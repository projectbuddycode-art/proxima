/**
 * PROXIMA Outreach Domain Model
 */

export const OUTREACH_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SENT',
  'DELIVERED',
  'BOUNCED',
  'FAILED'
] as const;

export type OutreachStatus = typeof OUTREACH_STATUSES[number];

export interface OutreachMessage {
  id: string;
  prospect_id: string;
  campaign_id?: string;
  channel: 'EMAIL' | 'LINKEDIN' | 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK';
  subject?: string;
  body: string;
  status: OutreachStatus;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  ai_provider?: string;
  score?: number;
  qa_passed?: boolean;
  qa_reasons?: string[];
  created_at: string;
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}
