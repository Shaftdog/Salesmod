#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMissingCards() {
  // Get gmail_messages without cards
  const { data: messages, error: msgErr } = await supabase
    .from('gmail_messages')
    .select('*')
    .is('card_id', null)
    .not('processed_at', 'is', null)
    .order('received_at', { ascending: false });

  if (msgErr) {
    console.error('Error fetching messages:', msgErr);
    return;
  }

  console.log('Found', messages.length, 'emails without cards\n');

  let created = 0;
  let errors = 0;

  for (const msg of messages) {
    console.log('Processing:', msg.subject);

    // Get tenant_id from the message's org
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', msg.org_id)
      .single();

    if (!profile || !profile.tenant_id) {
      console.log('  SKIP: No tenant_id for org', msg.org_id);
      continue;
    }

    // Find or get contact
    let contactId = null;
    let clientId = null;

    const { data: contact } = await supabase
      .from('contacts')
      .select('id, client_id')
      .eq('tenant_id', profile.tenant_id)
      .eq('email', msg.from_email)
      .single();

    if (contact) {
      contactId = contact.id;
      clientId = contact.client_id;
    } else {
      // Create contact - parse name into first/last
      const fullName = msg.from_name || msg.from_email;
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Contact';

      const { data: newContact, error: contactErr } = await supabase
        .from('contacts')
        .insert({
          tenant_id: profile.tenant_id,
          org_id: msg.org_id,
          email: msg.from_email,
          first_name: firstName,
          last_name: lastName
        })
        .select('id')
        .single();

      if (contactErr) {
        console.log('  ERROR creating contact:', contactErr.message);
        errors++;
        continue;
      }
      contactId = newContact.id;
    }

    // Create card
    const category = msg.category || 'ESCALATE';
    const title = 'Needs Review: ' + msg.subject;

    const { data: card, error: cardErr } = await supabase
      .from('kanban_cards')
      .insert({
        tenant_id: profile.tenant_id,
        org_id: msg.org_id,
        contact_id: contactId,
        client_id: clientId,
        gmail_message_id: msg.gmail_message_id,
        gmail_thread_id: msg.gmail_thread_id,
        email_category: category,
        type: 'create_task',
        title: title,
        description: `Email from: ${msg.from_name || msg.from_email}\nSubject: ${msg.subject}\n\n${msg.snippet || ''}`,
        rationale: `Email classified as ${category}. Created card for manual review.`,
        priority: 'medium',
        state: 'in_review',
        action_payload: {
          emailId: msg.gmail_message_id,
          threadId: msg.gmail_thread_id,
          from: { email: msg.from_email, name: msg.from_name },
          subject: msg.subject
        }
      })
      .select('id')
      .single();

    if (cardErr) {
      console.log('  ERROR creating card:', cardErr.message);
      errors++;
      continue;
    }

    // Update gmail_message with card_id
    await supabase
      .from('gmail_messages')
      .update({ card_id: card.id })
      .eq('id', msg.id);

    console.log('  ✓ Created card:', card.id);
    created++;
  }

  console.log('\n=== Summary ===');
  console.log('Cards created:', created);
  console.log('Errors:', errors);
}

createMissingCards().catch(console.error);
