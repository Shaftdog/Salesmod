#!/usr/bin/env node

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function showColumns(client, tableName) {
  const exists = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    );
  `, [tableName]);

  if (!exists.rows[0].exists) {
    console.log(`  ❌ Table ${tableName} does not exist\n`);
    return;
  }

  const columns = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = $1
    AND table_schema = 'public'
    ORDER BY ordinal_position;
  `, [tableName]);

  console.log(`  ✅ ${tableName} columns:\n`);
  columns.rows.forEach(row => {
    console.log(`    ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
  });
  console.log();
}

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    const tables = [
      'skill_types',
      'service_territories',
      'bookings',
      'mileage_logs',
      'gps_tracking',
      'customer_portal_access',
      'notifications',
      'webhooks'
    ];

    for (const table of tables) {
      await showColumns(client, table);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
