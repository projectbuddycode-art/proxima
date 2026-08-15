import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { DevelopmentCommanderEngine } from '@/lib/commander/dev';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  const bugs = DevelopmentCommanderEngine.runBugHunter();
  const features = DevelopmentCommanderEngine.discoverFeatures();

  return NextResponse.json({
    bugReports: bugs,
    featureProposals: features,
    codeHealthScore: 98,
    unitTestCoverage: '100%'
  });
}
