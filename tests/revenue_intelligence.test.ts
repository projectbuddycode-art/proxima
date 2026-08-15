import { GlobalRevenueIntelligenceEngine } from '../lib/intelligence/revenue';
import { EvidenceEngine } from '../lib/verification/evidence';
import { initDb, getDb } from '../lib/db';

process.env.TEST_MODE = 'true';

async function runRevenueIntelligenceTestSuite() {
  console.log('========================================================================');
  console.log('🔥 PROXIMA GLOBAL REVENUE INTELLIGENCE & EVIDENCE WEIGHT TEST SUITE');
  console.log('========================================================================\n');

  initDb();
  const db = getDb();
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`[REVENUE INTELLIGENCE TEST ${total}] ${desc}: PASS`);
      passed++;
    } else {
      console.error(`❌ [REVENUE INTELLIGENCE TEST ${total}] ${desc}: FAIL`);
      process.exit(1);
    }
  }

  // 1. Opportunity Score Calculation & Value Tier Estimation
  const highValueProspect = {
    company_name: 'Jaguar Lighting Emporio',
    industry: 'Lighting',
    location: 'Bangalore',
    website: 'https://jaguarlighting.in',
    phone: '+91 80 2222 3333',
    fit_score: 85
  };

  const scoreResult = GlobalRevenueIntelligenceEngine.calculateOpportunityScore(highValueProspect);
  assert(scoreResult.score >= 70, 'High-Ticket Opportunity Score Calculation');
  assert(scoreResult.tier === 'HIGH' || scoreResult.tier === 'ENTERPRISE', 'High-Ticket Project Value Tier Assignment');
  assert(scoreResult.why.length >= 2, 'Evidence-Backed Reasoning Breakdown');

  // 2. Growth Signal Detection
  const signals = GlobalRevenueIntelligenceEngine.detectGrowthSignals('prosp_101', highValueProspect);
  assert(Array.isArray(signals) && signals.length >= 2, 'Growth Signal Agent Output Array');
  assert(signals[0].signal_type === 'TECH_MIGRATION', 'Tech Migration Signal Detection');

  // 3. Source Reliability Hierarchy Weights
  const govWeight = EvidenceEngine.getSourceReliabilityScore('Official Government Registry');
  assert(govWeight === 100, 'Government Registry Weight = 100');

  const webWeight = EvidenceEngine.getSourceReliabilityScore('Official Website Domain');
  assert(webWeight === 95, 'Official Website Weight = 95');

  const osmWeight = EvidenceEngine.getSourceReliabilityScore('OpenStreetMap Public Extract');
  assert(osmWeight === 70, 'OpenStreetMap Extract Weight = 70');

  const aiWeight = EvidenceEngine.getSourceReliabilityScore('AI Inference Model');
  assert(aiWeight === 0, 'AI Inference Model Weight = 0 (Not Verified Fact)');

  // 4. Global Markets & City Rotation Coverage
  const markets = GlobalRevenueIntelligenceEngine.getGlobalMarkets();
  assert(markets.some(m => m.code === 'UAE'), 'Global Markets Include UAE');
  assert(markets.some(m => m.code === 'IND'), 'Global Markets Include India');
  assert(markets.some(m => m.code === 'UK'), 'Global Markets Include UK');
  assert(markets.some(m => m.code === 'USA'), 'Global Markets Include USA');

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passed}/${total} REVENUE INTELLIGENCE TESTS PASSED CLEANLY!`);
  console.log('========================================================================\n');
}

runRevenueIntelligenceTestSuite();
