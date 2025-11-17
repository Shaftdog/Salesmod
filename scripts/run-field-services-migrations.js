#!/usr/bin/env node

/**
 * Field Services Database Migration Runner
 *
 * Executes field services migrations in the correct order against the production database.
 *
 * Migrations to run:
 * 1. 20251110000002_field_services_phase4.sql - Route Optimization & Mobile
 * 2. 20251110000003_field_services_phase5.sql - Advanced Features
 * 3. 20251110000004_field_services_phase6_analytics.sql - Analytics & Reporting
 * 4. 20251110000005_field_services_phase7_integrations.sql - Third-party Integrations
 * 5. 20251110000006_field_services_phase8_advanced.sql - Advanced Capabilities
 * 6. 20251110000007_security_and_performance_patches.sql - Security & Performance
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const MIGRATIONS = [
  '20251110000000_field_services_phase1.sql',
  '20251110000001_field_services_phase2.sql',
  '20251110000002_field_services_phase4.sql',
  '20251110000003_field_services_phase5.sql',
  '20251110000004_field_services_phase6_analytics.sql',
  '20251110000005_field_services_phase7_integrations.sql',
  '20251110000006_field_services_phase8_advanced.sql',
  '20251110000007_security_and_performance_patches.sql',
];

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

async function checkIfMigrationApplied(client, filename) {
  try {
    // Extract version from filename (first part before underscore)
    const version = filename.replace('.sql', '');

    const result = await client.query(
      `SELECT EXISTS(
        SELECT 1 FROM supabase_migrations.schema_migrations
        WHERE version = $1
      )`,
      [version]
    );

    return result.rows[0].exists;
  } catch (error) {
    // If the table doesn't exist or query fails, assume not applied
    return false;
  }
}

async function recordMigration(client, filename) {
  try {
    const version = filename.replace('.sql', '');

    await client.query(
      `INSERT INTO supabase_migrations.schema_migrations (version, name)
       VALUES ($1, $2)
       ON CONFLICT (version) DO NOTHING`,
      [version, filename]
    );
  } catch (error) {
    console.warn(`Warning: Could not record migration in schema_migrations: ${error.message}`);
  }
}

async function runMigration(client, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Checking migration: ${filename}`);

  // Check if already applied
  const isApplied = await checkIfMigrationApplied(client, filename);

  if (isApplied) {
    console.log(`⏭️  SKIPPED: ${filename} (already applied)`);
    console.log(`${'='.repeat(70)}\n`);
    return { filename, success: true, skipped: true, error: null };
  }

  console.log(`Running migration: ${filename}`);
  console.log(`${'='.repeat(70)}\n`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    // Execute the migration
    await client.query(sql);

    // Record the migration
    await recordMigration(client, filename);

    console.log(`✅ SUCCESS: ${filename}`);
    return { filename, success: true, skipped: false, error: null };
  } catch (error) {
    console.error(`❌ FAILED: ${filename}`);
    console.error(`Error: ${error.message}`);
    return { filename, success: false, skipped: false, error: error.message };
  }
}

async function verifyMigrations(client) {
  console.log(`\n${'='.repeat(70)}`);
  console.log('Verifying migrations...');
  console.log(`${'='.repeat(70)}\n`);

  const queries = [
    {
      name: 'Check skill_types table (Phase 1)',
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'skill_types'
      );`
    },
    {
      name: 'Check service_territories table (Phase 1)',
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'service_territories'
      );`
    },
    {
      name: 'Check bookable_resources table (Phase 1)',
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'bookable_resources'
      );`
    },
    {
      name: 'Check bookings table (Phase 2)',
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
      );`
    },
    {
      name: 'Check mileage_logs table (Phase 4)',
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'mileage_logs'
      );`
    },
    {
      name: 'Check route_plans table (Phase 4)',
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'route_plans'
      );`
    },
    {
      name: 'Check service_contracts table (Phase 5)',
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'service_contracts'
      );`
    },
    {
      name: 'Check work_order_analytics table (Phase 6)',
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'work_order_analytics'
      );`
    },
    {
      name: 'Check integration_configs table (Phase 7)',
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'integration_configs'
      );`
    },
  ];

  const results = [];
  for (const query of queries) {
    try {
      const result = await client.query(query.sql);
      const exists = result.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} ${query.name}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
      results.push({ name: query.name, exists });
    } catch (error) {
      console.log(`❌ ${query.name}: ERROR - ${error.message}`);
      results.push({ name: query.name, exists: false, error: error.message });
    }
  }

  return results;
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║     Field Services Database Migration Runner                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Check for database URL (prefer pooler for better connectivity)
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ ERROR: Database URL not found in environment variables');
    console.error('Please ensure DIRECT_DATABASE_URL or DATABASE_URL is set in .env.local');
    process.exit(1);
  }

  console.log(`Database: ${databaseUrl.replace(/:[^:]*@/, ':****@')}\n`);

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    // Connect to database
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Run migrations
    const results = [];
    for (const migration of MIGRATIONS) {
      const result = await runMigration(client, migration);
      results.push(result);

      // Stop on first error
      if (!result.success) {
        console.error(`\n❌ Migration failed: ${migration}`);
        console.error(`Error: ${result.error}`);
        console.error('\nStopping migration process.\n');
        break;
      }
    }

    // Verify migrations
    console.log('\n');
    const verificationResults = await verifyMigrations(client);

    // Summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('Migration Summary');
    console.log(`${'='.repeat(70)}\n`);

    const successful = results.filter(r => r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Total migrations: ${MIGRATIONS.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}\n`);

    if (failed > 0) {
      console.log('Failed migrations:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.filename}: ${r.error}`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.\n');
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
