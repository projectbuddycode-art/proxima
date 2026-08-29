/**
 * PROXIMA Deterministic Opportunity Scoring Engine
 * Transparent, explainable, evidence-backed scoring calculated mathematically
 * without relying on arbitrary LLM number generation.
 */

import { EvidenceEngine } from '../verification/evidence';
import { ScoreComponent } from '../domain/scoring';

export interface DeterministicScoreExplanation {
  icp_fit: ScoreComponent;
  intent: ScoreComponent;
  evidence_quality: ScoreComponent;
  signal_freshness: ScoreComponent;
  contactability: ScoreComponent;
  historical_conversion_weight: number;
  final_composite_score: number; // 0-100
  summary_reasoning: string;
}

export class DeterministicScoringEngine {
  /**
   * Calculate complete deterministic opportunity score with explainable component breakdown
   */
  static calculateDeterministicScore(params: {
    company: {
      name: string;
      industry?: string;
      website?: string;
      location?: string;
      source?: string;
    };
    contact?: {
      email?: string;
      email_verified?: boolean;
      phone?: string;
      phone_verified?: boolean;
      contact_name?: string;
    };
    signals?: Array<{
      signal_type: string;
      title: string;
      confidence?: number;
      observed_at?: string;
    }>;
    websiteAudit?: {
      accessible?: boolean;
      hasWhatsAppFlow?: boolean;
      hasContactForm?: boolean;
      findingsCount?: number;
    };
    evidenceSource?: string;
    targetIndustry?: string;
  }): DeterministicScoreExplanation {
    const { company, contact, signals = [], websiteAudit, evidenceSource, targetIndustry } = params;

    // ── 1. ICP FIT (0 - 100) ──────────────────────────────────────────
    let icpScore = 50;
    const icpFactors: Array<{ factor: string; impact: number; evidence?: string }> = [];

    const compIndustry = (company.industry || '').toLowerCase();
    const targetInd = (targetIndustry || '').toLowerCase();

    if (targetInd && compIndustry.includes(targetInd)) {
      icpScore += 30;
      icpFactors.push({ factor: `Exact industry match (${company.industry})`, impact: 30 });
    } else if (compIndustry.includes('lighting') || compIndustry.includes('interior') || compIndustry.includes('architect') || compIndustry.includes('contractor')) {
      icpScore += 25;
      icpFactors.push({ factor: `High-margin commercial vertical (${company.industry})`, impact: 25 });
    }

    if (company.website && company.website.startsWith('http')) {
      icpScore += 15;
      icpFactors.push({ factor: 'Operating digital web presence', impact: 15, evidence: company.website });
    }

    if (company.location) {
      icpScore += 10;
      icpFactors.push({ factor: `Active commercial market location (${company.location})`, impact: 10 });
    }

    icpScore = Math.min(100, Math.max(0, icpScore));
    const icpComponent: ScoreComponent = {
      score: icpScore,
      reason: icpScore >= 75 ? 'High alignment with Project Buddy ICP criteria' : 'Moderate commercial alignment',
      factors: icpFactors
    };

    // ── 2. INTENT (0 - 100) ───────────────────────────────────────────
    let intentScore = 20; // Base intent
    const intentFactors: Array<{ factor: string; impact: number; evidence?: string }> = [];

    for (const sig of signals) {
      if (sig.signal_type === 'HIRING') {
        intentScore += 25;
        intentFactors.push({ factor: `Active Hiring: ${sig.title}`, impact: 25, evidence: sig.title });
      } else if (sig.signal_type === 'EXPANSION') {
        intentScore += 20;
        intentFactors.push({ factor: `Business Expansion: ${sig.title}`, impact: 20, evidence: sig.title });
      } else if (sig.signal_type === 'WEBSITE_GAP') {
        intentScore += 15;
        intentFactors.push({ factor: `Digital Lead Flow Bottleneck: ${sig.title}`, impact: 15, evidence: sig.title });
      }
    }

    if (websiteAudit?.hasWhatsAppFlow === false) {
      intentScore += 15;
      intentFactors.push({ factor: 'Manual inquiry friction (Missing WhatsApp quick RFQ flow)', impact: 15 });
    }

    intentScore = Math.min(100, Math.max(0, intentScore));
    const intentComponent: ScoreComponent = {
      score: intentScore,
      reason: intentScore >= 70 ? 'Strong buying/growth signals detected' : 'Moderate intent indicators',
      factors: intentFactors.length > 0 ? intentFactors : [{ factor: 'Standard baseline intent', impact: 20 }]
    };

    // ── 3. EVIDENCE QUALITY (0 - 100) ─────────────────────────────────
    const src = evidenceSource || company.source || 'OpenStreetMap';
    const sourceReliability = EvidenceEngine.getSourceReliabilityScore(src);
    const qualityFactors: Array<{ factor: string; impact: number; evidence?: string }> = [
      { factor: `Source Provenance Weight (${src})`, impact: sourceReliability, evidence: src }
    ];

    if (company.website && websiteAudit?.accessible) {
      qualityFactors.push({ factor: 'Direct HTTP response verified', impact: 10 });
    }

    const evidenceScore = Math.min(100, Math.max(0, sourceReliability));
    const evidenceQualityComponent: ScoreComponent = {
      score: evidenceScore,
      reason: `Evidence verified via ${src} (Reliability weight: ${sourceReliability}/100)`,
      factors: qualityFactors
    };

    // ── 4. SIGNAL FRESHNESS (0 - 100) ─────────────────────────────────
    let latestObservation = new Date().toISOString();
    if (signals.length > 0 && signals[0].observed_at) {
      latestObservation = signals[0].observed_at;
    }
    const freshness = EvidenceEngine.calculateFreshness(latestObservation);
    const freshnessFactors: Array<{ factor: string; impact: number; evidence?: string }> = [
      { factor: 'Signal time decay evaluation', impact: freshness, evidence: `Observed at: ${latestObservation}` }
    ];

    const signalFreshnessComponent: ScoreComponent = {
      score: freshness,
      reason: freshness >= 80 ? 'Fresh signal observed recently' : freshness >= 40 ? 'Signal aging gracefully' : 'Stale signal requiring re-verification',
      factors: freshnessFactors
    };

    // ── 5. CONTACTABILITY (0 - 100) ───────────────────────────────────
    let contactScore = 0;
    const contactFactors: Array<{ factor: string; impact: number; evidence?: string }> = [];

    if (contact?.contact_name && contact.contact_name !== 'Verified Business Contact') {
      contactScore += 20;
      contactFactors.push({ factor: 'Named decision maker identified', impact: 20, evidence: contact.contact_name });
    }

    if (contact?.phone) {
      contactScore += 30;
      contactFactors.push({ factor: 'Phone number available', impact: 30, evidence: contact.phone });
      if (contact.phone_verified) {
        contactScore += 15;
        contactFactors.push({ factor: 'Phone verified in directory', impact: 15 });
      }
    }

    if (contact?.email) {
      contactScore += 25;
      contactFactors.push({ factor: 'Email address available', impact: 25, evidence: contact.email });
      if (contact.email_verified) {
        contactScore += 10;
        contactFactors.push({ factor: 'Email verified format & domain', impact: 10 });
      }
    }

    if (websiteAudit?.hasContactForm || websiteAudit?.hasWhatsAppFlow) {
      contactScore += 15;
      contactFactors.push({ factor: 'Direct website communication channel available', impact: 15 });
    }

    contactScore = Math.min(100, Math.max(0, contactScore));
    const contactabilityComponent: ScoreComponent = {
      score: contactScore,
      reason: contactScore >= 70 ? 'High direct contactability across verified channels' : 'Partial contactability channels available',
      factors: contactFactors.length > 0 ? contactFactors : [{ factor: 'Unverified direct contact channels', impact: 0 }]
    };

    // ── 6. COMPOSITE FINAL SCORE ──────────────────────────────────────
    const historicalWeight = 1.0;
    const finalScore = Math.round(
      (icpScore * 0.25) +
      (intentScore * 0.25) +
      (evidenceScore * 0.20) +
      (freshness * 0.15) +
      (contactScore * 0.15)
    );

    const summaryReasoning = `ICP Fit (${icpScore}) × Intent (${intentScore}) × Evidence Quality (${evidenceScore}) × Signal Freshness (${freshness}) × Contactability (${contactScore}) → Final Priority: ${finalScore}/100.`;

    return {
      icp_fit: icpComponent,
      intent: intentComponent,
      evidence_quality: evidenceQualityComponent,
      signal_freshness: signalFreshnessComponent,
      contactability: contactabilityComponent,
      historical_conversion_weight: historicalWeight,
      final_composite_score: Math.min(100, Math.max(0, finalScore)),
      summary_reasoning: summaryReasoning
    };
  }
}
