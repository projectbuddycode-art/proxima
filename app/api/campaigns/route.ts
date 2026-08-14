import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { PipelineOrchestrator } from '@/lib/orchestrator/pipeline';

export async function GET() {
  initDb();
  const db = getDb();
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  initDb();
  const db = getDb();
  const body = await req.json();

  const { action, campaignId } = body;

  if (action === 'EXECUTE' && campaignId) {
    try {
      const results = await PipelineOrchestrator.runCampaignPipeline(campaignId);
      return NextResponse.json({ success: true, message: `Processed ${results.length} prospects.`, results });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // Create Campaign
  const id = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const { name, industry, location, target_role, offer, min_intent, min_fit } = body;

  db.prepare(`
    INSERT INTO campaigns (id, name, industry, location, target_role, offer, min_intent, min_fit, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `).run(
    id,
    name || `${location || 'Bangalore'} ${industry || 'Lighting'} Campaign`,
    industry || 'Lighting',
    location || 'Bangalore',
    target_role || 'Founder / Managing Director',
    offer || 'Premium Digital Lighting Showroom',
    min_intent || 70,
    min_fit || 70
  );

  // Automatically execute discovery pipeline for the new campaign
  let results: any[] = [];
  try {
    results = await PipelineOrchestrator.runCampaignPipeline(id);
  } catch (err) {
    console.warn('Pipeline execution warning:', err);
  }

  return NextResponse.json({ success: true, campaignId: id, prospectsGenerated: results.length });
}
