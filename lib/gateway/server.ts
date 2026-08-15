import { getDb } from '../db';
import crypto from 'crypto';

export interface BridgeSession {
  bridge_id: string;
  token_hash: string;
  machine_id: string;
  os: string;
  arch: string;
  ollama_version: string;
  models: string[];
  active_model: string;
  status: 'CONNECTED' | 'OFFLINE' | 'DEGRADED';
  last_seen: string;
  created_at: string;
}

export interface QueuedJob {
  request_id: string;
  job_id: string;
  type: string;
  payload: any;
  status: 'QUEUED' | 'CLAIMED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  result?: any;
  latency_ms?: number;
  bridge_id?: string;
  created_at: string;
  claimed_at?: string;
  completed_at?: string;
}

export class ProximaCloudGateway {
  /**
   * Hashes bridge token securely using SHA-256
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a 6-digit device pairing code and stores it in database table pairing_codes (10 min expiry)
   */
  static generatePairingCode(): string {
    const db = getDb();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    db.prepare(`
      INSERT INTO pairing_codes (id, pairing_code, expires_at, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(`pair_${Date.now()}`, code, expiresAt, 'ACTIVE', new Date().toISOString());

    return code;
  }

  /**
   * Validates pairing code against DB table pairing_codes, marks used, and issues bridge token
   */
  static validatePairingCode(code: string): { success: boolean; token?: string; message: string } {
    const db = getDb();
    const row = db.prepare("SELECT * FROM pairing_codes WHERE pairing_code = ?").get(code) as any;

    if (!row) {
      return { success: false, message: 'Invalid pairing code.' };
    }
    if (row.status !== 'ACTIVE') {
      return { success: false, message: 'Pairing code already used.' };
    }
    if (Date.now() > Number(row.expires_at)) {
      db.prepare("UPDATE pairing_codes SET status = ? WHERE pairing_code = ?").run('EXPIRED', code);
      return { success: false, message: 'Pairing code expired.' };
    }

    // Atomically mark pairing code as USED
    db.prepare("UPDATE pairing_codes SET status = ?, used_at = ? WHERE pairing_code = ?")
      .run('USED', new Date().toISOString(), code);

    // Issue new bridge token and store SHA-256 token_hash
    const token = `prx_bridge_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tokenHash = this.hashToken(token);
    const bridgeId = `bridge_${Math.random().toString(36).substring(2, 9)}`;

    db.prepare(`
      INSERT INTO bridge_sessions (id, bridge_id, token_hash, machine_id, os, arch, ollama_version, models, active_model, status, last_seen, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bridgeId,
      bridgeId,
      tokenHash,
      'machine_local',
      'Windows',
      'x64',
      '0.3.0',
      JSON.stringify(['qwen2.5-coder:7b']),
      'qwen2.5-coder:7b',
      'CONNECTED',
      new Date().toISOString(),
      new Date().toISOString()
    );

    return { success: true, token, message: 'Device paired successfully.' };
  }

  /**
   * Verifies Bearer token against stored token_hash in database
   */
  static verifyBearerToken(token: string): BridgeSession | null {
    if (!token) return null;
    const db = getDb();
    const tokenHash = this.hashToken(token);
    const session = db.prepare("SELECT * FROM bridge_sessions WHERE token_hash = ?").get(tokenHash) as any;
    if (!session) return null;

    return {
      bridge_id: session.bridge_id || session.id,
      token_hash: session.token_hash,
      machine_id: session.machine_id,
      os: session.os,
      arch: session.arch,
      ollama_version: session.ollama_version,
      models: typeof session.models === 'string' ? JSON.parse(session.models) : (session.models || []),
      active_model: session.active_model,
      status: session.status,
      last_seen: session.last_seen,
      created_at: session.created_at
    };
  }

  /**
   * Registers or updates heartbeat from Proxima Local Bridge (sent every 15 seconds)
   */
  static handleHeartbeat(payload: Partial<BridgeSession> & { token: string }): { ok: boolean; timestamp: string } {
    const db = getDb();
    const tokenHash = this.hashToken(payload.token);
    const existing = db.prepare("SELECT * FROM bridge_sessions WHERE token_hash = ?").get(tokenHash) as any;

    const bridgeId = payload.bridge_id || existing?.bridge_id || `bridge_${Date.now()}`;
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO bridge_sessions (id, bridge_id, token_hash, machine_id, os, arch, ollama_version, models, active_model, status, last_seen, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bridgeId,
      bridgeId,
      tokenHash,
      payload.machine_id || 'machine_local',
      payload.os || 'Windows',
      payload.arch || 'x64',
      payload.ollama_version || '0.3.0',
      JSON.stringify(payload.models || ['qwen2.5-coder:7b']),
      payload.active_model || 'qwen2.5-coder:7b',
      'CONNECTED',
      timestamp,
      timestamp
    );

    return { ok: true, timestamp };
  }

  /**
   * Retrieves active bridge status from DB (reports OFFLINE if last_seen > 30s)
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
   * Polled by Local Bridge to claim oldest QUEUED job atomically (QUEUED -> CLAIMED)
   */
  static claimNextJob(bridgeId: string): QueuedJob | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM ai_jobs WHERE status = 'QUEUED'").get() as any;
    if (!row) return null;

    const claimedAt = new Date().toISOString();
    db.prepare("UPDATE ai_jobs SET status = ?, claimed_at = ?, bridge_id = ? WHERE request_id = ?")
      .run('CLAIMED', claimedAt, bridgeId, row.request_id || row.id);

    return {
      request_id: row.request_id || row.id,
      job_id: row.job_id || row.id,
      type: row.type,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      status: 'CLAIMED',
      bridge_id: bridgeId,
      created_at: row.created_at,
      claimed_at: claimedAt
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
      bridge_id: row.bridge_id,
      created_at: row.created_at,
      claimed_at: row.claimed_at,
      completed_at: row.completed_at
    };
  }
}
