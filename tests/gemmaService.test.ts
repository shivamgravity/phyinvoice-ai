import { describe, it, expect } from 'vitest';
import { 
  buildGemmaPrompt, 
  offlineEnhanceDeliverable,
  fetchInstalledOllamaModels,
  synthesizeDeliverableWithGemma
} from '../src/services/gemmaService';

describe('Google Gemma Prompt Builder & Deliverable Enhancer', () => {
  it('should construct structured prompt matching Gemma turn tokens', () => {
    const prompt = buildGemmaPrompt('fixing jwt token bug', 'Customer Portal');
    expect(prompt).toContain('<start_of_turn>user');
    expect(prompt).toContain('<end_of_turn>');
    expect(prompt).toContain('<start_of_turn>model');
    expect(prompt).toContain('Customer Portal');
    expect(prompt).toContain('fixing jwt token bug');
  });

  it('should transform raw informal developer notes into client-ready deliverable sentences', () => {
    // Auth / JWT
    const authDeliverable = offlineEnhanceDeliverable('fixed jwt auth bug');
    expect(authDeliverable).toContain('authentication');
    expect(authDeliverable.endsWith('.')).toBe(true);

    // Payments
    const payDeliverable = offlineEnhanceDeliverable('stripe checkout integration');
    expect(payDeliverable).toContain('payment gateway');
    expect(payDeliverable.endsWith('.')).toBe(true);

    // Database / Query
    const dbDeliverable = offlineEnhanceDeliverable('optimizing slow postgres query');
    expect(dbDeliverable).toContain('database');
    expect(dbDeliverable.endsWith('.')).toBe(true);

    // CSS / UI
    const uiDeliverable = offlineEnhanceDeliverable('styling dark mode navbar');
    expect(uiDeliverable).toContain('user interface');
    expect(uiDeliverable.endsWith('.')).toBe(true);
  });

  it('should probe local Ollama daemon or gracefully report connection state', async () => {
    const { connected, models } = await fetchInstalledOllamaModels();
    expect(typeof connected).toBe('boolean');
    expect(Array.isArray(models)).toBe(true);
    if (connected && models.length > 0) {
      expect(models[0].name).toBeDefined();
    }
  });

  it('should immediately use deterministic fallback when offline-fallback mode is selected', async () => {
    const result = await synthesizeDeliverableWithGemma(
      'fixing dark mode border color',
      'Dashboard UI',
      { model: 'offline-fallback' }
    );
    expect(result.engine).toBe('deterministic-fallback');
    expect(result.deliverable).toContain('user interface');
  });
});

