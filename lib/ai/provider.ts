/**
 * PROXIMA AI Provider Architecture
 * Local Ollama-assisted reasoning and Claude multi-provider interface.
 * Mock AI is strictly prohibited unless explicitly enabled via ALLOW_MOCK_AI=true.
 */

export interface AIProvider {
  name: string;
  testConnection(): Promise<{ ok: boolean; models?: string[]; message?: string }>;
  generateStructuredJSON<T>(prompt: string, systemPrompt?: string): Promise<T>;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  capabilities(): string[];
}

export class OllamaProvider implements AIProvider {
  name = 'OllamaLocal';
  baseUrl: string;
  model: string;

  constructor(baseUrl = 'http://127.0.0.1:11434', model = 'qwen2.5-coder:3b') {
    this.baseUrl = (process.env.OLLAMA_BASE_URL || baseUrl).replace(/\/$/, '');
    this.model = process.env.OLLAMA_MODEL || model;
  }

  capabilities(): string[] {
    return ['Reasoning', 'Structured Output', 'Local Model Hosting'];
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

export class ClaudeProvider implements AIProvider {
  name = 'Claude';
  apiKey: string;
  model: string;

  constructor(apiKey: string, model = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
  }

  capabilities(): string[] {
    return ['Reasoning', 'Structured Output', 'Tool Orchestration', 'Streaming'];
  }

  async testConnection(): Promise<{ ok: boolean; models?: string[]; message?: string }> {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Connection test' }]
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (res.status === 401) {
        return { ok: false, message: 'AUTH_FAILED: Invalid Anthropic API Key.' };
      }
      if (!res.ok) {
        const errorText = await res.text();
        return { ok: false, message: `Anthropic HTTP Error ${res.status}: ${errorText}` };
      }

      const models = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'];
      return { ok: true, models, message: 'Connected successfully to Anthropic Message Endpoint.' };
    } catch (err: any) {
      return { ok: false, message: `Connection timed out or failed: ${err.message}` };
    }
  }

  async generateStructuredJSON<T>(prompt: string, systemPrompt = ''): Promise<T> {
    const systemInstruction = systemPrompt 
      ? systemPrompt + '\nRespond STRICTLY with valid JSON. Do not include any explanation or markdown formatting.'
      : 'Respond STRICTLY with valid JSON. Do not include any explanation or markdown formatting.';

    const rawText = await this.generateText(prompt, systemInstruction);
    try {
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson) as T;
      return { ...parsed, _provider: `claude:${this.model}`, _reasoning_available: true } as unknown as T;
    } catch (err: any) {
      console.warn('[CLAUDE PROVIDER] JSON parse warning, raw response was:', rawText);
      throw new Error(`Invalid JSON format returned by Claude: ${err.message}`);
    }
  }

  async generateText(prompt: string, systemPrompt = ''): Promise<string> {
    const timeoutMs = 30000;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt || undefined,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Claude HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      return data.content?.[0]?.text || '';
    } catch (err: any) {
      console.error('[CLAUDE PROVIDER] Text generation failure:', err.message);
      throw err;
    }
  }
}

/**
 * MockProvider: strictly for unit test environments where explicit ALLOW_MOCK_AI=true is configured.
 */
export class MockProvider implements AIProvider {
  name = 'MockRuleEngine';

  capabilities(): string[] {
    return ['Reasoning', 'Structured Output', 'Mock Operations'];
  }

  async testConnection() {
    return { ok: true, models: ['mock-rule-engine-v1'], message: 'Mock Rule Engine Active (Explicit Development Mode Only)' };
  }

  async generateStructuredJSON<T>(prompt: string, systemPrompt = ''): Promise<T> {
    const lower = (prompt + ' ' + systemPrompt).toLowerCase();

    // Response Classification
    if (lower.includes('classify this prospect message') || lower.includes('response classifier') || lower.includes('response_classification')) {
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
