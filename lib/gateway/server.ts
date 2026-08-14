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
  type: string;
  payload: any;
  status: 'QUEUED' | 'DISPATCHED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
  result?: any;
  created_at: string;
  completed_at?: string;
}

export class ProximaCloudGateway {
  private static activeSessions = new Map<string, BridgeSession>();
  private static pairingCodes = new Map<string, { code: string; expires_at: number }>();
  private static jobQueue: QueuedJob[] = [];

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
   * Validates pairing code and issues long-lived device token
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
   * Registers or updates heartbeat from Proxima Local Bridge (sent every 15 seconds)
   */
  static handleHeartbeat(payload: Partial<BridgeSession> & { token: string }): { ok: boolean; timestamp: string } {
    const session: BridgeSession = {
      bridge_id: payload.bridge_id || 'local_bridge_default',
      machine_id: payload.machine_id || 'machine_local',
      os: payload.os || 'Windows',
      arch: payload.arch || 'x64',
      ollama_version: payload.ollama_version || '0.3.0',
      models: payload.models || ['qwen2.5-coder:7b', 'llama3'],
      active_model: payload.active_model || 'qwen2.5-coder:7b',
      status: 'CONNECTED',
      last_seen: new Date().toISOString(),
      token: payload.token
    };

    this.activeSessions.set(session.bridge_id, session);
    return { ok: true, timestamp: session.last_seen };
  }

  /**
   * Retrieves active bridge status
   */
  static getStatus(): { bridge: BridgeSession | null; status: string; mode: string } {
    const session = Array.from(this.activeSessions.values())[0] || null;
    if (!session) {
      return { bridge: null, status: 'BRIDGE_OFFLINE', mode: 'HYBRID' };
    }
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
    const job: QueuedJob = {
      request_id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      status: 'QUEUED',
      created_at: new Date().toISOString()
    };
    this.jobQueue.push(job);
    return job;
  }
}
