/**
 * PROXIMA Response Domain Model
 */

export const RESPONSE_CLASSIFICATIONS = [
  'NOT_INTERESTED',
  'NO_RESPONSE',
  'OUT_OF_OFFICE',
  'WRONG_PERSON',
  'CURIOUS',
  'MAYBE',
  'NEEDS_MORE_INFORMATION',
  'INTERESTED',
  'BUYING_INTENT',
  'MEETING_REQUEST',
  'PRICE_REQUEST',
  'PROPOSAL_REQUEST',
  'PARTNERSHIP_INTEREST',
  'UNSUBSCRIBE',
  'NEGATIVE',
  'UNKNOWN'
] as const;

export type ResponseClassificationType = typeof RESPONSE_CLASSIFICATIONS[number];

export const POSITIVE_CLASSIFICATIONS: ResponseClassificationType[] = [
  'BUYING_INTENT',
  'INTERESTED',
  'MEETING_REQUEST',
  'PRICE_REQUEST',
  'PROPOSAL_REQUEST',
  'PARTNERSHIP_INTEREST'
];

export function isPositiveResponse(classification: string): boolean {
  return POSITIVE_CLASSIFICATIONS.includes(classification as ResponseClassificationType);
}

export interface ResponseRecord {
  id: string;
  prospect_id: string;
  message_id?: string;
  channel: string;
  raw_text?: string;
  classification?: string;
  confidence?: number;
  reason?: string;
  recommended_action?: string;
  automation_allowed: boolean;
  created_at: string;
}

export function generateResponseId(): string {
  return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}
