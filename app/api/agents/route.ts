import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  const db = getDb();
  const agentRecords = await db.queryAllAsync('SELECT * FROM agents');

  return NextResponse.json({
    agents: agentRecords
  });
}
