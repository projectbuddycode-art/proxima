import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PROXIMA Internal Diagnostics Endpoint
 * Returns database schema version, migration health, active jobs, and system status.
 */
export async function GET() {
  initDb();
  const db = getDb();
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    databaseType: db.type,
    schemaVersion: 'unknown',
    migrationHealth: 'unknown'
  };

  // Schema version
  try {
    const latest = await db.queryOneAsync('SELECT MAX(version) as version FROM schema_migrations');
    diagnostics.schemaVersion = (latest as any)?.version ?? 0;
    diagnostics.migrationHealth = 'HEALTHY';
  } catch {
    diagnostics.schemaVersion = 'schema_migrations table not found';
    diagnostics.migrationHealth = 'NO_TRACKING';
  }

  // Table row counts
  const tables = [
    'campaigns', 'prospects', 'companies', 'messages', 'outreach_messages',
    'responses', 'research', 'opportunities', 'ai_jobs', 'agents',
    'security_observations', 'evidence_claims', 'bridge_sessions'
  ];

  const tableCounts: Record<string, number | string> = {};
  for (const table of tables) {
    try {
      const count = await db.countAsync(table);
      tableCounts[table] = count;
    } catch {
      tableCounts[table] = 'error';
    }
  }
  diagnostics.tableCounts = tableCounts;

  // Active jobs
  try {
    const activeJobs = await db.queryAllAsync("SELECT id, type, status, entity_type, entity_id, created_at FROM ai_jobs WHERE status IN ('QUEUED', 'RUNNING', 'CLAIMED') ORDER BY created_at DESC");
    diagnostics.activeJobs = activeJobs;
    diagnostics.activeJobCount = activeJobs.length;
  } catch {
    diagnostics.activeJobs = [];
    diagnostics.activeJobCount = 0;
  }

  // Campaign pipeline status
  try {
    const campaigns = await db.queryAllAsync("SELECT id, name, status, pipeline_stage, error_code FROM campaigns WHERE status != 'ARCHIVED' ORDER BY created_at DESC");
    diagnostics.activeCampaigns = campaigns;
  } catch {
    diagnostics.activeCampaigns = [];
  }

  // Bridge status
  try {
    const bridge = await db.queryOneAsync('SELECT id, status, last_seen, ollama_version, active_model FROM bridge_sessions ORDER BY last_seen DESC LIMIT 1');
    if (bridge) {
      const isStale = (Date.now() - new Date((bridge as any).last_seen).getTime()) > 30000;
      diagnostics.bridge = {
        ...(bridge as any),
        connectionStatus: isStale ? 'OFFLINE' : 'CONNECTED'
      };
    } else {
      diagnostics.bridge = { connectionStatus: 'NO_BRIDGE' };
    }
  } catch {
    diagnostics.bridge = { connectionStatus: 'ERROR' };
  }

  // Pending approvals
  try {
    const pending = await db.queryAllAsync("SELECT COUNT(*) as cnt FROM messages WHERE approval_status = 'PENDING'");
    diagnostics.pendingApprovals = (pending[0] as any)?.cnt || 0;
  } catch {
    diagnostics.pendingApprovals = 0;
  }

  // Human takeovers
  try {
    const takeovers = await db.queryAllAsync('SELECT COUNT(*) as cnt FROM prospects WHERE human_takeover = 1');
    diagnostics.humanTakeovers = (takeovers[0] as any)?.cnt || 0;
  } catch {
    diagnostics.humanTakeovers = 0;
  }

  // Blocked/failed campaigns
  try {
    const failed = await db.queryAllAsync("SELECT id, name, error_code, error_message FROM campaigns WHERE status = 'FAILED'");
    diagnostics.failedCampaigns = failed;
  } catch {
    diagnostics.failedCampaigns = [];
  }

  return NextResponse.json(diagnostics);
}
