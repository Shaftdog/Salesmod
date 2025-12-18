/**
 * 21-Day Engagement Engine
 * Ensures every contact is touched at least every 21 days
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface EngagementClock {
  id: string;
  tenantId: string;
  entityType: 'contact' | 'account' | 'client';
  entityId: string;
  lastTouchAt: Date | null;
  lastTouchType: string | null;
  lastTouchBy: string | null;
  nextTouchDue: Date | null;
  touchFrequencyDays: number;
  touchCount30d: number;
  touchCount90d: number;
  responseRate: number;
  priorityScore: number;
  isCompliant: boolean;
  daysOverdue: number;
}

export interface EngagementViolation {
  entityType: string;
  entityId: string;
  entityName?: string;
  clientId?: string;
  lastTouchAt: Date | null;
  lastTouchType: string | null;
  daysOverdue: number;
  priority: number;
}

export interface EngagementTarget {
  contactId: string;
  contactName: string;
  clientId: string;
  clientName: string;
  email: string;
  daysSinceLastTouch: number;
  lastTouchType?: string;
  priorityScore: number;
  suggestedAction: 'email' | 'call' | 'meeting';
}

export interface EngagementStats {
  totalContacts: number;
  compliantContacts: number;
  violatingContacts: number;
  complianceRate: number;
  avgDaysBetweenTouches: number;
  touchesLast7Days: number;
  touchesLast30Days: number;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get all engagement violations (contacts > 21 days without touch)
 */
export async function getEngagementViolations(
  tenantId: string,
  limit: number = 50
): Promise<EngagementViolation[]> {
  const supabase = createServiceRoleClient();

  // First, refresh compliance status
  await refreshEngagementCompliance(tenantId);

  // Get violations from engagement_clocks
  const { data: clockViolations, error: clockError } = await supabase
    .from('engagement_clocks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_compliant', false)
    .order('days_overdue', { ascending: false })
    .limit(limit);

  if (clockError) {
    console.error('[Engagement] Error fetching violations:', clockError);
    return [];
  }

  // Also check for contacts that don't have engagement clocks yet
  const { data: untracked, error: untrackedError } = await supabase
    .from('contacts')
    .select(`
      id,
      first_name,
      last_name,
      email,
      client_id,
      clients!contacts_client_id_fkey(company_name)
    `)
    .eq('tenant_id', tenantId)
    .not('email', 'is', null);

  if (untrackedError) {
    console.error('[Engagement] Error fetching untracked contacts:', untrackedError);
    // Continue with just clock violations if untracked fetch fails
  }

  // Find contacts without engagement clocks
  const trackedIds = new Set((clockViolations || []).map((c) => c.entity_id));
  const untrackedContacts = (untracked || []).filter((c) => !trackedIds.has(c.id));

  // Create violations list
  const violations: EngagementViolation[] = [];

  // Add clock violations
  for (const clock of clockViolations || []) {
    violations.push({
      entityType: clock.entity_type,
      entityId: clock.entity_id,
      lastTouchAt: clock.last_touch_at ? new Date(clock.last_touch_at) : null,
      lastTouchType: clock.last_touch_type,
      daysOverdue: clock.days_overdue,
      priority: clock.priority_score,
    });
  }

  // Add untracked contacts as violations (they've never been touched)
  for (const contact of untrackedContacts.slice(0, limit - violations.length)) {
    violations.push({
      entityType: 'contact',
      entityId: contact.id,
      entityName: `${contact.first_name} ${contact.last_name}`,
      clientId: contact.client_id,
      lastTouchAt: null,
      lastTouchType: null,
      daysOverdue: 999, // Never touched
      priority: 100, // High priority for never-touched contacts
    });
  }

  // Sort by priority (overdue days + base priority)
  violations.sort((a, b) => {
    const scoreA = a.daysOverdue + (a.priority || 0);
    const scoreB = b.daysOverdue + (b.priority || 0);
    return scoreB - scoreA;
  });

  return violations.slice(0, limit);
}

/**
 * Select the next contacts that need to be touched
 * Returns prioritized list based on:
 * 1. High value clients
 * 2. High churn risk
 * 3. Active orders/deals
 * 4. Missed engagement (>21 days)
 */
