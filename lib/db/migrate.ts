import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

/**
 * PROXIMA Sequential Versioned Migration Runner
 *
 * - Creates schema_migrations table to track applied versions
 * - Runs each migration transactionally
 * - Records version only after successful completion
 * - Fails loudly on unexpected errors
 * - Never silently swallows database errors
 */

interface MigrationFile {
  version: number;
  name: string;
  filename: string;
  sql: string;
}

function discoverMigrations(migrationsDir: string): MigrationFile[] {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const migrations: MigrationFile[] = [];

  for (const filename of files) {
    const match = filename.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      console.warn(`⚠️ Skipping non-migration file: ${filename}`);
      continue;
    }

    const version = parseInt(match[1], 10);
    const name = match[2];
    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf-8');

    migrations.push({ version, name, filename, sql });
  }

  return migrations;
}

async function ensureSchemaMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedVersions(pool: Pool): Promise<Set<number>> {
  const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
  return new Set(result.rows.map(r => r.version));
}

async function runMigration(pool: Pool, migration: MigrationFile): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Execute the migration SQL
    await client.query(migration.sql);

    // The migration SQL itself should insert into schema_migrations,
    // but we verify and insert if not already done
    const check = await client.query(
      'SELECT version FROM schema_migrations WHERE version = $1',
      [migration.version]
    );

    if (check.rows.length === 0) {
      await client.query(
        'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
        [migration.version, migration.filename]
      );
    }

    await client.query('COMMIT');
    console.log(`  ✅ Migration ${migration.filename} applied successfully`);
  } catch (err: any) {
    await client.query('ROLLBACK');
    // Re-throw with context — never silently swallow
    throw new Error(
      `Migration ${migration.filename} (version ${migration.version}) failed: ${err.message}`
    );
  } finally {
    client.release();
  }
}

export async function runDatabaseMigrations(connectionString?: string): Promise<{
  applied: number;
  skipped: number;
  total: number;
  currentVersion: number;
}> {
  const dbUrl = connectionString || process.env.DATABASE_URL;

  if (!dbUrl || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'))) {
    console.log('⚠️ DATABASE_URL not configured. Skipping PostgreSQL migrations.');
    console.log('  Local development uses db.json automatically.');
    return { applied: 0, skipped: 0, total: 0, currentVersion: 0 };
  }

  console.log('🚀 Running PROXIMA Sequential Database Migrations...');
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    // Ensure tracking table exists
    await ensureSchemaMigrationsTable(pool);

    // Discover migration files
    const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
    const migrations = discoverMigrations(migrationsDir);
    console.log(`  📁 Found ${migrations.length} migration file(s)`);

    // Get already-applied versions
    const applied = await getAppliedVersions(pool);
    console.log(`  📋 Already applied: ${applied.size} migration(s)`);

    // Run pending migrations in order
    let appliedCount = 0;
    let skippedCount = 0;
    let currentVersion = applied.size > 0 ? Math.max(...applied) : 0;

    for (const migration of migrations) {
      if (applied.has(migration.version)) {
        skippedCount++;
        continue;
      }

      console.log(`  🔄 Applying migration ${migration.filename}...`);
      await runMigration(pool, migration);
      appliedCount++;
      currentVersion = migration.version;
    }

    console.log(`\n✅ Migration complete. Applied: ${appliedCount}, Skipped: ${skippedCount}, Version: ${currentVersion}`);

    return {
      applied: appliedCount,
      skipped: skippedCount,
      total: migrations.length,
      currentVersion
    };
  } catch (err: any) {
    console.error(`\n❌ MIGRATION FAILED: ${err.message}`);
    console.error('  The database may be in an inconsistent state.');
    console.error('  Fix the failing migration and re-run.');
    throw err;
  } finally {
    await pool.end();
  }
}

/**
 * Get migration health status for diagnostics
 */
export async function getMigrationHealth(connectionString?: string): Promise<{
  status: 'HEALTHY' | 'PENDING' | 'ERROR';
  currentVersion: number;
  totalMigrations: number;
  pendingCount: number;
  appliedMigrations: Array<{ version: number; name: string; applied_at: string }>;
}> {
  const dbUrl = connectionString || process.env.DATABASE_URL;

  if (!dbUrl || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'))) {
    return {
      status: 'HEALTHY',
      currentVersion: 0,
      totalMigrations: 0,
      pendingCount: 0,
      appliedMigrations: []
    };
  }

  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await ensureSchemaMigrationsTable(pool);

    const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
    const migrations = discoverMigrations(migrationsDir);
    const applied = await getAppliedVersions(pool);

    const result = await pool.query(
      'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
    );

    const pendingCount = migrations.filter(m => !applied.has(m.version)).length;
    const currentVersion = applied.size > 0 ? Math.max(...applied) : 0;

    return {
      status: pendingCount === 0 ? 'HEALTHY' : 'PENDING',
      currentVersion,
      totalMigrations: migrations.length,
      pendingCount,
      appliedMigrations: result.rows
    };
  } catch (err: any) {
    return {
      status: 'ERROR',
      currentVersion: -1,
      totalMigrations: 0,
      pendingCount: -1,
      appliedMigrations: []
    };
  } finally {
    await pool.end();
  }
}

// CLI entry point
if (require.main === module) {
  runDatabaseMigrations()
    .then(result => {
      console.log('\nMigration Summary:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal migration error:', err.message);
      process.exit(1);
    });
}
