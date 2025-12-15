#!/usr/bin/env node

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Check bookable_resources columns
    console.log('=== bookable_resources columns ===\n');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookable_resources'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    columns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Check profiles columns
    console.log('\n=== profiles columns ===\n');
    const profileColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    profileColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Check if organizations table exists
    console.log('\n=== organizations table check ===\n');
    const orgTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'organizations'
      );
    `);

    console.log(`  Organizations table exists: ${orgTableExists.rows[0].exists}`);

    if (orgTableExists.rows[0].exists) {
      const orgColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      console.log('\n=== organizations columns ===\n');
      orgColumns.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

    // Check audit_logs table if it exists
    console.log('\n=== audit_logs table check ===\n');
    const auditExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
      );
    `);

    console.log(`  Audit logs table exists: ${auditExists.rows[0].exists}`);

    if (auditExists.rows[0].exists) {
      const auditColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'audit_logs'
        AND table_schema = 'public'
        ORDER BY ordinal_position LIMIT 10;
      `);

      console.log('\n=== audit_logs columns (first 10) ===\n');
      auditColumns.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
