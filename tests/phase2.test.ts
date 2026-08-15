import { initDb, getDb } from '../lib/db';
import { AutonomousOrchestrator } from '../lib/orchestrator/pipeline';
import { OfflineMapIntelligenceEngine } from '../lib/discovery/map';
import { RealProspectFirewall } from '../lib/verification/firewall';
import { ContactVerificationEngine } from '../lib/verification/contacts';

process.env.TEST_MODE = 'true';

async function runPhase2TestSuite() {
  console.log('========================================================================');
  console.log('🔥 PROXIMA PHASE 2 — AUTONOMOUS OPERATIONS & PROSPECT INTELLIGENCE SUITE');
  console.log('========================================================================\n');

  initDb();
  const db = getDb();
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`[PHASE2 TEST ${total}] ${desc}: PASS`);
      passed++;
    } else {
      console.error(`❌ [PHASE2 TEST ${total}] ${desc}: FAIL`);
      process.exit(1);
    }
  }

  // 1. Autonomous Mode Toggle & Database Persistence
  await AutonomousOrchestrator.setAutonomousMode(true);
  const statusActive = await AutonomousOrchestrator.getAutonomousStatus();
  assert(statusActive.autonomousMode === 'ACTIVE', 'Autonomous Mode Activation');
  assert(statusActive.schedulerStatus === 'RUNNING', 'Scheduler Running Status');

  await AutonomousOrchestrator.setAutonomousMode(false);
  const statusStopped = await AutonomousOrchestrator.getAutonomousStatus();
  assert(statusStopped.autonomousMode === 'STOPPED', 'Autonomous Mode Deactivation');

  // Reset to ACTIVE for system operations
  await AutonomousOrchestrator.setAutonomousMode(true);

  // 2. Operational Agents Matrix (20 Agents)
  assert(statusActive.agentsCount === 20, '20 Operational Agents Registered');
  assert(statusActive.agents.length === 20, '20 Operational Agents Matrix List');
  assert(statusActive.agents[0].name === 'COMMANDER / AI CEO', 'Commander AI CEO Role');
  assert(statusActive.agents[17].name === 'TAKEOVER AGENT', 'Shivam Takeover Agent Role');

  // 3. OpenStreetMap Local Map Index Engine & Cache
  const mapStatus = await OfflineMapIntelligenceEngine.getIndexStatus('Bangalore');
  assert(mapStatus.status === 'ONLINE', 'Local Map Index Online');
  assert(mapStatus.region === 'Bangalore', 'Map Index Region Bangalore');

  const osmResults = await OfflineMapIntelligenceEngine.discoverFromMapData('Lighting', 'Bangalore');
  assert(Array.isArray(osmResults), 'Map Discovery Returns Array');

  // 4. Zero-Synthetic Firewall Enforcement
  const syntheticProspect = {
    company_name: 'Test Company',
    website: 'https://example.com',
    industry: 'Lighting',
    location: 'Bangalore',
    contact_name: 'Test User'
  };
  assert(!RealProspectFirewall.validateRealProspect(syntheticProspect), 'Synthetic Prospect Rejected by Firewall');

  // 5. Contact Provenance Verification (5-Level Gate)
  const contactResult = ContactVerificationEngine.verifyContact('email', undefined, undefined, 'official_website', true, false);
  assert(contactResult === null, 'Unverified Contact Returns NULL (No Inventions)');

  // 6. City & Industry Rotation Capabilities
  assert(statusActive.availableCities.includes('Bangalore'), 'City Rotation Includes Bangalore');
  assert(statusActive.availableCities.includes('Mumbai'), 'City Rotation Includes Mumbai');
  assert(statusActive.availableCities.includes('Delhi NCR'), 'City Rotation Includes Delhi NCR');
  assert(statusActive.availableIndustries.includes('Lighting'), 'Industry Rotation Includes Lighting');
  assert(statusActive.availableIndustries.includes('Architects'), 'Industry Rotation Includes Architects');

  // 7. Database Adapter Verification
  assert(db.type === 'LOCAL_JSON' || db.type === 'POSTGRES', 'Valid Database Adapter');

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passed}/${total} PHASE 2 AUTONOMOUS TESTS PASSED CLEANLY!`);
  console.log('========================================================================\n');
}

runPhase2TestSuite();
