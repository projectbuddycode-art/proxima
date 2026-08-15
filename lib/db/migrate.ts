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
    console.log('✅ PostgreSQL Schema Migration Executed Successfully!');
  } catch (err: any) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runDatabaseMigrations();
