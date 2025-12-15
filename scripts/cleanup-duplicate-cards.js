/**
 * Clean up duplicate kanban cards
 * Keeps the oldest card for each client/contact/type combo, deletes the rest
 * Run with: node scripts/cleanup-duplicate-cards.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicates() {
  console.log('='.repeat(60));
  console.log('CLEANING UP DUPLICATE KANBAN CARDS');
  console.log('='.repeat(60));
  console.log();

  // Get all pending cards (suggested, in_review, approved)
  const { data: cards, error } = await supabase
    .from('kanban_cards')
    .select('id, client_id, contact_id, type, title, state, created_at')
    .in('state', ['suggested', 'in_review', 'approved'])
    .order('created_at', { ascending: true }); // Oldest first

  if (error) {
    console.error('Error fetching cards:', error);
    return;
  }

  console.log(`Found ${cards.length} pending cards`);
  console.log();

  // Group cards by client_id + contact_id + type
  const cardGroups = new Map();

  for (const card of cards) {
    const key = `${card.client_id || 'null'}-${card.contact_id || 'null'}-${card.type}`;

    if (!cardGroups.has(key)) {
      cardGroups.set(key, []);
    }
    cardGroups.get(key).push(card);
  }

  // Find duplicates (groups with more than 1 card)
  const duplicateGroups = [];
  for (const [key, group] of cardGroups) {
    if (group.length > 1) {
      duplicateGroups.push({ key, cards: group });
    }
  }

  if (duplicateGroups.length === 0) {
    console.log('No duplicates found!');
    return;
  }

  console.log(`Found ${duplicateGroups.length} groups with duplicates`);
  console.log();

  // Collect cards to delete (keep the oldest, delete the rest)
  const cardsToDelete = [];

  for (const { key, cards: group } of duplicateGroups) {
    // First card is oldest (we sorted by created_at ascending)
    const keepCard = group[0];
    const deleteCards = group.slice(1);

    console.log(`Group: ${key}`);
    console.log(`  Keep: "${keepCard.title}" (${keepCard.id}) - ${keepCard.state}`);

    for (const card of deleteCards) {
      console.log(`  Delete: "${card.title}" (${card.id}) - ${card.state}`);
      cardsToDelete.push(card.id);
    }
    console.log();
  }

  console.log('-'.repeat(60));
  console.log(`Total cards to delete: ${cardsToDelete.length}`);
  console.log();

  if (cardsToDelete.length === 0) {
    return;
  }

  // Delete duplicates
  console.log('Deleting duplicates...');

  const { error: deleteError, count } = await supabase
    .from('kanban_cards')
    .delete()
    .in('id', cardsToDelete);

  if (deleteError) {
    console.error('Error deleting cards:', deleteError);
    return;
  }

  console.log(`✅ Successfully deleted ${cardsToDelete.length} duplicate cards`);
  console.log();

  // Show remaining cards count
  const { count: remainingCount } = await supabase
    .from('kanban_cards')
    .select('*', { count: 'exact', head: true })
    .in('state', ['suggested', 'in_review', 'approved']);

  console.log(`Remaining pending cards: ${remainingCount}`);
}

cleanupDuplicates().catch(console.error);
