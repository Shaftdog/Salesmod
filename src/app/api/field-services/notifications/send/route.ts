import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/field-services/notifications/send
 * Send notification to customer/resource
 *
 * Phase 5: Customer Portal & Communication
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, recipient, subject, message, entityType, entityId } = body;

    if (!type || !recipient || !message) {
      return NextResponse.json(
        { error: 'type, recipient, and message are required' },
        { status: 400 }
      );
    }

    // In production, integrate with Twilio (SMS) or SendGrid (Email)
    // For now, log the notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        org_id: body.orgId,
        notification_type: type,
        recipient_type: 'customer',
        recipient_email: type === 'email' ? recipient : null,
        recipient_phone: type === 'sms' ? recipient : null,
        subject,
        message,
        related_entity_type: entityType,
        related_entity_id: entityId,
        status: 'sent', // In production: 'pending' until provider confirms
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Notification error:', error);
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({
      notification,
      message: `${type.toUpperCase()} notification queued for delivery`
    }, { status: 201 });
  } catch (error: any) {
    console.error('Notification API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
