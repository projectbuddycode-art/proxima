import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { ProximaCommanderEngine } from '@/lib/commander/engine';
import { GeographicExpansionEngine } from '@/lib/commander/expansion';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  
  // Call newly refactored dynamic async commander engines
  const evaluation = await ProximaCommanderEngine.evaluateSystemState();
  const cityMatrix = await GeographicExpansionEngine.generateExpansionMatrix();

  return NextResponse.json({
    target: evaluation.target,
    gapAnalysis: evaluation.gapAnalysis,
    tasks: evaluation.prioritizedTasks,
    cityMatrix,
    summary: evaluation.summary
  });
}
