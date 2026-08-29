/**
 * PROXIMA Geographic Campaign Expansion Engine
 * Generates dynamic expansion reports and campaign matrices from live database records.
 */

import { getDb } from '../db';

export interface CityPerformanceRecord {
  city: string;
  state: string;
  country: string;
  prospects_found: number;
  verified_prospects: number;
  qualified_outreach: number;
  replies: number;
  positive_replies: number;
  meetings: number;
  proposals: number;
  revenue: number;
  conversion_rate: number;
  status: 'KEEP' | 'EXPAND' | 'PAUSE' | 'RESEARCH_MORE';
}

export const INDIAN_CITIES_ROTATION: Array<{ city: string; state: string }> = [
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Delhi NCR', state: 'Delhi' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Chandigarh', state: 'Punjab/Haryana' },
  { city: 'Indore', state: 'Madhya Pradesh' }
];

export const EXPLORATION_INDUSTRIES = [
  'Lighting Showrooms & Brands',
  'Electrical Contractors & Engineers',
  'EPC & Civil Infrastructure',
  'Real Estate & Commercial Developers',
  'Architectural & Interior Design Studios',
  'Industrial & Capital Goods Manufacturing',
  'Marketing Agencies & Digital Studios',
  'Healthcare & Private Hospital Networks',
  'Software & IT Consultancies'
];

export class GeographicExpansionEngine {
  /**
   * Generates City x Industry campaign matrix dynamically from database records
   */
  static async generateExpansionMatrix(): Promise<CityPerformanceRecord[]> {
    const db = getDb();
    
    // Core cities to report
    const targetCities = [
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Chennai', state: 'Tamil Nadu' }
    ];

    try {
      const companies = await db.queryAllAsync('SELECT * FROM companies') || [];
      const prospects = await db.queryAllAsync('SELECT * FROM prospects') || [];
      const messages = await db.queryAllAsync('SELECT * FROM messages') || [];

      return targetCities.map(tc => {
        const cityCompanies = companies.filter(c => (c.location || '').toLowerCase().includes(tc.city.toLowerCase()));
        const companyIds = cityCompanies.map(c => c.id);

        const cityProspects = prospects.filter(p => companyIds.includes(p.company_id) || (p.location || '').toLowerCase().includes(tc.city.toLowerCase()));
        const prospectIds = cityProspects.map(p => p.id);

        const cityMessages = messages.filter(m => prospectIds.includes(m.prospect_id));

        const prospectsFound = cityProspects.length;
        const verified = cityProspects.filter(p => p.verification_status === 'VERIFIED').length;
        const outreach = cityMessages.length;
        const replies = cityMessages.filter(m => m.status === 'REPLIED' || m.status === 'INTERESTED').length;
        const positive = cityMessages.filter(m => m.status === 'INTERESTED').length;

        // Stage based metrics
        const meetings = cityProspects.filter(p => p.pipeline_stage === 'MEETING').length;
        const proposals = cityProspects.filter(p => p.pipeline_stage === 'PROPOSAL').length;
        const won = cityProspects.filter(p => p.pipeline_stage === 'WON');
        const revenue = won.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

        const conversionRate = prospectsFound > 0 ? Math.round((won.length / prospectsFound) * 1000) / 10 : 0;

        let status: 'KEEP' | 'EXPAND' | 'PAUSE' | 'RESEARCH_MORE' = 'RESEARCH_MORE';
        if (conversionRate > 10 || positive > 2) {
          status = 'KEEP';
        } else if (prospectsFound > 10 && verified > 5) {
          status = 'EXPAND';
        }

        return {
          city: tc.city,
          state: tc.state,
          country: 'India',
          prospects_found: prospectsFound,
          verified_prospects: verified,
          qualified_outreach: outreach,
          replies,
          positive_replies: positive,
          meetings,
          proposals,
          revenue,
          conversion_rate: conversionRate,
          status
        };
      });
    } catch (e: any) {
      console.warn('[EXPANSION] Error calculating dynamic matrix:', e.message);
      // Clean baseline return
      return targetCities.map(tc => ({
        city: tc.city,
        state: tc.state,
        country: 'India',
        prospects_found: 0,
        verified_prospects: 0,
        qualified_outreach: 0,
        replies: 0,
        positive_replies: 0,
        meetings: 0,
        proposals: 0,
        revenue: 0,
        conversion_rate: 0,
        status: 'RESEARCH_MORE'
      }));
    }
  }
}
