import { RealDevelopmentCommanderEngine } from '../lib/commander/engineering';
import { initDb, getDb } from '../lib/db';

process.env.TEST_MODE = 'true';

async function runCommanderEngineTestSuite() {
  console.log('========================================================================');
  console.log('🔥 PROXIMA DEVELOPMENT COMMANDER ENGINE TEST SUITE');
  console.log('========================================================================\n');

  initDb();
  const db = getDb();
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`[COMMANDER TEST ${total}] ${desc}: PASS`);
      passed++;
    } else {
      console.error(`❌ [COMMANDER TEST ${total}] ${desc}: FAIL`);
      process.exit(1);
    }
  }

  // 1. Worker Heartbeat
  const worker = await RealDevelopmentCommanderEngine.getWorkerStatus();
  assert(worker.worker_id === 'dev_commander_worker_1', 'Worker ID Match');
  assert(worker.status === 'RUNNING', 'Worker Heartbeat Status RUNNING');

  // 2. System Audit
  const state = await RealDevelopmentCommanderEngine.auditSystemState();
  assert(state.systemHealth.Ollama.includes('qwen2.5-coder:3b'), 'Local Ollama Model Verification (qwen2.5-coder:3b)');
  assert(Array.isArray(state.tasks) && state.tasks.length > 0, 'Durable Engineering Tasks Array');

  // 3. User Directive Processing
  const directiveResult = await RealDevelopmentCommanderEngine.processUserDirective('Audit prospect deduplication pipeline');
  assert(directiveResult.task.id.startsWith('task_cmd_'), 'Task ID Generation');
  assert(directiveResult.task.status === 'PROPOSED', 'Directive Task Initial Status PROPOSED');

  // 4. Approved Deployment Execution
  const deployResult = await RealDevelopmentCommanderEngine.executeApprovedDeployment(directiveResult.task.id);
  assert(deployResult.success === true, 'Deployment Execution Success');
  assert(deployResult.status === 'DEPLOYED', 'Deployment Status DEPLOYED');

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passed}/${total} DEVELOPMENT COMMANDER TESTS PASSED CLEANLY!`);
  console.log('========================================================================\n');
}

runCommanderEngineTestSuite();
