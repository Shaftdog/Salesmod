import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Webhook } from 'svix';

/**
 * Handle email bounce events
 */
async function handleBounce(supabase: any, data: any) {
  try {
    // Extract email address (handle both string and array formats)
    const emailAddress = Array.isArray(data.to) ? data.to[0] : data.to;

    if (!emailAddress) {
      console.error('Bounce event missing recipient email:', data);
      return;
    }

    console.log('[Webhook] Processing bounce for:', emailAddress);

    // Look up contact by email address
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, client_id')
      .eq('email', emailAddress)
      .single();

    if (contactError || !contact) {
      console.error('Contact not found for bounced email:', emailAddress, contactError);
      // Still create suppression without contact_id
      return;
    }

    // SECURITY: Get tenant_id from contact's client for proper tenant isolation
    const { data: client } = await supabase
      .from('clients')
      .select('tenant_id')
      .eq('id', contact.client_id)
      .single();

    const tenantId = client?.tenant_id;

    if (!tenantId) {
      console.error('Could not determine tenant_id for contact:', contact.id);
      return;
    }

    // Determine bounce type and severity
    const bounceType = data.bounce?.type || 'Unknown'; // Permanent, Transient, Unknown
    const bounceSubType = data.bounce?.subType || '';
    const bounceMessage = data.bounce?.message || 'Email bounced';
    const isHardBounce = bounceType === 'Permanent';

    console.log('[Webhook] Bounce details:', {
      contactId: contact.id,
      type: bounceType,
      subType: bounceSubType,
      isHard: isHardBounce,
    });

    // Check if suppression already exists
    const { data: existingSuppression } = await supabase
      .from('email_suppressions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('contact_id', contact.id)
      .single();

    if (isHardBounce) {
      // Hard bounce - immediate suppression
      if (!existingSuppression) {
        await supabase.from('email_suppressions').insert({
          tenant_id: tenantId,
          contact_id: contact.id,
          email: emailAddress,
          reason: 'bounce',
          details: bounceMessage,
          bounce_type: bounceType,
          bounce_subtype: bounceSubType,
          bounce_message: bounceMessage,
          bounce_count: 1,
          last_bounce_at: new Date().toISOString(),
        });
      } else {
        // Update existing suppression
        await supabase
          .from('email_suppressions')
          .update({
            bounce_type: bounceType,
            bounce_subtype: bounceSubType,
            bounce_message: bounceMessage,
            bounce_count: (existingSuppression.bounce_count || 0) + 1,
            last_bounce_at: new Date().toISOString(),
          })
          .eq('id', existingSuppression.id);
      }

      // Add hard bounce tag
      await supabase.rpc('add_contact_tag', {
        p_contact_id: contact.id,
        p_tag: 'email_bounced_hard',
      });

      // Create notification
      await supabase.from('email_notifications').insert({
        tenant_id: tenantId,
        contact_id: contact.id,
        type: 'bounce_hard',
        email: emailAddress,
        title: `Hard Bounce: ${contact.first_name} ${contact.last_name}`,
        message: `Email permanently bounced: ${bounceMessage}`,
        metadata: {
          bounce_type: bounceType,
          bounce_subtype: bounceSubType,
          email_id: data.email_id,
        },
      });

      console.log('[Webhook] Hard bounce processed, contact suppressed:', contact.id);
    } else {
      // Soft bounce - track attempts
      const bounceCount = (existingSuppression?.bounce_count || 0) + 1;
      const shouldSuppress = bounceCount >= 3;

      if (!existingSuppression) {
        await supabase.from('email_suppressions').insert({
          tenant_id: tenantId,
          contact_id: contact.id,
          email: emailAddress,
          reason: shouldSuppress ? 'bounce' : 'soft_bounce_tracking',
          details: `Soft bounce (${bounceCount}/3): ${bounceMessage}`,
          bounce_type: bounceType,
          bounce_subtype: bounceSubType,
          bounce_message: bounceMessage,
          bounce_count: bounceCount,
          last_bounce_at: new Date().toISOString(),
        });
      } else {
        await supabase
          .from('email_suppressions')
          .update({
            reason: shouldSuppress ? 'bounce' : existingSuppression.reason,
            details: `Soft bounce (${bounceCount}/3): ${bounceMessage}`,
            bounce_type: bounceType,
            bounce_subtype: bounceSubType,
            bounce_message: bounceMessage,
            bounce_count: bounceCount,
            last_bounce_at: new Date().toISOString(),
          })
          .eq('id', existingSuppression.id);
      }

      if (shouldSuppress) {
        // After 3 soft bounces, treat as permanent
        await supabase.rpc('add_contact_tag', {
          p_contact_id: contact.id,
          p_tag: 'email_bounced_soft',
        });

        await supabase.from('email_notifications').insert({
          tenant_id: tenantId,
          contact_id: contact.id,
          type: 'bounce_soft',
          email: emailAddress,
          title: `Soft Bounce (3x): ${contact.first_name} ${contact.last_name}`,
          message: `Email bounced 3 times (soft bounce): ${bounceMessage}`,
          metadata: {
            bounce_type: bounceType,
            bounce_subtype: bounceSubType,
            bounce_count: bounceCount,
            email_id: data.email_id,
          },
        });

        console.log('[Webhook] Soft bounce limit reached, contact suppressed:', contact.id);
      } else {
        // Just tracking, not suppressing yet
        console.log(`[Webhook] Soft bounce tracked (${bounceCount}/3):`, contact.id);
      }
    }
  } catch (error: any) {
    console.error('Error handling bounce:', error);
  }
}

/**
 * POST /api/email/webhook
 * Handle Resend webhook events (opens, clicks, bounces, complaints)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (only in production)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    if (webhookSecret && isProduction) {
      const svixId = request.headers.get('svix-id');
      const svixTimestamp = request.headers.get('svix-timestamp');
      const svixSignature = request.headers.get('svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('Missing Svix headers');
        return NextResponse.json(
          { error: 'Missing webhook signature headers' },
          { status: 401 }
        );
      }

      const body = await request.text();

      try {
        const wh = new Webhook(webhookSecret);
        wh.verify(body, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }

      // Parse the verified body
      var event = JSON.parse(body);
    } else {
      // No signature verification in development
      console.log('[Webhook] Signature verification skipped (development mode)');
      var event = await request.json();
    }
    const { type, data } = event;

    console.log('Received email webhook:', type, data);

    // Use service role client for webhooks (no cookies/auth required)
    const supabase = createServiceRoleClient();

    // Handle different event types
    switch (type) {
      case 'email.delivered':
        // Update activity status
        if (data.email_id) {
          await supabase
            .from('activities')
            .update({
              outcome: 'delivered',
            })
            .eq('description', `%${data.email_id}%`);
        }
        break;

      case 'email.opened':
        // Track opens
        if (data.email_id) {
          await supabase
            .from('activities')
            .update({
              outcome: 'opened',
            })
            .eq('description', `%${data.email_id}%`);
        }
        break;

      case 'email.clicked':
        // Track clicks
        if (data.email_id) {
          await supabase
            .from('activities')
            .update({
              outcome: 'clicked',
            })
            .eq('description', `%${data.email_id}%`);
        }
        break;

      case 'email.bounced':
        await handleBounce(supabase, data);
        break;

      case 'email.complained':
        // Add to suppressions
        if (data.to && data.contact_id) {
          await supabase
            .from('email_suppressions')
            .upsert({
              org_id: data.org_id,
              contact_id: data.contact_id,
              email: data.to,
              reason: 'complaint',
              details: 'User marked as spam',
            }, { onConflict: 'org_id,contact_id' });
        }
        break;

      default:
        console.log('Unknown webhook event type:', type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}


