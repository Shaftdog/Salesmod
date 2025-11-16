/**
 * Backfill cards for emails that were processed but didn't get cards
 * This fixes the 3 emails that were processed before the schema fix
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

async function createCardForMessage(message: any) {
  console.log(`\\nProcessing: ${message.subject}`);
  console.log('  From: ' + message.from_email);
  console.log('  Category: ' + message.category);

  const orgId = message.org_id;

  // Find or create contact
  let contactId: string;

  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', message.from_email)
    .single();

  if (existingContact) {
    contactId = existingContact.id;
    console.log('  ✓ Found existing contact');
  } else {
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        org_id: orgId,
        email: message.from_email,
        first_name: message.from_name || message.from_email,
        last_name: '',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (contactError) {
      console.error('  ✗ Contact creation failed:', contactError.message);
      throw contactError;
    }

    contactId = newContact.id;
    console.log('  ✓ Created new contact');
  }

  // Determine card type based on category
  const cardType = message.category === 'ESCALATE' ? 'create_task' : 'send_email';

  // Create card
  const { data: card, error: cardError } = await supabase
    .from('kanban_cards')
    .insert({
      org_id: orgId,
      contact_id: contactId,
      client_id: null,
      gmail_message_id: message.gmail_message_id,
      gmail_thread_id: message.gmail_thread_id,
      email_category: message.category,
      type: cardType,
      title: `${message.category}: ${message.subject}`,
      description: `Email from: ${message.from_name || message.from_email}\\nSubject: ${message.subject}\\n\\n${message.snippet || ''}`,
      rationale: `Email classified as ${message.category} with confidence ${message.confidence}. Needs review.`,
      priority: 'medium',
      state: 'in_review',
      action_payload: {
        emailId: message.gmail_message_id,
        threadId: message.gmail_thread_id,
        backfilled: true,
        backfillDate: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (cardError) {
    console.error('  ✗ Card creation failed:', cardError.message);
    throw cardError;
  }

  console.log('  ✓ Card created:', card.id);

  // Update gmail_message with card_id
  const { error: updateError } = await supabase
    .from('gmail_messages')
    .update({ card_id: card.id })
    .eq('id', message.id);

  if (updateError) {
    console.error('  ⚠ Warning: Failed to update gmail_message:', updateError.message);
  } else {
    console.log('  ✓ Gmail message linked to card');
  }

  return {
    messageId: message.id,
    contactId,
    cardId: card.id,
    success: true,
  };
}

async function main() {
  console.log('Backfilling Missing Cards');
  console.log('='.repeat(80));

  // Find messages that were processed but don't have cards
  const { data: messages, error } = await supabase
    .from('gmail_messages')
    .select('*')
    .not('processed_at', 'is', null)
    .is('card_id', null)
    .order('processed_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
    return;
  }

  console.log(`\\nFound ${messages?.length || 0} messages without cards`);

  if (!messages || messages.length === 0) {
    console.log('\\n✓ No backfill needed - all processed messages have cards');
    return;
  }

  console.log('\\nBackfilling cards...');
  console.log('='.repeat(80));

  const results = [];

  for (const message of messages) {
    try {
      const result = await createCardForMessage(message);
      results.push(result);
    } catch (error: any) {
      console.error(`\\n✗ Failed to process message ${message.id}:`, error.message);
      results.push({
        messageId: message.id,
        success: false,
        error: error.message,
      });
    }
  }

  console.log('\\n' + '='.repeat(80));
  console.log('BACKFILL SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\\nTotal messages: ${messages.length}`);
  console.log(`Successfully backfilled: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (successful === messages.length) {
    console.log('\\n✓ ALL MESSAGES BACKFILLED SUCCESSFULLY!');
  }

  // Verify final state
  console.log('\\nVerifying final state...');

  const { data: remaining } = await supabase
    .from('gmail_messages')
    .select('id')
    .not('processed_at', 'is', null)
    .is('card_id', null);

  console.log(`Messages still without cards: ${remaining?.length || 0}`);

  if (remaining && remaining.length === 0) {
    console.log('\\n✓ All processed messages now have cards!');
  }
}

main().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
