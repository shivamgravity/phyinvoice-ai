export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

const EMBEDDING_TIMEOUT_MS = 60_000; // 60s — generous for first-time model download

class EmbeddingService {
  private worker: Worker;
  private pending: Map<string, { resolve: (val: number[]) => void; reject: (err: unknown) => void }>;
  private statusListeners: Array<(s: ModelStatus) => void> = [];
  private currentStatus: ModelStatus = 'idle';

  constructor() {
    this.pending = new Map();

    try {
      this.worker = new Worker(new URL('./embeddingWorker.ts', import.meta.url), { type: 'module' });
    } catch (err) {
      console.error('[EmbeddingService] Failed to create worker:', err);
      // Create a dummy worker object so the rest of the class doesn't crash
      this.worker = { postMessage: () => {}, onmessage: null, onerror: null } as unknown as Worker;
      this.setStatus('error');
      return;
    }

    this.worker.onmessage = (event) => {
      const { type, id, embedding, error, status } = event.data;

      if (type === 'result' && id && this.pending.has(id)) {
        this.pending.get(id)!.resolve(embedding);
        this.pending.delete(id);
      } else if (type === 'error' && id && this.pending.has(id)) {
        console.warn('[EmbeddingService] Worker returned error for request:', error);
        this.pending.get(id)!.reject(new Error(error));
        this.pending.delete(id);
      } else if (type === 'status') {
        console.info('[EmbeddingService] Status:', status);
        this.setStatus(status as ModelStatus);
      } else if (type === 'error' && !id) {
        console.error('[EmbeddingService] Worker global error:', error);
        this.setStatus('error');
        // Reject all pending requests
        this.rejectAll(new Error(error));
      }
    };

    // Catch worker-level errors (e.g. failed module load, WASM crash, uncaught exception)
    this.worker.onerror = (event) => {
      console.error('[EmbeddingService] Worker crashed:', event.message, event);
      this.setStatus('error');
      this.rejectAll(new Error(`Worker error: ${event.message}`));
    };
  }

  private setStatus(status: ModelStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  private rejectAll(err: Error) {
    for (const [, { reject }] of this.pending) {
      reject(err);
    }
    this.pending.clear();
  }

  generate(text: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      if (this.currentStatus === 'error') {
        reject(new Error('Embedding model unavailable'));
        return;
      }

      const id = crypto.randomUUID();

      // Timeout guard — if worker hangs, don't leave session stuck forever
      const timeout = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Embedding timed out after ${EMBEDDING_TIMEOUT_MS / 1000}s`));
        }
      }, EMBEDDING_TIMEOUT_MS);

      this.pending.set(id, {
        resolve: (val) => {
          clearTimeout(timeout);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      this.worker.postMessage({ type: 'generate', text, id });
    });
  }

  initializeModel(): void {
    if (this.currentStatus === 'idle') {
      console.info('[EmbeddingService] Requesting model init...');
      this.worker.postMessage({ type: 'init' });
    }
  }

  onStatusChange(cb: (status: ModelStatus) => void): void {
    this.statusListeners.push(cb);
    // Fire immediately with current status
    cb(this.currentStatus);
  }

  getStatus(): ModelStatus {
    return this.currentStatus;
  }
}

export const embeddingService = new EmbeddingService();
