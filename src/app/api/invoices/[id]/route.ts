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
        client:clients(
          id,
          company_name,
          email,
          payment_terms,
          address,
          phone,
          billing_contact_id,
          billing_email_confirmed,
          billing_contact:contacts!billing_contact_id(id, email, first_name, last_name)
        ),
        order:orders(id, order_number, property_address, status, completed_date),
        line_items:invoice_line_items(
          *,
          order:orders(id, order_number, property_address, status, completed_date)
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
    if (currentInvoice.amount_paid > 0 && (body.tax_rate || body.discount_amount || body.line_items)) {
      throw new BadRequestError(
        'Cannot modify amounts on invoice with existing payments'
      );
    }

    // Extract line_items from body for separate handling
    const { line_items, ...invoiceUpdateFields } = body;

    // Update invoice fields (excluding line_items)
    const updateData: any = {
      ...invoiceUpdateFields,
      updated_by: orgId,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select('*, tenant_id')
      .single();

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      throw updateError;
    }

    // Handle line items update if provided
    if (line_items && line_items.length > 0) {
      // First, fetch existing line items to preserve order_id associations
      const { data: existingLineItems, error: fetchExistingError } = await supabase
        .from('invoice_line_items')
        .select('id, order_id')
        .eq('invoice_id', id);

      if (fetchExistingError) {
        console.error('Error fetching existing line items:', fetchExistingError);
        throw fetchExistingError;
      }

      // Create a map of existing line item IDs to their order_id
      const orderIdMap = new Map<string, string | null>();
      let defaultOrderId: string | null = null;
      if (existingLineItems) {
        existingLineItems.forEach(item => {
          if (item.id) {
            orderIdMap.set(item.id, item.order_id);
          }
          // Also capture the first non-null order_id as default for new items
          if (!defaultOrderId && item.order_id) {
            defaultOrderId = item.order_id;
          }
        });
      }

      // Delete existing line items
      const { error: deleteError } = await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', id);

      if (deleteError) {
        console.error('Error deleting existing line items:', deleteError);
        throw deleteError;
      }

      // Calculate amounts for new line items and create them
      const lineItemsToInsert = line_items.map((item: any, index: number) => {
        const quantity = item.quantity || 1;
        const unitPrice = item.unit_price || 0;
        const taxRate = item.tax_rate || 0;
        const amount = quantity * unitPrice;
        const taxAmount = amount * taxRate;

        // Preserve order_id from existing item if it has an id, otherwise use default
        const orderId = item.id ? orderIdMap.get(item.id) : defaultOrderId;

        return {
          invoice_id: id,
          tenant_id: updatedInvoice.tenant_id,
          order_id: orderId || defaultOrderId, // Preserve the order association
          description: item.description,
          quantity,
          unit_price: unitPrice,
          amount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          line_order: item.line_order ?? index,
        };
      });

      const { error: insertError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsToInsert);

      if (insertError) {
        console.error('Error inserting new line items:', insertError);
        throw insertError;
      }

      // Recalculate invoice totals
      const subtotal = lineItemsToInsert.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = lineItemsToInsert.reduce((sum, item) => sum + item.tax_amount, 0);
      const discountAmount = updatedInvoice.discount_amount || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;
      const amountDue = totalAmount - (updatedInvoice.amount_paid || 0);

      // Update invoice with new totals
      const { error: totalsUpdateError } = await supabase
        .from('invoices')
        .update({
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          amount_due: amountDue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (totalsUpdateError) {
        console.error('Error updating invoice totals:', totalsUpdateError);
        throw totalsUpdateError;
      }
    }

    // Fetch complete updated invoice with relations
    const { data: completeInvoice, error: completeFetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, company_name, email, payment_terms),
        order:orders(id, order_number, property_address, status),
        line_items:invoice_line_items(
          *,
          order:orders(id, order_number, property_address, status)
        ),
        payments(*)
      `)
      .eq('id', id)
      .single();

    if (completeFetchError) {
      console.error('Error fetching updated invoice:', completeFetchError);
      throw completeFetchError;
    }

    return successResponse<InvoiceWithDetails>(
      completeInvoice,
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
