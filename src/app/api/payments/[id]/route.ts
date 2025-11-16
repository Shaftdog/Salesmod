/**
 * Single Payment API Routes
 * DELETE /api/payments/[id] - Delete payment (admin only)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedOrgId,
  successResponse,
  BadRequestError,
  verifyResourceOwnership,
} from '@/lib/errors/api-errors';

// =============================================
// DELETE /api/payments/[id]
// =============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { id } = await params;

    // Verify payment exists and belongs to org
    await verifyResourceOwnership(supabase, 'payments', id, orgId);

    // Fetch payment details
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('invoice_id, is_reconciled, amount')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Prevent deleting reconciled payments
    if (payment.is_reconciled) {
      throw new BadRequestError(
        'Cannot delete reconciled payment. Please un-reconcile first.'
      );
    }

    // Delete payment (triggers will update invoice status)
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting payment:', deleteError);
      throw deleteError;
    }

    // Fetch updated invoice status
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, status, amount_paid, amount_due')
      .eq('id', payment.invoice_id)
      .single();

    return successResponse(
      {
        deleted_payment_id: id,
        deleted_amount: payment.amount,
        invoice,
      },
      'Payment deleted successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
