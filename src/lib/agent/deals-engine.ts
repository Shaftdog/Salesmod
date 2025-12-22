/**
 * Deals Engine - Automated deal progression
 *
 * Detects stalled deals and automates follow-ups:
 * - Stalled deal detection based on configurable thresholds
 * - Automatic follow-up scheduling with escalating priority
 * - Stage history tracking
 * - Activity recording for deal movement
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface StalledDeal {
  dealId: string;
  title: string;
  stage: string;
  clientId: string;
  contactId: string | null;
  value: number | null;
  lastActivityAt: Date;
  daysSinceActivity: number;
  stalledThreshold: number;
  clientName?: string;
  contactName?: string;
  contactEmail?: string;
}

export interface DealFollowUpDue {
  dealId: string;
  title: string;
  stage: string;
  clientId: string;
  contactId: string | null;
  value: number | null;
  nextFollowUpAt: Date;
  followUpCount: number;
  maxFollowUps: number;
  clientName?: string;
  contactName?: string;
  contactEmail?: string;
}

export interface DealStageChange {
  dealId: string;
  fromStage: string | null;
  toStage: string;
  reason: string | null;
  changedBy: string | null;
}

export interface DealFollowUpResult {
  success: boolean;
  message: string;
  cardId?: string;
  error?: string;
}

// ============================================================================
// Stalled Deal Detection
// ============================================================================

/**
 * Detect stalled deals based on tenant configuration
 */
