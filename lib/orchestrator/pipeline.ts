import { getDb } from '../db';
import { DiscoveryEngine, DiscoveredProspect } from '../discovery/engine';
import {
  runResearchAgent,
  runBuyingIntentAgent,
  runFitScoreAgent,
  runOpportunityStrategist,
  runMessageStrategist,
  runTruthQAAgent,
  runResponseClassifier,
  runResponseCopilot,
  ResearchOutput,
  IntentOutput,
  FitOutput,
  OpportunityOutput,
  MessageOutput,
  ResponseClassification
} from '../ai/agents';
import { runMultiAgentCrossCheck } from '../ai/panel/cross_check';
import { initializeAgentRegistry } from '../ai/agents/registry';
import { initializeStrategyRegistry } from '../discovery/strategies';
import { ContactVerificationEngine } from '../verification/contacts';
import { SecurityIntelligenceAgent } from '../ai/agents/security';

export class PipelineOrchestrator {
  /**
   * Executes full PROXIMA multi-agent discovery & verification pipeline for a given campaign
   */
  static async runCampaignPipeline(campaignId: string) {
    initializeAgentRegistry();
    initializeStrategyRegistry();

    const db = getDb();
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId) as any;

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found.`);
    }

    db.prepare('INSERT INTO proxima_logs (id, stage, message) VALUES (?, ?, ?)').run(
      `log_${Date.now()}_1`,
      'CAMPAIGN_START',
      `PROXIMA pipeline started for ${campaign.name} (${campaign.industry})`
    );

    // 1. Discover Prospects via Prospect Hunter & Map Engine
    const rawProspects = await DiscoveryEngine.discoverProspectsForCampaign(campaign);
    const processed: any[] = [];

    db.prepare('INSERT INTO proxima_logs (id, stage, message) VALUES (?, ?, ?)').run(
      `log_${Date.now()}_2`,
      'DISCOVERY',
      `Discovered ${rawProspects.length} raw business records via public intelligence & OpenStreetMap extracts`
    );

    for (const raw of rawProspects) {
      // 2. Real Company Identity & Contact Provenance Verification Gate
      const verifiedContact = ContactVerificationEngine.verifyContact(
        'email',
        raw.email,
        raw.website,
        'official_website',
        true,
        false
      );

      // Deduplication check
      let company = db.prepare('SELECT * FROM companies WHERE name = ? OR website = ?').get(raw.company_name, raw.website) as any;
      if (!company) {
        const companyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        db.prepare(`
          INSERT INTO companies (id, name, website, industry, location, company_summary, decision_makers_json, products_services_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          companyId,
          raw.company_name,
          raw.website,
          raw.industry,
          raw.location,
          `Verified Operating Business discovered via ${raw.source_strategy}`,
          JSON.stringify([{ name: raw.contact_name, role: raw.role, email: verifiedContact?.value || null, phone: raw.phone || null }]),
          JSON.stringify(raw.raw_signals)
        );
        company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
      }

      // Passive Security Observation
      const secObservation = await SecurityIntelligenceAgent.observeDomain(raw.website);
      db.prepare('INSERT INTO security_observations (id, target_domain, https_enabled, security_headers_present, missing_security_headers, public_tech_signature, robots_txt_status, sitemap_status, observation_summary, project_buddy_remediation_opportunity, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(secObservation);

      // Create Prospect Record
      const prospectId = `prosp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO prospects (id, company_id, contact_name, role, email, phone, status)
        VALUES (?, ?, ?, ?, ?, ?, 'RESEARCHING')
      `).run(prospectId, company.id, raw.contact_name, raw.role, verifiedContact?.value || null, raw.phone || null);

      // 3. Research & Signal Agents
      const researchData: ResearchOutput = await runResearchAgent({
        name: raw.company_name,
        website: raw.website,
        industry: raw.industry,
        location: raw.location,
        rawContent: raw.raw_signals.join('\n')
      });

      const researchId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO research (
          id, company_id, observable_website_findings, social_signals, hiring_signals,
          expansion_signals, review_signals, buying_signals, pain_hypotheses,
          recommended_project_buddy_capability, recommended_offer, reason_to_contact_now, confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        researchId,
        company.id,
        JSON.stringify(researchData.observable_website_findings),
        JSON.stringify(researchData.social_signals),
        JSON.stringify(researchData.hiring_signals),
        JSON.stringify(researchData.expansion_signals),
        JSON.stringify(researchData.review_signals),
        JSON.stringify(researchData.buying_signals),
        JSON.stringify(researchData.pain_hypotheses),
        researchData.recommended_project_buddy_capability,
        researchData.recommended_offer,
        researchData.reason_to_contact_now,
        researchData.confidence
      );

      // 4. Buying Intent & Fit Score Agents
      const intent: IntentOutput = await runBuyingIntentAgent(researchData);
      const fit: FitOutput = await runFitScoreAgent(researchData);

      const minIntent = campaign.min_intent || 70;
      const minFit = campaign.min_fit || 70;
      const isQualified = intent.intent_score >= minIntent && fit.fit_score >= minFit;
      const prospectStatus = isQualified ? 'QUALIFIED' : 'REJECTED_LOW_FIT';

      db.prepare(`
        UPDATE prospects
        SET fit_score = ?, intent_score = ?, intent_level = ?, confidence = ?, status = ?
        WHERE id = ?
      `).run(fit.fit_score, intent.intent_score, intent.intent_level, intent.confidence, prospectStatus, prospectId);

      if (!isQualified) continue;

      // 5. Commercial Strategist & Offer Matcher
      const opportunity: OpportunityOutput = await runOpportunityStrategist(researchData, intent);
      const oppId = `opp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO opportunities (
          id, prospect_id, problem, business_impact, recommended_solution_category,
          recommended_offer, why_this_offer, estimated_commercial_band, discovery_question
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        oppId,
        prospectId,
        opportunity.problem,
        opportunity.business_impact,
        opportunity.recommended_solution_category,
        opportunity.recommended_offer,
        opportunity.why_this_offer,
        opportunity.estimated_commercial_band,
        opportunity.discovery_question
      );

      // 6. Message Writer & Humanization Agent
      const message: MessageOutput = await runMessageStrategist(researchData, opportunity);

      // 7. MULTI-AGENT CROSS-CHECK PANEL REVIEW (8 Agents)
      const crossCheck = await runMultiAgentCrossCheck(researchData, message);

      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.prepare(`
        INSERT INTO messages (id, prospect_id, campaign_id, channel, subject, body, score, qa_passed, qa_reasons_json, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        msgId,
        prospectId,
        campaign.id,
        'EMAIL',
        message.subject,
        message.body,
        crossCheck.confidence_score,
        crossCheck.overall_passed ? 1 : 0,
        JSON.stringify(crossCheck.rejection_reasons),
        crossCheck.overall_passed ? 'QUEUED' : 'CROSS_CHECK_REJECTED'
      );

      db.prepare('INSERT INTO proxima_logs (id, stage, message) VALUES (?, ?, ?)').run(
        `log_${Date.now()}_3`,
        'OUTREACH_QUEUED',
        `Message queued for ${raw.company_name} (Confidence: ${crossCheck.confidence_score}%, Evidence Tier: ${crossCheck.evidence_tier})`
      );

      processed.push({
        prospectId,
        companyName: raw.company_name,
        intentScore: intent.intent_score,
        fitScore: fit.fit_score,
        crossCheckPassed: crossCheck.overall_passed,
        evidenceTier: crossCheck.evidence_tier
      });
    }

    return processed;
  }

  /**
   * Processes incoming prospect reply and triggers Shivam takeover handoff
   */
  static async processIncomingResponse(prospectId: string, rawMessage: string, channel = 'EMAIL') {
    const db = getDb();
    const prospect = db.prepare('SELECT * FROM prospects WHERE id = ?').get(prospectId) as any;
    if (!prospect) throw new Error('Prospect not found');

    const classification: ResponseClassification = await runResponseClassifier(rawMessage);

    const highIntentCategories = [
      'INTERESTED',
      'BUYING_INTENT',
      'MEETING_REQUEST',
      'PROPOSAL_REQUEST',
      'PRICE_REQUEST',
      'PARTNERSHIP_INTEREST'
    ];

    const needsHumanTakeover = highIntentCategories.includes(classification.classification);

    const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    db.prepare(`
      INSERT INTO responses (id, prospect_id, channel, raw_text, classification, confidence, reason, recommended_action, automation_allowed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      responseId,
      prospectId,
      channel,
      rawMessage,
      classification.classification,
      classification.confidence,
      classification.reason,
      classification.recommended_action,
      needsHumanTakeover ? 0 : 1
    );

    if (needsHumanTakeover) {
      const takeoverReason = `🚨 Shivam, this one is yours! Positive intent classified (${classification.classification}).`;
      db.prepare(`
        UPDATE prospects
        SET human_takeover = 1, takeover_reason = ?, status = 'HUMAN_TAKEOVER'
        WHERE id = ?
      `).run(takeoverReason, prospectId);

      db.prepare(`
        UPDATE followups
        SET status = 'CANCELLED', reason = 'Stopped due to Human Takeover trigger'
        WHERE prospect_id = ? AND status = 'SCHEDULED'
      `).run(prospectId);

      db.prepare('INSERT INTO proxima_logs (id, stage, message) VALUES (?, ?, ?)').run(
        `log_${Date.now()}_4`,
        'HUMAN_TAKEOVER',
        `🚨 Shivam Takeover Triggered for ${prospect.contact_name}! Automated messaging stopped.`
      );

      db.prepare(`
        INSERT INTO tasks (id, title, type, payload_json, status)
        VALUES (?, ?, 'HUMAN_TAKEOVER', ?, 'PENDING')
      `).run(
        `task_${Date.now()}`,
        `🚨 Shivam: Take over conversation with ${prospect.contact_name}`,
        JSON.stringify({ prospectId, rawMessage, classification })
      );
    }

    return { classification, needsHumanTakeover };
  }
}
