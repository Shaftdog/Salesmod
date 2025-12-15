/**
 * Campaign Metrics Calculation
 * Computes metrics on-demand from campaign_contact_status and other tables
 */

import { createClient } from '@/lib/supabase/server';
import type { CampaignMetrics } from './types';

/**
 * Get comprehensive metrics for a campaign
 * Calculates from campaign_contact_status for performance
 */
export async function getCampaignMetrics(
  campaignId: string,
  orgId: string
): Promise<CampaignMetrics> {
  const supabase = await createClient();

  // Get all contact statuses for this campaign
  const { data: statuses, error: statusError } = await supabase
    .from('campaign_contact_status')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('org_id', orgId);

  if (statusError) {
    console.error('[Metrics] Failed to fetch statuses:', statusError);
    throw new Error('Failed to calculate metrics');
  }

  const contacts = statuses || [];

  // Calculate basic counts
  const eventCounts = countBy(contacts, 'last_event');
  const sent = (eventCounts.sent || 0) + (eventCounts.replied || 0);
  const replied = eventCounts.replied || 0;
  const pending = eventCounts.pending || 0;
  const bounced = eventCounts.bounced || 0;
  const unsubscribed = eventCounts.unsubscribed || 0;

  // Calculate response rate
  const response_rate = sent > 0 ? replied / sent : 0;

  // Sentiment breakdown (only for replied contacts)
  const repliedContacts = contacts.filter(c => c.last_event === 'replied');
  const sentimentCounts = countBy(repliedContacts, 'last_sentiment');

  const sentiment = {
    positive: sentimentCounts.POSITIVE || 0,
    neutral: sentimentCounts.NEUTRAL || 0,
    negative: sentimentCounts.NEGATIVE || 0,
  };

  // Disposition breakdown
  const dispositionCounts = countBy(
    contacts.filter(c => c.last_disposition),
    'last_disposition'
  );

  // Get task stats
  const { data: tasks, error: tasksError } = await supabase
    .from('cards')
    .select('status')
    .eq('campaign_id', campaignId)
    .eq('org_id', orgId);

  if (tasksError) {
    console.warn('[Metrics] Failed to fetch tasks:', tasksError);
  }

  const taskStatusCounts = countBy(tasks || [], 'status');
  const totalTasks = tasks?.length || 0;
  const completedTasks = taskStatusCounts.completed || 0;
  const pendingTasks = totalTasks - completedTasks;

  // Get contacts that need follow-up
  const needs_follow_up = contacts
    .filter(c =>
      c.open_tasks_count > 0 &&
      ['NO_ACTIVE_PROFILE', 'NEEDS_MORE_INFO', 'ESCALATE_UNCLEAR'].includes(c.last_disposition)
    )
    .map(c => ({
      email_address: c.email_address,
      last_disposition: c.last_disposition || '',
      last_reply_summary: c.last_reply_summary || null,
    }));

  return {
    sent,
    replied,
    pending,
    bounced,
    unsubscribed,
    response_rate,
    sentiment,
    dispositions: dispositionCounts,
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
    },
    needs_follow_up,
  };
}

/**
 * Helper: Count by field
 */
function countBy<T>(array: T[], field: keyof T): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of array) {
    const value = String(item[field] || 'unknown');
    counts[value] = (counts[value] || 0) + 1;
  }

  return counts;
}

/**
 * Get simple metrics for campaign list view
 */
export async function getCampaignListMetrics(
  campaignIds: string[],
  orgId: string
): Promise<Record<string, { sent: number; replied: number; response_rate: number }>> {
  if (campaignIds.length === 0) return {};

  const supabase = await createClient();

  const { data: statuses, error } = await supabase
    .from('campaign_contact_status')
    .select('campaign_id, last_event')
    .in('campaign_id', campaignIds)
    .eq('org_id', orgId);

  if (error || !statuses) {
    console.error('[Metrics] Failed to fetch list metrics:', error);
    return {};
  }

  // Group by campaign
  const byCampaign: Record<string, typeof statuses> = {};
  for (const status of statuses) {
    if (!byCampaign[status.campaign_id]) {
      byCampaign[status.campaign_id] = [];
    }
    byCampaign[status.campaign_id].push(status);
  }

  // Calculate metrics for each campaign
  const metrics: Record<string, { sent: number; replied: number; response_rate: number }> = {};

  for (const [campaignId, contacts] of Object.entries(byCampaign)) {
    const eventCounts = countBy(contacts, 'last_event');
    const sent = (eventCounts.sent || 0) + (eventCounts.replied || 0);
    const replied = eventCounts.replied || 0;

    metrics[campaignId] = {
      sent,
      replied,
      response_rate: sent > 0 ? replied / sent : 0,
    };
  }

  return metrics;
}
