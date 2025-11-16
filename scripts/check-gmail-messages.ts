import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkGmailMessages() {
  console.log('🔍 Checking gmail_messages table...\n');

  // Get all gmail messages
  const { data: messages, error } = await supabase
    .from('gmail_messages')
    .select('id, gmail_message_id, subject, sender_email, body_text, body_html, card_id, processed_at')
    .order('processed_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${messages?.length || 0} recent gmail messages\n`);

  if (messages && messages.length > 0) {
    for (const msg of messages) {
      console.log(`\n📧 Message ID: ${msg.gmail_message_id}`);
      console.log(`   DB ID: ${msg.id}`);
      console.log(`   Subject: ${msg.subject}`);
      console.log(`   From: ${msg.sender_email}`);
      console.log(`   Has body_text: ${!!msg.body_text}`);
      console.log(`   Has body_html: ${!!msg.body_html}`);
      console.log(`   Card ID: ${msg.card_id || 'none'}`);
      console.log(`   Processed: ${msg.processed_at}`);
    }
  }

  // Also check the specific IDs from the cards
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Checking specific message IDs from cards...\n');

  const cardMessageIds = ['19a873030ccaa463', '19a88025a05d00bd'];

  for (const msgId of cardMessageIds) {
    const { data, error } = await supabase
      .from('gmail_messages')
      .select('*')
      .eq('gmail_message_id', msgId)
      .single();

    console.log(`\nMessage ID: ${msgId}`);
    if (error || !data) {
      console.log('   ❌ Not found in gmail_messages table');
    } else {
      console.log('   ✓ Found!');
      console.log(`   Subject: ${data.subject}`);
      console.log(`   Has body: ${!!data.body_text || !!data.body_html}`);
    }
  }
}

checkGmailMessages()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
