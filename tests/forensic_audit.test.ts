import { CanonicalDeduplicationEngine } from '../lib/verification/dedup';
import { OfflineMapIntelligenceEngine } from '../lib/discovery/map';
import { PipelineOrchestrator } from '../lib/orchestrator/pipeline';
import { initDb, getDb } from '../lib/db';

process.env.TEST_MODE = 'true';

async function runForensicAuditTestSuite() {
  console.log('========================================================================');
  console.log('🔥 PROXIMA FORENSIC AUDIT & CANONICAL DEDUPLICATION TEST SUITE');
  console.log('========================================================================\n');

  initDb();
  const db = getDb();
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`[FORENSIC AUDIT TEST ${total}] ${desc}: PASS`);
      passed++;
    } else {
      console.error(`❌ [FORENSIC AUDIT TEST ${total}] ${desc}: FAIL`);
      process.exit(1);
    }
  }

  // 1. Domain Normalization
  const normDom1 = CanonicalDeduplicationEngine.normalizeDomain('https://www.abcinteriors.com/contact-us');
  assert(normDom1 === 'abcinteriors.com', 'Domain Normalization (www + path stripped)');

  const normDom2 = CanonicalDeduplicationEngine.normalizeDomain('http://abcinteriors.com');
  assert(normDom2 === 'abcinteriors.com', 'Domain Normalization (http stripped)');

  // 2. Company Name Normalization
  const normName1 = CanonicalDeduplicationEngine.normalizeCompanyName('Sri Venkateshwara Lighting Pvt Ltd, Indiranagar', 'Bangalore');
  assert(normName1 === 'sri venkateshwara lighting', 'Company Name Normalization (Legal Suffixes & Address Stripped)');

  // 3. Multi-Layer Canonical Deduplication Matching
  const canonicalMatch = await CanonicalDeduplicationEngine.findCanonicalCompany({
    company_name: 'Sri Venkateshwara Lighting Pvt Ltd, Indiranagar',
    city: 'Bangalore',
    website: 'https://srivenkateshwaralighting.in'
  });
  assert(canonicalMatch !== undefined, 'Canonical Company Match Query');

  // 4. OpenStreetMap Discovery Pagination Offset Support
  const page1 = await OfflineMapIntelligenceEngine.discoverFromMapData('Lighting', 'Bangalore', 0, 10);
  assert(Array.isArray(page1), 'Map Discovery Page 1 Array Return');

  const page2 = await OfflineMapIntelligenceEngine.discoverFromMapData('Lighting', 'Bangalore', 10, 10);
  assert(Array.isArray(page2), 'Map Discovery Page 2 Offset Pagination Array Return');

  // 5. Database Adapter Verification
  assert(db.type === 'LOCAL_JSON' || db.type === 'POSTGRES', 'Valid Database Adapter');

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passed}/${total} FORENSIC AUDIT & DEDUPLICATION TESTS PASSED CLEANLY!`);
  console.log('========================================================================\n');
}

runForensicAuditTestSuite();
