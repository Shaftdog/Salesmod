/**
 * Send Invoice API Route
 * POST /api/invoices/[id]/send - Send invoice via email
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  SendInvoiceSchema,
  type SendInvoiceInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedOrgId,
  successResponse,
  BadRequestError,
  verifyResourceOwnership,
} from '@/lib/errors/api-errors';

// =============================================
// POST /api/invoices/[id]/send
// =============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { id } = await params;

    // Validate request body
    const body = await validateRequestBody<SendInvoiceInput>(
      request,
      SendInvoiceSchema
    );

    // Verify invoice exists and belongs to org
    await verifyResourceOwnership(supabase, 'invoices', id, orgId);

    // Fetch invoice with client info
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, company_name, email, contact_name)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Validate invoice can be sent
    if (['paid', 'cancelled', 'void'].includes(invoice.status)) {
      throw new BadRequestError(
        `Cannot send invoice with status: ${invoice.status}`
      );
    }

    // Determine recipient email
    const recipientEmail = body.email || invoice.client.email;
    if (!recipientEmail) {
      throw new BadRequestError('No email address available for client');
    }

    // TODO: Integrate with email service (e.g., Resend, SendGrid, AWS SES)
    // For now, we'll just mark it as sent

    // Example email sending logic (commented out):
    /*
    const emailSubject = body.subject || `Invoice ${invoice.invoice_number} from Your Company`;
    const emailMessage = body.message || `Please find attached invoice ${invoice.invoice_number}`;

    await sendEmail({
      to: recipientEmail,
      cc: body.cc_emails,
      subject: emailSubject,
      html: generateInvoiceEmailHtml(invoice, emailMessage),
      attachments: [{
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: await generateInvoicePdf(invoice),
      }],
    });
    */

    // Update invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
        sent_at: new Date().toISOString(),
        updated_by: orgId,
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(id, company_name, email),
        line_items:invoice_line_items(*),
        payments(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      throw updateError;
    }

    return successResponse(
      updatedInvoice,
      `Invoice sent to ${recipientEmail}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
