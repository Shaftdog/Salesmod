/**
 * Backfill contacts for email-created cards
 *
 * This script:
 * 1. Finds kanban_cards created from emails (have gmail_message_id)
 * 2. Looks up the sender email from gmail_messages
 * 3. Creates contacts if they don't exist
 * 4. Updates cards with contact_id
 * 5. Updates activities with contact_id
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseFullName(fullName, fallbackEmail) {
  if (!fullName || !fullName.trim()) {
    const emailUsername = fallbackEmail.split('@')[0];
    return { firstName: emailUsername, lastName: '' };
  }

  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
}

async function backfillContacts() {
  console.log('Starting contact backfill for email-created cards...\n');

  // Get all cards with gmail_message_id
  const { data: cards, error: cardsError } = await supabase
    .from('kanban_cards')
    .select('id, tenant_id, org_id, gmail_message_id, contact_id, client_id')
    .not('gmail_message_id', 'is', null);

  if (cardsError) {
    console.error('Error fetching cards:', cardsError);
    return;
  }

  console.log(`Found ${cards.length} cards created from emails\n`);

  let contactsCreated = 0;
  let cardsUpdated = 0;
  let activitiesUpdated = 0;
  let skipped = 0;

  for (const card of cards) {
    // Get the gmail message to find sender info
    const { data: message, error: msgError } = await supabase
      .from('gmail_messages')
      .select('from_email, from_name, subject, received_at')
      .eq('gmail_message_id', card.gmail_message_id)
      .single();

    if (msgError || !message) {
      console.log(`  Skipping card ${card.id} - no gmail message found`);
      skipped++;
      continue;
    }

    const fromEmail = message.from_email;
    const fromName = message.from_name;

    console.log(`Processing: ${fromEmail} (${fromName || 'no name'})`);

    // Check if contact already exists for this email
    let { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('tenant_id', card.tenant_id)
      .eq('email', fromEmail)
      .single();

    let contactId = existingContact?.id;

    // Create contact if doesn't exist
    if (!contactId) {
      const { firstName, lastName } = parseFullName(fromName, fromEmail);

      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          tenant_id: card.tenant_id,
          org_id: card.org_id,
          email: fromEmail,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) {
        console.error(`  Error creating contact for ${fromEmail}:`, createError.message);
        continue;
      }

      contactId = newContact.id;
      contactsCreated++;
      console.log(`  Created contact: ${firstName} ${lastName} <${fromEmail}>`);
    } else {
      console.log(`  Found existing contact: ${contactId}`);
    }

    // Update card with contact_id if not set
    if (!card.contact_id && contactId) {
      const { error: updateError } = await supabase
        .from('kanban_cards')
        .update({ contact_id: contactId })
        .eq('id', card.id);

      if (updateError) {
        console.error(`  Error updating card ${card.id}:`, updateError.message);
      } else {
        cardsUpdated++;
        console.log(`  Updated card with contact_id`);
      }
    }

    // Find and update activities for this email
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('id, contact_id')
      .eq('tenant_id', card.tenant_id)
      .ilike('subject', `%${message.subject}%`)
      .is('contact_id', null);

    if (!actError && activities && activities.length > 0) {
      for (const activity of activities) {
        const { error: actUpdateError } = await supabase
          .from('activities')
          .update({ contact_id: contactId })
          .eq('id', activity.id);

        if (!actUpdateError) {
          activitiesUpdated++;
          console.log(`  Updated activity ${activity.id} with contact_id`);
        }
      }
    }

    console.log('');
  }

  console.log('\n========================================');
  console.log('Backfill Complete!');
  console.log('========================================');
  console.log(`Contacts created: ${contactsCreated}`);
  console.log(`Cards updated: ${cardsUpdated}`);
  console.log(`Activities updated: ${activitiesUpdated}`);
  console.log(`Skipped (no message): ${skipped}`);
}

backfillContacts().catch(console.error);
