/**
 * Engagement Engine - 21-day compliance tracking
 *
 * Tracks engagement clock per contact/account:
 * - Last touch (type, date, by whom)
 * - Next touch due
 * - Compliance status (compliant/overdue)
 * - Priority scoring for contact selection
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface EngagementClock {
  id: string;
  tenantId: string;
  clientId: string | null;
  contactId: string | null;
  lastTouchAt: Date | null;
  lastTouchType: string | null;
  lastTouchBy: string | null;
  nextTouchDue: Date | null;
  engagementIntervalDays: number;
  isCompliant: boolean;
  daysOverdue: number;
  priorityScore: number;
}

export interface EngagementViolation {
  clockId: string;
  clientId: string | null;
  contactId: string | null;
  daysOverdue: number;
  lastTouchAt: Date | null;
  nextTouchDue: Date | null;
  priorityScore: number;

  // Enriched data
  clientName?: string;
  contactName?: string;
  contactEmail?: string;
}

export interface EngagementStats {
  totalContacts: number;
  compliantContacts: number;
  overdueContacts: number;
  complianceRate: number;
  averageDaysOverdue: number;
}

export interface TouchSuggestion {
  contactId: string;
  clientId: string;
  contactName: string;
  contactEmail: string | null;
  clientName: string;
  daysOverdue: number;
  priority: 'high' | 'medium' | 'low';
  suggestedAction: 'email' | 'call' | 'follow_up';
  reason: string;
}

// ============================================================================
// Engagement Clock Management
// ============================================================================

/**
 * Get all engagement violations for a tenant
 */
export async function getEngagementViolations(
  tenantId: string,
  limit: number = 50
): Promise<EngagementViolation[]> {
  const supabase = createServiceRoleClient();

  // Use the database function for violations
  const { data, error } = await supabase.rpc('get_engagement_violations', {
    p_tenant_id: tenantId,
  });

  if (error) {
    console.error('[EngagementEngine] Error getting violations:', error);
    return [];
  }

  // Enrich with contact/client names using batch queries
  const violations: EngagementViolation[] = [];
  const limitedData = (data || []).slice(0, limit);

  // Collect all IDs for batch fetching
  const contactIds = limitedData.filter((row: any) => row.contact_id).map((row: any) => row.contact_id);
  const clientIds = limitedData.filter((row: any) => row.client_id && !row.contact_id).map((row: any) => row.client_id);

  // Batch fetch contacts
  const contactsMap = new Map<string, any>();
  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, client:clients(company_name)')
      .in('id', contactIds);

    contacts?.forEach(contact => {
      contactsMap.set(contact.id, contact);
    });
  }

  // Batch fetch clients
  const clientsMap = new Map<string, any>();
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name')
      .in('id', clientIds);

    clients?.forEach(client => {
      clientsMap.set(client.id, client);
    });
  }

  // Build violations with enriched data
  for (const row of limitedData) {
    const violation: EngagementViolation = {
      clockId: row.clock_id,
      clientId: row.client_id,
      contactId: row.contact_id,
      daysOverdue: row.days_overdue,
      lastTouchAt: row.last_touch_at ? new Date(row.last_touch_at) : null,
      nextTouchDue: row.next_touch_due ? new Date(row.next_touch_due) : null,
      priorityScore: row.priority_score,
    };

    if (row.contact_id) {
      const contact = contactsMap.get(row.contact_id);
      if (contact) {
        violation.contactName = `${contact.first_name} ${contact.last_name}`;
        violation.contactEmail = contact.email;
        violation.clientName = (contact.client as any)?.company_name;
      }
    } else if (row.client_id) {
      const client = clientsMap.get(row.client_id);
      if (client) {
        violation.clientName = client.company_name;
      }
    }

    violations.push(violation);
  }

  return violations;
}

/**
 * Select next contacts to touch based on priority
 */
