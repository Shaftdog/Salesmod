import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/email/webhook
 * Handle Resend webhook events (opens, clicks, bounces, complaints)
 */
export async function POST(request: NextRequest) {
  try {
    // In production, verify webhook signature here
    // const signature = request.headers.get('resend-signature');
    // if (!verifySignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const event = await request.json();
    const { type, data } = event;

    console.log('Received email webhook:', type, data);

    const supabase = await createClient();

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
        // Add to suppressions
        if (data.to && data.contact_id) {
          await supabase
            .from('email_suppressions')
            .upsert({
              org_id: data.org_id,
              contact_id: data.contact_id,
              email: data.to,
              reason: 'bounce',
              details: `Bounce type: ${data.bounce_type || 'unknown'}`,
            }, {
              onConflict: 'org_id,contact_id'
            });
        }
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
            }, {
              onConflict: 'org_id,contact_id'
            });
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


