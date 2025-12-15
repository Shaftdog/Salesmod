/**
 * Scheduler for promoting scheduled kanban cards when they become due
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Promote scheduled cards that are now due to 'suggested' state
 * This should be called at the start of each agent run
 */
export async function promoteScheduledCards(tenantId?: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Build the query
  let query = supabase
    .from('kanban_cards')
    .update({
      state: 'suggested',
      updated_at: now,
    })
    .eq('state', 'scheduled')
    .lte('due_at', now)
    .select('id');

  // Optionally scope to a specific tenant
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Scheduler] Failed to promote scheduled cards:', error);
    return 0;
  }

  const promotedCount = data?.length || 0;
  if (promotedCount > 0) {
    console.log(`[Scheduler] Promoted ${promotedCount} scheduled card(s) to suggested`);
  }

  return promotedCount;
}

/**
 * Get count of scheduled cards grouped by when they're due
 */
export async function getScheduledCardStats(tenantId: string): Promise<{
  dueToday: number;
  dueThisWeek: number;
  dueLater: number;
  total: number;
}> {
  const supabase = await createClient();
  const now = new Date();

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const { data: cards, error } = await supabase
    .from('kanban_cards')
    .select('due_at')
    .eq('tenant_id', tenantId)
    .eq('state', 'scheduled');

  if (error || !cards) {
    console.error('[Scheduler] Failed to get scheduled card stats:', error);
    return { dueToday: 0, dueThisWeek: 0, dueLater: 0, total: 0 };
  }

  let dueToday = 0;
  let dueThisWeek = 0;
  let dueLater = 0;

  cards.forEach(card => {
    if (!card.due_at) return;
    const dueDate = new Date(card.due_at);

    if (dueDate <= endOfDay) {
      dueToday++;
    } else if (dueDate <= endOfWeek) {
      dueThisWeek++;
    } else {
      dueLater++;
    }
  });

  return {
    dueToday,
    dueThisWeek,
    dueLater,
    total: cards.length,
  };
}
