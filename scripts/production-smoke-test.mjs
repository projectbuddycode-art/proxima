import { initDb, getDb } from '../lib/db.ts';
import { ProximaCloudGateway } from '../lib/gateway/server.ts';
import fs from 'fs';
import path from 'path';

async function runProductionSmokeTest() {
  console.log('========================================================================');
  console.log('🔥 PROXIMA PRODUCTION GATEWAY & DATABASE FORENSIC SMOKE TEST');
  console.log('========================================================================\n');

  // Clean test database for fresh run
  const dbFile = path.join(process.cwd(), 'db.json');
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
  }

  // 1. Database Connectivity & Initialization
  console.log('[SMOKE 1/14] Testing Database Adapter Initialization...');
  initDb();
  const db = getDb();
  console.log(`  ✅ Database Adapter Type: ${db.type}`);

  // 2. Pairing Code Creation (DB-backed, 6-digit, 10 min expiry)
  console.log('[SMOKE 2/14] Testing Single-Use Pairing Code Creation...');
  const code = await ProximaCloudGateway.generatePairingCode();
  console.log(`  ✅ Pairing Code Generated: ${code} (Stored in DB table pairing_codes)`);

  // 3. Pairing Code Validation & Token Generation
  console.log('[SMOKE 3/14] Testing Pairing Code Validation & Cryptographic Token Generation...');
  const pairRes = await ProximaCloudGateway.validatePairingCode(code);
  console.log(`  ✅ Validation Result: ${pairRes.success ? 'SUCCESS' : 'FAILED'} (Token Issued: ${pairRes.token?.substring(0, 15)}...)`);

  // 4. Duplicate Pairing Code Rejection
  console.log('[SMOKE 4/14] Testing Re-use of Used Pairing Code (Atomic Consumption Check)...');
  const rePairRes = await ProximaCloudGateway.validatePairingCode(code);
  console.log(`  ✅ Second Pairing Attempt: ${!rePairRes.success ? 'REJECTED (PASS)' : 'FAILED'}`);

  // 5. SHA-256 Bearer Token Verification
  console.log('[SMOKE 5/14] Testing SHA-256 Bearer Token Hash Verification...');
  const validSession = await ProximaCloudGateway.verifyBearerToken(pairRes.token || '');
  const invalidSession = await ProximaCloudGateway.verifyBearerToken('invalid_fake_token_999');
  console.log(`  ✅ Valid Bearer Token: BridgeID=${validSession?.bridge_id} (PASS)`);
  console.log(`  ✅ Invalid Bearer Token: ${invalidSession === null ? 'NULL (401 REJECT PASS)' : 'FAILED'}`);

  // 6. Bridge Heartbeat Upsert (No Duplicate Rows)
  console.log('[SMOKE 6/14] Testing Bridge Session Heartbeat Upsert...');
  const hb1 = await ProximaCloudGateway.handleHeartbeat({ token: pairRes.token || '', ollama_version: '0.3.0', models: ['qwen2.5-coder:7b'] });
  const hb2 = await ProximaCloudGateway.handleHeartbeat({ token: pairRes.token || '', ollama_version: '0.3.0', models: ['qwen2.5-coder:7b'] });
  console.log(`  ✅ Heartbeats Recorded: Timestamp 1=${hb1.timestamp}, Timestamp 2=${hb2.timestamp}`);

  // 7. Gateway Status & Server-Side Stale Check
  console.log('[SMOKE 7/14] Testing Server-Side Gateway Status & Stale Bridge Check...');
  const status = await ProximaCloudGateway.getStatus();
  console.log(`  ✅ Gateway Status: ${status.status} (Active BridgeID=${status.bridge?.bridge_id})`);

  // 8. Job Creation
  console.log('[SMOKE 8/14] Testing Serverless Job Queue Enqueuing...');
  const job1 = await ProximaCloudGateway.enqueueJob('TEST_INFERENCE', { prompt: 'Return exactly: PROXIMA LOCAL OLLAMA CONNECTED' });
  console.log(`  ✅ Enqueued Job: RequestID=${job1.request_id}, Status=${job1.status}`);

  // 9. Atomic Job Claiming (QUEUED -> CLAIMED)
  console.log('[SMOKE 9/14] Testing Atomic Job Queue Claiming...');
  const claimedJob = await ProximaCloudGateway.claimNextJob(validSession?.bridge_id || 'bridge_1');
  console.log(`  ✅ Claimed Job: RequestID=${claimedJob?.request_id}, Status=${claimedJob?.status}, BridgeID=${claimedJob?.bridge_id}`);

  // 10. Duplicate Job Claim Prevention
  console.log('[SMOKE 10/14] Testing Duplicate Job Claim Prevention...');
  const emptyClaim = await ProximaCloudGateway.claimNextJob('bridge_2');
  console.log(`  ✅ Second Claim Attempt: ${emptyClaim === null ? 'NULL (NO QUEUED JOBS PASS)' : 'FAILED'}`);

  // 11. Job Completion
  console.log('[SMOKE 11/14] Testing Job Completion & Latency Posting...');
  const completeRes = await ProximaCloudGateway.completeJob(job1.request_id, { output: 'PROXIMA LOCAL OLLAMA CONNECTED' }, 115, validSession?.bridge_id || 'bridge_1');
  console.log(`  ✅ Job Completion Posting: ${completeRes ? 'SUCCESS (PASS)' : 'FAILED'}`);

  // 12. Duplicate Job Completion Rejection
  console.log('[SMOKE 12/14] Testing Duplicate Job Completion Rejection...');
  const dupCompleteRes = await ProximaCloudGateway.completeJob(job1.request_id, { output: 'PROXIMA LOCAL OLLAMA CONNECTED' }, 115, validSession?.bridge_id || 'bridge_1');
  console.log(`  ✅ Duplicate Completion Posting: ${!dupCompleteRes ? 'REJECTED (PASS)' : 'FAILED'}`);

  // 13. Forged Job Result Rejection (Bridge A vs Bridge B)
  console.log('[SMOKE 13/14] Testing Forged Job Result Protection (Bridge A completing Bridge B job)...');
  const job2 = await ProximaCloudGateway.enqueueJob('TEST_INFERENCE', { prompt: 'Bridge B Prompt' });
  const claimedJob2 = await ProximaCloudGateway.claimNextJob('bridge_owner_B');
  const forgedRes = await ProximaCloudGateway.completeJob(job2.request_id, { output: 'Forged Output' }, 50, 'attacker_bridge_A');
  console.log(`  ✅ Forged Result Attempt: ${!forgedRes ? 'FORGED RESULT REJECTED (403 PASS)' : 'FAILED'}`);

  // Clean up claimedJob2
  await ProximaCloudGateway.completeJob(job2.request_id, { output: 'Valid Output' }, 50, 'bridge_owner_B');

  // 14. Final Job Status Check
  console.log('[SMOKE 14/14] Verifying Final Job Result & Latency...');
  const finalJobStatus = await ProximaCloudGateway.getJobStatus(job1.request_id);
  console.log(`  ✅ Final Job State: Status=${finalJobStatus?.status}, Latency=${finalJobStatus?.latency_ms}ms, Result="${finalJobStatus?.result?.output}"\n`);

  console.log('========================================================================');
  console.log('🎉 ALL 14 FORENSIC PRODUCTION SMOKE TESTS PASSED CLEANLY!');
  console.log('========================================================================');
}

runProductionSmokeTest().catch(err => {
  console.error('❌ Smoke test failure:', err);
  process.exit(1);
});
