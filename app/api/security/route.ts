import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  const db = getDb();
  const observations = await db.queryAllAsync('SELECT * FROM security_observations');

  return NextResponse.json({
    observations
  });
}
