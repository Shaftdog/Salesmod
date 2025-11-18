/**
 * Campaign Job Executor
 *
 * Processes campaign jobs with rate limiting:
 * - Respects send_rate_per_hour from campaign
 * - Processes tasks in batches
 * - Updates campaign_contact_status
 * - Handles scheduled campaigns (start_at)
 *
 * This can be called from:
 * - Cron job (every 5-15 minutes)
 * - API endpoint for manual trigger
 * - Background worker
 */

import { createClient } from '@/lib/supabase/server';
import { sendCampaignEmail } from './email-sender';
import { replaceMergeTokens } from './merge-tokens';

export interface JobExecutionResult {
  jobId: string;
  campaignId: string;
  tasksProcessed: number;
  emailsSent: number;
  errors: number;
  rateLimitReached: boolean;
}

/**
 * Execute all pending campaign jobs
 * Called by cron or background worker
 */
export async function executeCampaignJobs(): Promise<JobExecutionResult[]> {
  const supabase = await createClient();

  // Find all jobs for active campaigns with pending tasks
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id,
      campaign_id,
      metadata,
      campaigns!inner (
        id,
        status,
        start_at,
        send_rate_per_hour,
        send_batch_size,
        email_subject,
        email_body
      )
    `)
    .not('campaign_id', 'is', null)
    .in('campaigns.status', ['active', 'scheduled'])
    .order('created_at', { ascending: true });

  if (!jobs || jobs.length === 0) {
    console.log('No active campaign jobs to process');
    return [];
  }

  const results: JobExecutionResult[] = [];

  for (const job of jobs) {
    const campaign = job.campaigns;

    // Skip if scheduled for future
    if (campaign.start_at && new Date(campaign.start_at) > new Date()) {
      console.log(`Campaign ${campaign.id} scheduled for ${campaign.start_at}, skipping`);
      continue;
    }

    // Process this job
    const result = await executeJobWithRateLimit({
      jobId: job.id,
      campaignId: campaign.id,
      sendRatePerHour: campaign.send_rate_per_hour || 75,
      batchSize: campaign.send_batch_size || 25,
      emailSubject: campaign.email_subject!,
      emailBody: campaign.email_body!,
    });

    results.push(result);
  }

  return results;
}

/**
 * Execute a single campaign job with rate limiting
 */
export async function executeJobWithRateLimit({
  jobId,
  campaignId,
  sendRatePerHour,
  batchSize,
  emailSubject,
  emailBody,
}: {
  jobId: string;
  campaignId: string;
  sendRatePerHour: number;
  batchSize: number;
  emailSubject: string;
  emailBody: string;
}): Promise<JobExecutionResult> {
  const supabase = await createClient();

  // Calculate rate limit window
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check how many emails sent in last hour for this campaign
  const { data: recentSends, count: sentInLastHour } = await supabase
    .from('campaign_contact_status')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('last_event', 'sent')
    .gte('sent_at', oneHourAgo.toISOString());

  const remainingInWindow = sendRatePerHour - (sentInLastHour || 0);

  if (remainingInWindow <= 0) {
    console.log(`Rate limit reached for campaign ${campaignId}: ${sentInLastHour}/${sendRatePerHour} in last hour`);
    return {
      jobId,
      campaignId,
      tasksProcessed: 0,
      emailsSent: 0,
      errors: 0,
      rateLimitReached: true,
    };
  }

  // Determine batch size (don't exceed rate limit)
  const actualBatchSize = Math.min(batchSize, remainingInWindow);

  // Get pending tasks
  const { data: tasks } = await supabase
    .from('job_tasks')
    .select('*')
    .eq('job_id', jobId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(actualBatchSize);

  if (!tasks || tasks.length === 0) {
    console.log(`No pending tasks for job ${jobId}`);

    // Check if job is complete
    await checkAndCompleteJob(jobId, campaignId);

    return {
      jobId,
      campaignId,
      tasksProcessed: 0,
      emailsSent: 0,
      errors: 0,
      rateLimitReached: false,
    };
  }

  console.log(`Processing ${tasks.length} tasks for campaign ${campaignId} (rate limit: ${remainingInWindow} remaining)`);

  let emailsSent = 0;
  let errors = 0;

  // Process each task
  for (const task of tasks) {
    try {
      // Build merge data for this recipient
      const mergeData = task.metadata?.merge_data || {};

      // Replace merge tokens
      const personalizedSubject = replaceMergeTokens(emailSubject, mergeData);
      const personalizedBody = replaceMergeTokens(emailBody, mergeData);

      // Send email (simulation mode in V1)
      const result = await sendCampaignEmail({
        campaignId,
        recipientEmail: task.metadata.email_address,
        subject: personalizedSubject,
        htmlBody: personalizedBody,
        jobTaskId: task.id,
        metadata: {
          contact_id: task.contact_id,
          client_id: task.metadata.client_id,
        },
      });

      if (result.success) {
        emailsSent++;
      } else {
        errors++;
        console.error(`Failed to send email to ${task.metadata.email_address}:`, result.error);

        // Mark task as failed
        await supabase
          .from('job_tasks')
          .update({
            status: 'failed',
            metadata: {
              ...task.metadata,
              error: result.error,
              failed_at: new Date().toISOString(),
            },
          })
          .eq('id', task.id);

        // Update contact status
        await supabase
          .from('campaign_contact_status')
          .update({
            last_event: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId)
          .eq('email_address', task.metadata.email_address);
      }
    } catch (error) {
      errors++;
      console.error(`Error processing task ${task.id}:`, error);
    }
  }

  // Check if job is complete
  await checkAndCompleteJob(jobId, campaignId);

  return {
    jobId,
    campaignId,
    tasksProcessed: tasks.length,
    emailsSent,
    errors,
    rateLimitReached: remainingInWindow <= actualBatchSize,
  };
}

/**
 * Check if job is complete and update campaign status
 */
async function checkAndCompleteJob(jobId: string, campaignId: string) {
  const supabase = await createClient();

  // Check if any pending tasks remain
  const { count: pendingCount } = await supabase
    .from('job_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .eq('status', 'pending');

  if (pendingCount === 0) {
    // Mark job as completed
    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Mark campaign as completed
    await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    console.log(`✅ Campaign ${campaignId} completed!`);
  }
}

/**
 * Manual execution trigger (for testing or admin use)
 */
export async function triggerCampaignExecution(campaignId: string): Promise<JobExecutionResult | null> {
  const supabase = await createClient();

  // Get campaign and its job
  const { data: campaign } = await supabase
    .from('campaigns')
    .select(`
      id,
      status,
      start_at,
      send_rate_per_hour,
      send_batch_size,
      email_subject,
      email_body,
      primary_job_id
    `)
    .eq('id', campaignId)
    .single();

  if (!campaign || !campaign.primary_job_id) {
    console.error('Campaign not found or no job associated');
    return null;
  }

  if (campaign.status !== 'active') {
    console.error('Campaign is not active');
    return null;
  }

  // Execute the job
  return executeJobWithRateLimit({
    jobId: campaign.primary_job_id,
    campaignId: campaign.id,
    sendRatePerHour: campaign.send_rate_per_hour || 75,
    batchSize: campaign.send_batch_size || 25,
    emailSubject: campaign.email_subject!,
    emailBody: campaign.email_body!,
  });
}
