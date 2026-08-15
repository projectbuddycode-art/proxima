import { encryptToken, decryptToken } from '../lib/security/crypto';
import { EvidenceEngine } from '../lib/verification/evidence';
import { ProximaLearningEngine } from '../lib/ai/learning';
import { initDb, getDb } from '../lib/db';

process.env.TEST_MODE = 'true';

async function runConnectionsTestSuite() {
  console.log('========================================================================');
  console.log('🔥 PROXIMA CONNECTIONS CENTER, EVIDENCE & APPROVALS TEST SUITE');
  console.log('========================================================================\n');

  initDb();
  const db = getDb();
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`[CONNECTIONS TEST ${total}] ${desc}: PASS`);
      passed++;
    } else {
      console.error(`❌ [CONNECTIONS TEST ${total}] ${desc}: FAIL`);
      process.exit(1);
    }
  }

  // 1. AES-256-GCM Token Encryption & Decryption
  const tokenOriginal = 'prx_oauth_test_token_secret_12345';
  const { encrypted, iv, tag } = encryptToken(tokenOriginal);
  assert(Boolean(encrypted && iv && tag), 'AES-256-GCM Token Encryption Output');
  assert(encrypted !== tokenOriginal, 'Token Is Encrypted (Not Plaintext)');

  const decrypted = decryptToken(encrypted, iv, tag);
  assert(decrypted === tokenOriginal, 'AES-256-GCM Token Decryption Output Matches Original');

  // 2. Evidence Engine & Confidence Evaluation
  const claim = await EvidenceEngine.registerClaim({
    prospect_id: 'prosp_test_101',
    claim: 'Official OpenStreetMap public registry listing verified',
    source: 'OpenStreetMap Regional Extract',
    source_url: 'https://www.openstreetmap.org/node/6419006185',
    confidence: 'HIGH',
    agent: 'Map Intelligence Agent',
    evidence_type: 'Public Registry'
  });
  assert(claim.verification_status === 'VERIFIED', 'High Confidence Claim Verified');
  assert(claim.confidence === 'HIGH', 'High Confidence Value Assigned');

  const confEval = EvidenceEngine.evaluateClaimConfidence('https://www.openstreetmap.org/node/6419006185', true);
  assert(confEval === 'HIGH', 'Evidence Provenance Confidence High Evaluation');

  // 3. Proxima Learning Engine Lesson Recording
  const lesson = await ProximaLearningEngine.recordLesson({
    mistake: 'Accepted directory listing without two-source verification',
    root_cause: 'Single source email regex check',
    correction: 'Require two-source verification for high-value contacts',
    evidence: 'Unreachable email bounce event',
    affected_agent: 'Contact Verification Agent',
    regression_test: 'verifyContactTwoSourceTest'
  });
  assert(lesson.affected_agent === 'Contact Verification Agent', 'Learning Lesson Affected Agent Recorded');

  const lessons = await ProximaLearningEngine.getLessonsForAgent('Contact Verification Agent');
  assert(Array.isArray(lessons) && lessons.length > 0, 'Lessons Retrieved for Agent');

  // 4. Database Persistence Check
  assert(db.type === 'LOCAL_JSON' || db.type === 'POSTGRES', 'Database Adapter Valid');

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passed}/${total} CONNECTIONS & EVIDENCE TESTS PASSED CLEANLY!`);
  console.log('========================================================================\n');
}

runConnectionsTestSuite();
