import fs from 'fs';
import path from 'path';

/**
 * PROXIMA DATABASE ARCHITECTURE
 * Storage Type: LOCAL DATABASE (LOCAL FILE SYSTEM / JSON ABSTRACTED STORE)
 * Production Notice: NOT PRODUCTION PERSISTENT ON VERCEL SERVERLESS.
 * Production Deployments require an external persistent database service (PostgreSQL/Cloud SQL).
 */

export interface PreparedQuery {
  get: (...params: any[]) => any;
  all: (...params: any[]) => any[];
  run: (...params: any[]) => { changes: number; lastInsertRowid: number };
}

export interface DatabaseAdapter {
  prepare(sql: string): PreparedQuery;
  count(tableName: string, predicate?: (row: any) => boolean): number;
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

        // Handle SELECT COUNT(*) as cnt queries gracefully
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

        if (cleanSql.includes('WHERE id = ?')) {
          return rows.find(r => r.id === params[0]);
        }
        if (cleanSql.includes('WHERE pairing_code = ?')) {
          return rows.find(r => r.pairing_code === params[0]);
        }
        if (cleanSql.includes('WHERE token_hash = ?')) {
          return rows.find(r => r.token_hash === params[0]);
        }
        if (cleanSql.includes('WHERE bridge_id = ?')) {
          return rows.find(r => r.bridge_id === params[0]);
        }
        if (cleanSql.includes("key = 'ollama_base_url'")) {
          return rows.find(r => r.key === 'ollama_base_url');
        }
        if (cleanSql.includes("key = 'ollama_model'")) {
          return rows.find(r => r.key === 'ollama_model');
        }
        if (cleanSql.includes("status = 'QUEUED'")) {
          return rows.find(r => r.status === 'QUEUED');
        }
        if (cleanSql.includes("request_id = ?")) {
          return rows.find(r => r.request_id === params[0] || r.job_id === params[0]);
        }
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
        if (!this.data[tableName]) {
          this.data[tableName] = [];
        }

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

export type LocalDatabase = LocalJsonDatabase;

let dbInstance: LocalJsonDatabase | null = null;

export function initDb(): LocalJsonDatabase {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), 'db.json');
    dbInstance = new LocalJsonDatabase(dbPath);
    console.log('✅ Local Database Initialized Successfully.');
  }
  return dbInstance;
}

export function getDb(): LocalJsonDatabase {
  return initDb();
}
