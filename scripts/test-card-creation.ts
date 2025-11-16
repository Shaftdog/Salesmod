/**
 * Test script to debug card creation from Gmail messages
 * Run with: npx tsx scripts/test-card-creation.ts
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
  console.log('Testing Card Creation from Gmail Messages');
  console.log('='.repeat(60));

  // Get a processed message without a card
  const { data: messages, error: msgError } = await supabase
    .from('gmail_messages')
    .select('*')
    .is('card_id', null)
    .not('processed_at', 'is', null)
    .limit(1);

  if (msgError) {
    console.error('Error fetching messages:', msgError);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log('No processed messages without cards found');
    return;
  }

  const message = messages[0];
  console.log('\nFound message:', {
    id: message.id,
    gmail_message_id: message.gmail_message_id,
    subject: message.subject,
    from: message.from_email,
    category: message.category,
    confidence: message.confidence,
    processed_at: message.processed_at,
    card_id: message.card_id,
  });

  // Try to find if a card exists for this message
  console.log('\nSearching for cards...');

  // Search by Gmail API ID
  const { data: cardsByGmailId } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('gmail_message_id', message.gmail_message_id);

  console.log(`Cards with gmail_message_id = ${message.gmail_message_id}:`);
  console.log(`  Found: ${cardsByGmailId?.length || 0} cards`);

  if (cardsByGmailId && cardsByGmailId.length > 0) {
    cardsByGmailId.forEach(card => {
      console.log(`  - Card ID: ${card.id}`);
      console.log(`    Title: ${card.title}`);
      console.log(`    State: ${card.state}`);
      console.log(`    Type: ${card.type}`);

      // Try to update the gmail_message with this card_id
      console.log(`\n  Attempting to link card ${card.id} to gmail_message ${message.id}...`);

      const updateResult = supabase
        .from('gmail_messages')
        .update({ card_id: card.id })
        .eq('id', message.id);

      updateResult.then(({ data, error }) => {
        if (error) {
          console.error('  ERROR updating gmail_message:', error);
        } else {
          console.log('  SUCCESS: gmail_message updated');
        }
      });
    });
  }

  // Search by thread ID
  const { data: cardsByThreadId } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('gmail_thread_id', message.gmail_thread_id);

  console.log(`\nCards with gmail_thread_id = ${message.gmail_thread_id}:`);
  console.log(`  Found: ${cardsByThreadId?.length || 0} cards`);

  // Check if contact exists
  console.log('\nChecking contact...');
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('email', message.from_email)
    .eq('org_id', message.org_id);

  console.log(`Contacts with email ${message.from_email}:`);
  console.log(`  Found: ${contacts?.length || 0} contacts`);

  if (contacts && contacts.length > 0) {
    contacts.forEach(contact => {
      console.log(`  - Contact ID: ${contact.id}`);
      console.log(`    Name: ${contact.name}`);
      console.log(`    Client ID: ${contact.client_id}`);
    });
  }

  // Try to manually create a card
  console.log('\nAttempting manual card creation...');

  const contactId = contacts && contacts.length > 0 ? contacts[0].id : null;

  if (!contactId) {
    console.log('ERROR: No contact found, cannot create card');
    return;
  }

  const cardData = {
    org_id: message.org_id,
    contact_id: contactId,
    client_id: null,
    gmail_message_id: message.gmail_message_id,
    gmail_thread_id: message.gmail_thread_id,
    email_category: message.category,
    type: 'create_task',
    title: `Test: ${message.subject}`,
    description: `Test card from message ${message.gmail_message_id}`,
    rationale: 'Manual test card',
    priority: 'medium',
    state: 'suggested',
    action_payload: {
      test: true,
      emailId: message.gmail_message_id,
    },
  };

  console.log('Card data:', cardData);

  const { data: newCard, error: cardError } = await supabase
    .from('kanban_cards')
    .insert(cardData)
    .select()
    .single();

  if (cardError) {
    console.error('\nERROR creating card:', {
      message: cardError.message,
      code: cardError.code,
      details: cardError.details,
      hint: cardError.hint,
    });
  } else {
    console.log('\nSUCCESS: Card created:', {
      id: newCard.id,
      title: newCard.title,
      state: newCard.state,
      type: newCard.type,
    });

    // Try to update gmail_message with card_id
    console.log('\nUpdating gmail_message with card_id...');

    const { data: updateData, error: updateError } = await supabase
      .from('gmail_messages')
      .update({ card_id: newCard.id })
      .eq('gmail_message_id', message.gmail_message_id)
      .select();

    if (updateError) {
      console.error('ERROR updating gmail_message:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      });
    } else {
      console.log('SUCCESS: gmail_message updated:', updateData);
    }
  }
}

main().catch(console.error);
