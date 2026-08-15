import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { RealProspectFirewall } from '@/lib/verification/firewall';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    initDb();
    const db = getDb();

    const rawProspects = await db.queryAllAsync(`
      SELECT p.*, c.name as company_name, c.website, c.industry, c.location
      FROM prospects p
      LEFT JOIN companies c ON p.company_id = c.id
    `);

    const prospects = rawProspects.filter(p => RealProspectFirewall.validateRealProspect(p));

    const totalDiscovered = prospects.length;
    const totalResearched = prospects.length;
    const messagesPrepared = await db.countAsync('outreach_messages');
    const responsesReceived = await db.countAsync('responses');

    const campaigns = await db.queryAllAsync('SELECT * FROM campaigns');
    const activeCampaign = campaigns.find((c: any) => c.status === 'ACTIVE') || campaigns[0] || null;

    const topPerformingCampaign = activeCampaign ? activeCampaign.name : null;
    const bestOffer = activeCampaign ? activeCampaign.offer : null;

    let highIntentCount = 0;
    let meetingsScheduled = 0;
    let totalPipeline = 0;
    let actualTakeovers = 0;

    for (const p of prospects) {
      if ((p.intent_score || 0) >= 70) highIntentCount++;
      if (p.human_takeover === 1) actualTakeovers++;
      if (p.status === 'MEETING_SCHEDULED') meetingsScheduled++;
      if (p.human_takeover === 1 || (p.intent_score || 0) >= 70) {
        totalPipeline += p.estimated_value || p.min_project_value || 8500;
      }
    }
    const pipelineValue = totalPipeline;

    return NextResponse.json({
      reportDate: new Date().toISOString().split('T')[0],
      metrics: {
        prospectsDiscovered: totalDiscovered,
        prospectsResearched: totalResearched,
        highIntentProspects: highIntentCount,
        messagesPrepared,
        messagesSent: 0,
        repliesReceived: responsesReceived,
        interestedLeads: actualTakeovers,
        meetingsScheduled,
        pipelineValue
      },
      topPerformingCampaign,
      bestOffer,
      recommendedNextAction: actualTakeovers > 0
        ? `🚨 Review ${actualTakeovers} hot lead(s) requiring human takeover.`
        : 'No action required.'
    });
  } catch (err: any) {
    return NextResponse.json({
      error: 'DATABASE_UNAVAILABLE',
      message: err.message || 'Daily report could not be generated.'
    }, { status: 500 });
  }
}
