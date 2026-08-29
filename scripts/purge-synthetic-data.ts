import { initDb, getDb } from '../lib/db';

async function purgeSyntheticData() {
  console.log('====================================================');
  console.log('🔥 PROXIMA PRODUCTION REAL-DATA FIREWALL PURGE');
  console.log('====================================================');

  initDb();
  const db = getDb();

  try {
    // 1. Identify and delete synthetic responses
    const deletedResponses = await db.executeAsync(`
      DELETE FROM responses
      WHERE prospect_id IN (
        SELECT p.id FROM prospects p
        LEFT JOIN companies c ON p.company_id = c.id
        WHERE c.name ILIKE '%Test Company%'
           OR c.name ILIKE '%Example%'
           OR c.name ILIKE '%Sample%'
           OR c.name ILIKE '%Dummy%'
           OR c.website ILIKE '%example%'
           OR p.contact_name ILIKE '%Test User%'
           OR p.contact_name ILIKE '%Test Contact%'
           OR p.email ILIKE '%@example%'
           OR p.email ILIKE '%test@%'
      )
    `);
    console.log(`✅ Deleted synthetic responses: ${deletedResponses.changes || 0}`);

    // 2. Identify and delete synthetic messages
    const deletedMessages = await db.executeAsync(`
      DELETE FROM messages
      WHERE prospect_id IN (
        SELECT p.id FROM prospects p
        LEFT JOIN companies c ON p.company_id = c.id
        WHERE c.name ILIKE '%Test Company%'
           OR c.name ILIKE '%Example%'
           OR c.name ILIKE '%Sample%'
           OR c.name ILIKE '%Dummy%'
           OR c.website ILIKE '%example%'
           OR p.contact_name ILIKE '%Test User%'
           OR p.contact_name ILIKE '%Test Contact%'
           OR p.email ILIKE '%@example%'
           OR p.email ILIKE '%test@%'
      )
    `);
    console.log(`✅ Deleted synthetic messages: ${deletedMessages.changes || 0}`);

    // 3. Identify and delete synthetic opportunities
    const deletedOpps = await db.executeAsync(`
      DELETE FROM opportunities
      WHERE prospect_id IN (
        SELECT p.id FROM prospects p
        LEFT JOIN companies c ON p.company_id = c.id
        WHERE c.name ILIKE '%Test Company%'
           OR c.name ILIKE '%Example%'
           OR c.name ILIKE '%Sample%'
           OR c.name ILIKE '%Dummy%'
           OR c.website ILIKE '%example%'
           OR p.contact_name ILIKE '%Test User%'
           OR p.contact_name ILIKE '%Test Contact%'
           OR p.email ILIKE '%@example%'
           OR p.email ILIKE '%test@%'
      )
    `);
    console.log(`✅ Deleted synthetic opportunities: ${deletedOpps.changes || 0}`);

    // 4. Identify and delete synthetic prospects
    const deletedProspects = await db.executeAsync(`
      DELETE FROM prospects
      WHERE company_id IN (
        SELECT id FROM companies
        WHERE name ILIKE '%Test Company%'
           OR name ILIKE '%Example%'
           OR name ILIKE '%Sample%'
           OR name ILIKE '%Dummy%'
           OR website ILIKE '%example%'
      )
      OR contact_name ILIKE '%Test User%'
      OR contact_name ILIKE '%Test Contact%'
      OR email ILIKE '%@example%'
      OR email ILIKE '%test@%'
    `);
    console.log(`✅ Deleted synthetic prospects: ${deletedProspects.changes || 0}`);

    // 5. Identify and delete synthetic companies
    const deletedCompanies = await db.executeAsync(`
      DELETE FROM companies
      WHERE name ILIKE '%Test Company%'
         OR name ILIKE '%Example%'
         OR name ILIKE '%Sample%'
         OR name ILIKE '%Dummy%'
         OR website ILIKE '%example%'
    `);
    console.log(`✅ Deleted synthetic companies: ${deletedCompanies.changes || 0}`);

    // Verify remaining count
    const remainingProspects = await db.queryAllAsync(`
      SELECT p.*, c.name as company_name
      FROM prospects p
      LEFT JOIN companies c ON p.company_id = c.id
    `);

    console.log('\n====================================================');
    console.log(`📊 REAL PROSPECTS REMAINING IN DATABASE: ${remainingProspects.length}`);
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Purge Error:', err.message);
  }
}

purgeSyntheticData();