export async function selectNextContactsToTouch(
  tenantId: string,
  limit: number = 10
): Promise<TouchSuggestion[]> {
  const violations = await getEngagementViolations(tenantId, limit);

  return violations.map((v) => ({
    contactId: v.contactId || '',
    clientId: v.clientId || '',
    contactName: v.contactName || 'Unknown',
    contactEmail: v.contactEmail || null,
    clientName: v.clientName || 'Unknown',
    daysOverdue: v.daysOverdue,
    priority: v.daysOverdue > 14 ? 'high' : v.daysOverdue > 7 ? 'medium' : 'low',
    suggestedAction: v.contactEmail ? 'email' : 'call',
    reason: `${v.daysOverdue} days since last touch`,
  }));
}

/**
 * Record an engagement touch
 */
export async function recordEngagementTouch(
  tenantId: string,
  touchType: 'email' | 'call' | 'meeting' | 'task' | 'note',
  touchedBy: string,
  clientId?: string,
  contactId?: string
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  if (!clientId && !contactId) {
    console.error('[EngagementEngine] Must provide clientId or contactId');
    return null;
  }

  const { data, error } = await supabase.rpc('update_engagement_clock', {
    p_tenant_id: tenantId,
    p_client_id: clientId || null,
    p_contact_id: contactId || null,
    p_touch_type: touchType,
    p_touched_by: touchedBy,
  });

  if (error) {
    console.error('[EngagementEngine] Error recording touch:', error);
    return null;
  }

  console.log(`[EngagementEngine] Recorded ${touchType} touch for ${contactId || clientId}`);
  return data;
}

/**
 * Refresh engagement compliance for all contacts in tenant
 */
export async function refreshEngagementCompliance(tenantId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // Get existing contact IDs with engagement clocks for this tenant (tenant-scoped subquery)
  const { data: existingClocks } = await supabase
    .from('engagement_clocks')
    .select('contact_id')
    .eq('tenant_id', tenantId)
    .not('contact_id', 'is', null);

  const existingContactIds = existingClocks?.map(c => c.contact_id).filter(Boolean) || [];

  // Get all contacts without engagement clocks
  let contactsQuery = supabase
    .from('contacts')
    .select('id, client_id')
    .eq('tenant_id', tenantId);

  // Exclude contacts that already have clocks
  if (existingContactIds.length > 0) {
    contactsQuery = contactsQuery.not('id', 'in', `(${existingContactIds.join(',')})`);
  }

  const { data: contactsWithoutClocks } = await contactsQuery;

  // Create clocks for contacts without one
  if (contactsWithoutClocks && contactsWithoutClocks.length > 0) {
    for (const contact of contactsWithoutClocks) {
      await supabase.from('engagement_clocks').insert({
        tenant_id: tenantId,
        client_id: contact.client_id,
        contact_id: contact.id,
        next_touch_due: new Date(), // Due immediately since never touched
        engagement_interval_days: 21,
      });
    }
    console.log(`[EngagementEngine] Created ${contactsWithoutClocks.length} new engagement clocks`);
  }
}

/**
 * Get engagement statistics for tenant
 */
