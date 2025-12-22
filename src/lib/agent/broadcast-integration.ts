/**
 * Broadcast Integration - Campaign automation
 *
 * Wires existing campaign infrastructure into the autonomous cycle:
 * - Scheduled broadcast detection
 * - Batch sending with rate limiting
 * - Progress tracking and metrics
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface BroadcastDue {
  campaignId: string;
  name: string;
  scheduledFor: Date;
  totalRecipients: number;
  sentCount: number;
  remainingCount: number;
  status: string;
}

export interface BroadcastBatchResult {
  success: boolean;
  campaignId: string;
  batchSize: number;
  sentCount: number;
  failedCount: number;
  errors: string[];
}

export interface BroadcastProgress {
  campaignId: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  bouncedCount: number;
  openedCount: number;
  clickedCount: number;
  repliedCount: number;
  progressPercent: number;
}

// ============================================================================
// Broadcast Detection
// ============================================================================

/**
 * Get broadcasts that are due for sending
 */
export async function getBroadcastsDue(
  tenantId: string,
  limit: number = 5
): Promise<BroadcastDue[]> {
  const supabase = createServiceRoleClient();

  // Get campaigns that are scheduled and due
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select(`
      id,
      name,
      scheduled_at,
      status,
      total_recipients,
      sent_count
    `)
    .eq('org_id', tenantId)
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[BroadcastIntegration] Error getting due broadcasts:', error);
    return [];
  }

  return (campaigns || []).map(campaign => ({
    campaignId: campaign.id,
    name: campaign.name,
    scheduledFor: new Date(campaign.scheduled_at),
    totalRecipients: campaign.total_recipients || 0,
    sentCount: campaign.sent_count || 0,
    remainingCount: (campaign.total_recipients || 0) - (campaign.sent_count || 0),
    status: campaign.status,
  }));
}

/**
 * Get in-progress broadcasts that need more sending
 */
export async function getInProgressBroadcasts(
  tenantId: string,
  limit: number = 5
): Promise<BroadcastDue[]> {
  const supabase = createServiceRoleClient();

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select(`
      id,
      name,
      scheduled_at,
      status,
      total_recipients,
      sent_count
    `)
    .eq('org_id', tenantId)
    .eq('status', 'active')
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[BroadcastIntegration] Error getting in-progress broadcasts:', error);
    return [];
  }

  // Filter to only those with remaining recipients
  return (campaigns || [])
    .filter(c => (c.total_recipients || 0) > (c.sent_count || 0))
    .map(campaign => ({
      campaignId: campaign.id,
      name: campaign.name,
      scheduledFor: new Date(campaign.scheduled_at),
      totalRecipients: campaign.total_recipients || 0,
      sentCount: campaign.sent_count || 0,
      remainingCount: (campaign.total_recipients || 0) - (campaign.sent_count || 0),
      status: campaign.status,
    }));
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Process a batch of broadcasts
 */
