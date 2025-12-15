/**
 * Script to cleanup blocked kanban cards
 * - Delete orphaned cards (no client_id, can't be executed)
 * - Reset fixable cards to 'approved' state for re-execution
 *
 * Prerequisites: Run the SQL to add 'research' to activity_type constraint:
 * ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;
 * ALTER TABLE public.activities ADD CONSTRAINT activities_activity_type_check
 *   CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task', 'research'));
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== CLEANUP BLOCKED CARDS ===\n');

  // Step 1: Get all blocked cards
  const { data: blocked, error: fetchError } = await supabase
    .from('kanban_cards')
    .select('id, title, client_id, type, description')
    .eq('state', 'blocked');

  if (fetchError) {
    console.error('Error fetching blocked cards:', fetchError.message);
    return;
  }

  console.log(`Found ${blocked?.length || 0} blocked cards\n`);

  // Categorize cards
  const toDelete = [];
  const toReset = [];

  for (const card of blocked || []) {
    if (!card.client_id) {
      // No client_id - can't be executed, delete it
      toDelete.push(card);
    } else if (card.description?.includes('activity_type_check')) {
      // Has client_id but failed due to activity_type constraint
      toReset.push(card);
    } else {
      // Other blocked cards - try to reset
      toReset.push(card);
    }
  }

  // Step 2: Delete orphaned cards (no client_id)
  console.log(`Deleting ${toDelete.length} orphaned cards (no client_id)...`);
  for (const card of toDelete) {
    const { error } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', card.id);

    if (error) {
      console.log(`  ❌ Failed to delete "${card.title}": ${error.message}`);
    } else {
      console.log(`  ✓ Deleted: ${card.title}`);
    }
  }

  // Step 3: Reset fixable cards to 'approved'
  console.log(`\nResetting ${toReset.length} cards to 'approved' state...`);
  for (const card of toReset) {
    // Clean up the error message from description
    let cleanDescription = card.description || '';

    // Remove all error messages appended to description
    const errorIndex = cleanDescription.indexOf('\n\n❌ Execution');
    if (errorIndex !== -1) {
      cleanDescription = cleanDescription.substring(0, errorIndex);
    }

    const { error } = await supabase
      .from('kanban_cards')
      .update({
        state: 'approved',
        description: cleanDescription
      })
      .eq('id', card.id);

    if (error) {
      console.log(`  ❌ Failed to reset "${card.title}": ${error.message}`);
    } else {
      console.log(`  ✓ Reset: ${card.title}`);
    }
  }

  // Step 4: Verify
  console.log('\n=== VERIFICATION ===');
  const { data: remaining } = await supabase
    .from('kanban_cards')
    .select('id, title, state')
    .eq('state', 'blocked');

  console.log(`Remaining blocked cards: ${remaining?.length || 0}`);
  if (remaining && remaining.length > 0) {
    remaining.forEach(c => console.log(`  - ${c.title}`));
  }

  const { data: approved } = await supabase
    .from('kanban_cards')
    .select('id, title')
    .eq('state', 'approved');

  console.log(`\nApproved cards ready for execution: ${approved?.length || 0}`);
}

main().catch(console.error);