export async function selectNextContactsToTouch(
  tenantId: string,
  limit: number = 10
): Promise<EngagementTarget[]> {
  const supabase = createServiceRoleClient();

  // Get contacts with their engagement clocks and client info
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select(`
      id,
      first_name,
      last_name,
      email,
      title,
      client_id,
      clients!contacts_client_id_fkey(
        id,
        company_name,
        is_active
      ),
      engagement_clocks!engagement_clocks_entity_id_fkey(
        last_touch_at,
        last_touch_type,
        next_touch_due,
        is_compliant,
        days_overdue,
        priority_score
      )
    `)
    .eq('tenant_id', tenantId)
    .not('email', 'is', null);

  if (error) {
    console.error('[Engagement] Error selecting contacts:', error);
    return [];
  }

  // Score and rank contacts
  const scoredContacts: Array<{
    contact: any;
    score: number;
    daysSinceTouch: number;
  }> = [];

  const now = new Date();

  for (const contact of contacts || []) {
    // Handle both array and object cases for the join
    const client = Array.isArray(contact.clients) ? contact.clients[0] : contact.clients;
    if (!client?.is_active) continue;
    if (!contact.email) continue;

    const clock = Array.isArray(contact.engagement_clocks)
      ? contact.engagement_clocks[0]
      : contact.engagement_clocks;

    // Calculate days since last touch
    let daysSinceTouch = 999;
    if (clock?.last_touch_at) {
      daysSinceTouch = Math.floor(
        (now.getTime() - new Date(clock.last_touch_at).getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Skip contacts touched very recently
    if (daysSinceTouch < 3) continue;

    // Calculate priority score
    let score = 0;

    // Base score: days overdue (more overdue = higher priority)
    if (daysSinceTouch > 21) {
      score += (daysSinceTouch - 21) * 2; // 2 points per day overdue
    } else {
      score += Math.max(0, daysSinceTouch - 10); // Start building priority after 10 days
    }

    // Boost for never-touched contacts
    if (daysSinceTouch === 999) {
      score += 50;
    }

    // Add existing priority score
    if (clock?.priority_score) {
      score += clock.priority_score;
    }

    scoredContacts.push({
      contact,
      score,
      daysSinceTouch,
    });
  }

  // Sort by score descending
  scoredContacts.sort((a, b) => b.score - a.score);

  // Take top N and format as targets
  return scoredContacts.slice(0, limit).map((sc) => {
    const clock = Array.isArray(sc.contact.engagement_clocks)
      ? sc.contact.engagement_clocks[0]
      : sc.contact.engagement_clocks;

    return {
      contactId: sc.contact.id,
      contactName: `${sc.contact.first_name} ${sc.contact.last_name}`,
      clientId: sc.contact.client_id,
      clientName: sc.contact.clients?.company_name || 'Unknown',
      email: sc.contact.email,
      daysSinceLastTouch: sc.daysSinceTouch,
      lastTouchType: clock?.last_touch_type,
      priorityScore: sc.score,
      suggestedAction: suggestAction(sc.daysSinceTouch, clock?.last_touch_type),
    };
  });
}

/**
 * Update engagement clock after a touch
 */
export async function recordEngagementTouch(
  tenantId: string,
  entityType: 'contact' | 'account' | 'client',
  entityId: string,
  touchType: string,
  touchBy: string = 'agent',
  cardId?: string
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase.rpc('update_engagement_clock', {
      p_tenant_id: tenantId,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_touch_type: touchType,
      p_touch_by: touchBy,
      p_card_id: cardId || null,
    });

    if (error) {
      console.error('[Engagement] Error recording touch:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Engagement] Exception recording touch:', error);
    return null;
  }
}

/**
 * Refresh engagement compliance for a tenant
 */
export async function refreshEngagementCompliance(tenantId: string): Promise<number> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase.rpc('refresh_engagement_compliance', {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error('[Engagement] Error refreshing compliance:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('[Engagement] Exception refreshing compliance:', error);
    return 0;
  }
}

/**
 * Get engagement statistics for a tenant
 */
export async function getEngagementStats(tenantId: string): Promise<EngagementStats> {
  const supabase = createServiceRoleClient();

  // Get total contacts with email
  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .not('email', 'is', null);

  // Get compliant contacts
  const { count: compliantContacts } = await supabase
    .from('engagement_clocks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('entity_type', 'contact')
    .eq('is_compliant', true);

  // Get violating contacts
  const { count: violatingContacts } = await supabase
    .from('engagement_clocks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('entity_type', 'contact')
    .eq('is_compliant', false);

  // Get average days between touches
  const { data: avgData, error: avgError } = await supabase
    .from('engagement_clocks')
    .select('touch_frequency_days')
    .eq('tenant_id', tenantId)
    .eq('entity_type', 'contact');

  if (avgError) {
    console.error('[Engagement] Error fetching average days:', avgError);
  }

  const avgDays = avgData && avgData.length > 0
    ? avgData.reduce((sum, c) => sum + (c.touch_frequency_days || 21), 0) / avgData.length
    : 21;

  // Get touches in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: touches7d } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', sevenDaysAgo)
    .in('activity_type', ['email', 'call', 'meeting']);

  // Get touches in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: touches30d } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', thirtyDaysAgo)
    .in('activity_type', ['email', 'call', 'meeting']);

  const total = totalContacts || 0;
  const compliant = compliantContacts || 0;

  return {
    totalContacts: total,
    compliantContacts: compliant,
    violatingContacts: violatingContacts || 0,
    complianceRate: total > 0 ? compliant / total : 1,
    avgDaysBetweenTouches: avgDays,
    touchesLast7Days: touches7d || 0,
    touchesLast30Days: touches30d || 0,
  };
}

/**
 * Initialize engagement clocks for existing contacts
 * Run this once to set up tracking for existing data
 */
export async function initializeEngagementClocks(tenantId: string): Promise<number> {
  const supabase = createServiceRoleClient();

  // Get all contacts without engagement clocks
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select(`
      id,
      created_at,
      activities!activities_contact_id_fkey(
        created_at,
        activity_type
      )
    `)
    .eq('tenant_id', tenantId)
    .not('email', 'is', null);

  if (error || !contacts) {
    console.error('[Engagement] Error fetching contacts for init:', error);
    return 0;
  }

  let initialized = 0;

  for (const contact of contacts) {
    // Check if clock already exists
    const { data: existing } = await supabase
      .from('engagement_clocks')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('entity_type', 'contact')
      .eq('entity_id', contact.id)
      .single();

    if (existing) continue;

    // Find last touch from activities
    const activities = (contact.activities || [])
      .filter((a: any) => ['email', 'call', 'meeting'].includes(a.activity_type))
      .sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    const lastTouch = activities[0];
    const lastTouchAt = lastTouch ? new Date(lastTouch.created_at) : null;
    const lastTouchType = lastTouch?.activity_type || null;

    // Calculate next touch due
    const nextTouchDue = lastTouchAt
      ? new Date(lastTouchAt.getTime() + 21 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 1); // Already overdue if never touched

    // Calculate compliance
    const isCompliant = nextTouchDue >= new Date();
    const daysOverdue = isCompliant
      ? 0
      : Math.floor((Date.now() - nextTouchDue.getTime()) / (1000 * 60 * 60 * 24));

    // Insert engagement clock
    const { error: insertError } = await supabase.from('engagement_clocks').insert({
      tenant_id: tenantId,
      entity_type: 'contact',
      entity_id: contact.id,
      last_touch_at: lastTouchAt?.toISOString(),
      last_touch_type: lastTouchType,
      next_touch_due: nextTouchDue.toISOString(),
      touch_count_30d: activities.filter((a: any) => {
        const actDate = new Date(a.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return actDate >= thirtyDaysAgo;
      }).length,
      is_compliant: isCompliant,
      days_overdue: daysOverdue,
    });

    if (!insertError) {
      initialized++;
    }
  }

  console.log(`[Engagement] Initialized ${initialized} engagement clocks for tenant ${tenantId}`);
  return initialized;
}

// ============================================================================
// Helper Functions
// ============================================================================

function suggestAction(
  daysSinceTouch: number,
  lastTouchType?: string
): 'email' | 'call' | 'meeting' {
  // Vary the touch type to keep engagement fresh
  if (daysSinceTouch > 45) {
    // Very stale - try a call
    return 'call';
  }

  if (lastTouchType === 'email') {
    // Last was email, try call for variety
    return daysSinceTouch > 30 ? 'call' : 'email';
  }

  if (lastTouchType === 'call') {
    // Last was call, email is fine
    return 'email';
  }

  // Default to email
  return 'email';
}
