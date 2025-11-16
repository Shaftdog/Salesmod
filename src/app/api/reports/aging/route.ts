/**
 * Aging Report API Route
 * GET /api/reports/aging - Get accounts receivable aging report by client
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  AgingReportQuerySchema,
  type AgingReportQueryInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateQueryParams,
  getAuthenticatedOrgId,
  successResponse,
} from '@/lib/errors/api-errors';
import type { InvoiceAgingReport } from '@/types/invoicing';

// =============================================
// GET /api/reports/aging
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const query = validateQueryParams<AgingReportQueryInput>(
      url,
      AgingReportQuerySchema
    );

    // Query the invoice_aging_report view
    let supabaseQuery = supabase
      .from('invoice_aging_report')
      .select('*')
      .eq('org_id', orgId);

    // Apply filters
    if (query.client_id) {
      supabaseQuery = supabaseQuery.eq('client_id', query.client_id);
    }

    if (query.min_outstanding) {
      supabaseQuery = supabaseQuery.gte('total_outstanding_amount', query.min_outstanding);
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(
      query.sort_by || 'total_outstanding_amount',
      { ascending: query.sort_order === 'asc' }
    );

    // Execute query
    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Error fetching aging report:', error);
      throw error;
    }

    // Calculate totals across all clients
    const totalSummary = {
      total_clients: data?.length || 0,
      total_outstanding_invoices: data?.reduce((sum, client) => sum + client.total_outstanding_invoices, 0) || 0,
      total_outstanding_amount: data?.reduce((sum, client) => sum + client.total_outstanding_amount, 0) || 0,
      current_amount: data?.reduce((sum, client) => sum + client.current_amount, 0) || 0,
      aged_1_30: data?.reduce((sum, client) => sum + client.aged_1_30, 0) || 0,
      aged_31_60: data?.reduce((sum, client) => sum + client.aged_31_60, 0) || 0,
      aged_61_90: data?.reduce((sum, client) => sum + client.aged_61_90, 0) || 0,
      aged_90_plus: data?.reduce((sum, client) => sum + client.aged_90_plus, 0) || 0,
    };

    return successResponse<InvoiceAgingReport[]>(
      data || [],
      undefined,
      {
        summary: totalSummary,
      } as any
    );
  } catch (error) {
    return handleApiError(error);
  }
}
