/**
 * Comprehensive diagnosis of Gmail sync issue
 * Run with: npx tsx scripts/diagnose-gmail-sync.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Gmail Sync Diagnosis');
  console.log('='.repeat(80));

  // 1. Check gmail_messages
  console.log('\n1. GMAIL MESSAGES STATUS');
  console.log('-'.repeat(80));

  const { data: messages, error: msgError } = await supabase
    .from('gmail_messages')
    .select('*')
    .order('processed_at', { ascending: false, nullsFirst: false })
    .limit(5);

  if (msgError) {
    console.error('Error:', msgError);
    return;
  }

  console.log(`Total messages checked: ${messages?.length || 0}\n`);

  messages?.forEach((msg, i) => {
    console.log(`Message ${i + 1}:`);
    console.log(`  DB ID: ${msg.id}`);
    console.log(`  Gmail Message ID: ${msg.gmail_message_id}`);
    console.log(`  Subject: ${msg.subject}`);
    console.log(`  From: ${msg.from_email}`);
    console.log(`  Org ID: ${msg.org_id}`);
    console.log(`  Category: ${msg.category}`);
    console.log(`  Confidence: ${msg.confidence}`);
    console.log(`  Processed At: ${msg.processed_at}`);
    console.log(`  Card ID: ${msg.card_id}`);
    console.log(`  Contact ID: ${msg.contact_id}`);
    console.log('');
  });

  // 2. Check contacts for these emails
  console.log('\n2. CONTACTS STATUS');
  console.log('-'.repeat(80));

  const emailAddresses = messages?.map(m => m.from_email).filter(Boolean) || [];

  if (emailAddresses.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .in('email', emailAddresses);

    console.log(`Contacts found: ${contacts?.length || 0}\n`);

    contacts?.forEach(contact => {
      console.log(`Contact:`);
      console.log(`  ID: ${contact.id}`);
      console.log(`  Email: ${contact.email}`);
      console.log(`  Name: ${contact.name}`);
      console.log(`  Org ID: ${contact.org_id}`);
      console.log(`  Client ID: ${contact.client_id}`);
      console.log('');
    });

    // Check if org_ids match
    const orgIds = new Set(messages?.map(m => m.org_id));
    const contactOrgIds = new Set(contacts?.map(c => c.org_id));

    console.log('Org ID Analysis:');
    console.log(`  Message org_ids: ${Array.from(orgIds).join(', ')}`);
    console.log(`  Contact org_ids: ${Array.from(contactOrgIds).join(', ')}`);
    console.log(`  Match: ${orgIds.size === 1 && contactOrgIds.size === 1 && Array.from(orgIds)[0] === Array.from(contactOrgIds)[0]}`);
    console.log('');
  }

  // 3. Check kanban_cards
  console.log('\n3. KANBAN CARDS STATUS');
  console.log('-'.repeat(80));

  const gmailMessageIds = messages?.map(m => m.gmail_message_id).filter(Boolean) || [];

  if (gmailMessageIds.length > 0) {
    const { data: cards } = await supabase
      .from('kanban_cards')
      .select('*')
      .in('gmail_message_id', gmailMessageIds);

    console.log(`Cards found: ${cards?.length || 0}\n`);

    cards?.forEach(card => {
      console.log(`Card:`);
      console.log(`  ID: ${card.id}`);
      console.log(`  Gmail Message ID: ${card.gmail_message_id}`);
      console.log(`  Title: ${card.title}`);
      console.log(`  Type: ${card.type}`);
      console.log(`  State: ${card.state}`);
      console.log(`  Org ID: ${card.org_id}`);
      console.log(`  Contact ID: ${card.contact_id}`);
      console.log('');
    });
  }

  // 4. Check sync state
  console.log('\n4. SYNC STATE');
  console.log('-'.repeat(80));

  const { data: syncStates } = await supabase
    .from('gmail_sync_state')
    .select('*');

  syncStates?.forEach(state => {
    console.log(`Org: ${state.org_id}`);
    console.log(`  Enabled: ${state.is_enabled}`);
    console.log(`  Auto-process: ${state.auto_process}`);
    console.log(`  Last sync: ${state.last_sync_at}`);
    console.log(`  Total synced: ${state.total_messages_synced}`);
    console.log('');
  });

  // 5. Diagnosis
  console.log('\n5. DIAGNOSIS');
  console.log('-'.repeat(80));

  const processedMessages = messages?.filter(m => m.processed_at) || [];
  const messagesWithCards = messages?.filter(m => m.card_id) || [];
  const messagesWithContacts = messages?.filter(m => m.contact_id) || [];

  console.log(`Total processed messages: ${processedMessages.length}`);
  console.log(`Messages with card_id: ${messagesWithCards.length}`);
  console.log(`Messages with contact_id: ${messagesWithContacts.length}`);
  console.log('');

  if (processedMessages.length > 0 && messagesWithCards.length === 0) {
    console.log('ISSUE CONFIRMED: Messages processed but no cards created');
    console.log('');

    if (messagesWithContacts.length === 0) {
      console.log('ROOT CAUSE: Contact creation is failing');
      console.log('  - Contacts are NOT being created from emails');
      console.log('  - This suggests findOrCreateContact() is throwing an error');
      console.log('  - Error is likely being caught and logged, but not propagated');
    } else {
      console.log('Contacts ARE being created');
      console.log('  - Issue is in card creation or card_id update');
    }

    // Check if auto_process is enabled
    const autoProcessEnabled = syncStates?.some(s => s.auto_process) || false;
    if (!autoProcessEnabled) {
      console.log('');
      console.log('NOTE: auto_process is DISABLED');
      console.log('  - This would prevent card creation');
      console.log('  - But messages should still have contact_id set');
    }
  }

  // 6. Check RLS policies
  console.log('\n6. RLS POLICY CHECK');
  console.log('-'.repeat(80));

  const orgId = messages && messages.length > 0 ? messages[0].org_id : null;

  if (orgId) {
    console.log(`Testing with org_id: ${orgId}`);

    // Try to query as service role (bypasses RLS)
    const { data: serviceRoleData } = await supabase
      .from('gmail_messages')
      .select('id')
      .eq('org_id', orgId)
      .limit(1);

    console.log(`Service role query: ${serviceRoleData?.length || 0} results (RLS bypassed)`);
  }
}

main().catch(console.error);
