/**
 * Campaign Launch Logic
 * Handles launching a campaign: creates job, tasks, and contact status entries
 */

import { createClient } from '@/lib/supabase/server';
import { resolveTargetSegment } from './audience-resolver';
import { replaceMergeTokens, buildMergeData } from './merge-tokens';
import type { LaunchCampaignResponse } from './types';

/**
 * Launch a campaign
 * Creates job, tasks, and contact status entries
 */
export async function launchCampaign(
  campaignId: string,
  orgId: string
): Promise<LaunchCampaignResponse> {
  const supabase = await createClient();

  // Get campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('org_id', orgId)
    .single();

  if (campaignError || !campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'draft') {
    throw new Error('Campaign already launched');
  }

  // Resolve target audience (excludes suppressions)
  console.log('[Launch] Resolving audience for campaign:', campaignId);
  const recipients = await resolveTargetSegment(campaign.target_segment, orgId);

  if (recipients.length === 0) {
    throw new Error('No valid recipients after filtering suppressions');
  }

  console.log('[Launch] Found', recipients.length, 'recipients');

  // Create Job with first-class campaign_id
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      org_id: orgId,
      campaign_id: campaignId,
      name: campaign.name,
      role: 'outreach',
      description: campaign.description || `Email campaign: ${campaign.name}`,
      created_by: campaign.created_by,
      metadata: {
        rate_limit: {
          per_hour: campaign.send_rate_per_hour,
          batch_size: campaign.send_batch_size,
        },
        start_at: campaign.start_at,
      },
    })
    .select()
    .single();

  if (jobError || !job) {
    console.error('[Launch] Failed to create job:', jobError);
    throw new Error(`Failed to create job: ${jobError?.message}`);
  }

  console.log('[Launch] Created job:', job.id);

  // Create tasks with personalized content + first-class campaign_id
  const tasks = recipients.map(recipient => {
    // Build merge data
    const mergeData = buildMergeData(recipient);

    // Replace merge tokens
    const personalizedSubject = replaceMergeTokens(campaign.email_subject, mergeData);
    const personalizedBody = replaceMergeTokens(campaign.email_body, mergeData);

    return {
      org_id: orgId,
      job_id: job.id,
      campaign_id: campaignId, // FIRST-CLASS COLUMN
      contact_id: recipient.contact_id,
      client_id: recipient.client_id,
      email_address: recipient.email,
      status: 'pending',
      metadata: {
        email_subject: personalizedSubject,
        email_body: personalizedBody,
        merge_data: mergeData,
      },
    };
  });

  // Insert tasks in batches (Supabase has limits)
  const batchSize = 1000;
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const { error: tasksError } = await supabase.from('job_tasks').insert(batch);

    if (tasksError) {
      console.error('[Launch] Failed to create tasks batch:', tasksError);
      throw new Error(`Failed to create tasks: ${tasksError.message}`);
    }
  }

  console.log('[Launch] Created', tasks.length, 'job tasks');

  // Create campaign_contact_status rows
  const statusRows = recipients.map(r => ({
    org_id: orgId,
    campaign_id: campaignId,
    contact_id: r.contact_id,
    client_id: r.client_id,
    email_address: r.email,
    last_event: 'pending' as const,
  }));

  // Insert status rows in batches
  for (let i = 0; i < statusRows.length; i += batchSize) {
    const batch = statusRows.slice(i, i + batchSize);
    const { error: statusError } = await supabase
      .from('campaign_contact_status')
      .insert(batch);

    if (statusError) {
      console.error('[Launch] Failed to create status rows:', statusError);
      throw new Error(`Failed to create contact status: ${statusError.message}`);
    }
  }

  console.log('[Launch] Created', statusRows.length, 'contact status rows');

  // Update campaign status
  const newStatus = campaign.start_at ? 'scheduled' : 'active';

  const { error: updateError } = await supabase
    .from('campaigns')
    .update({
      primary_job_id: job.id,
      status: newStatus,
      launched_at: new Date().toISOString(),
    })
    .eq('id', campaignId);

  if (updateError) {
    console.error('[Launch] Failed to update campaign:', updateError);
    throw new Error(`Failed to update campaign: ${updateError.message}`);
  }

  console.log('[Launch] Campaign launched successfully. Status:', newStatus);

  // TODO: Schedule rate-limited execution
  // For now, the job exists and the Jobs AI agent can process it
  // In the future, implement:
  // - scheduleRateLimitedExecution(job.id, campaign.send_rate_per_hour)
  // - scheduleDelayedExecution(job.id, campaign.start_at) if scheduled

  return {
    campaign_id: campaignId,
    job_id: job.id,
    recipients_count: recipients.length,
  };
}
