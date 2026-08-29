/**
 * PROXIMA Agent Runtime System
 * Manages definitions, workers, runs, and events.
 * Strictly calculates metrics from actual run logs.
 */

import { getDb } from '../db';

export interface AgentRunRecord {
  run_id: string;
  agent_id: string;
  worker_id?: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STALE';
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  input?: any;
  output_summary?: string;
  tools_used?: string[];
  evidence_ids?: string[];
  error_message?: string;
  retry_count: number;
}

export class AgentRuntimeSystem {
  /**
   * Spawns a new agent execution run
   */
  static async startRun(agentId: string, input?: any, workerId = 'default_worker'): Promise<string> {
    const db = getDb();
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const startedAt = new Date().toISOString();

    try {
      await db.executeAsync(
        `INSERT INTO agent_runs (run_id, agent_id, worker_id, status, started_at, input, retry_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [runId, agentId, workerId, 'RUNNING', startedAt, input ? JSON.stringify(input) : null, 0]
      );
      
      await db.executeAsync(
        `UPDATE agent_workers SET status = 'RUNNING', current_run_id = ?, last_heartbeat = ? WHERE worker_id = ?`,
        [runId, startedAt, workerId]
      );

      await this.logEvent(runId, agentId, 'START', `Agent run started for ${agentId}`);
    } catch (e: any) {
      console.warn('[AGENT RUNTIME] Start run database logging failed:', e.message);
    }

    return runId;
  }

  /**
   * Completes an agent execution run successfully
   */
  static async completeRun(runId: string, agentId: string, outputSummary: string, toolsUsed: string[] = [], evidenceIds: string[] = [], outputPayload?: any, workerId = 'default_worker'): Promise<void> {
    const db = getDb();
    const finishedAt = new Date().toISOString();

    try {
      const run = await db.queryOneAsync('SELECT * FROM agent_runs WHERE run_id = ?', [runId]);
      const durationMs = run ? (new Date(finishedAt).getTime() - new Date((run as any).started_at).getTime()) : 0;

      await db.executeAsync(
        `UPDATE agent_runs
         SET status = 'SUCCEEDED', finished_at = ?, duration_ms = ?, output_summary = ?, tools_used = ?, evidence_ids = ?, output_payload = ?
         WHERE run_id = ?`,
        [finishedAt, durationMs, outputSummary, JSON.stringify(toolsUsed), JSON.stringify(evidenceIds), outputPayload ? JSON.stringify(outputPayload) : null, runId]
      );

      await db.executeAsync(
        `UPDATE agent_workers SET status = 'IDLE', current_run_id = NULL, last_heartbeat = ? WHERE worker_id = ?`,
        [finishedAt, workerId]
      );

      await this.logEvent(runId, agentId, 'SUCCESS', `Agent run completed successfully in ${durationMs}ms`);
    } catch (e: any) {
      console.warn('[AGENT RUNTIME] Complete run database logging failed:', e.message);
    }
  }

  /**
   * Fails an agent execution run with error message
   */
  static async failRun(runId: string, agentId: string, errorMessage: string, workerId = 'default_worker'): Promise<void> {
    const db = getDb();
    const finishedAt = new Date().toISOString();

    try {
      const run = await db.queryOneAsync('SELECT * FROM agent_runs WHERE run_id = ?', [runId]);
      const durationMs = run ? (new Date(finishedAt).getTime() - new Date((run as any).started_at).getTime()) : 0;

      await db.executeAsync(
        `UPDATE agent_runs
         SET status = 'FAILED', finished_at = ?, duration_ms = ?, error_message = ?
         WHERE run_id = ?`,
        [finishedAt, durationMs, errorMessage, runId]
      );

      await db.executeAsync(
        `UPDATE agent_workers SET status = 'IDLE', current_run_id = NULL, last_heartbeat = ? WHERE worker_id = ?`,
        [finishedAt, workerId]
      );

      await this.logEvent(runId, agentId, 'FAILURE', `Agent run failed: ${errorMessage}`);
    } catch (e: any) {
      console.warn('[AGENT RUNTIME] Fail run database logging failed:', e.message);
    }
  }

  /**
   * Log an event under an agent run
   */
  static async logEvent(runId: string, agentId: string, eventType: string, message: string, details?: any): Promise<void> {
    const db = getDb();
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    try {
      await db.executeAsync(
        `INSERT INTO agent_events (id, run_id, agent_id, event_type, message, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [eventId, runId, agentId, eventType, message, details ? JSON.stringify(details) : null]
      );
    } catch (e: any) {
      // Non-fatal
    }
  }

  /**
   * Dynamically aggregates real compute metrics for all registered agents.
   * Eliminates all hardcoded success rates / complete counts.
   */
  static async aggregateAgentMetrics(): Promise<Array<{
    agent_id: string;
    status: string;
    tasks_completed: number;
    tasks_failed: number;
    success_rate: number;
    last_active?: string;
  }>> {
    const db = getDb();
    try {
      const runs = await db.queryAllAsync('SELECT * FROM agent_runs');
      const workers = await db.queryAllAsync('SELECT * FROM agent_workers');
      
      const agents = await db.queryAllAsync('SELECT id FROM agent_definitions');
      const agentIds = agents.map((a: any) => a.id);

      return agentIds.map(agentId => {
        const agentRuns = runs.filter((r: any) => r.agent_id === agentId);
        const agentWorker = workers.find((w: any) => w.agent_id === agentId);

        const succeeded = agentRuns.filter((r: any) => r.status === 'SUCCEEDED').length;
        const failed = agentRuns.filter((r: any) => r.status === 'FAILED').length;
        const total = succeeded + failed;

        const successRate = total > 0 ? Math.round((succeeded / total) * 100) : 100;

        let status = 'IDLE';
        if (agentWorker) {
          const lastHeartbeat = new Date(agentWorker.last_heartbeat).getTime();
          const diffSec = (Date.now() - lastHeartbeat) / 1000;
          if (agentWorker.status === 'RUNNING' && diffSec <= 60) {
            status = 'RUNNING';
          } else if (diffSec > 180) {
            status = 'OFFLINE';
          }
        }

        const lastActive = agentRuns.length > 0 
          ? agentRuns.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0].started_at
          : undefined;

        return {
          agent_id: agentId,
          status,
          tasks_completed: succeeded,
          tasks_failed: failed,
          success_rate: successRate,
          last_active: lastActive
        };
      });
    } catch {
      return [];
    }
  }
}
