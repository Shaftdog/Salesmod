/**
 * Email Sending Service for Campaigns
 *
 * Routes all email through the central sendEmailThroughGate() which enforces:
 * - Email mode controls (dry_run, internal_only, limited_live, live)
 * - Rate limiting per tenant
 * - Audit logging for all send attempts
 * - Suppression list checking
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmailThroughGate, EmailPayload, EmailSendResult as GateResult } from '@/lib/email/email-sender';

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
 * Send an email using the central email gate
 * This is a thin wrapper that provides backwards compatibility
 *
 * @deprecated Use sendCampaignEmailWithGate for new code
 */
export async function sendEmail(request: EmailSendRequest): Promise<EmailSendResult> {
  // For backwards compatibility, simulate without tenant context
  // New code should use sendCampaignEmailWithGate which requires tenant context
  console.log('[Email Sender] sendEmail() called without tenant context - using simulation mode');

  const messageId = `sim_legacy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log('📧 [SIMULATION] Email Send (legacy):', {
    messageId,
    to: request.to,
    subject: request.subject,
    from: request.from || 'campaigns@salesmod.com',
    bodyLength: request.html.length,
    metadata: request.metadata,
  });

  return {
    success: true,
    messageId,
    simulation: true,
  };
}

/**
 * Send campaign email to a recipient with tenant context
 * Uses the central email gate for mode enforcement and logging
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
  const serviceClient = createServiceRoleClient();

  // Get tenant_id from campaign
  const { data: campaign, error: campaignError } = await serviceClient
    .from('campaigns')
    .select('tenant_id, org_id, created_by')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign?.tenant_id) {
    console.error('[Campaign Email] Cannot get tenant from campaign:', campaignError);
    return {
      success: false,
      error: 'Cannot determine tenant for campaign',
    };
  }

  const tenantId = campaign.tenant_id;
  const userId = campaign.created_by || 'system'; // Use campaign creator or 'system' for automated sends

  // Build email payload for central gate
  const emailPayload: EmailPayload = {
    to: recipientEmail,
    subject,
    html: htmlBody,
    text: textBody,
    from: process.env.CAMPAIGN_FROM_EMAIL || 'campaigns@salesmod.com',
    replyTo: process.env.CAMPAIGN_REPLY_TO_EMAIL,
    contactId: metadata.contact_id,
    source: 'campaign' as const,
  };

  // Send through central gate
  const gateResult = await sendEmailThroughGate(tenantId, userId, emailPayload);

  // Log the send attempt in database (campaign-specific logging)
  if (gateResult.success) {
    await logCampaignEmailSend({
      campaignId,
      recipientEmail,
      messageId: gateResult.messageId!,
      jobTaskId,
      simulation: gateResult.simulated,
      mode: gateResult.mode,
    });
  }

  // Map gate result to EmailSendResult for backwards compatibility
  return {
    success: gateResult.success,
    messageId: gateResult.messageId,
    error: gateResult.error,
    simulation: gateResult.simulated,
  };
}

/**
 * Log campaign email send in database
 */
async function logCampaignEmailSend({
  campaignId,
  recipientEmail,
  messageId,
  jobTaskId,
  simulation,
  mode,
}: {
  campaignId: string;
  recipientEmail: string;
  messageId: string;
  jobTaskId: string;
  simulation: boolean;
  mode: string;
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
        mode,
      },
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobTaskId);

  console.log(`✅ Campaign email logged: ${recipientEmail} (${simulation ? `SIMULATION:${mode}` : `REAL:${mode}`})`);
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
