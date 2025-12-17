/**
 * Invoice Payments API Routes
 * GET  /api/invoices/[id]/payments - List payments for an invoice
 * POST /api/invoices/[id]/payments - Record a new payment
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CreatePaymentSchema,
  type CreatePaymentInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedContext,
  successResponse,
  createdResponse,
  BadRequestError,
  verifyTenantResourceOwnership,
} from '@/lib/errors/api-errors';
import type { Payment } from '@/types/invoicing';

// =============================================
// GET /api/invoices/[id]/payments
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { tenantId } = await getAuthenticatedContext(supabase);
    const { id } = await params;

    // Verify invoice exists and belongs to tenant
    await verifyTenantResourceOwnership(supabase, 'invoices', id, tenantId);

    // Fetch payments for invoice
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }

    return successResponse<Payment[]>(payments || []);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/invoices/[id]/payments
// =============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { orgId, tenantId } = await getAuthenticatedContext(supabase);
    const { id } = await params;

    // Validate request body
    const body = await validateRequestBody<CreatePaymentInput>(
      request,
      CreatePaymentSchema
    );

    // Verify invoice exists and belongs to tenant
    await verifyTenantResourceOwnership(supabase, 'invoices', id, tenantId);

    // Fetch invoice to validate payment
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status, total_amount, amount_paid, amount_due')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Validate invoice status
    if (['cancelled', 'void'].includes(invoice.status)) {
      throw new BadRequestError(
        `Cannot record payment for ${invoice.status} invoice`
      );
    }

    // Validate payment amount doesn't exceed amount due
    if (body.amount > invoice.amount_due) {
      throw new BadRequestError(
        `Payment amount ($${body.amount}) exceeds amount due ($${invoice.amount_due})`
      );
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: id,
        tenant_id: tenantId,
        org_id: orgId,
        amount: body.amount,
        payment_method: body.payment_method,
        payment_date: body.payment_date || new Date().toISOString(),
        reference_number: body.reference_number,
        stripe_payment_intent_id: body.stripe_payment_intent_id,
        stripe_charge_id: body.stripe_charge_id,
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

    // Fetch updated invoice status (triggers will have updated it)
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('status, amount_paid, amount_due')
      .eq('id', id)
      .single();

    return createdResponse(
      {
        payment,
        invoice: updatedInvoice,
      },
      'Payment recorded successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
