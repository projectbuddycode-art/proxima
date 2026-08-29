/**
 * PROXIMA AI Capability Router
 * Routes tasks to deterministic code first, then local internet tools, and uses local Ollama
 * only when strategic reasoning is required. Automatically falls back to honest warning if Ollama is offline.
 */

import { getAIProvider } from './agents';
import { DeterministicScoringEngine } from '../scoring/deterministic';
import { CanonicalDeduplicationEngine } from '../verification/dedup';
import { WebsiteIntelligenceEngine } from '../intelligence/website';

export type TaskComplexity = 'DETERMINISTIC' | 'INTERNET_INTELLIGENCE' | 'REASONING';

export interface AIResult<T> {
  success: boolean;
  reasoning_available: boolean;
  data?: T;
  error?: string;
  source: 'DETERMINISTIC_ENGINE' | 'INTERNET_BRIDGE' | 'OLLAMA_LOCAL' | 'CLAUDE_CLOUD';
}

export class AICapabilityRouter {
  /**
   * Evaluates task complexity and routes to the correct executor
   */
  static async routeTask<T = any>(
    taskType: string,
    payload: any
  ): Promise<AIResult<T>> {
    const complexity = this.getTaskComplexity(taskType);

    if (complexity === 'DETERMINISTIC') {
      console.log(`[AI ROUTER] Routing deterministic task: "${taskType}" to Deterministic Engine.`);
      try {
        const data = await this.executeDeterministic(taskType, payload);
        return {
          success: true,
          reasoning_available: true,
          data: data as T,
          source: 'DETERMINISTIC_ENGINE'
        };
      } catch (err: any) {
        return {
          success: false,
          reasoning_available: true,
          error: err.message || 'Deterministic execution failed',
          source: 'DETERMINISTIC_ENGINE'
        };
      }
    }

    if (complexity === 'INTERNET_INTELLIGENCE') {
      console.log(`[AI ROUTER] Routing internet intelligence task: "${taskType}" to Internet Bridge.`);
      try {
        const data = await this.executeInternet(taskType, payload);
        return {
          success: true,
          reasoning_available: true,
          data: data as T,
          source: 'INTERNET_BRIDGE'
        };
      } catch (err: any) {
        return {
          success: false,
          reasoning_available: true,
          error: err.message || 'Internet bridge execution failed',
          source: 'INTERNET_BRIDGE'
        };
      }
    }

    // Reasoning task requiring active AI provider
    const ai = getAIProvider();
    const sourceVal = ai.name === 'Claude' ? 'CLAUDE_CLOUD' : 'OLLAMA_LOCAL';
    console.log(`[AI ROUTER] Routing reasoning task: "${taskType}" to active AI provider: ${ai.name}.`);
    
    // Check connection first
    const conn = await ai.testConnection();
    if (!conn.ok) {
      console.warn(`[AI ROUTER] Active AI provider (${ai.name}) is offline or unreachable: ${conn.message}`);
      if (process.env.ALLOW_MOCK_AI === 'true') {
        try {
          const data = await ai.generateStructuredJSON<T>(JSON.stringify(payload), `Task: ${taskType}`);
          return {
            success: true,
            reasoning_available: false,
            data,
            source: sourceVal
          };
        } catch (e: any) {
          // Fall through
        }
      }
      return {
        success: false,
        reasoning_available: false,
        error: `AI reasoning unavailable: ${ai.name} provider is offline or credentials failed.`,
        source: sourceVal
      };
    }

    try {
      const data = await ai.generateStructuredJSON<T>(
        JSON.stringify(payload),
        `Task: ${taskType}. System requirement: synthesize facts honestly, do not make up records.`
      );
      return {
        success: true,
        reasoning_available: true,
        data,
        source: sourceVal
      };
    } catch (err: any) {
      return {
        success: false,
        reasoning_available: false,
        error: err.message || 'AI text generation failed',
        source: sourceVal
      };
    }
  }

  private static getTaskComplexity(taskType: string): TaskComplexity {
    const t = taskType.toUpperCase();
    if (t.includes('SCORING') || t.includes('DEDUP') || t.includes('NORMALIZATION') || t.includes('VALIDATION') || t.includes('MATH')) {
      return 'DETERMINISTIC';
    }
    if (t.includes('AUDIT_WEBSITE') || t.includes('FETCH_URL') || t.includes('PING')) {
      return 'INTERNET_INTELLIGENCE';
    }
    return 'REASONING';
  }

  private static async executeDeterministic(taskType: string, payload: any): Promise<any> {
    if (taskType.toUpperCase().includes('SCORING')) {
      return DeterministicScoringEngine.calculateDeterministicScore(payload);
    }
    if (taskType.toUpperCase().includes('DEDUP')) {
      return CanonicalDeduplicationEngine.findCanonicalCompany(payload);
    }
    throw new Error(`Unsupported deterministic task type: ${taskType}`);
  }

  private static async executeInternet(taskType: string, payload: any): Promise<any> {
    if (taskType.toUpperCase().includes('AUDIT_WEBSITE')) {
      return WebsiteIntelligenceEngine.auditWebsite(payload.url, payload.companyId);
    }
    throw new Error(`Unsupported internet intelligence task type: ${taskType}`);
  }
}
