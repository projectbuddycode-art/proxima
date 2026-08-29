/**
 * PROXIMA Opportunity Intelligence Graph
 * Relational graph linking Company to Sources, Evidence, Signals, Website, Contacts,
 * Opportunities, Outreach, Campaigns, and Outcomes.
 */

import { EvidenceRecord } from '../domain/evidence';

export interface CompanyIntelligenceGraph {
  company: {
    id: string;
    name: string;
    website?: string;
    domain?: string;
    industry?: string;
    location?: string;
    normalized_name?: string;
    normalized_domain?: string;
    created_at: string;
  };
  sources: Array<{
    source: string;
    source_id?: string;
    source_url?: string;
    reliability_weight: number;
  }>;
  evidence: EvidenceRecord[];
  signals: Array<{
    id: string;
    signal_type: string;
    title: string;
    description?: string;
    confidence: number;
    freshness_score: number;
    observed_at: string;
  }>;
  websiteAudit?: {
    statusCode?: number;
    hasHttps: boolean;
    hasMobileViewport: boolean;
    hasWhatsAppFlow: boolean;
    hasContactForm: boolean;
    techStack: string[];
    scanned_at?: string;
  };
  contacts: Array<{
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    verification_status: string;
    confidence?: number;
  }>;
  opportunities: Array<{
    id: string;
    type: string;
    status: string;
    confidence: number;
    estimated_value: number;
    priority: number;
    next_action: string;
    evidence_ids: string[];
  }>;
  outreachHistory: Array<{
    id: string;
    channel: string;
    status: string;
    sent_at?: string;
  }>;
  outcomes: Array<{
    status: string;
    takeover_reason?: string;
  }>;
}
