/**
 * Cancel Invoice API Route
 * POST /api/invoices/[id]/cancel - Cancel invoice
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CancelInvoiceSchema,
  type CancelInvoiceInput,
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
// POST /api/invoices/[id]/cancel
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
    const body = await validateRequestBody<CancelInvoiceInput>(
      request,
      CancelInvoiceSchema
    );

    // Verify invoice exists and belongs to org
    await verifyResourceOwnership(supabase, 'invoices', id, orgId);

    // Fetch invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status, amount_paid, notes')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Validate invoice can be cancelled
    if (['paid', 'cancelled', 'void'].includes(invoice.status)) {
      throw new BadRequestError(
        `Cannot cancel invoice with status: ${invoice.status}`
      );
    }

    // Prevent cancelling if payments have been made
    if (invoice.amount_paid > 0) {
      throw new BadRequestError(
        'Cannot cancel invoice with payments. Please void instead or refund payments first.'
      );
    }

    // Update invoice to cancelled
    const updateData: any = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_by: orgId,
    };

    // Add cancellation reason to notes if provided
    if (body.reason) {
      updateData.notes = invoice.notes
        ? `${invoice.notes}\n\nCancellation reason: ${body.reason}`
        : `Cancellation reason: ${body.reason}`;
    }

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, company_name, email),
        line_items:invoice_line_items(*),
        payments(*)
      `)
      .single();

    if (updateError) {
      console.error('Error cancelling invoice:', updateError);
      throw updateError;
    }

    return successResponse(
      updatedInvoice,
      'Invoice cancelled successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
