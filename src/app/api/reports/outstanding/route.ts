/**
 * Outstanding Invoices Report API Route
 * GET /api/reports/outstanding - Get outstanding invoices with aging information
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  OutstandingReportQuerySchema,
  type OutstandingReportQueryInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateQueryParams,
  getAuthenticatedOrgId,
  successResponse,
} from '@/lib/errors/api-errors';
import type { OutstandingInvoice } from '@/types/invoicing';

// =============================================
// GET /api/reports/outstanding
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const query = validateQueryParams<OutstandingReportQueryInput>(
      url,
      OutstandingReportQuerySchema
    );

    // Query the outstanding_invoices view
    let supabaseQuery = supabase
      .from('outstanding_invoices')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.aging_bucket) {
      supabaseQuery = supabaseQuery.eq('aging_bucket', query.aging_bucket);
    }

    if (query.min_amount) {
      supabaseQuery = supabaseQuery.gte('amount_due', query.min_amount);
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(query.sort_by || 'due_date', {
      ascending: query.sort_order === 'asc',
    });

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    supabaseQuery = supabaseQuery.range(from, to);

    // Execute query
    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Error fetching outstanding invoices:', error);
      throw error;
    }

    // Calculate summary statistics
    const totalOutstanding = data?.reduce((sum, inv) => sum + inv.amount_due, 0) || 0;
    const overdueCount = data?.filter((inv) => inv.days_overdue > 0).length || 0;

    const agingBucketSummary = {
      current: data?.filter((inv) => inv.aging_bucket === 'current').reduce((sum, inv) => sum + inv.amount_due, 0) || 0,
      '1-30': data?.filter((inv) => inv.aging_bucket === '1-30').reduce((sum, inv) => sum + inv.amount_due, 0) || 0,
      '31-60': data?.filter((inv) => inv.aging_bucket === '31-60').reduce((sum, inv) => sum + inv.amount_due, 0) || 0,
      '61-90': data?.filter((inv) => inv.aging_bucket === '61-90').reduce((sum, inv) => sum + inv.amount_due, 0) || 0,
      '90+': data?.filter((inv) => inv.aging_bucket === '90+').reduce((sum, inv) => sum + inv.amount_due, 0) || 0,
    };

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return successResponse<OutstandingInvoice[]>(
      data || [],
      undefined,
      {
        page,
        limit,
        total: count || 0,
        totalPages,
        summary: {
          total_outstanding: totalOutstanding,
          overdue_count: overdueCount,
          aging_buckets: agingBucketSummary,
        },
      } as any
    );
  } catch (error) {
    return handleApiError(error);
  }
}
