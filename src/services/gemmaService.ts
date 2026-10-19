/**
 * Google Gemma Open-Weight LLM Service for Deliverable Synthesis
 * 
 * Supports any locally installed Google Gemma model variant (Gemma, Gemma 2, Gemma 3, etc.)
 * Transforms informal, raw developer/freelancer session notes into polished, 
 * professional, dispute-proof client deliverables suitable for formal invoices.
 */

export interface OllamaModelInfo {
  name: string;
  size: number;
  family?: string;
  parameterSize?: string;
}

export interface GemmaOptions {
  ollamaUrl?: string;
  model?: string;
  temperature?: number;
}

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_MODEL = 'gemma3:1b';

/**
 * Probes the local Ollama daemon for installed models (/api/tags)
 */
export async function fetchInstalledOllamaModels(
  ollamaUrl: string = DEFAULT_OLLAMA_URL
): Promise<{ connected: boolean; models: OllamaModelInfo[] }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { connected: false, models: [] };
    }

    const data = await res.json();
    if (Array.isArray(data.models)) {
      const models: OllamaModelInfo[] = data.models.map((m: any) => ({
        name: m.name,
        size: m.size || 0,
        family: m.details?.family || '',
        parameterSize: m.details?.parameter_size || '',
      }));
      return { connected: true, models };
    }
  } catch (_err) {
    // Ollama daemon not reachable
  }

  return { connected: false, models: [] };
}

/**
 * Builds the structured prompt for Google Gemma models
 */
export function buildGemmaPrompt(rawNote: string, projectContext?: string): string {
  const contextLine = projectContext ? `Project context: "${projectContext}".` : '';
  return `<start_of_turn>user
You are a senior technical project manager and professional billing consultant.
Convert the following informal work session note into a single, polished, professional client-facing invoice deliverable sentence.
${contextLine}
Rules:
1. Begin with an active past-tense verb (e.g., "Implemented", "Refactored", "Remediated", "Resolved", "Optimized", "Architected", "Conducted").
2. Focus on client business value, quality, stability, and completion.
3. Remove slang, typos, and internal frustration (e.g. "stupid bug", "zoom call with Dave").
4. Output EXACTLY one sentence without quotes, greetings, or conversational filler.

Raw work note: "${rawNote}"
<end_of_turn>
<start_of_turn>model
`;
}

/**
 * High-quality deterministic / rule-based fallback enhancer.
 * This guarantees the tool functions instantly even if the user hasn't started an Ollama daemon.
 */
export function offlineEnhanceDeliverable(rawNote: string, projectContext?: string): string {
  const clean = rawNote.trim();
  if (!clean) return 'Completed scheduled client deliverable milestones.';

  // Specific domain pattern matching
  const lower = clean.toLowerCase();

  // Authentication / JWT / Security
  if (lower.includes('jwt') || lower.includes('auth') || lower.includes('token') || lower.includes('login')) {
    return 'Resolved authentication token lifecycle and session validation logic to enhance system security.';
  }
  // Payments / Checkout
  if (lower.includes('pay') || lower.includes('checkout') || lower.includes('stripe') || lower.includes('cart')) {
    return 'Implemented payment gateway transaction workflows, ensuring compliant checkout processing and webhook synchronization.';
  }
  // Database / Performance / Indexing
  if (lower.includes('query') || lower.includes('database') || lower.includes('postgres') || lower.includes('sql') || lower.includes('index') || lower.includes('latency')) {
    return 'Optimized database query performance and query execution plans, remediating latency bottlenecks.';
  }
  // UI / Styling / Responsive / CSS
  if (lower.includes('css') || lower.includes('style') || lower.includes('ui') || lower.includes('dark mode') || lower.includes('responsive') || lower.includes('layout')) {
    return 'Refined user interface component architecture and cross-browser responsive layouts to uphold design system standards.';
  }
  // Meetings / Syncs / Calls
  if (lower.includes('zoom') || lower.includes('call') || lower.includes('sync') || lower.includes('meeting') || lower.includes('slack')) {
    return 'Conducted technical architecture review and requirements alignment consultation with project stakeholders.';
  }
  // Bug fixes
  if (lower.includes('bug') || lower.includes('fix') || lower.includes('issue') || lower.includes('crash')) {
    const topic = clean.replace(/^(fixed|fixing|debugged|debugging)\s+/i, '');
    return `Diagnosed and resolved critical technical anomalies in ${topic}, validating edge-case stability.`;
  }
  // General fallback
  const firstWord = clean.split(' ')[0].toLowerCase();
  let verb = 'Executed';
  if (firstWord.startsWith('creat') || firstWord.startsWith('add') || firstWord.startsWith('build')) verb = 'Engineered and deployed';
  else if (firstWord.startsWith('test')) verb = 'Conducted comprehensive automated test coverage for';
  else if (firstWord.startsWith('updat') || firstWord.startsWith('refactor')) verb = 'Refactored and enhanced';
  else verb = 'Implemented';

  const capitalizedRest = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `${verb} core milestones for: ${capitalizedRest}.`;
}

/**
 * Synthesizes a client deliverable using local Gemma/Ollama model, falling back to local heuristic.
 */
export async function synthesizeDeliverableWithGemma(
  rawNote: string,
  projectContext?: string,
  options: GemmaOptions = {}
): Promise<{ deliverable: string; engine: string }> {
  // If user explicitly chose offline fallback mode, bypass network probe immediately
  if (options.model === 'offline-fallback') {
    return {
      deliverable: offlineEnhanceDeliverable(rawNote, projectContext),
      engine: 'deterministic-fallback',
    };
  }

  const ollamaUrl = options.ollamaUrl || DEFAULT_OLLAMA_URL;
  const model = options.model || DEFAULT_MODEL;

  const prompt = buildGemmaPrompt(rawNote, projectContext);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for local models

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.2,
          num_predict: 80,
        }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const output = (data.response || '').trim();
      if (output.length > 10) {
        // Strip residual straight and smart/curly quotes or markdown
        const cleanedOutput = output.replace(/^["'`“”«»]+|["'`“”«»]+$/g, '').trim();
        return { deliverable: cleanedOutput, engine: `ollama:${model}` };
      }
    }
  } catch (_err) {
    // Ollama not reachable or offline - gracefully proceed with local deterministic enhancer
  }

  // Graceful zero-latency fallback
  return {
    deliverable: offlineEnhanceDeliverable(rawNote, projectContext),
    engine: 'deterministic-fallback',
  };
}

