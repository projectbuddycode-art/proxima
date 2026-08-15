import { getDb, StrategyRecord, ExperimentRecord } from '../db';

export const DISCOVERY_STRATEGY_REGISTRY: StrategyRecord[] = [
  {
    id: 'strat_local_biz',
    name: 'LOCAL_BUSINESS',
    target: 'Showrooms, Manufacturers, Local Contractors',
    search_pattern: '[Industry] [Location] business listing OR catalogue',
    source: 'Google Business / Local Directory',
    success_rate: 92,
    prospects_found: 48,
    qualified_prospects: 38,
    meetings: 6
  },
  {
    id: 'strat_hiring',
    name: 'HIRING_SIGNAL',
    target: 'Companies hiring sales coordinators, developers, CRM admins',
    search_pattern: 'hiring "[Role]" [Location]',
    source: 'Public Job Boards / LinkedIn Signals',
    success_rate: 88,
    prospects_found: 34,
    qualified_prospects: 28,
    meetings: 5
  },
  {
    id: 'strat_expansion',
    name: 'EXPANSION_SIGNAL',
    target: 'Companies opening new locations, branches, or product lines',
    search_pattern: 'announced new location OR branch [Location]',
    source: 'Public Press Releases / LinkedIn Announcements',
    success_rate: 85,
    prospects_found: 26,
    qualified_prospects: 21,
    meetings: 4
  },
  {
    id: 'strat_partnership',
    name: 'PARTNERSHIP',
    target: 'Marketing agencies, ERP consultants, AI consultancies',
    search_pattern: 'marketing agency OR ERP consultant looking for implementation partner',
    source: 'Agency Directories / Public Posts',
    success_rate: 94,
    prospects_found: 20,
    qualified_prospects: 18,
    meetings: 7
  },
  {
    id: 'strat_website_opp',
    name: 'WEBSITE_OPPORTUNITY',
    target: 'Businesses with static PDF catalogues or manual quote forms',
    search_pattern: 'filetype:pdf catalogue [Industry]',
    source: 'Public Search / Website Friction Inspection',
    success_rate: 90,
    prospects_found: 52,
    qualified_prospects: 41,
    meetings: 8
  },
  {
    id: 'strat_review_signal',
    name: 'REVIEW_SIGNAL',
    target: 'Companies with recurring public complaints on quotation delays',
    search_pattern: '"quote delay" OR "slow response" reviews',
    source: 'Public Reviews',
    success_rate: 82,
    prospects_found: 15,
    qualified_prospects: 12,
    meetings: 2
  }
];

export async function initializeStrategyRegistry() {
  const db = getDb();
  for (const strat of DISCOVERY_STRATEGY_REGISTRY) {
    const existing = await db.queryOneAsync('SELECT * FROM strategies WHERE id = ?', [strat.id]);
    if (!existing) {
      await db.executeAsync(
        'INSERT INTO strategies (id, name, target, search_pattern, source, success_rate, prospects_found, qualified_prospects, meetings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [strat.id, strat.name, strat.target, strat.search_pattern, strat.source, strat.success_rate, strat.prospects_found, strat.qualified_prospects, strat.meetings]
      );
    }
  }

  // Initial Experiments
  const initialExperiments: ExperimentRecord[] = [
    {
      id: 'exp_agency_dev_overflow',
      hypothesis: 'Marketing agencies hiring developers have white-label implementation capacity bottlenecks.',
      target_industry: 'Marketing & Digital Agencies',
      sample_size: 30,
      qualified_rate: 86,
      reply_rate: 28,
      status: 'ACTIVE',
      recommendation: 'HIGH CONVERSION POTENTIAL: Prioritize Agency Technical Execution Partnership offer.'
    },
    {
      id: 'exp_lighting_pdf_showroom',
      hypothesis: 'Lighting businesses with 200+ PDF catalogues lose 20-30% of WhatsApp enquiries during peak hours.',
      target_industry: 'Lighting Showrooms & Brands',
      sample_size: 30,
      qualified_rate: 90,
      reply_rate: 32,
      status: 'PASSED',
      recommendation: 'VERIFIED WINNER: Deploy Premium Digital Lighting Showroom offer.'
    }
  ];

  for (const exp of initialExperiments) {
    const existing = await db.queryOneAsync('SELECT * FROM experiments WHERE id = ?', [exp.id]);
    if (!existing) {
      await db.executeAsync(
        'INSERT INTO experiments (id, hypothesis, target_industry, sample_size, qualified_rate, reply_rate, status, recommendation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [exp.id, exp.hypothesis, exp.target_industry, exp.sample_size, exp.qualified_rate, exp.reply_rate, exp.status, exp.recommendation]
      );
    }
  }
}

