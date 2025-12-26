const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapping rules: what task titles should become what autonomous types
const conversionRules = [
  // Payment/Invoice related → send_email (reminder)
  { match: /monitor.*payment|invoice.*payment|payment.*follow/i, newType: 'send_email', reason: 'Send payment reminder email' },
  { match: /follow.*invoice|invoice.*follow/i, newType: 'send_email', reason: 'Send invoice follow-up email' },

  // Proposals → send_email (with proposal)
  { match: /prepare.*proposal|create.*proposal|proposal/i, newType: 'send_email', reason: 'Draft and send proposal via email' },
  { match: /pricing.*structure|volume.*pricing/i, newType: 'send_email', reason: 'Send pricing proposal via email' },

  // CRM/Contact updates → follow_up (logs the action)
  { match: /update.*crm|update.*contact|contact.*information/i, newType: 'follow_up', reason: 'Update CRM and log activity' },

  // Feedback requests → send_email
  { match: /request.*feedback|feedback.*request/i, newType: 'send_email', reason: 'Send feedback request email' },

  // Investigations → research
  { match: /investigate|resolve.*order|pending.*order/i, newType: 'research', reason: 'Research and investigate issue' },

  // Presentations/Documents → send_email
  { match: /prepare.*presentation|service.*capabilities/i, newType: 'send_email', reason: 'Send capabilities document via email' },

  // Discovery calls → send_email (with scheduling link)
  { match: /discovery.*call|schedule.*call/i, newType: 'send_email', reason: 'Send scheduling email with calendar link' },

  // Account issues → research
  { match: /account.*discrepancy|account.*setup/i, newType: 'research', reason: 'Research account issue' },

  // Pilot programs → send_email
  { match: /pilot.*program/i, newType: 'send_email', reason: 'Send pilot program proposal via email' },

  // "Needs Review" emails that aren't done → Delete these, they're stale
  { match: /needs review/i, newType: 'DELETE', reason: 'Stale email review card' },
];

async function convertCards() {
  // Get all create_task cards that are NOT done
  const { data: cards, error } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('type', 'create_task')
    .neq('state', 'done');

  if (error) {
    console.error('Error fetching cards:', error);
    return;
  }

  console.log('\n=== Converting ' + cards.length + ' create_task cards to autonomous types ===\n');

  let converted = 0;
  let deleted = 0;
  let skipped = 0;

  for (const card of cards) {
    let matched = false;

    for (const rule of conversionRules) {
      if (rule.match.test(card.title)) {
        matched = true;

        if (rule.newType === 'DELETE') {
          // Delete stale cards
          const { error: deleteError } = await supabase
            .from('kanban_cards')
            .delete()
            .eq('id', card.id);

          if (deleteError) {
            console.log('  ERROR deleting: ' + card.title);
          } else {
            console.log('  DELETED: ' + card.title);
            deleted++;
          }
        } else {
          // Convert to new type
          const updates = {
            type: rule.newType,
            rationale: card.rationale + '\n\n[Auto-converted] ' + rule.reason,
          };

          // For send_email, ensure we have email draft structure
          if (rule.newType === 'send_email' && card.action_payload) {
            const payload = card.action_payload;
            if (!payload.subject) {
              payload.subject = card.title;
            }
            if (!payload.body) {
              payload.body = '<p>' + (card.description || card.rationale) + '</p>';
            }
            updates.action_payload = payload;
          }

          const { error: updateError } = await supabase
            .from('kanban_cards')
            .update(updates)
            .eq('id', card.id);

          if (updateError) {
            console.log('  ERROR converting: ' + card.title + ' - ' + updateError.message);
          } else {
            console.log('  CONVERTED [' + card.type + ' → ' + rule.newType + ']: ' + card.title);
            converted++;
          }
        }
        break;
      }
    }

    if (!matched) {
      console.log('  SKIPPED (no rule): ' + card.title);
      skipped++;
    }
  }

  console.log('\n=== Summary ===');
  console.log('  Converted: ' + converted);
  console.log('  Deleted: ' + deleted);
  console.log('  Skipped: ' + skipped);
  console.log('  Total processed: ' + cards.length);
}

convertCards();
