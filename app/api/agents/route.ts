import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { AgentRuntimeSystem } from '@/lib/ai/runtime';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  const db = getDb();

  // Aggregate real execution-based metrics
  const realMetrics = await AgentRuntimeSystem.aggregateAgentMetrics();

  // Sync back to the compatibility agents table
  for (const metric of realMetrics) {
    try {
      await db.executeAsync(
        'UPDATE agents SET status = ?, tasks_completed = ?, tasks_rejected = ?, success_rate = ?, last_active = ? WHERE id = ?',
        [
          metric.status,
          metric.tasks_completed,
          metric.tasks_failed, // mapped to tasks_rejected/failed
          metric.success_rate,
          metric.last_active || null,
          metric.agent_id
        ]
      );
    } catch (e: any) {
      console.warn('[AGENT ROUTE] Sync warning:', e.message);
    }
  }

  const agentRecords = await db.queryAllAsync('SELECT * FROM agents');

  return NextResponse.json({
    agents: agentRecords
  });
}
