/**
 * PROXIMA Prospect Domain Model
 * Single source of truth for prospect lifecycle, statuses, and types.
 */

// ========================================================================
// Prospect Lifecycle States
// ========================================================================

export const PROSPECT_PIPELINE_STAGES = [
  'DISCOVERED',
  'NORMALIZED',
  'DUPLICATE',
  'ENRICHED',
  'PARTIALLY_VERIFIED',
  'VERIFIED',
  'REJECTED',
  'QUALIFIED',
  'OUTREACH_READY',
  'CONTACTED',
  'RESPONDED',
  'INTERESTED',
  'MEETING',
  'HUMAN_TAKEOVER',
  'WON',
  'LOST'
] as const;

export type ProspectPipelineStage = typeof PROSPECT_PIPELINE_STAGES[number];

export const DISCOVERY_STATUSES = [
  'DISCOVERED',
  'NORMALIZED',
  'ENRICHED',
  'FAILED'
] as const;

export type DiscoveryStatus = typeof DISCOVERY_STATUSES[number];

export const VERIFICATION_STATUSES = [
  'UNKNOWN',
  'SOURCE_FOUND',
  'FORMAT_VALID',
  'DOMAIN_MATCHED',
  'VERIFIED',
  'REJECTED'
] as const;

export type VerificationStatus = typeof VERIFICATION_STATUSES[number];

// ========================================================================
// Prospect Types
// ========================================================================

export interface Prospect {
  id: string;
  campaign_id?: string;
  company_id?: string;

  // Canonical contact fields
  contact_name?: string;
  contact_role?: string;
  title?: string;

  // Contact with provenance
  email?: string;
  email_verification_status: VerificationStatus;
  email_source?: string;
  email_source_url?: string;
  email_confidence?: number;

  phone?: string;
  phone_verification_status: VerificationStatus;
  phone_source?: string;
  phone_source_url?: string;
  phone_confidence?: number;

  // Scoring
  fit_score: number;
  intent_score: number;
  data_quality_score: number;
  opportunity_score: number;
  priority_score: number;
  intent_level?: string;
  confidence?: number;
  score_breakdown_json?: ScoreBreakdown;

  // Lifecycle
  status: string;
  discovery_status: DiscoveryStatus;
  verification_status: VerificationStatus;
  pipeline_stage: ProspectPipelineStage;

  // Human takeover
  human_takeover: number;
  takeover_reason?: string;

  // AI outputs
  research_summary_json?: unknown;
  fit_breakdown_json?: unknown;
  opportunity_angle_json?: unknown;
  outreach_draft_json?: unknown;
  cross_check_qa_json?: unknown;

  // Provenance
  source?: string;
  source_id?: string;
  source_url?: string;

  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  fit: number;
  intent: number;
  data_quality: number;
  opportunity: number;
  priority: number;
  fit_reason?: string;
  intent_reason?: string;
  data_quality_reason?: string;
  opportunity_reason?: string;
}

export function generateProspectId(): string {
  return `prosp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Calculate priority score from component scores
 */
export function calculatePriorityScore(breakdown: {
  fit: number;
  intent: number;
  data_quality: number;
  opportunity: number;
}): number {
  // Weighted average: fit 30%, intent 25%, opportunity 25%, data_quality 20%
  return Math.round(
    breakdown.fit * 0.30 +
    breakdown.intent * 0.25 +
    breakdown.opportunity * 0.25 +
    breakdown.data_quality * 0.20
  );
}
