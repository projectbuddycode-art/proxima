/**
 * PROXIMA AI Provider Architecture
 * Local Ollama-assisted reasoning with strict zero-fabrication guarantees.
 * Mock AI is strictly prohibited unless explicitly enabled via ALLOW_MOCK_AI=true.
 */

export interface AIProvider {
  name: string;
  testConnection(): Promise<{ ok: boolean; models?: string[]; message?: string }>;
  generateStructuredJSON<T>(prompt: string, systemPrompt?: string): Promise<T>;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
}

export class OllamaProvider implements AIProvider {
  name = 'OllamaLocal';
  baseUrl: string;
  model: string;

  constructor(baseUrl = 'http://127.0.0.1:11434', model = 'qwen2.5-coder:3b') {
    this.baseUrl = (process.env.OLLAMA_BASE_URL || baseUrl).replace(/\/$/, '');
    this.model = process.env.OLLAMA_MODEL || model;
  }

  async testConnection(): Promise<{ ok: boolean; models?: string[]; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) {
        return { ok: false, message: `Ollama HTTP error ${res.status}` };
      }
      const data = await res.json();
      const models = data.models?.map((m: any) => m.name) || [];
      return { ok: true, models, message: `Connected. ${models.length} model(s) available.` };
    } catch (err: any) {
      return { ok: false, message: `Ollama daemon connection unavailable at ${this.baseUrl}: ${err.message || err}` };
    }
  }

  async generateStructuredJSON<T>(prompt: string, systemPrompt = ''): Promise<T> {
    const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS || '30000', 10);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt + '\nRespond strictly with valid JSON.' }] : []),
            { role: 'user', content: prompt }
          ],
          format: 'json',
          stream: false
        })
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Ollama Chat Error ${res.status}`);
      }

      const data = await res.json();
      const rawText = data.message?.content || '{}';
      const parsed = JSON.parse(rawText) as T;
      return { ...parsed, _provider: `ollama:${this.model}`, _reasoning_available: true } as unknown as T;
    } catch (err: any) {
      if (process.env.ALLOW_MOCK_AI === 'true') {
        console.warn(`[AI PROVIDER] Ollama unavailable (${err.message}). Explicit ALLOW_MOCK_AI=true is set; using dev MockProvider.`);
        const mock = new MockProvider();
        return mock.generateStructuredJSON<T>(prompt, systemPrompt);
      }

      console.warn(`[AI PROVIDER] Ollama unavailable (${err.message}). Production zero-fabrication active: returning honest fallback.`);
      throw new Error(`AI reasoning unavailable: Ollama daemon is offline or model ${this.model} is not loaded (${err.message})`);
    }
  }

  async generateText(prompt: string, systemPrompt = ''): Promise<string> {
    const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS || '30000', 10);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          stream: false
        })
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Ollama Chat Error ${res.status}`);
      }

      const data = await res.json();
      return data.message?.content || '';
    } catch (err: any) {
      if (process.env.ALLOW_MOCK_AI === 'true') {
        console.warn(`[AI PROVIDER] Ollama text generation unavailable (${err.message}), using dev MockProvider.`);
        const mock = new MockProvider();
        return mock.generateText(prompt, systemPrompt);
      }

      console.warn(`[AI PROVIDER] Ollama unavailable (${err.message}). Returning honest message.`);
      return `AI reasoning unavailable: Local Ollama daemon is offline or unreachable at ${this.baseUrl}. Deterministic operations remain operational.`;
    }
  }
}

/**
 * MockProvider: strictly for unit test environments where explicit ALLOW_MOCK_AI=true is configured.
 */
export class MockProvider implements AIProvider {
  name = 'MockRuleEngine';

  async testConnection() {
    return { ok: true, models: ['mock-rule-engine-v1'], message: 'Mock Rule Engine Active (Explicit Development Mode Only)' };
  }

  async generateStructuredJSON<T>(prompt: string, systemPrompt = ''): Promise<T> {
    const lower = (prompt + ' ' + systemPrompt).toLowerCase();

    // Response Classification
    if (lower.includes('classify this prospect message') || lower.includes('response classifier')) {
      if (lower.includes('interested') || lower.includes('what did you have in mind') || lower.includes('tell me more')) {
        return {
          classification: 'INTERESTED',
          confidence: 0.94,
          reason: 'Prospect directly acknowledged the problem and requested further information.',
          recommended_action: '🚨 HUMAN TAKEOVER REQUIRED: Founder should schedule discovery call.',
          automation_allowed: false
        } as unknown as T;
      }
      if (lower.includes('not interested') || lower.includes('unsubscribe') || lower.includes('remove me')) {
        return {
          classification: 'NOT_INTERESTED',
          confidence: 0.95,
          reason: 'Prospect requested removal or declined contact.',
          recommended_action: 'Add to suppression list and stop sequence.',
          automation_allowed: false
        } as unknown as T;
      }
      return {
        classification: 'CURIOUS',
        confidence: 0.85,
        reason: 'Prospect asked a preliminary question about capabilities.',
        recommended_action: 'Prepare low-friction response with specific observation.',
        automation_allowed: true
      } as unknown as T;
    }

    // QA Verification Pass
    if (lower.includes('qa verification') || lower.includes('truth / qa agent')) {
      return {
        passed: true,
        reasons: ['Contains specific observation', 'Framed as hypothesis', 'One natural question', 'Zero generic spam']
      } as unknown as T;
    }

    // Default structured mock output
    return {
      passed: true,
      classification: 'CURIOUS',
      intent_score: 75,
      fit_score: 80,
      confidence: 0.85,
      _provider: 'mock-dev'
    } as unknown as T;
  }

  async generateText(prompt: string, systemPrompt = ''): Promise<string> {
    return `PROXIMA Development Response (Mock Mode enabled via ALLOW_MOCK_AI=true).`;
  }
}
