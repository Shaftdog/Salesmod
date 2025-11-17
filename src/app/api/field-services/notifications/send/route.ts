import { NextRequest } from 'next/server';
import {
  getApiContext,
  handleApiError,
  createdResponse,
  createAuditLog,
} from '@/lib/api-utils';
import { sendNotificationSchema } from '@/lib/validations/field-services';

/**
 * POST /api/field-services/notifications/send
 * Send notification to customer/resource
 *
 * Phase 5: Customer Portal & Communication
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;

    const body = await request.json();
    const validated = sendNotificationSchema.parse(body);

    // In production, integrate with Twilio (SMS) or SendGrid (Email)
    // For now, log the notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        org_id: orgId,
        notification_type: validated.type,
        recipient_type: 'customer',
        recipient_email: validated.type === 'email' ? validated.recipient : null,
        recipient_phone: validated.type === 'sms' ? validated.recipient : null,
        subject: validated.subject,
        message: validated.message,
        related_entity_type: validated.entityType,
        related_entity_id: validated.entityId,
        status: 'sent', // In production: 'pending' until provider confirms
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await createAuditLog(
      context,
      'notification.sent',
      'notification',
      notification.id,
      undefined,
      { type: validated.type, recipient: validated.recipient }
    );

    return createdResponse(
      { notification },
      `${validated.type.toUpperCase()} notification queued for delivery`
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
