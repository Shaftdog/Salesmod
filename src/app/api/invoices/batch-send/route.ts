/**
 * Batch Send Invoices API Route
 * POST /api/invoices/batch-send - Send multiple invoices at once
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  BatchSendInvoicesSchema,
  type BatchSendInvoicesInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedOrgId,
  successResponse,
  BadRequestError,
} from '@/lib/errors/api-errors';

// =============================================
// POST /api/invoices/batch-send
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Validate request body
    const body = await validateRequestBody<BatchSendInvoicesInput>(
      request,
      BatchSendInvoicesSchema
    );

    // Verify all invoices exist and belong to tenant
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        client:clients(id, company_name, email)
      `)
      .in('id', body.invoice_ids)
      .eq('tenant_id', tenantId);

    if (fetchError) {
      console.error('Error fetching invoices:', fetchError);
      throw fetchError;
    }

    if (!invoices || invoices.length === 0) {
      throw new BadRequestError('No invoices found');
    }

    if (invoices.length !== body.invoice_ids.length) {
      throw new BadRequestError(
        'Some invoices not found or access denied'
      );
    }

    const results: {
      sent: string[];
      failed: Array<{ invoice_id: string; invoice_number: string; error: string }>;
    } = {
      sent: [],
      failed: [],
    };

    // Process each invoice
    for (const invoice of invoices) {
      try {
        // Validate invoice can be sent
        if (['paid', 'cancelled', 'void'].includes(invoice.status)) {
          throw new Error(`Cannot send invoice with status: ${invoice.status}`);
        }

        // Check if client has email (client is returned as object from Supabase)
        const client = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client;
        if (!client?.email) {
          throw new Error('Client has no email address');
        }

        // TODO: Send email
        // For now, just mark as sent

        // Update invoice status
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            status: invoice.status === 'draft' ? 'sent' : invoice.status,
            sent_at: new Date().toISOString(),
            updated_by: orgId,
          })
          .eq('id', invoice.id);

        if (updateError) {
          throw updateError;
        }

        results.sent.push(invoice.id);
      } catch (error: any) {
        results.failed.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          error: error.message || 'Unknown error',
        });
      }
    }

    const message = results.failed.length > 0
      ? `Sent ${results.sent.length} invoices, ${results.failed.length} failed`
      : `Successfully sent ${results.sent.length} invoices`;

    return successResponse(
      results,
      message
    );
  } catch (error) {
    return handleApiError(error);
  }
}
