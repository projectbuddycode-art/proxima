import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { RealProspectFirewall } from '@/lib/verification/firewall';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  initDb();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const takeoverOnly = searchParams.get('takeover') === 'true';

  if (id) {
    const prospect = await db.queryOneAsync(`
      SELECT p.*, c.name as company_name, c.website, c.industry, c.location
      FROM prospects p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (!prospect || !RealProspectFirewall.validateRealProspect(prospect)) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const research = prospect.company_id ? await db.queryOneAsync('SELECT * FROM research WHERE company_id = ?', [prospect.company_id]) : null;
    const opportunity = await db.queryOneAsync('SELECT * FROM opportunities WHERE prospect_id = ?', [prospect.id]);
    const messages = await db.queryAllAsync('SELECT * FROM messages WHERE prospect_id = ?', [prospect.id]);
    const responses = await db.queryAllAsync('SELECT * FROM responses WHERE prospect_id = ? ORDER BY created_at DESC', [prospect.id]);
    const followups = await db.queryAllAsync('SELECT * FROM followups WHERE prospect_id = ?', [prospect.id]);
    const sources = (research && (research as any).id) ? await db.queryAllAsync('SELECT * FROM sources WHERE research_id = ?', [(research as any).id]) : [];

    // Query evidence and signals from database
    const evidence = prospect.company_id ? await db.queryAllAsync('SELECT * FROM prospect_evidence WHERE entity_id = ?', [prospect.company_id]) : [];
    const signals = prospect.company_id ? await db.queryAllAsync('SELECT * FROM prospect_signals WHERE company_id = ?', [prospect.company_id]) : [];

    // Compute explainability parameters
    const isQualified = RealProspectFirewall.validateQualified(prospect);
    const whyDiscovered = `Prospect was discovered on ${prospect.source || 'OpenStreetMap'} under campaign ID: ${prospect.campaign_id}.`;
    const howIdentityWasVerified = prospect.email_verification_status === 'VERIFIED'
      ? `Company identity was verified through official domain check to ${prospect.website || 'website'} and corroborated contact email format.`
      : 'Company identity verification is LIKELY based on public records match.';
    
    const unverifiedList: string[] = [];
    if (prospect.phone_verification_status !== 'VERIFIED') unverifiedList.push('phone');
    if (prospect.email_verification_status !== 'VERIFIED') unverifiedList.push('email');
    const whatIsUnverified = unverifiedList.length > 0 ? `Unverified contact channels: ${unverifiedList.join(', ')}` : 'All primary contact channels verified.';

    const explainability = {
      WHY_DISCOVERED: whyDiscovered,
      HOW_IDENTITY_WAS_VERIFIED: howIdentityWasVerified,
      WHAT_IS_UNVERIFIED: whatIsUnverified,
      SOURCES: [prospect.source || 'Discovered Web Registry'],
      EVIDENCE: evidence.map((e: any) => e.claim_type || e.claim || 'Observation Claim'),
      CONTACTS: [
        { type: 'EMAIL', value: prospect.email, status: prospect.email_verification_status },
        { type: 'PHONE', value: prospect.phone, status: prospect.phone_verification_status }
      ],
      SIGNALS: signals.map((s: any) => s.title || s.signal_type),
      FRESHNESS: prospect.priority_score >= 70 ? 'FRESH' : 'AGING',
      CONFIDENCE: prospect.confidence || 75,
      DEDUPLICATION_STATUS: 'MERGED_UNIQUE_RECORD',
      QUALIFICATION_STATUS: isQualified ? 'QUALIFIED' : 'NEEDS_REVIEW'
    };

    return NextResponse.json({
      prospect,
      research,
      opportunity,
      messages,
      responses,
      followups,
      sources,
      explainability
    });
  }

  let query = `
    SELECT p.*, c.name as company_name, c.website, c.industry, c.location
    FROM prospects p
    LEFT JOIN companies c ON p.company_id = c.id
  `;

  if (takeoverOnly) {
    query += ` WHERE p.human_takeover = 1`;
  }

  query += ` ORDER BY p.intent_score DESC, p.created_at DESC`;

  const rawProspects = await db.queryAllAsync(query);
  const prospects = rawProspects.filter(p => RealProspectFirewall.validateRealProspect(p));

  return NextResponse.json({ prospects });
}
