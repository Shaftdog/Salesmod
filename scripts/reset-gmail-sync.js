#!/usr/bin/env node
/**
 * Check and reset Gmail sync state
 *
 * This script:
 * 1. Shows current gmail_sync_state (last_sync_at value)
 * 2. Resets last_sync_at to NULL so next sync fetches last 24 hours
 * 3. Shows count of gmail_messages in database
 *
 * Usage:
 *   node scripts/reset-gmail-sync.js
 */

const { Client } = require('pg');

// Load .env.local
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not set in .env.local');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Show current gmail_sync_state
    console.log('='.repeat(60));
    console.log('📊 CURRENT GMAIL SYNC STATE');
    console.log('='.repeat(60));
    console.log('');

    const syncStateResult = await client.query(`
      SELECT
        org_id,
        last_sync_at,
        last_history_id,
        total_messages_synced,
        last_message_received_at,
        is_enabled,
        poll_interval_minutes,
        auto_process,
        created_at,
        updated_at
      FROM gmail_sync_state
      ORDER BY created_at DESC
    `);

    if (syncStateResult.rows.length === 0) {
      console.log('⚠️  No gmail_sync_state records found\n');
    } else {
      console.log(`Found ${syncStateResult.rows.length} sync state record(s):\n`);

      syncStateResult.rows.forEach((row, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Org ID:                    ${row.org_id}`);
        console.log(`  Last Sync At:              ${row.last_sync_at || 'NULL (never synced)'}`);
        console.log(`  Last History ID:           ${row.last_history_id || 'NULL'}`);
        console.log(`  Total Messages Synced:     ${row.total_messages_synced}`);
        console.log(`  Last Message Received At:  ${row.last_message_received_at || 'NULL'}`);
        console.log(`  Is Enabled:                ${row.is_enabled}`);
        console.log(`  Poll Interval (minutes):   ${row.poll_interval_minutes}`);
        console.log(`  Auto Process:              ${row.auto_process}`);
        console.log(`  Created At:                ${row.created_at}`);
        console.log(`  Updated At:                ${row.updated_at}`);
        console.log('');
      });
    }

    // Step 2: Check gmail_messages count
    console.log('='.repeat(60));
    console.log('📧 GMAIL MESSAGES COUNT');
    console.log('='.repeat(60));
    console.log('');

    const messageCountResult = await client.query(`
      SELECT
        org_id,
        COUNT(*) as message_count,
        MIN(received_at) as earliest_message,
        MAX(received_at) as latest_message
      FROM gmail_messages
      GROUP BY org_id
      ORDER BY org_id
    `);

    if (messageCountResult.rows.length === 0) {
      console.log('⚠️  No gmail_messages found in database\n');
    } else {
      console.log(`Found messages for ${messageCountResult.rows.length} org(s):\n`);

      messageCountResult.rows.forEach((row, index) => {
        console.log(`Org ${index + 1}:`);
        console.log(`  Org ID:           ${row.org_id}`);
        console.log(`  Message Count:    ${row.message_count}`);
        console.log(`  Earliest Message: ${row.earliest_message}`);
        console.log(`  Latest Message:   ${row.latest_message}`);
        console.log('');
      });
    }

    // Step 3: Reset last_sync_at to NULL
    console.log('='.repeat(60));
    console.log('🔄 RESETTING SYNC STATE');
    console.log('='.repeat(60));
    console.log('');

    const resetResult = await client.query(`
      UPDATE gmail_sync_state
      SET
        last_sync_at = NULL,
        last_history_id = NULL,
        updated_at = NOW()
      RETURNING org_id, last_sync_at, last_history_id
    `);

    if (resetResult.rows.length === 0) {
      console.log('⚠️  No records updated (no gmail_sync_state exists)\n');
    } else {
      console.log(`✅ Reset ${resetResult.rows.length} sync state record(s):\n`);

      resetResult.rows.forEach((row, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Org ID:          ${row.org_id}`);
        console.log(`  Last Sync At:    ${row.last_sync_at || 'NULL (ready for fresh sync)'}`);
        console.log(`  Last History ID: ${row.last_history_id || 'NULL'}`);
        console.log('');
      });

      console.log('✅ Next Gmail sync will fetch emails from the last 24 hours\n');
    }

    console.log('='.repeat(60));
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
