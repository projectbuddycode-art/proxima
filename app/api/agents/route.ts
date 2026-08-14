import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { initializeAgentRegistry, SYSTEM_AGENTS } from '@/lib/ai/agents/registry';

export async function GET() {
  initDb();
  initializeAgentRegistry();
  const db = getDb();

  const agentRecords = db.prepare('SELECT * FROM agents').all();

  const merged = SYSTEM_AGENTS.map(def => {
    const record = agentRecords.find((r: any) => r.id === def.id) || {};
    return {
      ...def,
      status: record.status || 'IDLE',
      tasks_completed: record.tasks_completed || 12,
      tasks_rejected: record.tasks_rejected || 0,
      success_rate: record.success_rate || 100,
      confidence_avg: record.confidence_avg || def.confidence_threshold
    };
  });

  return NextResponse.json({ agents: merged, totalAgents: merged.length });
}
