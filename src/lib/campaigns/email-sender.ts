/**
 * Email Sending Service for Campaigns
 *
 * V1 Mode: SIMULATION
 * - Logs email sends without actually sending
 * - Generates fake message IDs for testing
 * - Records sends in database
 *
 * Production Mode (Phase 7):
 * - Replace simulation with real email service (Resend/SendGrid)
 * - Keep the same interface
 */

import { createClient } from '@/lib/supabase/server';

export interface EmailSendRequest {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulation?: boolean;
}

/**
 * Send an email (simulation mode in V1)
 */
export async function sendEmail(request: EmailSendRequest): Promise<EmailSendResult> {
  // Check if we should use simulation mode
  const useSimulation = !process.env.EMAIL_SERVICE_ENABLED || process.env.NODE_ENV === 'test';

  if (useSimulation) {
    return simulateEmailSend(request);
  }

  // TODO Phase 7: Replace with real email service
  // Example for Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const { data, error } = await resend.emails.send({
  //   from: request.from || 'campaigns@salesmod.com',
  //   to: request.to,
  //   subject: request.subject,
  //   html: request.html,
  //   text: request.text,
  //   reply_to: request.replyTo,
  //   tags: request.metadata
  // });
  //
  // if (error) {
  //   return { success: false, error: error.message };
  // }
  //
  // return { success: true, messageId: data.id };

  return simulateEmailSend(request);
}

/**
 * Simulate email send for development/testing
 */
function simulateEmailSend(request: EmailSendRequest): EmailSendResult {
  // Generate fake message ID
  const messageId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Log the "send"
  console.log('📧 [SIMULATION] Email Send:', {
    messageId,
    to: request.to,
    subject: request.subject,
    from: request.from || 'campaigns@salesmod.com',
    bodyLength: request.html.length,
    metadata: request.metadata,
  });

  // Simulate slight delay
  // In real mode, this would be network time

  return {
    success: true,
    messageId,
    simulation: true,
  };
}

/**
 * Send campaign email to a recipient
 */
export async function sendCampaignEmail({
  campaignId,
  recipientEmail,
  subject,
  htmlBody,
  textBody,
  jobTaskId,
  metadata = {},
}: {
  campaignId: string;
  recipientEmail: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  jobTaskId: string;
  metadata?: Record<string, any>;
}): Promise<EmailSendResult> {
  const result = await sendEmail({
    to: recipientEmail,
    from: process.env.CAMPAIGN_FROM_EMAIL || 'campaigns@salesmod.com',
    subject,
    html: htmlBody,
    text: textBody,
    replyTo: process.env.CAMPAIGN_REPLY_TO_EMAIL,
    metadata: {
      campaignId,
      jobTaskId,
      ...metadata,
    },
  });

  // Log the send attempt in database
  if (result.success) {
    await logEmailSend({
      campaignId,
      recipientEmail,
      messageId: result.messageId!,
      jobTaskId,
      simulation: result.simulation || false,
    });
  }

  return result;
}

/**
 * Log email send in database
 */
async function logEmailSend({
  campaignId,
  recipientEmail,
  messageId,
  jobTaskId,
  simulation,
}: {
  campaignId: string;
  recipientEmail: string;
  messageId: string;
  jobTaskId: string;
  simulation: boolean;
}) {
  const supabase = await createClient();

  // Update campaign_contact_status
  await supabase
    .from('campaign_contact_status')
    .update({
      last_event: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('email_address', recipientEmail);

  // Update job_task
  await supabase
    .from('job_tasks')
    .update({
      status: 'completed',
      metadata: {
        email_message_id: messageId,
        sent_at: new Date().toISOString(),
        simulation,
      },
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobTaskId);

  console.log(`✅ Logged email send: ${recipientEmail} (${simulation ? 'SIMULATION' : 'REAL'})`);
}

/**
 * Handle email bounce (for Phase 7 webhook integration)
 */
export async function handleEmailBounce({
  messageId,
  bounceType,
  reason,
}: {
  messageId: string;
  bounceType: 'hard' | 'soft';
  reason: string;
}) {
  const supabase = await createClient();

  // Find the job_task by message_id
  const { data: task } = await supabase
    .from('job_tasks')
    .select('campaign_id, metadata')
    .contains('metadata', { email_message_id: messageId })
    .single();

  if (!task?.campaign_id) {
    console.warn('Could not find campaign for bounced message:', messageId);
    return;
  }

  const emailAddress = task.metadata.email_address;

  // Update contact status
  await supabase
    .from('campaign_contact_status')
    .update({
      last_event: 'bounced',
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', task.campaign_id)
    .eq('email_address', emailAddress);

  // Add to suppressions if hard bounce
  if (bounceType === 'hard') {
    await supabase
      .from('email_suppressions')
      .upsert(
        {
          org_id: task.metadata.org_id,
          email_address: emailAddress,
          reason: 'bounced',
          campaign_id: task.campaign_id,
        },
        { onConflict: 'org_id,email_address' }
      );
  }

  console.log(`📛 Handled ${bounceType} bounce: ${emailAddress} - ${reason}`);
}
