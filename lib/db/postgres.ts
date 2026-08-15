import { DatabaseAdapter, PreparedQuery } from '../db';
import { Pool } from 'pg';
import crypto from 'crypto';

// Strict allowlist for table names used in dynamic SQL count queries
const ALLOWED_TABLES = new Set([
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
  'agent_statuses'
]);

function convertSqlPlaceholders(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export class PostgresProductionDatabase implements DatabaseAdapter {
  public type: 'POSTGRES' = 'POSTGRES';
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    console.log('⚡ Initialized Real PostgresProductionDatabase Pool for Production Deployment.');
  }

  public async queryOneAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const pgSql = convertSqlPlaceholders(sql);
    try {
      const res = await this.pool.query(pgSql, params);
      return (res.rows[0] as T) || null;
    } catch (err: any) {
      console.error(`PostgreSQL queryOneAsync error [${pgSql}]:`, err.message);
      throw err;
    }
  }

  public async queryAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const pgSql = convertSqlPlaceholders(sql);
    try {
      const res = await this.pool.query(pgSql, params);
      return (res.rows as T[]) || [];
    } catch (err: any) {
      console.error(`PostgreSQL queryAllAsync error [${pgSql}]:`, err.message);
      throw err;
    }
  }

  public async executeAsync(sql: string, params: any[] = []): Promise<{ changes: number }> {
    const pgSql = convertSqlPlaceholders(sql);
    try {
      const res = await this.pool.query(pgSql, params);
      return { changes: res.rowCount || 0 };
    } catch (err: any) {
      console.error(`PostgreSQL executeAsync error [${pgSql}]:`, err.message);
      throw err;
    }
  }

  public count(tableName: string, predicate?: (row: any) => boolean): number {
    throw new Error('PostgresProductionDatabase does not support synchronous count(). Use countAsync().');
  }

  public async countAsync(tableName: string, predicate?: (row: any) => boolean): Promise<number> {
    const tableKey = tableName.toLowerCase();
    if (!ALLOWED_TABLES.has(tableKey)) {
      throw new Error(`Invalid table name '${tableName}' rejected by SQL table allowlist.`);
    }

    try {
      const res = await this.pool.query(`SELECT COUNT(*) as cnt FROM ${tableKey}`);
      return parseInt(res.rows[0]?.cnt || '0', 10);
    } catch (err: any) {
      console.error(`PostgreSQL count error on table '${tableKey}':`, err.message);
      throw err;
    }
  }

  public async createPairingCodeAsync(): Promise<string> {
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const id = `pair_${Date.now()}`;

    await this.pool.query(`
      INSERT INTO pairing_codes (id, pairing_code, expires_at, status, created_at)
      VALUES ($1, $2, $3, 'ACTIVE', CURRENT_TIMESTAMP)
    `, [id, code, expiresAt]);

    return code;
  }

  public async validatePairingCodeAsync(code: string): Promise<{ success: boolean; token?: string; message: string }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const selectRes = await client.query(`
        SELECT * FROM pairing_codes 
        WHERE pairing_code = $1 
        FOR UPDATE
      `, [code]);

      if (selectRes.rows.length === 0) {
        await client.query('COMMIT');
        return { success: false, message: 'Invalid pairing code.' };
      }

      const row = selectRes.rows[0];
      if (row.status !== 'ACTIVE') {
        await client.query('COMMIT');
        return { success: false, message: 'Pairing code already used.' };
      }

      if (Date.now() > Number(row.expires_at)) {
        await client.query("UPDATE pairing_codes SET status = 'EXPIRED' WHERE pairing_code = $1", [code]);
        await client.query('COMMIT');
        return { success: false, message: 'Pairing code expired.' };
      }

      const usedAt = new Date().toISOString();
      await client.query("UPDATE pairing_codes SET status = 'USED', used_at = $1 WHERE pairing_code = $2", [usedAt, code]);

      const token = `prx_bridge_${crypto.randomBytes(24).toString('hex')}`;
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const bridgeId = `bridge_${crypto.randomBytes(4).toString('hex')}`;

      await client.query(`
        INSERT INTO bridge_sessions (id, bridge_id, token_hash, machine_id, os, arch, ollama_version, models, active_model, status, last_seen, created_at)
        VALUES ($1, $2, $3, 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', '[]', 'UNKNOWN', 'CONNECTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [bridgeId, bridgeId, tokenHash]);

      await client.query('COMMIT');
      return { success: true, token, message: 'Device paired successfully.' };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL validatePairingCode error:', err.message);
      return { success: false, message: 'Pairing code validation failed.' };
    } finally {
      client.release();
    }
  }

  public async verifyBearerTokenAsync(token: string): Promise<any> {
    if (!token) return null;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const res = await this.pool.query('SELECT * FROM bridge_sessions WHERE token_hash = $1', [tokenHash]);
    return res.rows[0] || null;
  }

  public async handleHeartbeatAsync(payload: any): Promise<{ ok: boolean; timestamp: string }> {
    const tokenHash = crypto.createHash('sha256').update(payload.token).digest('hex');
    const timestamp = new Date().toISOString();
    const bridgeId = payload.bridge_id || `bridge_${Date.now()}`;

    await this.pool.query(`
      INSERT INTO bridge_sessions (id, bridge_id, token_hash, machine_id, os, arch, ollama_version, models, active_model, status, last_seen, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'CONNECTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (token_hash) DO UPDATE SET
        last_seen = CURRENT_TIMESTAMP,
        status = 'CONNECTED',
        machine_id = EXCLUDED.machine_id,
        os = EXCLUDED.os,
        arch = EXCLUDED.arch,
        ollama_version = EXCLUDED.ollama_version,
        models = EXCLUDED.models,
        active_model = EXCLUDED.active_model
    `, [
      bridgeId,
      bridgeId,
      tokenHash,
      payload.machine_id || 'UNKNOWN',
      payload.os || 'UNKNOWN',
      payload.arch || 'UNKNOWN',
      payload.ollama_version || 'UNKNOWN',
      JSON.stringify(payload.models || []),
      payload.active_model || 'UNKNOWN'
    ]);

    return { ok: true, timestamp };
  }

  public async getBridgeStatusAsync(): Promise<{ bridge: any; status: string; mode: string }> {
    const res = await this.pool.query('SELECT * FROM bridge_sessions ORDER BY last_seen DESC LIMIT 1');
    if (res.rows.length === 0) return { bridge: null, status: 'BRIDGE_OFFLINE', mode: 'HYBRID' };
    const session = res.rows[0];
    const isStale = (Date.now() - new Date(session.last_seen).getTime()) > 30000;
    return {
      bridge: isStale ? { ...session, status: 'OFFLINE' } : session,
      status: isStale ? 'OFFLINE' : session.status,
      mode: 'HYBRID'
    };
  }

  public async enqueueJobAsync(type: string, payload: any): Promise<any> {
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

    await this.pool.query(`
      INSERT INTO ai_jobs (id, request_id, job_id, type, payload, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'QUEUED', CURRENT_TIMESTAMP)
    `, [jobId, reqId, jobId, type, JSON.stringify(payload)]);

    return {
      ...job,
      payload
    };
  }

  public async claimNextJobAtomicallyAsync(bridgeId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const selectRes = await client.query(`
        SELECT * FROM ai_jobs 
        WHERE status = 'QUEUED' 
        ORDER BY created_at ASC 
        LIMIT 1 
        FOR UPDATE SKIP LOCKED
      `);

      if (selectRes.rows.length === 0) {
        await client.query('COMMIT');
        return null;
      }

      const job = selectRes.rows[0];
      const claimedAt = new Date().toISOString();

      await client.query(`
        UPDATE ai_jobs 
        SET status = 'CLAIMED', claimed_at = CURRENT_TIMESTAMP, bridge_id = $1 
        WHERE request_id = $2
      `, [bridgeId, job.request_id]);

      await client.query('COMMIT');
      return {
        ...job,
        status: 'CLAIMED',
        bridge_id: bridgeId,
        claimed_at: claimedAt,
        payload: typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL claimNextJob error:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  public async completeJobAtomicallyAsync(requestId: string, result: any, latencyMs: number, bridgeId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const selectRes = await client.query(`
        SELECT * FROM ai_jobs 
        WHERE (request_id = $1 OR job_id = $1) 
        FOR UPDATE
      `, [requestId]);

      if (selectRes.rows.length === 0) {
        await client.query('COMMIT');
        return false;
      }

      const row = selectRes.rows[0];
      if (row.bridge_id && row.bridge_id !== bridgeId) {
        await client.query('COMMIT');
        return false; // Reject forged completion
      }
      if (row.status === 'COMPLETED') {
        await client.query('COMMIT');
        return false; // Reject duplicate completion
      }

      await client.query(`
        UPDATE ai_jobs 
        SET status = 'COMPLETED', result = $1, latency_ms = $2, completed_at = CURRENT_TIMESTAMP 
        WHERE id = $3
      `, [JSON.stringify(result), latencyMs, row.id]);

      await client.query('COMMIT');
      return true;
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL completeJob error:', err.message);
      return false;
    } finally {
      client.release();
    }
  }

  public async getJobStatusAsync(requestId: string): Promise<any> {
    const res = await this.pool.query('SELECT * FROM ai_jobs WHERE (request_id = $1 OR job_id = $1)', [requestId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      result: row.result ? (typeof row.result === 'string' ? JSON.parse(row.result) : row.result) : undefined
    };
  }

  public prepare(sql: string): PreparedQuery {
    throw new Error('PostgresProductionDatabase does not support prepare(). All production queries use async adapter methods (queryOneAsync, queryAllAsync, executeAsync) directly.');
  }
}

export function getPostgresDb(connectionString: string): DatabaseAdapter {
  return new PostgresProductionDatabase(connectionString);
}
