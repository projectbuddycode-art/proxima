/**
 * PROXIMA GTM Target and Objective Analysis
 * Calculates performance and gap metrics dynamically from active database records.
 */

import { getDb } from '../db';

export interface MonthlyTarget {
  id: string;
  month: string;
  revenue_target: number; // in INR
  client_target: number;
  meeting_target: number;
  proposal_target: number;
  qualified_lead_target: number;
  min_project_value: number;
  max_outreach_capacity: number;
  created_at: string;
}

export interface FunnelDecomposition {
  revenue_target: number;
  target_clients: number;
  required_proposals: number;
  required_meetings: number;
  required_positive_conversations: number;
  required_qualified_outreach: number;
  model_assumptions: {
    win_rate: string;
    proposal_rate: string;
    meeting_rate: string;
    reply_rate: string;
  };
}

export interface TargetGapAnalysis {
  days_remaining: number;
  current_revenue: number;
  revenue_gap: number;
  required_daily_pipeline: number;
  status: 'ON_TRACK' | 'BEHIND_PLAN' | 'CRITICAL_GAP';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}

export class MonthlyObjectiveCenter {
  /**
   * Decomposes a monthly revenue target into required funnel metrics
   */
  static decomposeTarget(target: MonthlyTarget): FunnelDecomposition {
    const avgProjectVal = Math.max(target.min_project_value, 250000);
    const requiredWins = Math.ceil(target.revenue_target / avgProjectVal);

    // Standard baseline model assumptions (replaced by historical data as it accumulates)
    const requiredProposals = Math.ceil(requiredWins / 0.25); // 25% proposal-to-win rate
    const requiredMeetings = Math.ceil(requiredProposals / 0.40); // 40% meeting-to-proposal rate
    const requiredPositiveConvos = Math.ceil(requiredMeetings / 0.25); // 25% reply-to-meeting rate
    const requiredOutreach = Math.ceil(requiredPositiveConvos / 0.05); // 5% outreach-to-positive-response rate

    return {
      revenue_target: target.revenue_target,
      target_clients: requiredWins,
      required_proposals: requiredProposals,
      required_meetings: requiredMeetings,
      required_positive_conversations: requiredPositiveConvos,
      required_qualified_outreach: requiredOutreach,
      model_assumptions: {
        win_rate: '25% (Model Baseline)',
        proposal_rate: '40% (Model Baseline)',
        meeting_rate: '25% (Model Baseline)',
        reply_rate: '5% (Model Baseline)'
      }
    };
  }

  /**
   * Calculates current gap analysis against monthly target dynamically from database
   */
  static async calculateGap(target: MonthlyTarget, daysRemaining = 18): Promise<TargetGapAnalysis> {
    const db = getDb();
    let currentRevenue = 0;

    try {
      // Sum value of won prospects dynamically
      const wonProspects = await db.queryAllAsync(
        "SELECT * FROM prospects WHERE pipeline_stage = 'WON'"
      );
      if (wonProspects && wonProspects.length > 0) {
        currentRevenue = wonProspects.reduce((sum, p) => sum + (p.estimated_value || target.min_project_value), 0);
      }
    } catch (e: any) {
      console.warn('[TARGETS] Revenue aggregation failed:', e.message);
    }

    const gap = Math.max(0, target.revenue_target - currentRevenue);
    const requiredDaily = daysRemaining > 0 ? Math.ceil(gap / daysRemaining) : gap;

    const isBehind = gap > target.revenue_target * 0.4;
    const status = isBehind ? 'BEHIND_PLAN' : 'ON_TRACK';
    const risk_level = isBehind ? 'HIGH' : 'LOW';

    const recommendations = [
      'Prioritize high-intent B2B lighting & electrical contractor prospects.',
      'Launch marketing agency technical execution partnership campaign.',
      'Increase high-fit outreach in Hyderabad and Chennai hubs.',
      'Activate Titan Mail value follow-ups for warm proposal prospects.'
    ];

    return {
      days_remaining: daysRemaining,
      current_revenue: currentRevenue,
      revenue_gap: gap,
      required_daily_pipeline: requiredDaily,
      status,
      risk_level,
      recommendations
    };
  }

  /**
   * Generates Daily Command Brief for founder Shivam
   */
  static generateDailyCommandBrief(target: MonthlyTarget, gapAnalysis: TargetGapAnalysis): string {
    return `
# PROJECT BUDDY DAILY COMMAND BRIEF
**Month**: ${target.month} | **Target**: ₹${target.revenue_target.toLocaleString()} | **Status**: ${gapAnalysis.status}

## PERFORMANCE METRICS
- **Current Revenue**: ₹${gapAnalysis.current_revenue.toLocaleString()}
- **Revenue Gap**: ₹${gapAnalysis.revenue_gap.toLocaleString()} (${gapAnalysis.days_remaining} days remaining)
- **Required Daily Pace**: ₹${gapAnalysis.required_daily_pipeline.toLocaleString()}/day

## TODAY'S PRIORITIES (PROXIMA COMMANDER)
${gapAnalysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## TAKE OVER ALERT
🚨 High-intent prospects awaiting Shivam takeover in Hot Leads dashboard.
    `.trim();
  }
}