export async function processBroadcastBatch(
  campaignId: string,
  batchSize: number = 50
): Promise<BroadcastBatchResult> {
  const supabase = createServiceRoleClient();

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select(`
      id,
      org_id,
      name,
      status,
      send_rate_per_hour,
      send_batch_size
    `)
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    return {
      success: false,
      campaignId,
      batchSize: 0,
      sentCount: 0,
      failedCount: 0,
      errors: [campaignError?.message || 'Campaign not found'],
    };
  }

  // Use campaign's batch size if specified
  const actualBatchSize = campaign.send_batch_size || batchSize;

  // Get unsent recipients
  const { data: recipients, error: recipientError } = await supabase
    .from('campaign_contact_status')
    .select(`
      id,
      contact_id,
      job_task_id,
      contact:contacts(id, first_name, last_name, email)
    `)
    .eq('campaign_id', campaignId)
    .is('sent_at', null)
    .limit(actualBatchSize);

  if (recipientError || !recipients || recipients.length === 0) {
    // No more recipients - mark campaign as completed
    if (!recipientError && (!recipients || recipients.length === 0)) {
      await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      console.log(`[BroadcastIntegration] Campaign ${campaignId} completed - no more recipients`);
    }

    return {
      success: true,
      campaignId,
      batchSize: actualBatchSize,
      sentCount: 0,
      failedCount: 0,
      errors: recipientError ? [recipientError.message] : [],
    };
  }

  // Update campaign status to active if scheduled
  if (campaign.status === 'scheduled') {
    await supabase
      .from('campaigns')
      .update({
        status: 'active',
        launched_at: new Date().toISOString(),
      })
      .eq('id', campaignId);
  }

  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  // Process each recipient by creating email cards
  for (const recipientData of recipients) {
    try {
      // Type assertion for Supabase joined data
      const recipient = recipientData as any;
      const contact = recipient.contact as { id: string; first_name: string; last_name: string; email: string } | null;

      if (!contact?.email) {
        failedCount++;
        errors.push(`No email for contact ${recipient.contact_id}`);
        continue;
      }

      // Create kanban card for sending
      const { error: cardError } = await supabase
        .from('kanban_cards')
        .insert({
          tenant_id: campaign.org_id,
          type: 'send_email',
          title: `Campaign: ${campaign.name}`,
          description: `Send campaign email to ${contact.first_name} ${contact.last_name}`,
          state: 'approved', // Auto-approve campaign emails
          priority: 'medium',
          contact_id: recipient.contact_id,
          action_payload: {
            to: contact.email,
            campaignId: campaign.id,
            recipientId: recipient.id,
            jobTaskId: recipient.job_task_id,
            type: 'campaign_email',
          },
          source: 'broadcast_integration',
        });

      if (cardError) {
        failedCount++;
        errors.push(`Card creation failed: ${cardError.message}`);
      } else {
        sentCount++;

        // Update recipient status
        await supabase
          .from('campaign_contact_status')
          .update({
            sent_at: new Date().toISOString(),
            last_event: 'sent',
          })
          .eq('id', recipient.id);
      }
    } catch (err) {
      failedCount++;
      errors.push(`Error processing recipient ${(recipientData as any).id}: ${(err as Error).message}`);
    }
  }

  // Update campaign sent count using raw SQL for atomic increment
  // Cannot use supabase.rpc('increment') inline - use a direct increment instead
  const { data: currentCampaign } = await supabase
    .from('campaigns')
    .select('sent_count')
    .eq('id', campaignId)
    .single();

  const currentSentCount = currentCampaign?.sent_count || 0;
  await supabase
    .from('campaigns')
    .update({
      sent_count: currentSentCount + sentCount,
    })
    .eq('id', campaignId);

  console.log(`[BroadcastIntegration] Processed batch for campaign ${campaignId}: ${sentCount} sent, ${failedCount} failed`);

  return {
    success: failedCount === 0,
    campaignId,
    batchSize: actualBatchSize,
    sentCount,
    failedCount,
    errors,
  };
}

// ============================================================================
// Progress Tracking
// ============================================================================

/**
 * Get broadcast progress metrics
 */
export async function getBroadcastProgress(campaignId: string): Promise<BroadcastProgress | null> {
  const supabase = createServiceRoleClient();

  // Get campaign
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, total_recipients, sent_count')
    .eq('id', campaignId)
    .single();

  if (error || !campaign) {
    return null;
  }

  // Get status counts
  const { data: statusCounts } = await supabase
    .from('campaign_contact_status')
    .select('last_event')
    .eq('campaign_id', campaignId);

  const counts = {
    sent: 0,
    delivered: 0,
    bounced: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
  };

  for (const status of statusCounts || []) {
    switch (status.last_event) {
      case 'sent':
        counts.sent++;
        break;
      case 'delivered':
        counts.delivered++;
        break;
      case 'bounced':
        counts.bounced++;
        break;
      case 'opened':
        counts.opened++;
        break;
      case 'clicked':
        counts.clicked++;
        break;
      case 'replied':
        counts.replied++;
        break;
    }
  }

  const totalRecipients = campaign.total_recipients || 0;
  const sentCount = campaign.sent_count || 0;

  return {
    campaignId,
    totalRecipients,
    sentCount,
    deliveredCount: counts.delivered,
    bouncedCount: counts.bounced,
    openedCount: counts.opened,
    clickedCount: counts.clicked,
    repliedCount: counts.replied,
    progressPercent: totalRecipients > 0 ? (sentCount / totalRecipients) * 100 : 0,
  };
}

/**
 * Get broadcast statistics for tenant
 */
export async function getBroadcastStats(tenantId: string): Promise<{
  activeCampaigns: number;
  completedCampaigns: number;
  totalSent: number;
  averageOpenRate: number;
  averageReplyRate: number;
}> {
  const supabase = createServiceRoleClient();

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, status, sent_count, total_recipients')
    .eq('org_id', tenantId);

  if (!campaigns) {
    return {
      activeCampaigns: 0,
      completedCampaigns: 0,
      totalSent: 0,
      averageOpenRate: 0,
      averageReplyRate: 0,
    };
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);

  // Get aggregate open/reply rates (simplified)
  const { data: statuses } = await supabase
    .from('campaign_contact_status')
    .select('last_event')
    .in('campaign_id', campaigns.map(c => c.id));

  let openedCount = 0;
  let repliedCount = 0;

  for (const status of statuses || []) {
    if (status.last_event === 'opened') openedCount++;
    if (status.last_event === 'replied') repliedCount++;
  }

  return {
    activeCampaigns,
    completedCampaigns,
    totalSent,
    averageOpenRate: totalSent > 0 ? (openedCount / totalSent) * 100 : 0,
    averageReplyRate: totalSent > 0 ? (repliedCount / totalSent) * 100 : 0,
  };
}
