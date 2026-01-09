/**
 * Send Invoice via SMS API Route
 * POST /api/invoices/[id]/send-sms - Send invoice link via SMS
 */

import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedContext,
  successResponse,
  BadRequestError,
  verifyTenantResourceOwnership,
} from '@/lib/errors/api-errors';
import {
  sendSms,
  generateInvoiceSmsMessage,
  formatPhoneNumber,
  isValidPhoneNumber,
  isTwilioConfigured,
} from '@/lib/sms/sms-sender';
import { z } from 'zod';

// Request schema
const SendSmsSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  recipient_name: z.string().optional(),
  recipient_role: z.string().optional(),
});

type SendSmsInput = z.infer<typeof SendSmsSchema>;

// Generate email token for tracking (same format as email)
function generateEmailToken(): string {
  return 'e_' + randomBytes(24).toString('hex');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { orgId, tenantId } = await getAuthenticatedContext(supabase);
    const { id } = await params;

    // Validate request body
    const body = await validateRequestBody<SendSmsInput>(request, SendSmsSchema);

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(body.phone);
    if (!isValidPhoneNumber(formattedPhone)) {
      throw new BadRequestError(
        `Invalid phone number: ${body.phone}. Please use format: +1234567890 or 1234567890`
      );
    }

    // Verify invoice exists and belongs to tenant
    await verifyTenantResourceOwnership(supabase, 'invoices', id, tenantId);

    // Fetch invoice details
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        status,
        view_token
      `)
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      throw new BadRequestError('Invoice not found');
    }

    // Validate invoice can be sent
    if (['paid', 'cancelled', 'void'].includes(invoice.status)) {
      throw new BadRequestError(
        `Cannot send invoice with status: ${invoice.status}`
      );
    }

    // Get org info for SMS message
    const { data: orgProfile } = await supabase
      .from('profiles')
      .select('company_name')
      .eq('id', orgId)
      .single();

    const orgName = orgProfile?.company_name;

    // Generate unique tracking token for this SMS recipient
    const smsToken = generateEmailToken();

    // Create tracking record (reusing invoice_email_tokens table)
    const { error: tokenError } = await supabase
      .from('invoice_email_tokens')
      .insert({
        invoice_id: id,
        tenant_id: tenantId,
        token: smsToken,
        recipient_email: formattedPhone, // Store phone in email field for SMS
        recipient_name: body.recipient_name || null,
        recipient_role: body.recipient_role || 'sms',
        sent_at: new Date().toISOString(),
      });

    if (tokenError) {
      console.error('Error creating SMS token:', tokenError);
      throw new BadRequestError('Failed to create tracking token');
    }

    // Generate the view URL with tracking token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const viewUrl = `${baseUrl}/invoices/view/${smsToken}`;

    // Generate SMS message
    const smsBody = generateInvoiceSmsMessage({
      invoiceNumber: invoice.invoice_number,
      totalAmount: parseFloat(invoice.total_amount),
      viewUrl,
      orgName,
    });

    // Send SMS
    const smsResult = await sendSms({
      to: formattedPhone,
      body: smsBody,
    });

    if (!smsResult.success && !smsResult.simulated) {
      throw new BadRequestError(`Failed to send SMS: ${smsResult.error}`);
    }

    // Update invoice status if draft
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_by: orgId,
        })
        .eq('id', id);
    }

    // Build response message
    let message = `Invoice sent via SMS to ${formattedPhone}`;
    if (smsResult.simulated) {
      message += ' (simulated - Twilio not configured)';
    }

    return successResponse(
      {
        phone: formattedPhone,
        view_url: viewUrl,
        message_id: smsResult.messageId,
        sms_sent: smsResult.success,
        sms_simulated: smsResult.simulated || false,
      },
      message
    );
  } catch (error) {
    return handleApiError(error);
  }
}
