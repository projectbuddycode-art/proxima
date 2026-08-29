/**
 * PROXIMA Campaign Domain Model
 * Single source of truth for campaign types, statuses, and validation.
 */

// ========================================================================
// Campaign Pipeline Stages
// ========================================================================

export const CAMPAIGN_PIPELINE_STAGES = [
  'CAMPAIGN_CREATED',
  'DISCOVERY_RUNNING',
  'DISCOVERY_COMPLETED',
  'NORMALIZATION_RUNNING',
  'ENRICHMENT_RUNNING',
  'VERIFICATION_RUNNING',
  'SCORING_RUNNING',
  'READY_FOR_REVIEW',
  'OUTREACH_READY',
  'OUTREACH_ACTIVE',
  'COMPLETED',
  'FAILED'
] as const;

export type CampaignPipelineStage = typeof CAMPAIGN_PIPELINE_STAGES[number];

export const CAMPAIGN_STATUSES = [
  'CREATED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'FAILED',
  'ARCHIVED'
] as const;

export type CampaignStatus = typeof CAMPAIGN_STATUSES[number];

// ========================================================================
// Campaign Types
// ========================================================================

export interface Campaign {
  id: string;
  name: string;
  objective?: string;
  industry?: string;
  location?: string;
  ideal_customer_profile?: string;
  company_size?: string;
  target_role?: string;
  target_roles?: string[];
  offer?: string;
  discovery_sources?: string[];
  min_intent: number;
  min_fit: number;
  status: CampaignStatus;
  pipeline_stage: CampaignPipelineStage;
  error_code?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface CreateCampaignInput {
  name?: string;
  objective?: string;
  industry?: string;
  location?: string;
  ideal_customer_profile?: string;
  company_size?: string;
  target_role?: string;
  target_roles?: string[];
  offer?: string;
  discovery_sources?: string[];
  min_intent?: number;
  min_fit?: number;
}

// ========================================================================
// Validation
// ========================================================================

export function validateCampaignInput(input: CreateCampaignInput): {
  valid: boolean;
  errors: string[];
  normalized: CreateCampaignInput;
} {
  const errors: string[] = [];

  const industry = (input.industry || '').trim();
  const location = (input.location || '').trim();

  if (!industry && !location && !input.name) {
    errors.push('Campaign must have at least a name, industry, or location.');
  }

  const name = input.name || `${location || 'Global'} ${industry || 'Commercial'} Campaign`;

  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      ...input,
      name,
      industry: industry || 'Commercial',
      location: location || 'Bangalore',
      target_role: input.target_role || 'Director',
      offer: input.offer || 'Operational Modernization & Automation',
      min_intent: input.min_intent ?? 70,
      min_fit: input.min_fit ?? 70
    }
  };
}

export function generateCampaignId(): string {
  return `camp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}
