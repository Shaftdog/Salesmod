/**
 * Single Invoice API Routes
 * GET    /api/invoices/[id] - Get invoice details
 * PATCH  /api/invoices/[id] - Update invoice
 * DELETE /api/invoices/[id] - Delete/void invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  UpdateInvoiceSchema,
  type UpdateInvoiceInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedOrgId,
  successResponse,
  noContentResponse,
  NotFoundError,
  BadRequestError,
  verifyResourceOwnership,
} from '@/lib/errors/api-errors';
import type { InvoiceWithDetails } from '@/types/invoicing';
import { isValidStatusTransition, InvoiceStatus } from '@/lib/constants/invoicing';

// =============================================
// GET /api/invoices/[id] - Get invoice details
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { id } = await params;

    // Fetch invoice with all relations
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, company_name, email, payment_terms, address, phone),
        line_items:invoice_line_items(
          *,
          order:orders(id, order_number, property_address, status, completed_at)
        ),
        payments(*)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Invoice');
      }
      console.error('Error fetching invoice:', error);
      throw error;
    }

    return successResponse<InvoiceWithDetails>(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// PATCH /api/invoices/[id] - Update invoice
// =============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { id } = await params;

    // Validate request body
    const body = await validateRequestBody<UpdateInvoiceInput>(
      request,
      UpdateInvoiceSchema
    );

    // Verify invoice exists and belongs to org
    await verifyResourceOwnership(supabase, 'invoices', id, orgId);

    // Check if invoice can be edited
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status, amount_paid')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Validate status transition if status is being changed
    if (body.status && body.status !== currentInvoice.status) {
      if (!isValidStatusTransition(currentInvoice.status as InvoiceStatus, body.status as InvoiceStatus)) {
        throw new BadRequestError(
          `Invalid status transition from '${currentInvoice.status}' to '${body.status}'`
        );
      }
    }

    // Prevent editing paid, cancelled, or voided invoices (except for status changes)
    if (['paid', 'cancelled', 'void'].includes(currentInvoice.status)) {
      // Only allow status changes for paid invoices (to void)
      const isOnlyStatusChange = Object.keys(body).length === 1 && 'status' in body;
      if (!isOnlyStatusChange) {
        throw new BadRequestError(
          `Cannot edit invoice with status: ${currentInvoice.status}. Only status changes are allowed.`
        );
      }
    }

    // Prevent changing amounts if payments exist
    if (currentInvoice.amount_paid > 0 && (body.tax_rate || body.discount_amount)) {
      throw new BadRequestError(
        'Cannot modify amounts on invoice with existing payments'
      );
    }

    // Update invoice
    const updateData: any = {
      ...body,
      updated_by: orgId,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, company_name, email, payment_terms),
        line_items:invoice_line_items(
          *,
          order:orders(id, order_number, property_address, status)
        ),
        payments(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      throw updateError;
    }

    return successResponse<InvoiceWithDetails>(
      updatedInvoice,
      'Invoice updated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// DELETE /api/invoices/[id] - Delete/void invoice
// =============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { id } = await params;

    // Verify invoice exists and belongs to org
    await verifyResourceOwnership(supabase, 'invoices', id, orgId);

    // Fetch invoice to check if it can be deleted
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status, amount_paid')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Only allow deleting draft invoices with no payments
    if (invoice.status === 'draft' && invoice.amount_paid === 0) {
      // Hard delete
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting invoice:', deleteError);
        throw deleteError;
      }

      return noContentResponse();
    }

    // For non-draft invoices or invoices with payments, void instead of delete
    const { error: voidError } = await supabase
      .from('invoices')
      .update({
        status: 'void',
        voided_at: new Date().toISOString(),
        updated_by: orgId,
      })
      .eq('id', id);

    if (voidError) {
      console.error('Error voiding invoice:', voidError);
      throw voidError;
    }

    return successResponse(
      { id, status: 'void' },
      'Invoice voided successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
