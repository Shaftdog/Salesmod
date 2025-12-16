/**
 * Send Invoice API Route
 * POST /api/invoices/[id]/send - Send invoice via email
 */

import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
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
import { sendEmail } from '@/lib/campaigns/email-sender';
import {
  generateInvoiceEmailHtml,
  generateInvoiceEmailText,
} from '@/lib/email/invoice-email';

// Generate a secure random token for invoice viewing
function generateViewToken(): string {
  return randomBytes(32).toString('hex');
}

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

    // Fetch invoice with client and billing contact info
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(
          id,
          company_name,
          email,
          contact_name,
          billing_contact_id,
          billing_email_confirmed,
          billing_contact:contacts!billing_contact_id(id, email, first_name, last_name)
        )
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

    // Validate billing contact is set up
    const client = invoice.client;
    const hasBillingContact = client?.billing_contact_id && client?.billing_contact?.email;
    const hasBillingEmailConfirmed = client?.billing_email_confirmed && client?.email;

    if (!hasBillingContact && !hasBillingEmailConfirmed) {
      throw new BadRequestError(
        'Cannot send invoice: Client has no billing contact configured. Please set a billing contact or confirm the company email for billing in the client settings.'
      );
    }

    // Determine recipient email (override > billing contact > confirmed company email)
    const recipientEmail = body.email
      || (hasBillingContact ? client.billing_contact.email : null)
      || (hasBillingEmailConfirmed ? client.email : null);

    if (!recipientEmail) {
      throw new BadRequestError('No valid billing email address available for client');
    }

    // Validate email is not a placeholder
    const placeholderPatterns = [
      /^test@test\./i,
      /^placeholder/i,
      /@example\.(com|org|net)$/i,
      /@test\.(com|org|net)$/i,
      /^noemail@/i,
      /^no-?reply@/i,
    ];

    const isPlaceholderEmail = placeholderPatterns.some(pattern => pattern.test(recipientEmail));
    if (isPlaceholderEmail) {
      throw new BadRequestError(
        `Email "${recipientEmail}" appears to be a placeholder. Please update the billing contact with a valid email address.`
      );
    }

    // Generate view token if not already set
    const viewToken = invoice.view_token || generateViewToken();

    // Generate the public view URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const viewUrl = `${baseUrl}/invoices/view/${viewToken}`;

    // Get org info for email
    const { data: orgProfile } = await supabase
      .from('profiles')
      .select('company_name, email')
      .eq('id', orgId)
      .single();

    const orgName = orgProfile?.company_name || 'Your Company';
    const orgEmail = orgProfile?.email;

    // Fetch line items for email
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('description, quantity, unit_price, amount')
      .eq('invoice_id', id);

    // Generate email content
    const emailSubject = body.subject || `Invoice ${invoice.invoice_number} from ${orgName}`;
    const emailHtml = generateInvoiceEmailHtml({
      invoiceNumber: invoice.invoice_number,
      clientName: client?.company_name || 'Valued Customer',
      totalAmount: invoice.total_amount,
      dueDate: invoice.due_date,
      viewUrl,
      orgName,
      orgEmail,
      lineItems: lineItems?.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.amount,
      })),
    });
    const emailText = generateInvoiceEmailText({
      invoiceNumber: invoice.invoice_number,
      clientName: client?.company_name || 'Valued Customer',
      totalAmount: invoice.total_amount,
      dueDate: invoice.due_date,
      viewUrl,
      orgName,
      orgEmail,
    });

    // Send the email
    const emailResult = await sendEmail({
      to: recipientEmail,
      from: process.env.INVOICE_FROM_EMAIL || `${orgName} <invoices@roiappraise.com>`,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      replyTo: orgEmail,
      metadata: {
        invoiceId: id,
        invoiceNumber: invoice.invoice_number,
        type: 'invoice',
      },
    });

    if (!emailResult.success) {
      console.error('Failed to send invoice email:', emailResult.error);
      // Don't throw - we'll still update the status but warn the user
    }

    // Update invoice status and set view token
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
        sent_at: new Date().toISOString(),
        view_token: viewToken,
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

    // Build response message
    let message = `Invoice sent to ${recipientEmail}`;
    if (emailResult.simulation) {
      message += ' (email simulated - Resend not configured)';
    } else if (!emailResult.success) {
      message = `Invoice marked as sent, but email delivery failed: ${emailResult.error}. You can share the invoice link manually.`;
    }

    return successResponse(
      {
        ...updatedInvoice,
        view_url: viewUrl,
        email_sent: emailResult.success,
        email_simulated: emailResult.simulation || false,
        email_error: emailResult.error,
      },
      message
    );
  } catch (error) {
    return handleApiError(error);
  }
}
