/**
 * Batch Invoice Creation API Route
 * POST /api/invoices/batch - Create multiple invoices at once
 *
 * NOTE: This implementation processes invoices sequentially without database transactions.
 * In case of partial failures, successfully created invoices are returned in the 'success' array.
 * Failed invoices are returned in the 'failed' array with error details.
 *
 * FUTURE IMPROVEMENT: Consider implementing Supabase RPC function for atomic batch operations
 * or implementing compensating transactions for rollback on partial failure.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  BatchCreateInvoicesSchema,
  type BatchCreateInvoicesInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedOrgId,
  successResponse,
  BadRequestError,
} from '@/lib/errors/api-errors';
import type { Invoice } from '@/types/invoicing';

// =============================================
// POST /api/invoices/batch
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Validate request body
    const body = await validateRequestBody<BatchCreateInvoicesInput>(
      request,
      BatchCreateInvoicesSchema
    );

    const results: {
      success: Invoice[];
      failed: Array<{ index: number; error: string; invoice: any }>;
    } = {
      success: [],
      failed: [],
    };

    // Process each invoice
    for (let i = 0; i < body.invoices.length; i++) {
      const invoiceData = body.invoices[i];

      try {
        // Verify client exists and belongs to org
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, payment_terms')
          .eq('id', invoiceData.client_id)
          .eq('org_id', orgId)
          .single();

        if (clientError || !client) {
          throw new Error('Client not found or access denied');
        }

        // Calculate due date if not provided
        let dueDate = invoiceData.due_date;
        if (!dueDate) {
          const invoiceDate = invoiceData.invoice_date
            ? new Date(invoiceData.invoice_date)
            : new Date();
          const paymentTerms = client.payment_terms || 30;
          const dueDateObj = new Date(invoiceDate);
          dueDateObj.setDate(dueDateObj.getDate() + paymentTerms);
          dueDate = dueDateObj.toISOString();
        }

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            org_id: orgId,
            client_id: invoiceData.client_id,
            payment_method: invoiceData.payment_method,
            invoice_date: invoiceData.invoice_date || new Date().toISOString(),
            due_date: dueDate,
            tax_rate: invoiceData.tax_rate || 0,
            discount_amount: invoiceData.discount_amount || 0,
            notes: invoiceData.notes,
            terms_and_conditions: invoiceData.terms_and_conditions,
            footer_text: invoiceData.footer_text,
            stripe_customer_id: invoiceData.stripe_customer_id,
            cod_collected_by: invoiceData.cod_collected_by,
            cod_collection_method: invoiceData.cod_collection_method,
            cod_notes: invoiceData.cod_notes,
            created_by: orgId,
            updated_by: orgId,
          })
          .select()
          .single();

        if (invoiceError) {
          throw invoiceError;
        }

        // Create line items
        const lineItemsToInsert = invoiceData.line_items.map((item, index) => ({
          invoice_id: invoice.id,
          order_id: item.order_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate || 0,
          line_order: item.line_order ?? index,
        }));

        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItemsToInsert);

        if (lineItemsError) {
          // Rollback: delete the invoice
          await supabase.from('invoices').delete().eq('id', invoice.id);
          throw lineItemsError;
        }

        // Fetch complete invoice
        const { data: completeInvoice, error: fetchError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoice.id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        results.success.push(completeInvoice);
      } catch (error: any) {
        results.failed.push({
          index: i,
          error: error.message || 'Unknown error',
          invoice: invoiceData,
        });
      }
    }

    // If send_immediately is true, send all successful invoices
    if (body.send_immediately && results.success.length > 0) {
      // TODO: Implement batch sending
      // For now, just mark them as sent
      const invoiceIds = results.success.map(inv => inv.id);
      await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_by: orgId,
        })
        .in('id', invoiceIds)
        .eq('status', 'draft');
    }

    // Return results
    const hasFailures = results.failed.length > 0;
    const message = hasFailures
      ? `Created ${results.success.length} invoices, ${results.failed.length} failed`
      : `Successfully created ${results.success.length} invoices`;

    return successResponse(
      results,
      message
    );
  } catch (error) {
    return handleApiError(error);
  }
}
