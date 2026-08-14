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
   * Generates City x Industry campaign matrix with performance decisions
   */
  static generateExpansionMatrix(): CityPerformanceRecord[] {
    return [
      {
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        prospects_found: 48,
        verified_prospects: 38,
        qualified_outreach: 22,
        replies: 7,
        positive_replies: 3,
        meetings: 2,
        proposals: 1,
        revenue: 210000,
        conversion_rate: 13.6,
        status: 'KEEP'
      },
      {
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        prospects_found: 34,
        verified_prospects: 28,
        qualified_outreach: 16,
        replies: 5,
        positive_replies: 2,
        meetings: 1,
        proposals: 1,
        revenue: 0,
        conversion_rate: 12.5,
        status: 'EXPAND'
      },
      {
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        prospects_found: 26,
        verified_prospects: 20,
        qualified_outreach: 10,
        replies: 3,
        positive_replies: 1,
        meetings: 1,
        proposals: 0,
        revenue: 0,
        conversion_rate: 10.0,
        status: 'RESEARCH_MORE'
      }
    ];
  }
}
