import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    initDb();
    const db = getDb();

    const totalDiscovered = db.count('prospects');
    const totalResearched = db.count('prospects', r => r.fit_score !== undefined || r.intent_score !== undefined);
    const highIntentCount = db.count('prospects', r => (r.intent_score || 0) >= 70);
    const takeoverCount = db.count('prospects', r => r.human_takeover === 1);
    const messagesPrepared = db.count('outreach_messages');
    const messagesSent = db.count('outreach_messages', r => r.status === 'SENT');
    const responsesReceived = db.count('responses');
    const meetingsScheduled = db.count('prospects', r => r.status === 'MEETING_SCHEDULED');

    // Retrieve active campaign and offer from actual database records
    const campaigns = db.prepare('SELECT * FROM campaigns').all() as any[];
    const activeCampaign = campaigns.find(c => c.status === 'ACTIVE') || campaigns[0] || null;

    const topPerformingCampaign = activeCampaign ? activeCampaign.name : null;
    const bestOffer = activeCampaign ? activeCampaign.offer : null;

    // Calculate actual pipeline value from database records or return null
    const prospects = db.prepare('SELECT * FROM prospects').all() as any[];
    let totalPipeline = 0;
    for (const p of prospects) {
      if (p.human_takeover === 1 || p.intent_score >= 70) {
        totalPipeline += p.estimated_value || p.min_project_value || 0;
      }
    }
    const pipelineValue = totalPipeline > 0 ? totalPipeline : null;

    return NextResponse.json({
      reportDate: new Date().toISOString().split('T')[0],
      metrics: {
        prospectsDiscovered: totalDiscovered,
        prospectsResearched: totalResearched,
        highIntentProspects: highIntentCount,
        messagesPrepared,
        messagesSent,
        repliesReceived: responsesReceived,
        interestedLeads: takeoverCount,
        meetingsScheduled,
        pipelineValue
      },
      topPerformingCampaign,
      bestOffer,
      recommendedNextAction: takeoverCount > 0
        ? `🚨 Review ${takeoverCount} hot lead(s) requiring human takeover.`
        : 'No action required.'
    });
  } catch (err: any) {
    return NextResponse.json({
      error: 'DATABASE_UNAVAILABLE',
      message: 'Daily report could not be generated.'
    }, { status: 500 });
  }
}
