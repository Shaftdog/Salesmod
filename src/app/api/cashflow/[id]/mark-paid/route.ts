/**
 * Mark Cashflow Transaction as Paid API Route
 * POST /api/cashflow/[id]/mark-paid - Mark transaction as paid
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  MarkPaidSchema,
} from '@/lib/validations/cashflow';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedContext,
  successResponse,
  notFoundError,
  badRequestError,
} from '@/lib/errors/api-errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { tenantId } = await getAuthenticatedContext(supabase);
    const { id } = await params;

    // Check transaction exists and belongs to org
    const { data: existing, error: fetchError } = await supabase
      .from('cashflow_transactions')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existing) {
      return notFoundError('Cashflow transaction');
    }

    // Check if already paid
    if (existing.status === 'paid') {
      return badRequestError('Transaction is already marked as paid');
    }

    // Can't mark cancelled as paid
    if (existing.status === 'cancelled') {
      return badRequestError('Cannot mark cancelled transaction as paid');
    }

    // Can't mark invoice-linked transactions as paid (use payment recording instead)
    if (existing.invoice_id) {
      return badRequestError(
        'Cannot mark invoice-linked transaction as paid. Record payment via invoicing system.'
      );
    }

    // Parse request body
    const body = await validateRequestBody(request, MarkPaidSchema);

    const actual_date = body.actual_date || new Date().toISOString().split('T')[0];

    // Update transaction
    const { data, error } = await supabase
      .from('cashflow_transactions')
      .update({
        status: 'paid',
        actual_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        client:clients(id, name, email),
        order:orders(id, order_number, property_address)
      `)
      .single();

    if (error) {
      console.error('Failed to mark transaction as paid:', error);
      throw error;
    }

    return successResponse(data, 'Transaction marked as paid successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
