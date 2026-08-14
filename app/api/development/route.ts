import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { DevelopmentCommanderEngine } from '@/lib/commander/dev';

export async function GET() {
  initDb();
  const bugs = DevelopmentCommanderEngine.runBugHunter();
  const features = DevelopmentCommanderEngine.discoverFeatures();

  return NextResponse.json({ bugs, features });
}
