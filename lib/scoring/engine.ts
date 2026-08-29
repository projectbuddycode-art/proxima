/**
 * PROXIMA Scoring Engine
 * Explainable, evidence-backed scoring for prospects using deterministic calculation.
 */

import { ProspectScoreBreakdown, ScoreComponent, calculatePriorityFromBreakdown, calculateDataQualityScore } from '../domain/scoring';
import { DeterministicScoringEngine, DeterministicScoreExplanation } from './deterministic';

/**
 * Build a complete prospect score breakdown from data and signals deterministically.
 */
export function buildScoreBreakdown(params: {
  fitOutput?: { fit_score?: number; reason?: string; confidence?: number };
  intentOutput?: { intent_score?: number; intent_level?: string; signals?: string[]; reason?: string; confidence?: number };
  opportunityOutput?: { problem?: string; business_impact?: string; discovery_question?: string };
  prospect: {
    company_name?: string;
    industry?: string;
    location?: string;
    email?: string;
    email_verification_status?: string;
    phone?: string;
    phone_verification_status?: string;
    contact_name?: string;
    source?: string;
    source_url?: string;
  };
  websiteAudit?: {
    accessible?: boolean;
    hasWhatsAppFlow?: boolean;
    hasContactForm?: boolean;
    findingsCount?: number;
  };
}): ProspectScoreBreakdown & { deterministic_explanation?: DeterministicScoreExplanation } {
  const { fitOutput, intentOutput, opportunityOutput, prospect, websiteAudit } = params;

  // Run deterministic scoring engine
  const deterministic = DeterministicScoringEngine.calculateDeterministicScore({
    company: {
      name: prospect.company_name || 'Prospect',
      industry: prospect.industry,
      location: prospect.location,
      source: prospect.source
    },
    contact: {
      email: prospect.email,
      email_verified: prospect.email_verification_status === 'VERIFIED',
      phone: prospect.phone,
      phone_verified: prospect.phone_verification_status === 'VERIFIED',
      contact_name: prospect.contact_name
    },
    signals: intentOutput?.signals?.map(s => ({ signal_type: 'INTENT', title: s })) || [],
    websiteAudit
  });

  // Fit Score (Deterministic first, fallback to AI output if provided)
  const fitScore = fitOutput?.fit_score !== undefined
    ? Math.min(100, Math.max(0, fitOutput.fit_score))
    : deterministic.icp_fit.score;

  const fit: ScoreComponent = {
    score: fitScore,
    reason: fitOutput?.reason || deterministic.icp_fit.reason,
    factors: deterministic.icp_fit.factors.length > 0
      ? deterministic.icp_fit.factors
      : [{ factor: 'Deterministic Fit Calculation', impact: fitScore }]
  };

  // Intent Score
  const intentScore = intentOutput?.intent_score !== undefined
    ? Math.min(100, Math.max(0, intentOutput.intent_score))
    : deterministic.intent.score;

  const intentFactors = (intentOutput?.signals || []).map(s => ({
    factor: s,
    impact: Math.round(intentScore / Math.max(1, intentOutput?.signals?.length || 1))
  }));

  const intent: ScoreComponent = {
    score: intentScore,
    reason: intentOutput?.reason || deterministic.intent.reason,
    factors: intentFactors.length > 0 ? intentFactors : deterministic.intent.factors
  };

  // Data Quality Score
  const data_quality = calculateDataQualityScore(prospect);

  // Opportunity Score
  let oppScore = 50;
  const oppFactors: Array<{ factor: string; impact: number; evidence?: string }> = [];

  if (opportunityOutput?.problem) {
    oppScore += 15;
    oppFactors.push({ factor: 'Identified business problem', impact: 15, evidence: opportunityOutput.problem });
  }
  if (opportunityOutput?.business_impact) {
    oppScore += 15;
    oppFactors.push({ factor: 'Quantifiable business impact', impact: 15, evidence: opportunityOutput.business_impact });
  }
  if (opportunityOutput?.discovery_question) {
    oppScore += 10;
    oppFactors.push({ factor: 'Discovery question formulated', impact: 10 });
  }

  const opportunity: ScoreComponent = {
    score: Math.min(100, oppScore),
    reason: opportunityOutput?.problem || 'Opportunity assessment calculated deterministically',
    factors: oppFactors.length > 0 ? oppFactors : [{ factor: 'Base opportunity assessment', impact: 50 }]
  };

  const priority = calculatePriorityFromBreakdown({
    fit: fit.score,
    intent: intent.score,
    data_quality: data_quality.score,
    opportunity: opportunity.score
  });

  return {
    fit,
    intent,
    data_quality,
    opportunity,
    priority,
    deterministic_explanation: deterministic
  };
}
