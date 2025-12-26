import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEmptyCards() {
  // Find cards that are send_email or follow_up type, in suggested/in_review state
  const { data: cards, error } = await supabase
    .from('kanban_cards')
    .select(`
      id,
      title,
      description,
      rationale,
      type,
      state,
      action_payload,
      contact_id,
      client_id,
      contacts(first_name, last_name, email),
      clients(company_name)
    `)
    .in('type', ['send_email', 'follow_up'])
    .in('state', ['suggested', 'in_review'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching cards:', error);
    return;
  }

  console.log(`Found ${cards.length} cards to check`);

  let fixedCount = 0;
  for (const card of cards) {
    const payload = card.action_payload || {};

    // Check if missing subject or body
    if (!payload.subject || (!payload.body && !payload.html && !payload.text)) {
      const contact = card.contacts;
      const contactName = contact
        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        : 'there';
      const firstName = contact?.first_name || contactName.split(' ')[0] || 'there';
      const companyName = card.clients?.company_name || 'your company';
      const contactEmail = contact?.email || payload.to;

      // Parse days overdue from rationale if available
      const daysMatch = card.rationale?.match(/(\d+)\s*days/i);
      const daysOverdue = daysMatch ? parseInt(daysMatch[1]) : 14;

      // Generate email content
      const emailSubject = payload.subject || `Checking in - ${companyName}`;
      let emailBody;

      if (daysOverdue >= 21) {
        emailBody = `<p>Hi ${firstName},</p>
<p>It's been a while since we last connected, and I wanted to reach out to see how things are going with ${companyName}.</p>
<p>I'd love to catch up and learn about any upcoming appraisal needs you might have. Even if you don't have anything immediate, I'm happy to be a resource.</p>
<p>Would you have a few minutes for a quick call this week?</p>
<p>Best regards</p>`;
      } else if (daysOverdue >= 14) {
        emailBody = `<p>Hi ${firstName},</p>
<p>I hope this message finds you well. I realized it's been a couple of weeks since we last touched base, and I wanted to check in.</p>
<p>Is there anything I can help you with regarding appraisals or any questions you might have? I'm here to help.</p>
<p>Looking forward to hearing from you.</p>
<p>Best regards</p>`;
      } else {
        emailBody = `<p>Hi ${firstName},</p>
<p>Just wanted to quickly touch base and see how things are going. Is there anything I can assist you with?</p>
<p>Feel free to reach out if you have any appraisal needs or questions.</p>
<p>Best regards</p>`;
      }

      // Update the card
      const updatedPayload = {
        ...payload,
        to: contactEmail || payload.to,
        subject: emailSubject,
        body: payload.body || emailBody,
      };

      const { error: updateError } = await supabase
        .from('kanban_cards')
        .update({
          action_payload: updatedPayload,
          type: 'send_email'
        })
        .eq('id', card.id);

      if (updateError) {
        console.error(`Failed to update card ${card.id}:`, updateError);
      } else {
        console.log(`Fixed card ${card.id}: "${card.title}" -> Subject: "${emailSubject}"`);
        fixedCount++;
      }
    } else {
      console.log(`Card ${card.id} already has content: "${card.title}"`);
    }
  }

  console.log(`\nFixed ${fixedCount} cards with missing email content`);
}

fixEmptyCards().catch(console.error);
