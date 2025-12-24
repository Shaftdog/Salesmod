import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmailThroughGate, EmailPayload } from '@/lib/email/email-sender';

/**
 * POST /api/email/send
 * Send an email via the central email gate with rollout controls
 *
 * All emails go through sendEmailThroughGate() which enforces:
 * - Email mode controls (dry_run, internal_only, limited_live, live)
 * - Rate limiting per tenant
 * - Audit logging for all send attempts
 * - Suppression list checking
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
    const { to, subject, html, text, replyTo, contactId, cardId } = body;

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

    // Build email payload
    const emailPayload: EmailPayload = {
      to,
      subject,
      html,
      text,
      replyTo,
      contactId,
      cardId,
      source: 'api' as const,
    };

    // Send through central gate (handles mode enforcement, rate limits, logging)
    const result = await sendEmailThroughGate(tenantId, user.id, emailPayload);

    // Log activity for UI visibility
    await supabase.from('activities').insert({
      activity_type: 'email',
      subject,
      description: result.success
        ? `Email ${result.simulated ? 'sent (simulated)' : 'sent'} to ${to}${result.messageId ? ` (ID: ${result.messageId})` : ''}`
        : `Email failed to ${to}: ${result.error}`,
      status: 'completed',
      completed_at: new Date().toISOString(),
      outcome: result.success ? 'sent' : (result.blocked ? 'blocked' : 'failed'),
      created_by: user.id,
      tenant_id: tenantId,
      metadata: {
        to,
        mode: result.mode,
        simulated: result.simulated,
        messageId: result.messageId,
        blocked: result.blocked,
        error: result.error,
      },
    });

    if (!result.success) {
      const statusCode = result.blocked ? 429 : 500;
      return NextResponse.json(
        {
          error: result.error,
          mode: result.mode,
          blocked: result.blocked,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      simulated: result.simulated,
      mode: result.mode,
    });
  } catch (error: any) {
    console.error('[Email API] Send failed:', error);
    return NextResponse.json(
      { error: error.message || 'Email send failed' },
      { status: 500 }
    );
  }
}
