import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillEmailContent() {
  console.log('🔍 Finding cards in review state that need email content...\n');

  // Get cards in review that were created from emails
  const { data: cards, error: cardsError } = await supabase
    .from('kanban_cards')
    .select('id, title, gmail_message_id, action_payload, state')
    .eq('state', 'in_review')
    .not('gmail_message_id', 'is', null);

  if (cardsError) {
    console.error('❌ Error fetching cards:', cardsError);
    return;
  }

  console.log(`Found ${cards?.length || 0} cards in review with gmail_message_id\n`);

  if (!cards || cards.length === 0) {
    console.log('No cards to update');
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;

  for (const card of cards) {
    console.log(`\n📧 Processing card: ${card.title}`);
    console.log(`   Gmail Message ID: ${card.gmail_message_id}`);

    // Check if card already has email body in action_payload
    const hasEmailBody = card.action_payload?.bodyText || card.action_payload?.bodyHtml;

    if (hasEmailBody) {
      console.log(`   ⏭️  Skipping - already has email body`);
      skippedCount++;
      continue;
    }

    // Fetch email content from gmail_messages table
    const { data: gmailMessage, error: gmailError } = await supabase
      .from('gmail_messages')
      .select('body_text, body_html, subject, from_name, from_email, snippet')
      .eq('gmail_message_id', card.gmail_message_id)
      .single();

    if (gmailError || !gmailMessage) {
      console.log(`   ⚠️  Warning: Could not find gmail_message record`);
      continue;
    }

    console.log(`   ✓ Found email content in database`);
    console.log(`   - Subject: ${gmailMessage.subject}`);
    console.log(`   - From: ${gmailMessage.from_name || gmailMessage.from_email}`);
    console.log(`   - Has body_text: ${!!gmailMessage.body_text}`);
    console.log(`   - Has body_html: ${!!gmailMessage.body_html}`);

    // Update action_payload with email content
    const updatedActionPayload = {
      ...(card.action_payload || {}),
      bodyText: gmailMessage.body_text,
      bodyHtml: gmailMessage.body_html,
      subject: gmailMessage.subject,
      from: {
        name: gmailMessage.from_name,
        email: gmailMessage.from_email,
      },
      emailId: card.gmail_message_id,
    };

    // Update the card
    const { error: updateError } = await supabase
      .from('kanban_cards')
      .update({
        action_payload: updatedActionPayload,
      })
      .eq('id', card.id);

    if (updateError) {
      console.log(`   ❌ Error updating card:`, updateError.message);
      continue;
    }

    console.log(`   ✅ Updated card with email content`);
    updatedCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Total cards found: ${cards.length}`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped (already had content): ${skippedCount}`);
  console.log(`   Failed: ${cards.length - updatedCount - skippedCount}`);
  console.log('='.repeat(60));
}

backfillEmailContent()
  .then(() => {
    console.log('\n✅ Backfill complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
