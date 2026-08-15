import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { PipelineOrchestrator } from '@/lib/orchestrator/pipeline';
import { runResponseCopilot } from '@/lib/ai/agents';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  initDb();
  const db = getDb();
  const body = await req.json();

  const { prospectId, rawMessage, channel } = body;

  if (!prospectId || !rawMessage) {
    return NextResponse.json({ error: 'prospectId and rawMessage required' }, { status: 400 });
  }

  try {
    const result = await PipelineOrchestrator.processIncomingResponse(prospectId, rawMessage, channel || 'EMAIL');

    // Fetch copilot guidance if human takeover triggered
    let copilot = null;
    if (result.needsHumanTakeover) {
      const prospect = await db.queryOneAsync('SELECT company_id FROM prospects WHERE id = ?', [prospectId]);
      const research = (prospect && (prospect as any).company_id) ? await db.queryOneAsync('SELECT * FROM research WHERE company_id = ?', [(prospect as any).company_id]) : null;
      if (research) {
        copilot = await runResponseCopilot(rawMessage, {
          company_name: (research as any).company_name || 'Prospect Company',
          website: '',
          industry: '',
          location: '',
          company_summary: (research as any).reason_to_contact_now || '',
          decision_makers: [],
          products_services: [],
          target_customers: [],
          business_model: '',
          observable_website_findings: JSON.parse((research as any).observable_website_findings || '[]'),
          social_signals: [],
          hiring_signals: [],
          expansion_signals: [],
          review_signals: [],
          buying_signals: [],
          pain_hypotheses: JSON.parse((research as any).pain_hypotheses || '[]'),
          commercial_opportunities: [],
          recommended_project_buddy_capability: (research as any).recommended_project_buddy_capability || '',
          recommended_offer: (research as any).recommended_offer || '',
          reason_to_contact_now: (research as any).reason_to_contact_now || '',
          confidence: 0.9
        });
      }
    }

    return NextResponse.json({
      success: true,
      classification: result.classification.classification,
      humanTakeoverRequired: result.needsHumanTakeover,
      reason: result.classification.reason,
      copilot
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
