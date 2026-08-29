/**
 * PROXIMA Scoring Domain Model
 * Explainable scoring with component breakdown.
 */

export interface ScoreComponent {
  score: number;      // 0-100
  reason: string;
  factors: Array<{ factor: string; impact: number; evidence?: string }>;
}

export interface ProspectScoreBreakdown {
  fit: ScoreComponent;
  intent: ScoreComponent;
  data_quality: ScoreComponent;
  opportunity: ScoreComponent;
  priority: number;   // Weighted composite 0-100
}

/**
 * Calculate data quality score from prospect provenance
 */
export function calculateDataQualityScore(prospect: {
  email?: string;
  email_verification_status?: string;
  phone?: string;
  phone_verification_status?: string;
  contact_name?: string;
  source?: string;
  source_url?: string;
}): ScoreComponent {
  let score = 30; // Base score for having a record
  const factors: Array<{ factor: string; impact: number; evidence?: string }> = [];

  if (prospect.contact_name && prospect.contact_name !== 'Verified Business Contact') {
    score += 15;
    factors.push({ factor: 'Named contact identified', impact: 15 });
  }

  if (prospect.email) {
    score += 15;
    factors.push({ factor: 'Email address available', impact: 15, evidence: prospect.email });
    if (prospect.email_verification_status === 'VERIFIED') {
      score += 10;
      factors.push({ factor: 'Email verified', impact: 10 });
    }
  }

  if (prospect.phone) {
    score += 15;
    factors.push({ factor: 'Phone number available', impact: 15 });
    if (prospect.phone_verification_status === 'VERIFIED') {
      score += 10;
      factors.push({ factor: 'Phone verified', impact: 10 });
    }
  }

  if (prospect.source_url) {
    score += 5;
    factors.push({ factor: 'Source URL available', impact: 5, evidence: prospect.source_url });
  }

  return {
    score: Math.min(100, score),
    reason: score >= 70 ? 'Good data quality with verified contact information' :
            score >= 50 ? 'Moderate data quality, some contact info available' :
            'Limited data quality, verification needed',
    factors
  };
}

/**
 * Calculate composite priority score from all components
 */
export function calculatePriorityFromBreakdown(breakdown: {
  fit: number;
  intent: number;
  data_quality: number;
  opportunity: number;
}): number {
  return Math.round(
    breakdown.fit * 0.30 +
    breakdown.intent * 0.25 +
    breakdown.opportunity * 0.25 +
    breakdown.data_quality * 0.20
  );
}
