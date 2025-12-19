import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  checkEmailSendPermission,
  getEmailConfig,
} from '@/lib/email/email-config';
import {
  recordPolicyBlock,
  recordEmailProviderFailure,
  checkEmailVolumeSpike,
} from '@/lib/agent/agent-config';

/**
 * POST /api/email/send
 * Send an email via Resend with rollout controls
 *
 * Send modes:
 * - dry_run: Log only, no actual send
 * - internal_only: Send only to approved domains/emails
 * - limited_live: Send with strict per-tenant rate limits
 * - live: Full production sending
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { to, subject, html, text, replyTo, contactId } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      );
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    const tenantId = profile.tenant_id;

    // Check suppressions
    if (contactId) {
      const { data: suppression } = await supabase
        .from('email_suppressions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('contact_id', contactId)
        .single();

      if (suppression) {
        return NextResponse.json(
          {
            error: 'Email address is suppressed',
            reason: suppression.reason,
            bounceType: suppression.bounce_type,
          },
          { status: 403 }
        );
      }
    }

    // Check send permission based on mode and rate limits
    const sendCheck = await checkEmailSendPermission(tenantId, to);

    if (!sendCheck.allowed) {
      // Log the blocked send attempt
      await supabase.from('activities').insert({
        activity_type: 'email',
        subject,
        description: `Email blocked: ${sendCheck.reason}`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: 'blocked',
        created_by: user.id,
        tenant_id: tenantId,
        metadata: {
          to,
          mode: sendCheck.mode,
          reason: sendCheck.reason,
        },
      });

      // Record policy block for alerting
      await recordPolicyBlock(tenantId, `email_${sendCheck.mode}`, sendCheck.reason || 'Unknown');

      return NextResponse.json(
        {
          error: sendCheck.reason,
          mode: sendCheck.mode,
          blocked: true,
        },
        { status: 429 }
      );
    }

    // Get email config for from address
    const emailConfig = await getEmailConfig(tenantId);

    // If should simulate (dry-run or internal-only blocked), log and return
    if (sendCheck.shouldSimulate) {
      console.log(`[Email] Simulated send (${sendCheck.mode}):`, { to, subject });
      const messageId = `sim_${sendCheck.mode}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await supabase.from('activities').insert({
        activity_type: 'email',
        subject,
        description: `Email sent (simulated - ${sendCheck.mode}) to ${to}`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: 'sent',
        created_by: user.id,
        tenant_id: tenantId,
        metadata: {
          to,
          mode: sendCheck.mode,
          simulated: true,
          messageId,
        },
      });

      return NextResponse.json({
        success: true,
        messageId,
        simulated: true,
        mode: sendCheck.mode,
      });
    }

    // Real send via Resend
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey || resendApiKey === 're_YOUR_API_KEY_HERE') {
      // Fallback to simulation if Resend not configured
      console.log('[Email] Simulated send (no Resend key):', { to, subject });
      const messageId = `sim_no_key_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await supabase.from('activities').insert({
        activity_type: 'email',
        subject,
        description: `Email sent (simulated - no API key) to ${to}`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: 'sent',
        created_by: user.id,
        tenant_id: tenantId,
        metadata: {
          to,
          mode: sendCheck.mode,
          simulated: true,
          reason: 'RESEND_API_KEY not configured',
          messageId,
        },
      });

      return NextResponse.json({
        success: true,
        messageId,
        simulated: true,
        mode: sendCheck.mode,
        reason: 'RESEND_API_KEY not configured',
      });
    }

    // Send via Resend API
    try {
      const fromAddress = replyTo || `${emailConfig.fromName} <${emailConfig.fromEmail}>`;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to,
          subject,
          html,
          text,
          reply_to: replyTo || emailConfig.replyToEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      const messageId = data.id;

      // Log successful send
      await supabase.from('activities').insert({
        activity_type: 'email',
        subject,
        description: `Email sent to ${to} (ID: ${messageId})`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: 'sent',
        created_by: user.id,
        tenant_id: tenantId,
        metadata: {
          to,
          mode: sendCheck.mode,
          simulated: false,
          messageId,
        },
      });

      // Check for volume spike (async, don't block response)
      checkEmailVolumeSpike(tenantId, 1).catch(() => {
        // Ignore errors in volume spike check
      });

      return NextResponse.json({
        success: true,
        messageId,
        simulated: false,
        mode: sendCheck.mode,
      });
    } catch (resendError: any) {
      console.error('[Email] Resend send error:', resendError);

      // Record provider failure for alerting
      const errorType = resendError.message?.includes('401') ? 'auth_error' :
                       resendError.message?.includes('429') ? 'rate_limit' :
                       resendError.message?.includes('5') ? 'server_error' : 'unknown';
      await recordEmailProviderFailure(tenantId, errorType, resendError.message);

      // Log failed send
      await supabase.from('activities').insert({
        activity_type: 'email',
        subject,
        description: `Email failed to ${to}: ${resendError.message}`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: 'failed',
        created_by: user.id,
        tenant_id: tenantId,
        metadata: {
          to,
          mode: sendCheck.mode,
          error: resendError.message,
        },
      });

      return NextResponse.json(
        {
          error: `Email send failed: ${resendError.message}`,
          mode: sendCheck.mode,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Email] Send failed:', error);
    return NextResponse.json(
      { error: error.message || 'Email send failed' },
      { status: 500 }
    );
  }
}
