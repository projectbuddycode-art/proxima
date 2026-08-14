import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  initDb();
  const db = getDb();
  const observations = db.prepare('SELECT * FROM security_observations').all();

  return NextResponse.json({ observations });
}
