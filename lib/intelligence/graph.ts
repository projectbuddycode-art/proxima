/**
 * PROXIMA Opportunity Intelligence Graph Engine
 * Query and materialize company relationship graph deterministically from database records.
 */

import { getDb } from '../db';
import { CompanyIntelligenceGraph } from '../domain/graph';
import { EvidenceEngine } from '../verification/evidence';

export class OpportunityGraphEngine {
  /**
   * Fetches the complete relationship graph for a company
   */
  static async getCompanyGraph(companyId: string): Promise<CompanyIntelligenceGraph | null> {
    const db = getDb();
    const company = await db.queryOneAsync('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) return null;

    // 1. Evidence
    const evidence = await EvidenceEngine.getEvidenceForEntity('company', companyId);

    // 2. Signals
    const rawSignals = await db.queryAllAsync('SELECT * FROM prospect_signals WHERE company_id = ?', [companyId]);
    const signals = rawSignals.map((s: any) => ({
      id: s.id,
      signal_type: s.signal_type,
      title: s.title,
      description: s.description,
      confidence: s.confidence || 80,
      freshness_score: EvidenceEngine.calculateFreshness(s.observed_at || s.created_at),
      observed_at: s.observed_at || s.created_at
    }));

    // 3. Website Audit
    const rawAudit = await db.queryOneAsync('SELECT * FROM website_audits WHERE company_id = ? ORDER BY scanned_at DESC LIMIT 1', [companyId]);
    let websiteAudit;
    if (rawAudit) {
      websiteAudit = {
        statusCode: rawAudit.status_code,
        hasHttps: rawAudit.has_https === 1 || rawAudit.has_https === true,
        hasMobileViewport: rawAudit.has_mobile_viewport === 1 || rawAudit.has_mobile_viewport === true,
        hasWhatsAppFlow: rawAudit.has_whatsapp_flow === 1 || rawAudit.has_whatsapp_flow === true,
        hasContactForm: rawAudit.has_contact_form === 1 || rawAudit.has_contact_form === true,
        techStack: typeof rawAudit.tech_stack === 'string' ? JSON.parse(rawAudit.tech_stack) : (rawAudit.tech_stack || []),
        scanned_at: rawAudit.scanned_at
      };
    }

    // 4. Contacts & Prospects
    const prospects = await db.queryAllAsync('SELECT * FROM prospects WHERE company_id = ?', [companyId]);
    const contacts = prospects.map((p: any) => ({
      name: p.contact_name || 'Business Contact',
      role: p.contact_role,
      email: p.email,
      phone: p.phone,
      verification_status: p.verification_status || 'UNKNOWN',
      confidence: p.confidence
    }));

    // 5. Sources
    const sources: Array<{ source: string; source_id?: string; source_url?: string; reliability_weight: number }> = [];
    if (company.source) {
      sources.push({
        source: company.source,
        source_id: company.source_id,
        source_url: company.website,
        reliability_weight: EvidenceEngine.getSourceReliabilityScore(company.source)
      });
    }

    // 6. Opportunities
    const rawOpps = await db.queryAllAsync('SELECT * FROM opportunities WHERE prospect_id IN (SELECT id FROM prospects WHERE company_id = ?)', [companyId]);
    const opportunities = rawOpps.map((o: any) => ({
      id: o.id,
      type: o.recommended_solution_category || 'Commercial Automation',
      status: 'QUALIFIED',
      confidence: o.confidence || 80,
      estimated_value: 250000,
      priority: 85,
      next_action: o.discovery_question || 'Schedule consultative discovery call',
      evidence_ids: []
    }));

    // 7. Outreach History
    const rawMessages = await db.queryAllAsync('SELECT * FROM messages WHERE prospect_id IN (SELECT id FROM prospects WHERE company_id = ?)', [companyId]);
    const outreachHistory = rawMessages.map((m: any) => ({
      id: m.id,
      channel: m.channel,
      status: m.status,
      sent_at: m.sent_at
    }));

    // 8. Outcomes
    const outcomes = prospects
      .filter((p: any) => p.pipeline_stage === 'HUMAN_TAKEOVER' || p.pipeline_stage === 'WON' || p.pipeline_stage === 'LOST')
      .map((p: any) => ({
        status: p.pipeline_stage,
        takeover_reason: p.takeover_reason
      }));

    return {
      company: {
        id: company.id,
        name: company.name,
        website: company.website,
        domain: company.domain,
        industry: company.industry,
        location: company.location,
        normalized_name: company.normalized_name,
        normalized_domain: company.normalized_domain,
        created_at: company.created_at
      },
      sources,
      evidence,
      signals,
      websiteAudit,
      contacts,
      opportunities,
      outreachHistory,
      outcomes
    };
  }
}
