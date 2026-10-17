import { pipeline, env } from '@huggingface/transformers';

// Disable local model loading — always fetch from Hugging Face CDN
env.allowLocalModels = false;
// Use browser cache so the model is only downloaded once
env.useBrowserCache = true;

let extractor: Awaited<ReturnType<typeof pipeline>> | null = null;
let initPromise: Promise<void> | null = null;

async function loadModel() {
  if (extractor) return;

  self.postMessage({ type: 'status', status: 'loading' });

  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    progress_callback: (progress: Record<string, unknown>) => {
      self.postMessage({ type: 'progress', progress });
    },
  });

  self.postMessage({ type: 'status', status: 'ready' });
}

self.onmessage = async (event: MessageEvent) => {
  const { type, text, id } = event.data as { type: string; text?: string; id?: string };

  if (type === 'init') {
    // Preload model eagerly so the first session stop is fast
    if (!initPromise) {
      initPromise = loadModel().catch((err) => {
        console.error('[Worker] Model init failed:', err);
        self.postMessage({ type: 'error', error: String(err) });
        initPromise = null; // allow retry
        extractor = null;
      });
    }
    return;
  }

  if (type === 'generate') {
    try {
      // Load model if not yet loaded (e.g. init was never called)
      if (!initPromise) {
        initPromise = loadModel().catch((err) => {
          initPromise = null;
          extractor = null;
          throw err;
        });
      }
      await initPromise;

      if (!extractor) {
        throw new Error('Model failed to load');
      }

      // @ts-ignore - The types in @xenova/transformers are occasionally incomplete
      const output = await extractor(text!, { pooling: 'mean', normalize: true });
      // @ts-ignore - 'data' might be missing from the inferred type, but it's present on Tensor
      const embedding = Array.from(output.data as Float32Array) as number[];
      self.postMessage({ type: 'result', id, embedding });
    } catch (err) {
      console.error('[Worker] Embedding generation failed:', err);
      self.postMessage({ type: 'error', id, error: String(err) });
    }
  }
};

// Catch any unhandled errors in the worker global scope
self.addEventListener('error', (event) => {
  console.error('[Worker] Unhandled error:', event);
  self.postMessage({ type: 'error', error: `Unhandled worker error: ${event.message}` });
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Worker] Unhandled promise rejection:', event.reason);
  self.postMessage({ type: 'error', error: `Unhandled rejection: ${event.reason}` });
});