export async function detectStalledDeals(
  tenantId: string,
  limit: number = 20
): Promise<StalledDeal[]> {
  const supabase = createServiceRoleClient();

  // Validate limit to prevent DoS
  const safeLimit = Math.max(1, Math.min(limit, 100));

  // Use database function for efficient stalled detection
  const { data, error } = await supabase.rpc('get_stalled_deals', {
    p_tenant_id: tenantId,
    p_limit: safeLimit,
  });

  if (error) {
    console.error('[DealsEngine] Error detecting stalled deals:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Batch fetch client and contact names
  const clientIds = [...new Set(data.map((d: any) => d.client_id))];
  const contactIds = [...new Set(data.filter((d: any) => d.contact_id).map((d: any) => d.contact_id))];

  const [{ data: clients }, { data: contacts }] = await Promise.all([
    supabase.from('clients').select('id, company_name').in('id', clientIds),
    contactIds.length > 0
      ? supabase.from('contacts').select('id, first_name, last_name, email').in('id', contactIds)
      : { data: [] },
  ]);

  const clientsMap = new Map((clients || []).map(c => [c.id, c]));
  const contactsMap = new Map((contacts || []).map(c => [c.id, c]));

  return data.map((row: any) => {
    const client = clientsMap.get(row.client_id);
    const contact = row.contact_id ? contactsMap.get(row.contact_id) : null;

    return {
      dealId: row.deal_id,
      title: row.title,
      stage: row.stage,
      clientId: row.client_id,
      contactId: row.contact_id,
      value: row.value,
      lastActivityAt: new Date(row.last_activity_at),
      daysSinceActivity: row.days_since_activity,
      stalledThreshold: row.stalled_threshold,
      clientName: client?.company_name,
      contactName: contact ? `${contact.first_name} ${contact.last_name}` : undefined,
      contactEmail: contact?.email,
    };
  });
}

/**
 * Get deals that are due for follow-up
 */
export async function getDealFollowUpsDue(
  tenantId: string,
  limit: number = 20
): Promise<DealFollowUpDue[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('deals')
    .select(`
      id,
      title,
      stage,
      client_id,
      contact_id,
      value,
      next_follow_up_at,
      follow_up_count,
      client:clients(company_name),
      contact:contacts(first_name, last_name, email)
    `)
    .eq('tenant_id', tenantId)
    .not('stage', 'in', '("won","lost")')
    .eq('auto_follow_up_enabled', true)
    .lte('next_follow_up_at', new Date().toISOString())
    .lt('follow_up_count', 5) // Max 5 follow-ups
    .order('value', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('[DealsEngine] Error getting deals due for follow-up:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    dealId: row.id,
    title: row.title,
    stage: row.stage,
    clientId: row.client_id,
    contactId: row.contact_id,
    value: row.value,
    nextFollowUpAt: new Date(row.next_follow_up_at),
    followUpCount: row.follow_up_count,
    maxFollowUps: 5,
    clientName: row.client?.company_name,
    contactName: row.contact ? `${row.contact.first_name} ${row.contact.last_name}` : undefined,
    contactEmail: row.contact?.email,
  }));
}

// ============================================================================
// Follow-up Management
// ============================================================================

/**
 * Schedule a follow-up for a stalled deal
 */
export async function scheduleFollowUp(
  dealId: string
): Promise<DealFollowUpResult> {
  const supabase = createServiceRoleClient();

  // Get deal with details
  const { data: dealData, error } = await supabase
    .from('deals')
    .select(`
      id,
      tenant_id,
      title,
      stage,
      value,
      client_id,
      contact_id,
      follow_up_count,
      client:clients(company_name),
      contact:contacts(first_name, last_name, email)
    `)
    .eq('id', dealId)
    .single();

  if (error || !dealData) {
    return {
      success: false,
      message: 'Deal not found',
      error: error?.message,
    };
  }

  // Type assertion for Supabase joined data
  const deal = dealData as any;
  const contact = deal.contact as { first_name: string; last_name: string; email: string } | null;
  const client = deal.client as { company_name: string } | null;

  if (!contact?.email) {
    return {
      success: false,
      message: 'No contact email available for follow-up',
    };
  }

  // Generate follow-up email based on stage and follow-up count
  const followUpNumber = deal.follow_up_count + 1;
  const stageMessages: Record<string, string> = {
    lead: "I wanted to follow up on our initial conversation about working together.",
    qualified: "I'm following up on our discussion about your needs and how we might help.",
    proposal: "I wanted to check in on the proposal we sent over. Do you have any questions?",
    negotiation: "I'm following up on our negotiations. Is there anything else you need to move forward?",
  };

  const urgencyMessages = [
    '',
    ' I understand you\'re busy, but I wanted to make sure this doesn\'t fall through the cracks.',
    ' I\'m following up one more time as I want to ensure you have everything you need.',
    ' This will be my last follow-up, but please don\'t hesitate to reach out when you\'re ready.',
  ];

  const stageMessage = stageMessages[deal.stage] || "I wanted to follow up on our recent discussions.";
  const urgencyMessage = urgencyMessages[Math.min(followUpNumber - 1, 3)];

  const emailBody = `Hi ${contact.first_name},

${stageMessage}${urgencyMessage}

${deal.value ? `We're discussing a $${deal.value.toLocaleString()} opportunity, and I want to ensure we're providing you with the best possible service.` : ''}

Please let me know if you have any questions or if there's a better time to connect.

Best regards`;

  // Create kanban card for follow-up email
  const { data: card, error: cardError } = await supabase
    .from('kanban_cards')
    .insert({
      tenant_id: deal.tenant_id,
      type: 'send_email',
      title: `Deal Follow-up #${followUpNumber}: ${deal.title}`,
      description: `Follow-up email for ${deal.stage} stage deal with ${client?.company_name}`,
      state: 'suggested',
      priority: followUpNumber >= 3 ? 'high' : 'medium',
      contact_id: deal.contact_id,
      client_id: deal.client_id,
      action_payload: {
        to: contact.email,
        subject: `Following up: ${deal.title}`,
        body: emailBody,
        dealId: deal.id,
        type: 'deal_follow_up',
        followUpNumber,
      },
      source: 'deals_engine',
    })
    .select('id')
    .single();

  if (cardError) {
    console.error('[DealsEngine] Error creating follow-up card:', cardError);
    return {
      success: false,
      message: 'Failed to create follow-up card',
      error: cardError.message,
    };
  }

  // Get stage config for next follow-up interval
  const { data: stageConfig } = await supabase
    .from('deal_stage_config')
    .select('follow_up_interval_days')
    .eq('tenant_id', deal.tenant_id)
    .eq('stage', deal.stage)
    .single();

  const intervalDays = stageConfig?.follow_up_interval_days || 3;
  const nextFollowUp = new Date();
  nextFollowUp.setDate(nextFollowUp.getDate() + intervalDays);

  // Update deal with follow-up tracking
  await supabase
    .from('deals')
    .update({
      follow_up_count: followUpNumber,
      last_activity_at: new Date().toISOString(),
      next_follow_up_at: nextFollowUp.toISOString(),
      stalled_at: null, // Clear stalled status
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId);

  console.log(`[DealsEngine] Created follow-up card ${card.id} for deal ${dealId} (follow-up #${followUpNumber})`);

  return {
    success: true,
    message: `Follow-up #${followUpNumber} scheduled`,
    cardId: card.id,
  };
}

// ============================================================================
// Activity Recording
// ============================================================================

/**
 * Record deal activity and reset stalled timer
 */
export async function recordDealActivity(
  dealId: string,
  activityType: 'email' | 'call' | 'meeting' | 'note' | 'stage_change'
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('deals')
    .update({
      last_activity_at: new Date().toISOString(),
      stalled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId);

  console.log(`[DealsEngine] Recorded ${activityType} activity for deal ${dealId}`);
}

/**
 * Record a stage change with history
 */
export async function recordStageChange(
  change: DealStageChange
): Promise<void> {
  const supabase = createServiceRoleClient();

  // Get the deal to get tenant_id and calculate days in previous stage
  const { data: deal } = await supabase
    .from('deals')
    .select('tenant_id, stage, updated_at')
    .eq('id', change.dealId)
    .single();

  if (!deal) return;

  const daysInPreviousStage = change.fromStage
    ? Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Insert history record
  await supabase
    .from('deal_stage_history')
    .insert({
      tenant_id: deal.tenant_id,
      deal_id: change.dealId,
      from_stage: change.fromStage,
      to_stage: change.toStage,
      reason: change.reason,
      changed_by: change.changedBy,
      days_in_previous_stage: daysInPreviousStage,
    });

  // Update deal stage and activity
  await supabase
    .from('deals')
    .update({
      stage: change.toStage,
      last_activity_at: new Date().toISOString(),
      stalled_at: null,
      follow_up_count: 0, // Reset follow-up count on stage change
      updated_at: new Date().toISOString(),
    })
    .eq('id', change.dealId);

  console.log(`[DealsEngine] Recorded stage change: ${change.fromStage} -> ${change.toStage} for deal ${change.dealId}`);
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Initialize default stage configuration for a tenant
 */
export async function initializeStageConfig(tenantId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const defaultConfigs = [
    { stage: 'lead', max_days_before_stale: 7, follow_up_interval_days: 2, max_follow_ups: 5 },
    { stage: 'qualified', max_days_before_stale: 14, follow_up_interval_days: 3, max_follow_ups: 5 },
    { stage: 'proposal', max_days_before_stale: 7, follow_up_interval_days: 2, max_follow_ups: 5 },
    { stage: 'negotiation', max_days_before_stale: 5, follow_up_interval_days: 1, max_follow_ups: 5 },
  ];

  for (const config of defaultConfigs) {
    await supabase
      .from('deal_stage_config')
      .upsert({
        tenant_id: tenantId,
        ...config,
      }, { onConflict: 'tenant_id,stage' });
  }

  console.log(`[DealsEngine] Initialized stage config for tenant ${tenantId}`);
}

/**
 * Get deal statistics for tenant
 */
export async function getDealStats(tenantId: string): Promise<{
  totalActive: number;
  stalled: number;
  byStage: Record<string, number>;
  totalValue: number;
  averageDaysInStage: number;
}> {
  const supabase = createServiceRoleClient();

  const { data: deals } = await supabase
    .from('deals')
    .select('stage, value, last_activity_at, created_at')
    .eq('tenant_id', tenantId)
    .not('stage', 'in', '("won","lost")');

  if (!deals) {
    return {
      totalActive: 0,
      stalled: 0,
      byStage: {},
      totalValue: 0,
      averageDaysInStage: 0,
    };
  }

  const byStage: Record<string, number> = {};
  let totalValue = 0;
  let stalled = 0;
  let totalDaysInStage = 0;

  for (const deal of deals) {
    byStage[deal.stage] = (byStage[deal.stage] || 0) + 1;
    totalValue += deal.value || 0;

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(deal.last_activity_at || deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    totalDaysInStage += daysSinceActivity;

    if (daysSinceActivity > 7) stalled++;
  }

  return {
    totalActive: deals.length,
    stalled,
    byStage,
    totalValue,
    averageDaysInStage: deals.length > 0 ? Math.round(totalDaysInStage / deals.length) : 0,
  };
}
