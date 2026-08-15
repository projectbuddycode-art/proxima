import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

async function runDatabaseMigrations() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'))) {
    console.log('⚠️ DATABASE_URL environment variable is not configured.');
    console.log('  Skipping PostgreSQL migration. Local development uses db.json automatically.');
    process.exit(0);
  }

  console.log('🚀 Running PostgreSQL Production Schema Migration...');
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    const migrationFile = path.join(process.cwd(), 'db', 'migrations', '001_initial_schema.sql');
    if (!fs.existsSync(migrationFile)) {
      console.error('❌ Migration file 001_initial_schema.sql not found.');
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');
    await pool.query(sql);

    // Schema alterations for existing tables
    const alterQueries = [
      'ALTER TABLE bridge_sessions ADD CONSTRAINT bridge_sessions_token_hash_key UNIQUE (token_hash);',
      'ALTER TABLE prospects ALTER COLUMN name DROP NOT NULL;',
      'ALTER TABLE prospects ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);',
      'ALTER TABLE prospects ADD COLUMN IF NOT EXISTS role VARCHAR(255);',
      'ALTER TABLE prospects ADD COLUMN IF NOT EXISTS intent_level VARCHAR(50);',
      'ALTER TABLE prospects ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,2);',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_summary TEXT;',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS decision_makers_json JSONB;',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS products_services_json JSONB;',
      'ALTER TABLE security_observations ALTER COLUMN target DROP NOT NULL;',
      'ALTER TABLE security_observations ALTER COLUMN finding DROP NOT NULL;',
      'ALTER TABLE security_observations ALTER COLUMN risk_level DROP NOT NULL;',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS target_domain VARCHAR(255);',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS https_enabled INTEGER DEFAULT 1;',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS security_headers_present JSONB;',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS missing_security_headers JSONB;',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS public_tech_signature JSONB;',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS robots_txt_status VARCHAR(50);',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS sitemap_status VARCHAR(50);',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS observation_summary TEXT;',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS project_buddy_remediation_opportunity TEXT;',
      'ALTER TABLE security_observations ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,2);',
      'ALTER TABLE messages ALTER COLUMN body DROP NOT NULL;',
      'ALTER TABLE responses ALTER COLUMN response_text DROP NOT NULL;',
      'ALTER TABLE responses ALTER COLUMN content DROP NOT NULL;',
      'ALTER TABLE responses ADD COLUMN IF NOT EXISTS raw_text TEXT;',
      'ALTER TABLE responses ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,2);',
      'ALTER TABLE responses ADD COLUMN IF NOT EXISTS reason TEXT;',
      'ALTER TABLE responses ADD COLUMN IF NOT EXISTS recommended_action TEXT;',
      'ALTER TABLE responses ADD COLUMN IF NOT EXISTS automation_allowed INTEGER DEFAULT 1;',
      'ALTER TABLE responses ADD COLUMN IF NOT EXISTS classification VARCHAR(50);'
    ];

    for (const q of alterQueries) {
      try {
        await pool.query(q);
      } catch (e) {
        // Ignore if constraint or column already exists
      }
    }

    console.log('✅ PostgreSQL Schema Migration Executed Successfully!');
  } catch (err: any) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runDatabaseMigrations();
