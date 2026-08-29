/**
 * PROXIMA Research Domain Model
 */

export interface StructuredResearch {
  company_summary: string;
  products_services: string[];
  target_market: string[];
  digital_presence: string[];
  observable_sales_or_operations_signals: string[];
  identified_problem?: string;
  evidence: string[];
  business_impact?: string;
  confidence: number;
  source_links: string[];
}

export interface OpportunityAnalysis {
  observation: string;
  evidence: string;
  potential_business_impact: string;
  hypothesis: string;
  discovery_question: string;
}

export function generateResearchId(): string {
  return `res_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}
