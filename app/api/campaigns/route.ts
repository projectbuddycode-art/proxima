import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { PipelineOrchestrator } from '@/lib/orchestrator/pipeline';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  const db = getDb();
  const campaigns = await db.queryAllAsync('SELECT * FROM campaigns ORDER BY created_at DESC');
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  try {
    initDb();
    const db = getDb();
    const body = await request.json();

    const campaignId = `camp_${Date.now()}`;
    await db.executeAsync(
      `INSERT INTO campaigns (id, name, industry, location, target_role, offer, min_intent, min_fit, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaignId,
        body.name || `${body.location || 'Bangalore'} ${body.industry || 'Commercial'} PROXIMA Campaign`,
        body.industry || 'Commercial',
        body.location || 'Bangalore',
        body.target_role || 'Director',
        body.offer || 'Operational Modernization & Automation',
        body.min_intent || 70,
        body.min_fit || 70,
        'ACTIVE'
      ]
    );

    // Execute real pipeline discovery & verification
    console.log(`[CAMPAIGNS API] Triggering real discovery pipeline for campaign ${campaignId}...`);
    const processed = await PipelineOrchestrator.runCampaignPipeline(campaignId);

    return NextResponse.json({
      success: true,
      campaignId,
      prospectsDiscovered: processed.length,
      processed
    });
  } catch (err: any) {
    console.error('[CAMPAIGNS API ERROR]', err.message);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Discovery execution failed.',
        code: 'DISCOVERY_EXECUTION_FAILED'
      },
      { status: 500 }
    );
  }
}
