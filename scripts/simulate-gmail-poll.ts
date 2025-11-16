/**
 * Simulate a full Gmail poll cycle to test the fix
 * This mimics what happens when pollGmailInbox() processes an email
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

async function simulateEmailProcessing(orgId: string, email: any) {
  console.log(`\\nProcessing email: ${email.subject}`);
  console.log('='.repeat(80));

  // Step 1: Store Gmail message (like gmail-poller.ts line 227-251)
  console.log('1. Storing Gmail message...');

  const { data: gmailMessage, error: insertError } = await supabase
    .from('gmail_messages')
    .insert({
      org_id: orgId,
      gmail_message_id: email.id,
      gmail_thread_id: email.threadId,
      from_email: email.from.email,
      from_name: email.from.name,
      to_email: [email.to],
      subject: email.subject,
      body_text: email.bodyText,
      snippet: email.snippet,
      labels: [],
      has_attachments: false,
      attachment_count: 0,
      attachments: [],
      received_at: email.receivedAt,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('   ✗ FAILED:', insertError.message);
    throw insertError;
  }

  console.log('   ✓ Gmail message stored:', gmailMessage.id);

  // Step 2: Classify (simulated)
  const classification = {
    category: email.category,
    confidence: email.confidence,
    intent: 'Test classification',
    entities: {},
    reasoning: 'Simulated classification',
    shouldEscalate: email.confidence < 0.95,
  };

  console.log('2. Email classified:', classification.category);

  // Step 3: Update message with classification (like gmail-poller.ts line 292-308)
  console.log('3. Updating message with classification...');

  await supabase
    .from('gmail_messages')
    .update({
      category: classification.category,
      confidence: classification.confidence,
      intent: {
        description: classification.intent,
        entities: classification.entities,
        reasoning: classification.reasoning,
      },
      processed_at: new Date().toISOString(),
    })
    .eq('id', gmailMessage.id);

  console.log('   ✓ Message updated');

  // Step 4: Find or create contact (like email-to-card.ts line 453-489)
  console.log('4. Finding or creating contact...');

  let contactId: string;

  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', email.from.email)
    .single();

  if (existingContact) {
    contactId = existingContact.id;
    console.log('   ✓ Found existing contact:', contactId);
  } else {
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        org_id: orgId,
        email: email.from.email,
        first_name: email.from.name || email.from.email,
        last_name: '',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (contactError) {
      console.error('   ✗ Contact creation FAILED:', contactError.message);
      throw contactError;
    }

    contactId = newContact.id;
    console.log('   ✓ Created new contact:', contactId);
  }

  // Step 5: Create card (like email-to-card.ts line 106-148)
  console.log('5. Creating kanban card...');

  const { data: card, error: cardError } = await supabase
    .from('kanban_cards')
    .insert({
      org_id: orgId,
      client_id: null,
      contact_id: contactId,
      gmail_message_id: email.id,
      gmail_thread_id: email.threadId,
      email_category: classification.category,
      type: 'create_task',
      title: `Simulated: ${email.subject}`,
      description: `Email from: ${email.from.email}\\nSubject: ${email.subject}`,
      rationale: 'Simulated card from test',
      priority: 'medium',
      state: 'suggested',
      action_payload: { test: true, emailId: email.id },
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (cardError) {
    console.error('   ✗ Card creation FAILED:', cardError.message);
    throw cardError;
  }

  console.log('   ✓ Card created:', card.id);

  // Step 6: Update gmail_message with card_id (like email-to-card.ts line 158-166)
  console.log('6. Linking card to gmail_message...');

  const { error: updateError } = await supabase
    .from('gmail_messages')
    .update({ card_id: card.id })
    .eq('gmail_message_id', email.id);

  if (updateError) {
    console.error('   ✗ Update FAILED:', updateError.message);
    // Non-fatal, continue
  } else {
    console.log('   ✓ Gmail message linked to card');
  }

  return {
    gmailMessageId: gmailMessage.id,
    contactId,
    cardId: card.id,
  };
}

async function main() {
  console.log('Gmail Poll Simulation');
  console.log('='.repeat(80));

  const orgId = 'bde00714-427d-4024-9fbd-6f895824f733';

  // Simulate processing 3 emails with different scenarios
  const testEmails = [
    {
      id: 'sim-test-' + Date.now() + '-1',
      threadId: 'thread-1',
      from: { email: 'newuser1@example.com', name: 'New User 1' },
      to: 'test@example.com',
      subject: 'New opportunity - interested in appraisal services',
      bodyText: 'I need an appraisal for a property.',
      snippet: 'I need an appraisal...',
      receivedAt: new Date().toISOString(),
      category: 'OPPORTUNITY',
      confidence: 0.98,
    },
    {
      id: 'sim-test-' + Date.now() + '-2',
      threadId: 'thread-2',
      from: { email: 'newuser2@example.com', name: 'New User 2' },
      to: 'test@example.com',
      subject: 'Status update request',
      bodyText: 'Can you provide a status update?',
      snippet: 'Can you provide...',
      receivedAt: new Date().toISOString(),
      category: 'STATUS',
      confidence: 0.97,
    },
    {
      id: 'sim-test-' + Date.now() + '-3',
      threadId: 'thread-3',
      from: { email: 'newuser3@example.com', name: 'New User 3' },
      to: 'test@example.com',
      subject: 'Unclear message',
      bodyText: 'Some unclear text',
      snippet: 'Some unclear...',
      receivedAt: new Date().toISOString(),
      category: 'ESCALATE',
      confidence: 0.5,
    },
  ];

  const results = [];

  for (const email of testEmails) {
    try {
      const result = await simulateEmailProcessing(orgId, email);
      results.push({ success: true, ...result });
    } catch (error: any) {
      console.error(`\\n✗ Failed to process email: ${error.message}`);
      results.push({ success: false, error: error.message });
    }
  }

  console.log('\\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success).length;
  console.log(`\\nProcessed: ${testEmails.length} emails`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${testEmails.length - successful}`);

  if (successful === testEmails.length) {
    console.log('\\n✓ ALL EMAILS PROCESSED SUCCESSFULLY!');

    // Verify in database
    console.log('\\nVerifying database state...');

    for (const result of results.filter(r => r.success)) {
      const { data: verifyMessage } = await supabase
        .from('gmail_messages')
        .select(`
          id,
          subject,
          category,
          confidence,
          card_id,
          contact_id
        `)
        .eq('id', (result as any).gmailMessageId)
        .single();

      const hasCard = verifyMessage?.card_id !== null;
      const hasContact = verifyMessage?.contact_id === null; // contact_id is not set on gmail_messages

      console.log(`  ${verifyMessage?.subject}: card=${hasCard ? '✓' : '✗'}`);
    }

    console.log('\\nCleaning up test data...');

    for (const result of results.filter(r => r.success)) {
      await supabase.from('gmail_messages').delete().eq('id', (result as any).gmailMessageId);
      await supabase.from('kanban_cards').delete().eq('id', (result as any).cardId);
      await supabase.from('contacts').delete().eq('id', (result as any).contactId);
    }

    console.log('✓ Cleanup complete');
  }

  console.log('\\n' + '='.repeat(80));
}

main().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
