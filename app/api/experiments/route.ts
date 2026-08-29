import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  const db = getDb();

  const strategies = await db.queryAllAsync('SELECT * FROM strategies');
  const experiments = await db.queryAllAsync('SELECT * FROM experiments');

  return NextResponse.json({
    strategies,
    experiments
  });
}
