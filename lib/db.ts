import fs from 'fs';
import path from 'path';
import { getPostgresDb } from './db/postgres';

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
  
  // Clean 100% Async Query API
  queryOneAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  queryAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  executeAsync(sql: string, params?: any[]): Promise<{ changes: number }>;

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

  prepare(sql: string): PreparedQuery;
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
      'pairing_codes',
      'agents',
      'strategies',
      'experiments',
      'research',
      'opportunities',
      'messages',
      'followups',
      'sources',
      'proxima_logs',
      'system_settings',
      'map_businesses',
      'map_regions',
      'social_integrations',
      'agent_statuses',
      'integrations',
      'oauth_states',
      'evidence_claims',
      'learning_lessons',
      'proposals',
      'prospect_evidence',
      'prospect_signals',
      'website_audits',
      'partnerships',
      'referrals',
      'agent_definitions',
      'agent_workers',
      'agent_runs',
      'agent_events',
      'commander_tasks',
      'commander_workers',
      'execution_events',
      'approvals'
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

  public async queryOneAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const prep = this.prepare(sql);
    const res = prep.get(...params);
    return (res !== undefined && res !== null) ? (res as T) : null;
  }

  public async queryAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const prep = this.prepare(sql);
    const res = prep.all(...params);
    return (Array.isArray(res) ? res : []) as T[];
  }

  public async executeAsync(sql: string, params: any[] = []): Promise<{ changes: number }> {
    const prep = this.prepare(sql);
    const res = prep.run(...params);
    return { changes: res.changes || 1 };
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
    const cleanSql = sql.trim().replace(/\s+/g, ' ');
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
        
        const mergeCompany = (prospectRow: any) => {
          if (!prospectRow) return prospectRow;
          const companyRow = this.data['companies']?.find(c => c.id === prospectRow.company_id);
          if (companyRow) {
            return {
              ...prospectRow,
              company_name: companyRow.name,
              website: companyRow.website,
              industry: companyRow.industry,
              location: companyRow.location
            };
          }
          return prospectRow;
        };

        const mergeProspect = (msgRow: any) => {
          if (!msgRow) return msgRow;
          const prospectRow = this.data['prospects']?.find(p => p.id === msgRow.prospect_id);
          if (prospectRow) {
            return {
              ...msgRow,
              contact_name: prospectRow.contact_name,
              prospect_stage: prospectRow.pipeline_stage
            };
          }
          return msgRow;
        };

        const applyJoins = (item: any) => {
          if (!item) return item;
          if (tableName === 'prospects') return mergeCompany(item);
          if (tableName === 'messages') return mergeProspect(item);
          return item;
        };

        if (/SELECT\s+COUNT\(\*\)\s+as\s+cnt/i.test(cleanSql)) {
          let cnt = 0;
          if (cleanSql.includes("WHERE intent_score >= 70")) {
            cnt = rows.filter(r => (r.intent_score || 0) >= 70).length;
          } else if (cleanSql.includes("WHERE human_takeover = 1") || cleanSql.includes("WHERE p.human_takeover = 1")) {
            cnt = rows.filter(r => r.human_takeover === 1).length;
          } else if (cleanSql.includes("WHERE status = 'ACTIVE'")) {
            cnt = rows.filter(r => r.status === 'ACTIVE').length;
          } else if (cleanSql.includes("WHERE status = 'SUCCEEDED'")) {
            cnt = rows.filter(r => r.status === 'SUCCEEDED').length;
          } else if (cleanSql.includes("WHERE status = 'FAILED'")) {
            cnt = rows.filter(r => r.status === 'FAILED').length;
          } else if (cleanSql.includes("approval_status = 'PENDING'")) {
            cnt = rows.filter(r => r.approval_status === 'PENDING').length;
          } else if (cleanSql.includes("status = 'PENDING'")) {
            cnt = rows.filter(r => r.status === 'PENDING').length;
          } else {
            cnt = rows.length;
          }
          return { cnt };
        }

        if (cleanSql.includes('WHERE id = ?') || cleanSql.includes('WHERE p.id = ?')) {
          return applyJoins(rows.find(r => r.id === params[0]));
        }
        if (cleanSql.includes('WHERE key = ?')) return rows.find(r => r.key === params[0]);
        if (cleanSql.includes('WHERE pairing_code = ?')) return rows.find(r => r.pairing_code === params[0]);
        if (cleanSql.includes('WHERE token_hash = ?')) return rows.find(r => r.token_hash === params[0]);
        if (cleanSql.includes('WHERE bridge_id = ?')) return rows.find(r => r.bridge_id === params[0]);
        if (cleanSql.includes('WHERE worker_id = ?')) return rows.find(r => r.worker_id === params[0]);
        if (cleanSql.includes('WHERE agent_id = ?')) return rows.find(r => r.agent_id === params[0]);
        if (cleanSql.includes('WHERE run_id = ?')) return rows.find(r => r.run_id === params[0]);
        if (cleanSql.includes("key = 'ollama_base_url'")) return rows.find(r => r.key === 'ollama_base_url');
        if (cleanSql.includes("key = 'ollama_model'")) return rows.find(r => r.key === 'ollama_model');
        if (cleanSql.includes("status = 'QUEUED'")) return rows.find(r => r.status === 'QUEUED');
        if (cleanSql.includes("request_id = ?")) return rows.find(r => r.request_id === params[0] || r.job_id === params[0]);
        return applyJoins(rows[0]);
      },
      all: (...params: any[]) => {
        let rows = [...(this.data[tableName] || [])];
        
        const mergeCompany = (prospectRow: any) => {
          if (!prospectRow) return prospectRow;
          const companyRow = this.data['companies']?.find(c => c.id === prospectRow.company_id);
          if (companyRow) {
            return {
              ...prospectRow,
              company_name: companyRow.name,
              website: companyRow.website,
              industry: companyRow.industry,
              location: companyRow.location
            };
          }
          return prospectRow;
        };

        const mergeProspect = (msgRow: any) => {
          if (!msgRow) return msgRow;
          const prospectRow = this.data['prospects']?.find(p => p.id === msgRow.prospect_id);
          if (prospectRow) {
            return {
              ...msgRow,
              contact_name: prospectRow.contact_name,
              prospect_stage: prospectRow.pipeline_stage
            };
          }
          return msgRow;
        };

        const applyJoins = (item: any) => {
          if (!item) return item;
          if (tableName === 'prospects') return mergeCompany(item);
          if (tableName === 'messages') return mergeProspect(item);
          return item;
        };

        let results = [];
        
        // Dynamic filtering based on parameters and query criteria
        if (cleanSql.includes("WHERE campaign_id = ?") || cleanSql.includes("WHERE p.campaign_id = ?")) {
          results = rows.filter(r => r.campaign_id === params[0]);
        } else if (cleanSql.includes("WHERE prospect_id = ?")) {
          results = rows.filter(r => r.prospect_id === params[0]);
        } else if (cleanSql.includes("WHERE company_id = ?")) {
          results = rows.filter(r => r.company_id === params[0]);
        } else if (cleanSql.includes("WHERE research_id = ?")) {
          results = rows.filter(r => r.research_id === params[0]);
        } else if (cleanSql.includes("WHERE agent_id = ?")) {
          results = rows.filter(r => r.agent_id === params[0]);
        } else if (cleanSql.includes("WHERE worker_id = ?")) {
          results = rows.filter(r => r.worker_id === params[0]);
        } else if (cleanSql.includes("WHERE run_id = ?")) {
          results = rows.filter(r => r.run_id === params[0]);
        } else if (cleanSql.includes("WHERE entity_type = ? AND entity_id = ?")) {
          results = rows.filter(r => r.entity_type === params[0] && r.entity_id === params[1]);
        } else if (cleanSql.includes("WHERE entity_type = ?")) {
          results = rows.filter(r => r.entity_type === params[0]);
        } else if (cleanSql.includes("WHERE entity_id = ?")) {
          results = rows.filter(r => r.entity_id === params[0]);
        } else if (cleanSql.includes("WHERE claim_type = ?")) {
          results = rows.filter(r => r.claim_type === params[0]);
        } else if (cleanSql.includes("WHERE signal_type = ?")) {
          results = rows.filter(r => r.signal_type === params[0]);
        } else if (cleanSql.includes("WHERE category = ?")) {
          results = rows.filter(r => r.category === params[0]);
        } else if (cleanSql.includes("WHERE p.human_takeover = 1") || cleanSql.includes("WHERE human_takeover = 1")) {
          results = rows.filter(r => r.human_takeover === 1);
        } else if (cleanSql.includes("approval_status = 'PENDING'")) {
          results = rows.filter(r => r.approval_status === 'PENDING');
        } else if (cleanSql.includes("WHERE status = 'PENDING'") || cleanSql.includes("status = 'PENDING'")) {
          results = rows.filter(r => r.status === 'PENDING');
        } else if (cleanSql.includes("WHERE status = 'WON'")) {
          results = rows.filter(r => r.status === 'WON');
        } else if (cleanSql.includes("WHERE status = 'SUCCEEDED'")) {
          results = rows.filter(r => r.status === 'SUCCEEDED');
        } else if (cleanSql.includes("status = 'ACTIVE'") || cleanSql.includes("status = 'QUEUED'")) {
          results = rows.filter(r => r.status === 'ACTIVE' || r.status === 'QUEUED');
        } else {
          results = rows;
        }

        // Sorting
        if (cleanSql.includes("ORDER BY created_at DESC")) {
          results.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        } else if (cleanSql.includes("ORDER BY started_at DESC")) {
          results.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime());
        } else if (cleanSql.includes("ORDER BY priority_score DESC")) {
          results.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
        }

        // Limit
        const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1], 10);
          results = results.slice(0, limit);
        }

        return results.map(applyJoins);
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

            // Enforce unique constraints for local JSON database to match pg behavior
            const existingTable = this.data[tableName] || [];
            if ('id' in newObj && newObj.id && existingTable.some(r => r.id === newObj.id)) {
              throw new Error(`UNIQUE constraint failed: ${tableName}.id`);
            }
            if ('key' in newObj && newObj.key && existingTable.some(r => r.key === newObj.key)) {
              throw new Error(`UNIQUE constraint failed: ${tableName}.key`);
            }

            this.data[tableName].push(newObj);
            this.saveData();
            return { changes: 1, lastInsertRowid: Date.now() };
          }
        }

        if (isUpdate && cleanSql.includes('WHERE key = ?')) {
          const keyVal = params[params.length - 1];
          const item = this.data[tableName].find(r => r.key === keyVal);
          if (item) {
            if (cleanSql.includes('value = ?')) item.value = params[0];
            if (cleanSql.includes('updated_at = ?')) item.updated_at = params[1];
            this.saveData();
            return {
              changes: 1,
              lastInsertRowid: 0
            };
          }
        }

        if (isUpdate && (cleanSql.includes('WHERE id = ?') || cleanSql.includes('WHERE p.id = ?'))) {
          const idVal = params[params.length - 1];
          const item = this.data[tableName].find(r => r.id === idVal);
          if (item) {
            const setPart = cleanSql.match(/SET\s+(.+?)\s+WHERE/i);
            if (setPart) {
              const assignments = setPart[1].split(',');
              let paramIdx = 0;
              assignments.forEach(assignment => {
                const parts = assignment.split('=');
                if (parts.length === 2) {
                  const fieldName = parts[0].trim().toLowerCase();
                  const rightSide = parts[1].trim();
                  if (rightSide === '?') {
                    item[fieldName] = params[paramIdx++];
                  } else {
                    if (rightSide === 'true') item[fieldName] = true;
                    else if (rightSide === 'false') item[fieldName] = false;
                    else if (/^\d+$/.test(rightSide)) item[fieldName] = parseInt(rightSide, 10);
                    else if (/^['"](.*)['"]$/.test(rightSide)) {
                      item[fieldName] = rightSide.slice(1, -1);
                    } else {
                      item[fieldName] = rightSide;
                    }
                  }
                }
              });
            }
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
        
        if (isDelete && cleanSql.includes('WHERE company_id = ?')) {
          const idVal = params[0];
          this.data[tableName] = this.data[tableName].filter(r => r.company_id !== idVal);
          this.saveData();
          return { changes: 1, lastInsertRowid: 0 };
        }
        
        if (isDelete && cleanSql.includes('WHERE prospect_id = ?')) {
          const idVal = params[0];
          this.data[tableName] = this.data[tableName].filter(r => r.prospect_id !== idVal);
          this.saveData();
          return { changes: 1, lastInsertRowid: 0 };
        }
        
        if (isDelete && cleanSql.includes('WHERE campaign_id = ?')) {
          const idVal = params[0];
          this.data[tableName] = this.data[tableName].filter(r => r.campaign_id !== idVal);
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
