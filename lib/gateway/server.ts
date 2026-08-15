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
  static async generatePairingCode(): Promise<string> {
    const db = getDb();
    return await db.createPairingCodeAsync();
  }

  /**
   * Validates pairing code against DB table pairing_codes, marks used, and issues bridge token
   */
  static async validatePairingCode(code: string): Promise<{ success: boolean; token?: string; message: string }> {
    const db = getDb();
    return await db.validatePairingCodeAsync(code);
  }

  /**
   * Verifies Bearer token against stored token_hash in database
   */
  static async verifyBearerToken(token: string): Promise<BridgeSession | null> {
    if (!token) return null;
    const db = getDb();
    return await db.verifyBearerTokenAsync(token);
  }

  /**
   * Registers or updates heartbeat from Proxima Local Bridge (sent every 15 seconds)
   */
  static async handleHeartbeat(payload: Partial<BridgeSession> & { token: string }): Promise<{ ok: boolean; timestamp: string }> {
    const db = getDb();
    return await db.handleHeartbeatAsync(payload);
  }

  /**
   * Retrieves active bridge status from DB (reports OFFLINE if last_seen > 30s)
   */
  static async getStatus(): Promise<{ bridge: BridgeSession | null; status: string; mode: string }> {
    const db = getDb();
    return await db.getBridgeStatusAsync();
  }

  /**
   * Enqueues an AI inference job for execution by the Local Bridge
   */
  static async enqueueJob(type: string, payload: any): Promise<QueuedJob> {
    const db = getDb();
    return await db.enqueueJobAsync(type, payload);
  }

  /**
   * Polled by Local Bridge to claim oldest QUEUED job atomically (QUEUED -> CLAIMED)
   */
  static async claimNextJob(bridgeId: string): Promise<QueuedJob | null> {
    const db = getDb();
    return await db.claimNextJobAtomicallyAsync(bridgeId);
  }

  /**
   * Submitted by Local Bridge to complete job execution with result and latency
   */
  static async completeJob(requestId: string, result: any, latencyMs: number, bridgeId: string): Promise<boolean> {
    const db = getDb();
    return await db.completeJobAtomicallyAsync(requestId, result, latencyMs, bridgeId);
  }

  /**
   * Checks job completion status for UI polling
   */
  static async getJobStatus(requestId: string): Promise<QueuedJob | null> {
    const db = getDb();
    return await db.getJobStatusAsync(requestId);
  }
}
