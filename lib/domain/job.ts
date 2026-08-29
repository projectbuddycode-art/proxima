/**
 * PROXIMA Job Domain Model
 * General job/orchestration types for background task processing.
 */

export const JOB_STATUSES = [
  'QUEUED',
  'RUNNING',
  'RETRYING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
] as const;

export type JobStatus = typeof JOB_STATUSES[number];

export const JOB_TYPES = [
  'CAMPAIGN_DISCOVERY',
  'PROSPECT_ENRICHMENT',
  'PROSPECT_VERIFICATION',
  'PROSPECT_SCORING',
  'OUTREACH_GENERATION',
  'RESPONSE_CLASSIFICATION',
  'AI_INFERENCE',
  'SECURITY_SCAN',
  'TEST_INFERENCE'
] as const;

export type JobType = typeof JOB_TYPES[number];

export interface Job {
  id: string;
  request_id: string;
  job_id: string;
  type: string;
  entity_type?: string;
  entity_id?: string;
  payload?: unknown;
  status: JobStatus;
  result?: unknown;
  latency_ms?: number;
  bridge_id?: string;
  attempt_count: number;
  max_attempts: number;
  error_code?: string;
  error_message?: string;
  created_at: string;
  claimed_at?: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
}

export function generateJobId(): string {
  const hex = Math.random().toString(36).substr(2, 6);
  return `job_${Date.now()}_${hex}`;
}

export function generateRequestId(): string {
  const hex = Math.random().toString(36).substr(2, 6);
  return `req_${Date.now()}_${hex}`;
}