export async function getEngagementStats(tenantId: string): Promise<EngagementStats> {
  const supabase = createServiceRoleClient();

  // Get total count
  const { count: totalCount } = await supabase
    .from('engagement_clocks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  // Get compliant count
  const { count: compliantCount } = await supabase
    .from('engagement_clocks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_compliant', true);

  // Get overdue stats
  const { data: overdueClocks } = await supabase
    .from('engagement_clocks')
    .select('days_overdue')
    .eq('tenant_id', tenantId)
    .eq('is_compliant', false);

  const totalContacts = totalCount || 0;
  const compliantContacts = compliantCount || 0;
  const overdueContacts = overdueClocks?.length || 0;
  const avgDaysOverdue = overdueClocks && overdueClocks.length > 0
    ? overdueClocks.reduce((sum, c) => sum + c.days_overdue, 0) / overdueClocks.length
    : 0;

  return {
    totalContacts,
    compliantContacts,
    overdueContacts,
    complianceRate: totalContacts > 0 ? (compliantContacts / totalContacts) * 100 : 100,
    averageDaysOverdue: Math.round(avgDaysOverdue),
  };
}

// ============================================================================
// Priority Scoring
// ============================================================================

/**
 * Recalculate priority scores for all clocks
 *
 * Priority factors:
 * - Days overdue (higher = more urgent)
 * - Client revenue (higher revenue = higher priority)
 * - Recent order activity
 * - Contact role (decision maker > influencer > user)
 */
export async function recalculatePriorityScores(tenantId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // Get all clocks with enriched data
  const { data: clocks } = await supabase
    .from('engagement_clocks')
    .select(`
      id, days_overdue, client_id, contact_id,
      contact:contacts(title, is_primary),
      client:clients(id)
    `)
    .eq('tenant_id', tenantId);

  if (!clocks) return;

  for (const clock of clocks) {
    let score = 0;

    // Days overdue factor (0-50 points)
    score += Math.min(clock.days_overdue * 2, 50);

    // Primary contact factor (+20 points)
    if ((clock.contact as any)?.is_primary) {
      score += 20;
    }

    // Decision maker title factor (+15 points)
    const title = ((clock.contact as any)?.title || '').toLowerCase();
    if (title.includes('president') || title.includes('ceo') || title.includes('owner') || title.includes('director')) {
      score += 15;
    } else if (title.includes('manager') || title.includes('lead') || title.includes('head')) {
      score += 10;
    }

    // TODO: Add revenue-based scoring once we have that data readily available

    // Update priority score
    await supabase
      .from('engagement_clocks')
      .update({ priority_score: score })
      .eq('id', clock.id);
  }

  console.log(`[EngagementEngine] Updated priority scores for ${clocks.length} clocks`);
}

// ============================================================================
// Auto-touch Integration
// ============================================================================

/**
 * Check if a contact needs a touch (called before email/action)
 */
export async function needsTouch(
  tenantId: string,
  contactId: string
): Promise<{ needed: boolean; daysOverdue: number }> {
  const supabase = createServiceRoleClient();

  const { data: clock } = await supabase
    .from('engagement_clocks')
    .select('is_compliant, days_overdue')
    .eq('tenant_id', tenantId)
    .eq('contact_id', contactId)
    .single();

  if (!clock) {
    return { needed: true, daysOverdue: 21 }; // Assume needs touch if no clock
  }

  return {
    needed: !clock.is_compliant,
    daysOverdue: clock.days_overdue,
  };
}

/**
 * Get clients that need engagement attention
 */
export async function getClientsNeedingAttention(
  tenantId: string,
  limit: number = 10
): Promise<Array<{
  clientId: string;
  clientName: string;
  overdueContactsCount: number;
  mostOverdueDays: number;
}>> {
  const supabase = createServiceRoleClient();

  // Get overdue clocks grouped by client
  const { data: clocks } = await supabase
    .from('engagement_clocks')
    .select('client_id, days_overdue')
    .eq('tenant_id', tenantId)
    .eq('is_compliant', false)
    .not('client_id', 'is', null);

  if (!clocks || clocks.length === 0) {
    return [];
  }

  // Group by client
  const clientMap = new Map<string, { count: number; maxDays: number }>();
  for (const clock of clocks) {
    const current = clientMap.get(clock.client_id!) || { count: 0, maxDays: 0 };
    clientMap.set(clock.client_id!, {
      count: current.count + 1,
      maxDays: Math.max(current.maxDays, clock.days_overdue),
    });
  }

  // Sort by most overdue and get client names
  const clientIds = Array.from(clientMap.entries())
    .sort((a, b) => b[1].maxDays - a[1].maxDays)
    .slice(0, limit)
    .map((e) => e[0]);

  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .in('id', clientIds);

  return clientIds.map((clientId) => {
    const client = clients?.find((c) => c.id === clientId);
    const stats = clientMap.get(clientId)!;
    return {
      clientId,
      clientName: client?.company_name || 'Unknown',
      overdueContactsCount: stats.count,
      mostOverdueDays: stats.maxDays,
    };
  });
}
