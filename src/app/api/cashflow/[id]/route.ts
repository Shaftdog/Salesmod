/**
 * Single Cashflow Transaction API Routes
 * GET    /api/cashflow/[id] - Get single transaction
 * PATCH  /api/cashflow/[id] - Update transaction
 * DELETE /api/cashflow/[id] - Delete transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  UpdateCashflowTransactionSchema,
  type UpdateCashflowTransactionInput,
} from '@/lib/validations/cashflow';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedOrgId,
  successResponse,
  notFoundError,
  badRequestError,
} from '@/lib/errors/api-errors';

// =============================================
// GET /api/cashflow/[id] - Get single transaction
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    const { data, error } = await supabase
      .from('cashflow_board')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      return notFoundError('Cashflow transaction');
    }

    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// PATCH /api/cashflow/[id] - Update transaction
// =============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Get authenticated user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check transaction exists and belongs to org
    const { data: existing, error: fetchError } = await supabase
      .from('cashflow_transactions')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !existing) {
      return notFoundError('Cashflow transaction');
    }

    // Check if transaction can be edited
    if (existing.status === 'paid' || existing.status === 'cancelled') {
      return badRequestError('Cannot edit paid or cancelled transactions');
    }

    // Can't edit invoice-linked transactions (managed by invoicing system)
    if (existing.invoice_id) {
      return badRequestError(
        'Cannot edit invoice-linked transactions. Update via invoicing system.'
      );
    }

    // Parse and validate request body
    const updates = await validateRequestBody<UpdateCashflowTransactionInput>(
      request,
      UpdateCashflowTransactionSchema
    );

    // Validate status transition if status is being changed
    if (updates.status && updates.status !== existing.status) {
      const validTransitions = getValidStatusTransitions(existing.status);
      if (!validTransitions.includes(updates.status)) {
        return badRequestError(
          `Cannot change status from ${existing.status} to ${updates.status}`
        );
      }

      // If marking as paid, set actual_date
      if (updates.status === 'paid' && !updates.actual_date) {
        updates.actual_date = new Date().toISOString().split('T')[0];
      }
    }

    // Update transaction
    const { data, error } = await supabase
      .from('cashflow_transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('org_id', orgId)
      .select(`
        *,
        client:clients(id, name, email),
        order:orders(id, order_number, property_address),
        invoice:invoices(invoice_number, status)
      `)
      .single();

    if (error) {
      console.error('Failed to update cashflow transaction:', error);
      throw error;
    }

    return successResponse(data, 'Cashflow transaction updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// DELETE /api/cashflow/[id] - Delete transaction
// =============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Check transaction exists and belongs to org
    const { data: existing, error: fetchError } = await supabase
      .from('cashflow_transactions')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !existing) {
      return notFoundError('Cashflow transaction');
    }

    // Can't delete invoice-linked transactions
    if (existing.invoice_id) {
      return badRequestError(
        'Cannot delete invoice-linked transactions. They are managed by the invoicing system.'
      );
    }

    // Can't delete if it has child recurring transactions
    const { count } = await supabase
      .from('cashflow_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('parent_transaction_id', params.id);

    if (count && count > 0) {
      return badRequestError(
        `Cannot delete recurring transaction with ${count} future instances. Delete instances first.`
      );
    }

    // Delete transaction
    const { error } = await supabase
      .from('cashflow_transactions')
      .delete()
      .eq('id', params.id)
      .eq('org_id', orgId);

    if (error) {
      console.error('Failed to delete cashflow transaction:', error);
      throw error;
    }

    return successResponse(null, 'Cashflow transaction deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function getValidStatusTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    pending: ['scheduled', 'paid', 'overdue', 'cancelled'],
    scheduled: ['pending', 'paid', 'overdue', 'cancelled'],
    paid: [], // Terminal
    overdue: ['paid', 'cancelled'],
    cancelled: [], // Terminal
  };

  return transitions[currentStatus] || [];
}
