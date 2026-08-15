import fs from 'fs';
import path from 'path';

/**
 * PROXIMA UNIVERSAL ASYNC DATABASE ADAPTER ARCHITECTURE
 * Local Development: LocalJsonDatabase (db.json in process.cwd())
 * Production Vercel: PostgresProductionDatabase via process.env.DATABASE_URL
 */

export interface PreparedQuery {
  get: (...params: any[]) => any;
  all: (...params: any[]) => any[];
  run: (...params: any[]) => { changes: number; lastInsertRowid: number };
}

export interface DatabaseAdapter {
  type: 'LOCAL_JSON' | 'POSTGRES';
  prepare(sql: string): PreparedQuery;
  count(tableName: string, predicate?: (row: any) => boolean): number;
  countAsync(tableName: string, predicate?: (row: any) => boolean): Promise<number>;
  createPairingCodeAsync(): Promise<string>;
  validatePairingCodeAsync(code: string): Promise<{ success: boolean; token?: string; message: string }>;
  handleHeartbeatAsync(payload: any): Promise<{ ok: boolean; timestamp: string }>;
  getBridgeStatusAsync(): Promise<{ bridge: any; status: string; mode: string }>;
  enqueueJobAsync(type: string, payload: any): Promise<any>;
  claimNextJobAtomicallyAsync(bridgeId: string): Promise<any>;
  completeJobAtomicallyAsync(requestId: string, result: any, latencyMs: number, bridgeId: string): Promise<boolean>;
  getJobStatusAsync(requestId: string): Promise<any>;
  verifyBearerTokenAsync(token: string): Promise<any>;
}

export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  goal?: string;
  category?: string;
  status: string;
  tasks_completed?: number;
  tasks_rejected?: number;
  success_rate: number;
  confidence_avg?: number;
  last_active?: string;
}

export interface StrategyRecord {
  id: string;
  name: string;
  target?: string;
  description?: string;
  target_industry?: string;
  search_pattern?: string;
  source?: string;
  success_rate?: number;
  prospects_found?: number;
  qualified_prospects?: number;
  meetings?: number;
  status?: string;
}

export interface ExperimentRecord {
  id: string;
  strategy_id?: string;
  name?: string;
  hypothesis?: string;
  target_industry?: string;
  sample_size?: number;
  qualified_rate?: number;
  reply_rate?: number;
  status: string;
  recommendation?: string;
  conversion_rate?: number;
}

