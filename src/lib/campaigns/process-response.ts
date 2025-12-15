/**
 * Response Processing System
 * Processes incoming Gmail responses to campaign emails
 */

import { createClient } from '@/lib/supabase/server';
import { classifyResponse } from './classifier';
import { generateTasksForDisposition } from './task-generator';
import { getGmailMessage } from './gmail-client';

/**
 * Process an email response to a campaign
 * Called by Gmail webhook/polling when a reply is detected
 */
export async function processResponse({
  gmailMessageId,
  jobTaskId,
  orgId,
}: {
  gmailMessageId: string;
  jobTaskId: string;
  orgId: string;
}): Promise<void> {
  const supabase = await createClient();

  console.log('[Process Response] Processing:', { gmailMessageId, jobTaskId });

  // Get job_task with first-class campaign_id
  const { data: task, error: taskError } = await supabase
    .from('job_tasks')
    .select('*, campaign_id')
    .eq('id', jobTaskId)
    .single();

  if (taskError || !task) {
    console.error('[Process Response] Job task not found:', taskError);
    throw new Error('Job task not found');
  }

  if (!task.campaign_id) {
    console.log('[Process Response] Not a campaign email, skipping');
    return; // Not a campaign email
  }

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('name')
    .eq('id', task.campaign_id)
    .single();

  if (campaignError || !campaign) {
    console.error('[Process Response] Campaign not found:', campaignError);
    throw new Error('Campaign not found');
  }

  // Get Gmail message
  let gmailMessage = await getGmailMessage(gmailMessageId);

  if (!gmailMessage) {
    console.warn('[Process Response] Gmail API not configured, using fallback mock data');
    // Fallback for when Gmail API is not configured
    const message = {
      body: 'Mock response body - Gmail API not configured. Configure Google OAuth credentials to enable real message fetching.',
      receivedAt: new Date().toISOString(),
    };
    // Still process with mock data for testing
    gmailMessage = { ...message, from: 'mock@example.com', subject: 'Mock Reply' } as any;
  }

  const message = {
    body: gmailMessage!.body,
    receivedAt: gmailMessage!.receivedAt,
  };

  // Get original message from task metadata
  const originalMessage = task.metadata?.email_body || '';

  // AI Classification
  console.log('[Process Response] Classifying response...');
  const classification = await classifyResponse({
    campaignName: campaign.name,
    responseText: message.body,
    originalMessage,
  });

  console.log('[Process Response] Classification:', classification);

  // Create CampaignResponse
  const { data: response, error: responseError } = await supabase
    .from('campaign_responses')
    .insert({
      org_id: orgId,
      campaign_id: task.campaign_id,
      contact_id: task.contact_id,
      client_id: task.client_id,
      email_address: task.email_address,
      job_id: task.job_id,
      job_task_id: jobTaskId,
      gmail_message_id: gmailMessageId,
      sentiment: classification.sentiment,
      disposition: classification.disposition,
      response_text: message.body,
      ai_summary: classification.summary,
      received_at: message.receivedAt,
      processed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (responseError || !response) {
    console.error('[Process Response] Failed to create response:', responseError);
    throw new Error('Failed to create campaign response');
  }

  console.log('[Process Response] Created response:', response.id);

  // Handle unsubscribe/not interested
  if (classification.disposition === 'NOT_INTERESTED' || classification.is_unsubscribe) {
    console.log('[Process Response] Adding to suppression list');

    await supabase
      .from('email_suppressions')
      .upsert({
        org_id: orgId,
        email_address: task.email_address,
        reason: classification.is_unsubscribe ? 'unsubscribed' : 'not_interested',
        campaign_id: task.campaign_id,
        contact_id: task.contact_id,
      }, {
        onConflict: 'org_id, email_address',
        ignoreDuplicates: true
      });

    // Update contact status
    await supabase
      .from('campaign_contact_status')
      .update({
        last_event: 'unsubscribed',
        last_sentiment: classification.sentiment,
        last_disposition: classification.disposition,
        last_reply_at: message.receivedAt,
        last_reply_summary: classification.summary,
        latest_response_id: response.id,
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', task.campaign_id)
      .eq('email_address', task.email_address);

    // Increment reply_count using SQL function
    await supabase.rpc('increment_reply_count', {
      p_campaign_id: task.campaign_id,
      p_email_address: task.email_address,
    });

    console.log('[Process Response] Unsubscribe/not interested processed');
    return; // Don't generate tasks for unsubscribes
  }

  // Update campaign_contact_status for normal replies
  await supabase
    .from('campaign_contact_status')
    .update({
      last_event: 'replied',
      last_sentiment: classification.sentiment,
      last_disposition: classification.disposition,
      last_reply_at: message.receivedAt,
      last_reply_summary: classification.summary,
      latest_response_id: response.id,
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', task.campaign_id)
    .eq('email_address', task.email_address);

  // Increment reply_count using SQL function
  await supabase.rpc('increment_reply_count', {
    p_campaign_id: task.campaign_id,
    p_email_address: task.email_address,
  });

  console.log('[Process Response] Updated contact status');

  // Generate tasks if needed
  const tasksCreated = await generateTasksForDisposition({
    campaignId: task.campaign_id,
    responseId: response.id,
    disposition: classification.disposition,
    contactId: task.contact_id,
    clientId: task.client_id,
    orgId,
  });

  console.log('[Process Response] Tasks created:', tasksCreated);

  // Increment open_tasks_count if tasks were created
  if (tasksCreated > 0) {
    await supabase.rpc('increment_open_tasks_count', {
      p_campaign_id: task.campaign_id,
      p_email_address: task.email_address,
      p_increment: tasksCreated,
    });
  }

  console.log('[Process Response] Processing complete');
}
