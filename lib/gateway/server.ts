import { getDb } from '../db';

export interface BridgeSession {
  bridge_id: string;
  machine_id: string;
  os: string;
  arch: string;
  ollama_version: string;
  models: string[];
  active_model: string;
  status: 'CONNECTED' | 'OFFLINE' | 'DEGRADED';
  last_seen: string;
  token: string;
}

export interface QueuedJob {
  request_id: string;
  job_id: string;
  type: string;
  payload: any;
  status: 'QUEUED' | 'CLAIMED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  result?: any;
  latency_ms?: number;
  created_at: string;
  completed_at?: string;
}

export class ProximaCloudGateway {
  private static pairingCodes = new Map<string, { code: string; expires_at: number }>();

  /**
   * Generates a 6-digit device pairing code for first-time Local Bridge setup
   */
  static generatePairingCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.pairingCodes.set(code, {
      code,
      expires_at: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    return code;
  }

  /**
   * Validates pairing code and issues device pairing token
   */
  static validatePairingCode(code: string): { success: boolean; token?: string; message: string } {
    const item = this.pairingCodes.get(code);
    if (!item) {
      return { success: false, message: 'Invalid or expired pairing code.' };
    }
    if (Date.now() > item.expires_at) {
      this.pairingCodes.delete(code);
      return { success: false, message: 'Pairing code expired.' };
    }
    this.pairingCodes.delete(code);
    const token = `prx_bridge_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return { success: true, token, message: 'Device paired successfully.' };
  }

  /**
   * Registers or updates heartbeat from Proxima Local Bridge (sent every 15 seconds with Bearer Token)
   */
  static handleHeartbeat(payload: Partial<BridgeSession> & { token: string }): { ok: boolean; timestamp: string } {
    const db = getDb();
    const session: BridgeSession = {
      bridge_id: payload.bridge_id || 'bridge_default',
      machine_id: payload.machine_id || 'machine_local',
      os: payload.os || 'Windows',
      arch: payload.arch || 'x64',
      ollama_version: payload.ollama_version || '0.3.0',
      models: payload.models || ['qwen2.5-coder:7b'],
      active_model: payload.active_model || 'qwen2.5-coder:7b',
      status: 'CONNECTED',
      last_seen: new Date().toISOString(),
      token: payload.token
    };

    db.prepare(`
      INSERT INTO bridge_sessions (id, bridge_id, machine_id, os, arch, ollama_version, models, active_model, status, last_seen, token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.bridge_id,
      session.bridge_id,
      session.machine_id,
      session.os,
      session.arch,
      session.ollama_version,
      JSON.stringify(session.models),
      session.active_model,
      session.status,
      session.last_seen,
      session.token
    );

    return { ok: true, timestamp: session.last_seen };
  }

  /**
   * Retrieves active bridge status from DB
   */
  static getStatus(): { bridge: BridgeSession | null; status: string; mode: string } {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM bridge_sessions').all() as any[];
    if (!rows || rows.length === 0) {
      return { bridge: null, status: 'BRIDGE_OFFLINE', mode: 'HYBRID' };
    }
    const session = rows[rows.length - 1];
    const isStale = (Date.now() - new Date(session.last_seen).getTime()) > 30000;
    return {
      bridge: isStale ? { ...session, status: 'OFFLINE' } : session,
      status: isStale ? 'OFFLINE' : session.status,
      mode: 'HYBRID'
    };
  }

  /**
   * Enqueues an AI inference job for execution by the Local Bridge
   */
  static enqueueJob(type: string, payload: any): QueuedJob {
    const db = getDb();
    const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const job: QueuedJob = {
      request_id: reqId,
      job_id: jobId,
      type,
      payload,
      status: 'QUEUED',
      created_at: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO ai_jobs (id, request_id, job_id, type, payload, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(jobId, job.request_id, job.job_id, job.type, JSON.stringify(job.payload), job.status, job.created_at);

    return job;
  }

  /**
   * Polled by Local Bridge to claim oldest QUEUED job
   */
  static claimNextJob(): QueuedJob | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM ai_jobs WHERE status = 'QUEUED'").get() as any;
    if (!row) return null;

    db.prepare("UPDATE ai_jobs SET status = ? WHERE request_id = ?").run('CLAIMED', row.request_id || row.id);
    return {
      request_id: row.request_id || row.id,
      job_id: row.job_id || row.id,
      type: row.type,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      status: 'CLAIMED',
      created_at: row.created_at
    };
  }

  /**
   * Submitted by Local Bridge to complete job execution with result and latency
   */
  static completeJob(requestId: string, result: any, latencyMs: number): boolean {
    const db = getDb();
    db.prepare("UPDATE ai_jobs SET status = ?, result = ?, latency_ms = ? WHERE request_id = ?")
      .run('COMPLETED', JSON.stringify(result), latencyMs, requestId);
    return true;
  }

  /**
   * Checks job completion status for UI polling
   */
  static getJobStatus(requestId: string): QueuedJob | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM ai_jobs WHERE request_id = ?").get(requestId) as any;
    if (!row) return null;

    return {
      request_id: row.request_id || row.id,
      job_id: row.job_id || row.id,
      type: row.type,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      status: row.status,
      result: row.result ? (typeof row.result === 'string' ? JSON.parse(row.result) : row.result) : undefined,
      latency_ms: row.latency_ms,
      created_at: row.created_at
    };
  }
}
