/**
 * Central Email Sending Service
 *
 * ALL email sending MUST go through this service to enforce:
 * - Email mode controls (dry_run, internal_only, limited_live, live)
 * - Rate limiting per tenant
 * - Audit logging for all send attempts
 * - Suppression list checking
 *
 * This is the ONLY place that should call the Resend API.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  checkEmailSendPermission,
  getEmailConfig,
  EmailSendCheck,
  EmailConfig,
} from './email-config';
import {
  recordEmailProviderFailure,
  checkEmailVolumeSpike,
  recordPolicyBlock,
} from '@/lib/agent/agent-config';

// ============================================================================
// Types
// ============================================================================

export interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  contactId?: string;
  cardId?: string;
  source: 'agent' | 'api' | 'campaign' | 'invoice' | 'broadcast' | 'manual';
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  simulated: boolean;
  mode: string;
  error?: string;
  blocked?: boolean;
}

// ============================================================================
// Central Email Sending Gate
// ============================================================================

/**
 * Send an email through the central gate.
 * This is the ONLY function that should be used to send emails.
 *
 * Enforces:
 * - dry_run: Log only, no actual send
 * - internal_only: Send only to approved domains/emails
 * - limited_live: Send with strict per-tenant rate limits
 * - live: Full production sending
 *
 * All sends are logged to email_send_log table for auditing.
 */
export async function sendEmailThroughGate(
  tenantId: string,
  userId: string,
  payload: EmailPayload
): Promise<EmailSendResult> {
  const supabase = createServiceRoleClient();
  const startTime = Date.now();

  // Validate required fields
  if (!payload.to || !payload.subject || (!payload.html && !payload.text)) {
    return {
      success: false,
      simulated: true,
      mode: 'validation_failed',
      error: 'Missing required fields: to, subject, and html or text',
    };
  }

  // Check suppressions first
  if (payload.contactId) {
    const { data: suppression } = await supabase
      .from('email_suppressions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('contact_id', payload.contactId)
      .single();

    if (suppression) {
      await logEmailSend(supabase, {
        tenantId,
        userId,
        payload,
        result: {
          success: false,
          simulated: true,
          mode: 'suppressed',
          blocked: true,
          error: `Email address is suppressed: ${suppression.reason}`,
        },
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        simulated: true,
        mode: 'suppressed',
        blocked: true,
        error: `Email address is suppressed: ${suppression.reason}`,
      };
    }
  }

  // Check send permission based on mode and rate limits
  const sendCheck = await checkEmailSendPermission(tenantId, payload.to);

  if (!sendCheck.allowed) {
    // Record policy block for alerting
    await recordPolicyBlock(tenantId, `email_${sendCheck.mode}`, sendCheck.reason || 'Unknown');

    await logEmailSend(supabase, {
      tenantId,
      userId,
      payload,
      result: {
        success: false,
        simulated: true,
        mode: sendCheck.mode,
        blocked: true,
        error: sendCheck.reason,
      },
      durationMs: Date.now() - startTime,
    });

    return {
      success: false,
      simulated: true,
      mode: sendCheck.mode,
      blocked: true,
      error: sendCheck.reason,
    };
  }

  // Get email config for from address
  const emailConfig = await getEmailConfig(tenantId);

  // Handle simulation modes (dry_run or internal_only blocked)
  if (sendCheck.shouldSimulate) {
    const messageId = `sim_${sendCheck.mode}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log(`[EmailGate] Simulated send (${sendCheck.mode}):`, {
      to: payload.to,
      subject: payload.subject,
      source: payload.source,
    });

    await logEmailSend(supabase, {
      tenantId,
      userId,
      payload,
      result: {
        success: true,
        messageId,
        simulated: true,
        mode: sendCheck.mode,
      },
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      messageId,
      simulated: true,
      mode: sendCheck.mode,
    };
  }

  // Real send via Resend
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey || resendApiKey === 're_YOUR_API_KEY_HERE') {
    // Fallback to simulation if Resend not configured
    const messageId = `sim_no_key_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('[EmailGate] Simulated send (no Resend key):', {
      to: payload.to,
      subject: payload.subject,
    });

    await logEmailSend(supabase, {
      tenantId,
      userId,
      payload,
      result: {
        success: true,
        messageId,
        simulated: true,
        mode: 'no_api_key',
      },
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      messageId,
      simulated: true,
      mode: 'no_api_key',
    };
  }

  // Actual Resend API call
  try {
    const fromAddress = payload.from || `${emailConfig.fromName} <${emailConfig.fromEmail}>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.replyTo || emailConfig.replyToEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const messageId = data.id;

    // Check for volume spike (async, don't block response)
    checkEmailVolumeSpike(tenantId, 1).catch(() => {});

    await logEmailSend(supabase, {
      tenantId,
      userId,
      payload,
      result: {
        success: true,
        messageId,
        simulated: false,
        mode: sendCheck.mode,
      },
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      messageId,
      simulated: false,
      mode: sendCheck.mode,
    };
  } catch (resendError: any) {
    console.error('[EmailGate] Resend send error:', resendError);

    // Record provider failure for alerting
    const errorType = resendError.message?.includes('401')
      ? 'auth_error'
      : resendError.message?.includes('429')
        ? 'rate_limit'
        : resendError.message?.includes('5')
          ? 'server_error'
          : 'unknown';
    await recordEmailProviderFailure(tenantId, errorType, resendError.message);

    await logEmailSend(supabase, {
      tenantId,
      userId,
      payload,
      result: {
        success: false,
        simulated: false,
        mode: sendCheck.mode,
        error: resendError.message,
      },
      durationMs: Date.now() - startTime,
    });

    return {
      success: false,
      simulated: false,
      mode: sendCheck.mode,
      error: resendError.message,
    };
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

interface LogEntry {
  tenantId: string;
  userId: string;
  payload: EmailPayload;
  result: EmailSendResult;
  durationMs: number;
}

async function logEmailSend(supabase: any, entry: LogEntry): Promise<void> {
  try {
    await supabase.from('email_send_log').insert({
      tenant_id: entry.tenantId,
      user_id: entry.userId,
      to_email: entry.payload.to,
      subject: entry.payload.subject,
      source: entry.payload.source,
      contact_id: entry.payload.contactId,
      card_id: entry.payload.cardId,
      mode: entry.result.mode,
      simulated: entry.result.simulated,
      success: entry.result.success,
      blocked: entry.result.blocked || false,
      message_id: entry.result.messageId,
      error: entry.result.error,
      duration_ms: entry.durationMs,
      payload_preview: {
        hasHtml: !!entry.payload.html,
        hasText: !!entry.payload.text,
        from: entry.payload.from,
        replyTo: entry.payload.replyTo,
        // Don't log full content for privacy
        subjectLength: entry.payload.subject.length,
        htmlLength: entry.payload.html?.length || 0,
        textLength: entry.payload.text?.length || 0,
      },
    });
  } catch (error) {
    // Table may not exist yet - log to console
    console.warn('[EmailGate] Could not log email send:', {
      to: entry.payload.to,
      mode: entry.result.mode,
      success: entry.result.success,
      error,
    });
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if an email would be allowed to send (without actually sending)
 */
export async function wouldEmailSend(
  tenantId: string,
  recipientEmail: string
): Promise<EmailSendCheck> {
  return await checkEmailSendPermission(tenantId, recipientEmail);
}

/**
 * Get current email configuration for a tenant
 */
export async function getTenantEmailConfig(tenantId: string): Promise<EmailConfig> {
  return await getEmailConfig(tenantId);
}
