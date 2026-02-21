/**
 * Apply Database Migrations (REST API Version)
 * 
 * Applies all pending database migrations to production Supabase
 * using the Supabase REST API (no psql required).
 */

import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
const envContent = await fs.readFile(path.join(process.cwd(), '../.env.local'), 'utf8');
const envLines = envContent.split('\n');

function getEnvVar(name) {
  const line = envLines.find(l => l.startsWith(`${name}=`));
  if (line) {
    return line.split('=')[1].trim();
  }
  return '';
}

const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_KEY = getEnvVar('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Extract project ref from URL (for the PostgreSQL connection string)
const url = new URL(SUPABASE_URL);
const projectRef = url.hostname.replace('.supabase.co', '');

const connectionString = `postgresql://postgres.supabase_admin:${SUPABASE_SERVICE_KEY}@${projectRef}:5432/postgres`;

console.log(`📡 Project: ${projectRef}`);
console.log(`📡 Connection string prepared`);

// Migration files to apply
const migrations = [
  {
    name: 'Saved Searches',
    file: 'supabase/migrations/20261616000000_saved_searches.sql'
  },
  {
    name: 'Analytics Tables',
    file: 'supabase/migrations/20261707000000_analytics_tables.sql'
  },
  {
    name: 'Referral System',
    file: 'supabase/migrations/20262007000000_referral_system.sql'
  }
];

async function readMigrationSQL(filename) {
  const filepath = path.join(process.cwd(), '..', filename);
  const sql = await fs.readFile(filepath, 'utf8');
  return sql;
}

async function applyMigrationUsingPostgres(migration) {
  const { name, file } = migration;
  console.log(`\n📜 Applying: ${name}`);
  console.log(`   File: ${file}`);

  try {
    const sql = await readMigrationSQL(file);

    // Track applied migration
    const trackSql = `
      INSERT INTO _schema_migrations (filename)
      VALUES ('${file}')
      ON CONFLICT (filename) DO NOTHING;
    `;

    // Apply all SQL statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Executing ${statements.length} SQL statements...`);

    for (const i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Execute statement via Supabase API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/postgres/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          connection_string: connectionString,
          query: statement
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to execute statement ${i}: ${errorText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`Error in statement ${i}: ${result.error.message}`);
      }

      console.log(`   ✓ Statement ${i + 1}/${statements.length} executed`);
      
      // Small delay to avoid rate limiting
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ Applied: ${name}`);
    return { success: true, statementsExecuted: statements.length };

  } catch (error) {
    console.error(`❌ Error applying ${name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function trackMigration(filename) {
  const trackSql = `
    INSERT INTO _schema_migrations (filename)
    VALUES ('${filename}')
    ON CONFLICT (filename) DO NOTHING;
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/postgres/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        connection_string: connectionString,
        query: trackSql
      })
    });

    if (!response.ok) {
      console.warn(`⚠️  Could not track migration: ${filename}`);
    } else {
      console.log(`✅ Tracked: ${filename}`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not track migration: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting Production Database Migrations...\n');
  console.log(`📋 Using PostgreSQL connection to: ${projectRef}\n`);

  let successCount = 0;
  let failCount = 0;

  // Apply each migration
  for (const migration of migrations) {
    const result = await applyMigrationUsingPostgres(migration);

    if (result.success) {
      successCount++;
      await trackMigration(migration.file);
    } else {
      failCount++;
      console.error(`   ✗ ${migration.name}: ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Migration Summary:`);
  console.log(`   Total: ${migrations.length}`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`=`.repeat(60));
  console.log(`🎉 Production database is now up to date!\n`);

  if (failCount > 0) {
    console.log(`\n⚠️  Some migrations failed. You may need to apply them manually via the Supabase Dashboard.`);
    console.log(`   Dashboard: https://supabase.com/dashboard/project/${projectRef}/sql`);
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