export class LocalJsonDatabase implements DatabaseAdapter {
  public type: 'LOCAL_JSON' = 'LOCAL_JSON';
  private dbPath: string;
  private data: Record<string, any[]>;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.data = this.loadData();
    this.initTables();
  }

  private loadData(): Record<string, any[]> {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to load db.json, creating new store.');
    }
    return {};
  }

  private saveData() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save db.json:', err);
    }
  }

  private initTables() {
    const tables = [
      'companies',
      'prospects',
      'campaigns',
      'outreach_messages',
      'responses',
      'security_observations',
      'settings',
      'proxima_activity_logs',
      'strategy_experiments',
      'bridge_sessions',
      'ai_jobs',
      'pairing_codes'
    ];
    let changed = false;
    for (const t of tables) {
      if (!this.data[t]) {
        this.data[t] = [];
        changed = true;
      }
    }
    if (changed) this.saveData();
  }

  public count(tableName: string, predicate?: (row: any) => boolean): number {
    const tableKey = tableName.toLowerCase();
    const rows = this.data[tableKey] || [];
    if (predicate) {
      return rows.filter(predicate).length;
    }
    return rows.length;
  }

  public async countAsync(tableName: string, predicate?: (row: any) => boolean): Promise<number> {
    return this.count(tableName, predicate);
  }

  public async createPairingCodeAsync(): Promise<string> {
    const crypto = require('crypto');
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    this.data['pairing_codes'].push({
      id: `pair_${Date.now()}`,
      pairing_code: code,
      expires_at: expiresAt,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    });
    this.saveData();
    return code;
  }

  public async validatePairingCodeAsync(code: string): Promise<{ success: boolean; token?: string; message: string }> {
    const crypto = require('crypto');
    const row = this.data['pairing_codes'].find(r => r.pairing_code === code);
    if (!row) return { success: false, message: 'Invalid pairing code.' };
    if (row.status !== 'ACTIVE') return { success: false, message: 'Pairing code already used.' };
    if (Date.now() > Number(row.expires_at)) {
      row.status = 'EXPIRED';
      this.saveData();
      return { success: false, message: 'Pairing code expired.' };
    }

    row.status = 'USED';
    row.used_at = new Date().toISOString();

    const token = `prx_bridge_${crypto.randomBytes(24).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const bridgeId = `bridge_${crypto.randomBytes(4).toString('hex')}`;

    this.data['bridge_sessions'].push({
      id: bridgeId,
      bridge_id: bridgeId,
      token_hash: tokenHash,
      machine_id: 'UNKNOWN',
      os: 'UNKNOWN',
      arch: 'UNKNOWN',
      ollama_version: 'UNKNOWN',
      models: '[]',
      active_model: 'UNKNOWN',
      status: 'CONNECTED',
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
    this.saveData();

    return { success: true, token, message: 'Device paired successfully.' };
  }

  public async verifyBearerTokenAsync(token: string): Promise<any> {
    if (!token) return null;
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = this.data['bridge_sessions'].find(r => r.token_hash === tokenHash);
    return session || null;
  }

  public async handleHeartbeatAsync(payload: any): Promise<{ ok: boolean; timestamp: string }> {
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(payload.token).digest('hex');
    let session = this.data['bridge_sessions'].find(r => r.token_hash === tokenHash);
    const timestamp = new Date().toISOString();

    if (session) {
      session.last_seen = timestamp;
      session.status = 'CONNECTED';
      if (payload.machine_id) session.machine_id = payload.machine_id;
      if (payload.os) session.os = payload.os;
      if (payload.arch) session.arch = payload.arch;
      if (payload.ollama_version) session.ollama_version = payload.ollama_version;
      if (payload.models) session.models = JSON.stringify(payload.models);
      if (payload.active_model) session.active_model = payload.active_model;
    } else {
      const bridgeId = payload.bridge_id || `bridge_${Date.now()}`;
      session = {
        id: bridgeId,
        bridge_id: bridgeId,
        token_hash: tokenHash,
        machine_id: payload.machine_id || 'UNKNOWN',
        os: payload.os || 'UNKNOWN',
        arch: payload.arch || 'UNKNOWN',
        ollama_version: payload.ollama_version || 'UNKNOWN',
        models: JSON.stringify(payload.models || []),
        active_model: payload.active_model || 'UNKNOWN',
        status: 'CONNECTED',
        last_seen: timestamp,
        created_at: timestamp
      };
      this.data['bridge_sessions'].push(session);
    }
    this.saveData();
    return { ok: true, timestamp };
  }

  public async getBridgeStatusAsync(): Promise<{ bridge: any; status: string; mode: string }> {
    const rows = this.data['bridge_sessions'] || [];
    if (rows.length === 0) return { bridge: null, status: 'BRIDGE_OFFLINE', mode: 'HYBRID' };
    const session = rows[rows.length - 1];
    const isStale = (Date.now() - new Date(session.last_seen).getTime()) > 30000;
    return {
      bridge: isStale ? { ...session, status: 'OFFLINE' } : session,
      status: isStale ? 'OFFLINE' : session.status,
      mode: 'HYBRID'
    };
  }

  public async enqueueJobAsync(type: string, payload: any): Promise<any> {
    const crypto = require('crypto');
    const reqId = `req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const jobId = `job_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const job = {
      id: jobId,
      request_id: reqId,
      job_id: jobId,
      type,
      payload: JSON.stringify(payload),
      status: 'QUEUED',
      created_at: new Date().toISOString()
    };
    this.data['ai_jobs'].push(job);
    this.saveData();
    return {
      ...job,
      payload
    };
  }

  public async claimNextJobAtomicallyAsync(bridgeId: string): Promise<any> {
    const row = this.data['ai_jobs'].find(r => r.status === 'QUEUED');
    if (!row) return null;

    row.status = 'CLAIMED';
    row.claimed_at = new Date().toISOString();
    row.bridge_id = bridgeId;
    this.saveData();

    return {
      ...row,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
    };
  }

  public async completeJobAtomicallyAsync(requestId: string, result: any, latencyMs: number, bridgeId: string): Promise<boolean> {
    const row = this.data['ai_jobs'].find(r => (r.request_id === requestId || r.job_id === requestId));
    if (!row) return false;
    if (row.bridge_id && row.bridge_id !== bridgeId) return false; // Reject forged completions
    if (row.status === 'COMPLETED') return false; // Reject duplicate completions

    row.status = 'COMPLETED';
    row.result = JSON.stringify(result);
    row.latency_ms = latencyMs;
    row.completed_at = new Date().toISOString();
    this.saveData();
    return true;
  }

  public async getJobStatusAsync(requestId: string): Promise<any> {
    const row = this.data['ai_jobs'].find(r => (r.request_id === requestId || r.job_id === requestId));
    if (!row) return null;

    return {
      ...row,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      result: row.result ? (typeof row.result === 'string' ? JSON.parse(row.result) : row.result) : undefined
    };
  }

  public prepare(sql: string): PreparedQuery {
    const cleanSql = sql.trim();
    const isSelect = /^SELECT/i.test(cleanSql);
    const isInsert = /^INSERT/i.test(cleanSql);
    const isUpdate = /^UPDATE/i.test(cleanSql);
    const isDelete = /^DELETE/i.test(cleanSql);

    const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    const intoMatch = cleanSql.match(/INTO\s+([a-zA-Z0-9_]+)/i);
    const updateMatch = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
    const tableName = (fromMatch?.[1] || intoMatch?.[1] || updateMatch?.[1] || '').toLowerCase();

    return {
      get: (...params: any[]) => {
        const rows = this.data[tableName] || [];
        if (/SELECT\s+COUNT\(\*\)\s+as\s+cnt/i.test(cleanSql)) {
          let cnt = 0;
          if (cleanSql.includes("WHERE intent_score >= 70")) {
            cnt = rows.filter(r => (r.intent_score || 0) >= 70).length;
          } else if (cleanSql.includes("WHERE human_takeover = 1")) {
            cnt = rows.filter(r => r.human_takeover === 1).length;
          } else if (cleanSql.includes("WHERE status = 'ACTIVE'")) {
            cnt = rows.filter(r => r.status === 'ACTIVE').length;
          } else {
            cnt = rows.length;
          }
          return { cnt };
        }

        if (cleanSql.includes('WHERE id = ?')) return rows.find(r => r.id === params[0]);
        if (cleanSql.includes('WHERE pairing_code = ?')) return rows.find(r => r.pairing_code === params[0]);
        if (cleanSql.includes('WHERE token_hash = ?')) return rows.find(r => r.token_hash === params[0]);
        if (cleanSql.includes('WHERE bridge_id = ?')) return rows.find(r => r.bridge_id === params[0]);
        if (cleanSql.includes("key = 'ollama_base_url'")) return rows.find(r => r.key === 'ollama_base_url');
        if (cleanSql.includes("key = 'ollama_model'")) return rows.find(r => r.key === 'ollama_model');
        if (cleanSql.includes("status = 'QUEUED'")) return rows.find(r => r.status === 'QUEUED');
        if (cleanSql.includes("request_id = ?")) return rows.find(r => r.request_id === params[0] || r.job_id === params[0]);
        return rows[0];
      },
      all: (...params: any[]) => {
        const rows = this.data[tableName] || [];
        if (cleanSql.includes("status = 'ACTIVE'") || cleanSql.includes("status = 'QUEUED'")) {
          return rows.filter(r => r.status === 'ACTIVE' || r.status === 'QUEUED');
        }
        return rows;
      },
      run: (...params: any[]) => {
        if (!this.data[tableName]) this.data[tableName] = [];

        if (isInsert) {
          const colMatches = cleanSql.match(/\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
          if (colMatches) {
            const cols = colMatches[1].split(',').map(c => c.trim().toLowerCase());
            const newObj: Record<string, any> = {};
            cols.forEach((col, idx) => {
              newObj[col] = params[idx];
            });
            this.data[tableName].push(newObj);
            this.saveData();
            return { changes: 1, lastInsertRowid: Date.now() };
          }
        }

        if (isUpdate && cleanSql.includes('WHERE id = ?')) {
          const idVal = params[params.length - 1];
          const item = this.data[tableName].find(r => r.id === idVal);
          if (item) {
            if (cleanSql.includes('status = ?')) item.status = params[0];
            if (cleanSql.includes('used_at = ?')) item.used_at = params[1];
            if (cleanSql.includes('human_takeover = ?')) item.human_takeover = params[0];
            if (cleanSql.includes('takeover_reason = ?')) item.takeover_reason = params[1];
            if (cleanSql.includes('result = ?')) item.result = params[0];
            if (cleanSql.includes('latency_ms = ?')) item.latency_ms = params[1];
            this.saveData();
            return { changes: 1, lastInsertRowid: 0 };
          }
        }

        if (isUpdate && cleanSql.includes('WHERE pairing_code = ?')) {
          const codeVal = params[params.length - 1];
          const item = this.data[tableName].find(r => r.pairing_code === codeVal);
          if (item) {
            if (cleanSql.includes('status = ?')) item.status = params[0];
            if (cleanSql.includes('used_at = ?')) item.used_at = params[1];
            this.saveData();
            return { changes: 1, lastInsertRowid: 0 };
          }
        }

        if (isUpdate && cleanSql.includes('WHERE request_id = ?')) {
          const idVal = params[params.length - 1];
          const item = this.data[tableName].find(r => r.request_id === idVal || r.job_id === idVal);
          if (item) {
            item.status = params[0];
            if (cleanSql.includes('claimed_at = ?')) item.claimed_at = params[1];
            if (cleanSql.includes('bridge_id = ?')) item.bridge_id = params[2];
            if (params.length > 2 && cleanSql.includes('result = ?')) item.result = params[1];
            this.saveData();
            return { changes: 1, lastInsertRowid: 0 };
          }
        }

        if (isDelete && cleanSql.includes('WHERE id = ?')) {
          const idVal = params[0];
          this.data[tableName] = this.data[tableName].filter(r => r.id !== idVal);
          this.saveData();
          return { changes: 1, lastInsertRowid: 0 };
        }

        this.saveData();
        return { changes: 1, lastInsertRowid: 0 };
      }
    };
  }
}

export type LocalDatabase = DatabaseAdapter;

let dbInstance: DatabaseAdapter | null = null;

export function initDb(): DatabaseAdapter {
  if (!dbInstance) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
      const { getPostgresDb } = require('./db/postgres');
      dbInstance = getPostgresDb(dbUrl);
    } else {
      const dbPath = path.join(process.cwd(), 'db.json');
      dbInstance = new LocalJsonDatabase(dbPath);
      console.log('✅ Local Development JSON Database Initialized Successfully.');
    }
  }
  return dbInstance!;
}

export function getDb(): DatabaseAdapter {
  return initDb();
}
