import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { initializeStrategyRegistry } from '@/lib/discovery/strategies';

export async function GET() {
  initDb();
  initializeStrategyRegistry();
  const db = getDb();

  const strategies = db.prepare('SELECT * FROM strategies').all();
  const experiments = db.prepare('SELECT * FROM experiments').all();

  return NextResponse.json({ strategies, experiments });
}
