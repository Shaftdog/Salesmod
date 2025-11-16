/**
 * Debug why cards were not created from Gmail sync
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('='.repeat(60));
  console.log('DEBUG: Why Cards Were Not Created');
  console.log('='.repeat(60));
  console.log();

  // 1. Get the 3 processed messages
  const { data: messages } = await supabase
    .from('gmail_messages')
    .select('*')
    .order('processed_at', { ascending: false })
    .limit(5);

  console.log('PROCESSED MESSAGES:');
  console.log('-'.repeat(60));
  messages.forEach(msg => {
    console.log(`Subject: ${msg.subject}`);
    console.log(`  From: ${msg.from_email}`);
    console.log(`  Category: ${msg.category}`);
    console.log(`  Confidence: ${msg.confidence}`);
    console.log(`  Processed: ${msg.processed_at}`);
    console.log(`  Card ID in gmail_messages.card_id: ${msg.card_id}`);
    console.log(`  Gmail Message ID: ${msg.gmail_message_id}`);
    console.log(`  DB Record ID: ${msg.id}`);
    console.log();
  });

  // 2. Try to find any cards that might match these messages
  console.log('\nSEARCHING FOR MATCHING CARDS:');
  console.log('-'.repeat(60));

  for (const msg of messages) {
    // The gmail-poller uses email.id (which is the Gmail API message ID)
    // as the gmail_message_id in the kanban_cards table
    // But createCardFromEmail is passed gmailMessage.id (the DB record ID)

    console.log(`\nMessage: ${msg.subject}`);
    console.log(`  Gmail API ID: ${msg.gmail_message_id}`);
    console.log(`  DB Record ID: ${msg.id}`);

    // Search by Gmail API ID (what the code SHOULD be using)
    const { data: cardsByApiId } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('gmail_message_id', msg.gmail_message_id);

    console.log(`  Cards with gmail_message_id = Gmail API ID (${msg.gmail_message_id}):`);
    console.log(`    Found: ${cardsByApiId?.length || 0} cards`);

    // Search by DB Record ID (what the code MIGHT be using due to bug)
    const { data: cardsByDbId } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('gmail_message_id', msg.id);

    console.log(`  Cards with gmail_message_id = DB Record ID (${msg.id}):`);
    console.log(`    Found: ${cardsByDbId?.length || 0} cards`);

    if (cardsByApiId && cardsByApiId.length > 0) {
      cardsByApiId.forEach(card => {
        console.log(`      - ${card.title} (State: ${card.state})`);
      });
    }

    if (cardsByDbId && cardsByDbId.length > 0) {
      cardsByDbId.forEach(card => {
        console.log(`      - ${card.title} (State: ${card.state})`);
      });
    }
  }

  // 3. Check auto_process setting
  console.log('\n\nSYNC CONFIGURATION:');
  console.log('-'.repeat(60));

  const { data: syncStates } = await supabase
    .from('gmail_sync_state')
    .select('*');

  syncStates.forEach(state => {
    console.log(`Org ID: ${state.org_id}`);
    console.log(`  Auto-process enabled: ${state.auto_process}`);
    console.log(`  Sync enabled: ${state.is_enabled}`);
    console.log(`  Last sync: ${state.last_sync_at}`);
    console.log();
  });

  // 4. Check for contacts that might have been created
  console.log('\nCONTACTS CREATED FROM EMAILS:');
  console.log('-'.repeat(60));

  const emailAddresses = messages.map(m => m.from_email).filter(Boolean);
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .in('email', emailAddresses);

  if (contacts && contacts.length > 0) {
    contacts.forEach(contact => {
      console.log(`Email: ${contact.email}`);
      console.log(`  Contact ID: ${contact.id}`);
      console.log(`  Name: ${contact.name}`);
      console.log(`  Client ID: ${contact.client_id}`);
      console.log(`  Org ID: ${contact.org_id}`);
      console.log();
    });
  } else {
    console.log('No contacts found for these email addresses');
  }

  // 5. Check schema of gmail_messages table
  console.log('\nCODE ANALYSIS:');
  console.log('-'.repeat(60));
  console.log('Looking at gmail-poller.ts line 280-285:');
  console.log('  const cardResult = await createCardFromEmail(');
  console.log('    orgId,');
  console.log('    message,           // This is the GmailMessage object');
  console.log('    classification,');
  console.log('    gmailMessage.id    // This is the DB record ID from line 199');
  console.log('  );');
  console.log();
  console.log('Looking at email-to-card.ts line 55:');
  console.log('  gmail_message_id: email.id,  // email.id is message.id from Gmail API');
  console.log();
  console.log('POTENTIAL BUG IDENTIFIED:');
  console.log('  - createCardFromEmail receives gmailMessage.id (DB record UUID)');
  console.log('  - But it uses email.id (Gmail API message ID) in the insert');
  console.log('  - The gmailMessageId parameter is never used in the card insert!');
  console.log();

  // 6. Final diagnosis
  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSIS:');
  console.log('='.repeat(60));
  console.log();

  if (!messages || messages.length === 0) {
    console.log('No processed messages found - sync may not have run');
  } else {
    const hasCardIds = messages.filter(m => m.card_id);
    console.log(`Total messages processed: ${messages.length}`);
    console.log(`Messages with card_id set: ${hasCardIds.length}`);
    console.log();

    if (hasCardIds.length === 0) {
      console.log('ISSUE: No messages have card_id set');
      console.log('This means createCardFromEmail either:');
      console.log('  1. Was not called');
      console.log('  2. Failed with an error');
      console.log('  3. Succeeded but the card_id update failed');
      console.log();
      console.log('RECOMMENDATION:');
      console.log('  Check server logs for errors during Gmail sync');
      console.log('  Look for errors from createCardFromEmail or card insertion');
    }
  }
}

main().catch(console.error);
