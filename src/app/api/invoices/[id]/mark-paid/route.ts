/**
 * Mark Invoice as Paid API Route
 * POST /api/invoices/[id]/mark-paid - Mark invoice as paid (COD use case)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  MarkPaidSchema,
  type MarkPaidInput,
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
// POST /api/invoices/[id]/mark-paid
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
    const body = await validateRequestBody<MarkPaidInput>(
      request,
      MarkPaidSchema
    );

    // Verify invoice exists and belongs to org
    await verifyResourceOwnership(supabase, 'invoices', id, orgId);

    // Fetch invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Validate invoice can be marked as paid
    if (['paid', 'cancelled', 'void'].includes(invoice.status)) {
      throw new BadRequestError(
        `Cannot mark invoice as paid with status: ${invoice.status}`
      );
    }

    // Calculate amount to pay (remaining balance)
    const amountToPay = invoice.amount_due;

    if (amountToPay <= 0) {
      throw new BadRequestError('Invoice has no outstanding balance');
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: id,
        org_id: orgId,
        amount: amountToPay,
        payment_method: body.payment_method,
        payment_date: body.payment_date || new Date().toISOString(),
        reference_number: body.reference_number,
        notes: body.notes,
        created_by: orgId,
        updated_by: orgId,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      throw paymentError;
    }

    // Fetch updated invoice (triggers will have updated status and amounts)
    const { data: updatedInvoice, error: updateFetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, company_name, email),
        line_items:invoice_line_items(*),
        payments(*)
      `)
      .eq('id', id)
      .single();

    if (updateFetchError) {
      throw updateFetchError;
    }

    return successResponse(
      updatedInvoice,
      'Invoice marked as paid successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
