/**
 * Test the complete email-to-card flow after the fix
 * Simulates what happens when an email is processed
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
  console.log('Testing Email-to-Card Flow After Fix');
  console.log('='.repeat(80));

  const orgId = 'bde00714-427d-4024-9fbd-6f895824f733'; // Real org ID from processed messages
  const testEmail = {
    id: 'test-' + Date.now(),
    from: {
      email: 'testuser@example.com',
      name: 'Test User'
    },
    subject: 'Test Email for Card Creation',
    snippet: 'This is a test email to verify card creation works',
  };

  console.log('\n1. TESTING CONTACT CREATION');
  console.log('-'.repeat(80));

  // Test: Can we create a contact with org_id?
  console.log('Attempting to create contact with org_id...');

  const { data: newContact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      org_id: orgId,
      email: testEmail.from.email,
      first_name: testEmail.from.name,
      last_name: '',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (contactError) {
    console.error('✗ Contact creation FAILED:', {
      message: contactError.message,
      code: contactError.code,
      details: contactError.details,
      hint: contactError.hint,
    });
    return;
  }

  console.log('✓ Contact created successfully:', {
    id: newContact.id,
    email: newContact.email,
    org_id: newContact.org_id,
  });

  console.log('\n2. TESTING CARD CREATION');
  console.log('-'.repeat(80));

  // Test: Can we create a card?
  console.log('Attempting to create card...');

  const { data: newCard, error: cardError } = await supabase
    .from('kanban_cards')
    .insert({
      org_id: orgId,
      contact_id: newContact.id,
      client_id: null,
      gmail_message_id: testEmail.id,
      gmail_thread_id: testEmail.id,
      email_category: 'ESCALATE',
      type: 'create_task',
      title: `Test: ${testEmail.subject}`,
      description: `Email from: ${testEmail.from.email}\\nSubject: ${testEmail.subject}\\n\\n${testEmail.snippet}`,
      rationale: 'Test card creation after fix',
      priority: 'medium',
      state: 'suggested',
      action_payload: {
        test: true,
        emailId: testEmail.id,
      },
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (cardError) {
    console.error('✗ Card creation FAILED:', {
      message: cardError.message,
      code: cardError.code,
      details: cardError.details,
      hint: cardError.hint,
    });

    // Clean up contact
    await supabase.from('contacts').delete().eq('id', newContact.id);
    return;
  }

  console.log('✓ Card created successfully:', {
    id: newCard.id,
    title: newCard.title,
    type: newCard.type,
    state: newCard.state,
  });

  console.log('\n3. TESTING GMAIL_MESSAGE TABLE UPDATE');
  console.log('-'.repeat(80));

  // Create a test gmail_message record
  console.log('Creating test gmail_message record...');

  const { data: gmailMessage, error: gmailError } = await supabase
    .from('gmail_messages')
    .insert({
      org_id: orgId,
      gmail_message_id: testEmail.id,
      gmail_thread_id: testEmail.id,
      from_email: testEmail.from.email,
      from_name: testEmail.from.name,
      to_email: ['test@example.com'],
      subject: testEmail.subject,
      body_text: testEmail.snippet,
      snippet: testEmail.snippet,
      labels: [],
      has_attachments: false,
      attachment_count: 0,
      attachments: [],
      received_at: new Date().toISOString(),
      category: 'ESCALATE',
      confidence: 0.5,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (gmailError) {
    console.error('✗ Gmail message creation FAILED:', gmailError);

    // Clean up
    await supabase.from('kanban_cards').delete().eq('id', newCard.id);
    await supabase.from('contacts').delete().eq('id', newContact.id);
    return;
  }

  console.log('✓ Gmail message created:', gmailMessage.id);

  // Test: Can we update gmail_message with card_id?
  console.log('\\nAttempting to link card to gmail_message...');

  const { data: updateData, error: updateError } = await supabase
    .from('gmail_messages')
    .update({ card_id: newCard.id })
    .eq('gmail_message_id', testEmail.id)
    .select();

  if (updateError) {
    console.error('✗ Gmail message update FAILED:', {
      message: updateError.message,
      code: updateError.code,
      details: updateError.details,
      hint: updateError.hint,
    });

    // Clean up
    await supabase.from('gmail_messages').delete().eq('id', gmailMessage.id);
    await supabase.from('kanban_cards').delete().eq('id', newCard.id);
    await supabase.from('contacts').delete().eq('id', newContact.id);
    return;
  }

  console.log('✓ Gmail message updated with card_id:', updateData[0].card_id);

  console.log('\n4. VERIFICATION');
  console.log('-'.repeat(80));

  // Verify the full relationship
  const { data: verifyMessage } = await supabase
    .from('gmail_messages')
    .select(`
      id,
      subject,
      card_id,
      kanban_cards (
        id,
        title,
        state,
        contact_id
      )
    `)
    .eq('id', gmailMessage.id)
    .single();

  console.log('Final state:');
  console.log(JSON.stringify(verifyMessage, null, 2));

  console.log('\n5. CLEANUP');
  console.log('-'.repeat(80));

  // Clean up test data
  console.log('Removing test data...');

  await supabase.from('gmail_messages').delete().eq('id', gmailMessage.id);
  console.log('  ✓ Deleted gmail_message');

  await supabase.from('kanban_cards').delete().eq('id', newCard.id);
  console.log('  ✓ Deleted kanban_card');

  await supabase.from('contacts').delete().eq('id', newContact.id);
  console.log('  ✓ Deleted contact');

  console.log('\n' + '='.repeat(80));
  console.log('✓ ALL TESTS PASSED - Email-to-Card flow is working!');
  console.log('='.repeat(80));
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
