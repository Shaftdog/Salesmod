/**
 * Backfill gmail_message_id on existing email activities
 *
 * This script matches activities to gmail_messages by:
 * 1. Activity subject = "Received: " + gmail_message.subject
 * 2. Same tenant_id
 * 3. Activity type = 'email'
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

async function backfillActivityGmailIds() {
  console.log('Backfilling gmail_message_id on email activities...\n');

  // Get all email activities without gmail_message_id
  const { data: activities, error: actError } = await supabase
    .from('activities')
    .select('id, tenant_id, subject, created_at')
    .eq('activity_type', 'email')
    .is('gmail_message_id', null)
    .ilike('subject', 'Received:%');

  if (actError) {
    console.error('Error fetching activities:', actError);
    return;
  }

  console.log(`Found ${activities.length} email activities without gmail_message_id\n`);

  let matched = 0;
  let notFound = 0;

  for (const activity of activities) {
    // Extract the original email subject from "Received: {subject}"
    const emailSubject = activity.subject.replace(/^Received:\s*/, '');

    // Find matching gmail_message
    const { data: messages, error: msgError } = await supabase
      .from('gmail_messages')
      .select('gmail_message_id, subject')
      .eq('tenant_id', activity.tenant_id)
      .eq('subject', emailSubject);

    if (msgError) {
      console.error(`Error finding message for activity ${activity.id}:`, msgError.message);
      continue;
    }

    if (!messages || messages.length === 0) {
      console.log(`No match: "${emailSubject.substring(0, 50)}..."`);
      notFound++;
      continue;
    }

    // Use the first match (should be unique by subject + tenant)
    const message = messages[0];

    // Update the activity
    const { error: updateError } = await supabase
      .from('activities')
      .update({ gmail_message_id: message.gmail_message_id })
      .eq('id', activity.id);

    if (updateError) {
      console.error(`Error updating activity ${activity.id}:`, updateError.message);
      continue;
    }

    console.log(`Matched: "${emailSubject.substring(0, 50)}..." -> ${message.gmail_message_id}`);
    matched++;
  }

  console.log('\n========================================');
  console.log('Backfill Complete!');
  console.log('========================================');
  console.log(`Matched and updated: ${matched}`);
  console.log(`Not found: ${notFound}`);
}

backfillActivityGmailIds().catch(console.error);
