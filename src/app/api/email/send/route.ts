import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/email/send
 * Send an email via Resend
 * 
 * Note: This is a placeholder. Install Resend with: npm install resend
 * Then import and use: import { Resend } from 'resend';
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

    // Check suppressions
    if (contactId) {
      const { data: suppression } = await supabase
        .from('email_suppressions')
        .select('*')
        .eq('org_id', user.id)
        .eq('contact_id', contactId)
        .single();

      if (suppression) {
        return NextResponse.json(
          {
            error: 'Email address is suppressed',
            reason: suppression.reason,
          },
          { status: 403 }
        );
      }
    }

    // Check daily send limit
    const { data: settings } = await supabase
      .from('agent_settings')
      .select('daily_send_limit')
      .eq('org_id', user.id)
      .single();

    const dailyLimit = settings?.daily_send_limit || 50;

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    // Count emails sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: sentToday } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .eq('activity_type', 'email')
      .eq('outcome', 'sent')
      .gte('created_at', today.toISOString());

    if (sentToday && sentToday >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily send limit reached (${dailyLimit} emails)` },
        { status: 429 }
      );
    }

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey || resendApiKey === 're_YOUR_API_KEY_HERE') {
      // Fallback to simulation if Resend not configured
      console.log('Email send (simulated - no Resend key):', { to, subject });
      const messageId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await supabase.from('activities').insert({
        activity_type: 'email',
        subject,
        description: `Email sent (simulated) to ${to}`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: 'sent',
        created_by: user.id,
        tenant_id: profile.tenant_id,
      });
      
      return NextResponse.json({
        success: true,
        messageId,
        simulated: true,
      });
    }

    // Real Resend send
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: replyTo || 'Admin <Admin@roiappraise.com>',
          to: to, // Must be a string
          subject,
          html,
          text,
          reply_to: replyTo || 'Admin@roiappraise.com',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      const messageId = data.id;

      // Log the email send
      await supabase.from('activities').insert({
        activity_type: 'email',
        subject,
        description: `Email sent to ${to} (ID: ${messageId})`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: 'sent',
        created_by: user.id,
        tenant_id: profile.tenant_id,
      });

      return NextResponse.json({
        success: true,
        messageId,
        simulated: false,
      });
    } catch (resendError: any) {
      console.error('Resend send error:', resendError);
      
      // Log failed send
      await supabase.from('activities').insert({
        activity_type: 'email',
        subject,
        description: `Email failed to ${to}: ${resendError.message}`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: 'failed',
        created_by: user.id,
        tenant_id: profile.tenant_id,
      });

      return NextResponse.json(
        { error: `Email send failed: ${resendError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Email send failed:', error);
    return NextResponse.json(
      { error: error.message || 'Email send failed' },
      { status: 500 }
    );
  }
}


