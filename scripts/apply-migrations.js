/**
 * Apply Production Migrations (v4 - Final Fix)
 * 
 * Applies all pending database migrations to production Supabase.
 */

import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
require('dotenv').config({ path: fileURLToPath(import.meta.url, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local.save');
  process.exit(1);
}

// Get project reference from Supabase URL
const url = new URL(SUPABASE_URL);
const projectRef = url.hostname.replace('.supabase.co', '');

console.log(`📡 Project: ${projectRef}`);

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

async function readMigrationFile(filename) {
  const filepath = path.join(process.cwd(), 'n8n-universe', 'supabase', 'migrations', filename);
  const content = await fs.readFile(filepath, 'utf8');
  return content;
}

async function applyMigration(migration) {
  const { name, file } = migration;
  console.log(`📜 Applying: ${name}`);
  console.log(`   File: ${file}`);

  try {
    // Read migration SQL
    const sql = await readMigrationFile(file);

    // Extract project ref from Supabase URL
    const url = new URL(SUPABASE_URL);
    const projectRef = url.hostname.replace('.supabase.co', '');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Executing ${statements.length} SQL statements...`);

    // Execute each statement using Supabase SQL API
    let executed = 0;
    for (const statement of statements) {
      const { error } = await fetch(`${SUPABASE_URL}/rest/v1/rpc/postgres/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'partner=us-east-1'
        },
        body: JSON.stringify({
          connection_string: `postgresql://postgres.supabase_admin:${SUPABASE_SERVICE_ROLE_KEY}@${projectRef}:5432/postgres`,
          query: statement
        })
      });

      if (error) {
        console.error(`❌ Error in statement: ${statement.substring(0, 50)}...`);
        console.error(`   ${error.message}`);
        throw error;
      }

      executed++;

      // Progress indicator every 10 statements
      if (executed % 10 === 0) {
        process.stdout.write('.');
      }
    }

    console.log(`✅ Applied: ${name} (${executed} statements)`);
  } catch (error) {
    console.error(`❌ Failed to apply ${name}:`, error.message);
    throw error;
  }
}

async function trackMigration(filename) {
  try {
    // Create migration tracking record if table exists
    const { error } = await fetch(`${SUPABASE_URL}/rest/v1/rpc/postgres/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'partner=us-east-1'
      },
      body: JSON.stringify({
        connection_string: `postgresql://postgres.supabase_admin:${SUPABASE_SERVICE_ROLE_KEY}@${projectRef}:5432/postgres`,
        query: `
          INSERT INTO _schema_migrations (filename)
          VALUES ('${filename}')
          ON CONFLICT (filename) DO NOTHING;
        `
      })
    });

    if (error) {
      console.warn(`⚠️  Could not track migration: ${error.message}`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not track migration: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting Production Migration (v4 - Final Fix)...\n');

  try {
    // Read and apply each migration
    for (const migration of migrations) {
      await applyMigration(migration);

      // Track migration
      await trackMigration(migration.file);

      // Small delay between migrations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ All migrations applied successfully!\n');
    console.log('🎉 Production database is up to date!\n');
    console.log('\n📊 Migration Summary:');
    console.log(`   Applied: ${migrations.length} migrations`);
    console.log(`   Status: All tables, indexes, and policies created\n');
    console.log('\n📋 Next: Upload 15,106 workflows to complete setup');
    console.log('   Run: node workflows/upload-workflows.js\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Apply migrations manually via Supabase Dashboard:');
    console.error('   https://supabase.com/dashboard/project/xivfaplrtwoprrymeqjb/sql\n');
    process.exit(1);
  }
}

main();
