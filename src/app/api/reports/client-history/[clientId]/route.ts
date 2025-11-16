/**
 * Client Payment History Report API Route
 * GET /api/reports/client-history/[clientId] - Get payment performance for a client
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedOrgId,
  successResponse,
  NotFoundError,
} from '@/lib/errors/api-errors';
import type { ClientPaymentHistory } from '@/types/invoicing';

// =============================================
// GET /api/reports/client-history/[clientId]
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { clientId } = await params;

    // Verify client exists and belongs to org
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('id', clientId)
      .eq('org_id', orgId)
      .single();

    if (clientError || !client) {
      throw new NotFoundError('Client');
    }

    // Query client payment history view
    const { data: history, error: historyError } = await supabase
      .from('client_payment_history')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (historyError) {
      console.error('Error fetching client payment history:', historyError);
      throw historyError;
    }

    // Fetch detailed invoice list for this client
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, due_date, status, total_amount, amount_paid, amount_due')
      .eq('client_id', clientId)
      .eq('org_id', orgId)
      .order('invoice_date', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching client invoices:', invoicesError);
      throw invoicesError;
    }

    // Fetch recent payments for this client
    const { data: recentPayments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_date,
        payment_method,
        reference_number,
        invoice:invoices(invoice_number)
      `)
      .eq('org_id', orgId)
      .in('invoice_id', invoices.map(inv => inv.id))
      .order('payment_date', { ascending: false })
      .limit(10);

    if (paymentsError) {
      console.error('Error fetching recent payments:', paymentsError);
    }

    return successResponse<ClientPaymentHistory>({
      ...history,
      invoices,
      recent_payments: recentPayments || [],
    } as any);
  } catch (error) {
    return handleApiError(error);
  }
}
