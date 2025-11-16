/**
 * Revenue Recognition Report API Route
 * GET /api/reports/revenue - Get revenue recognition report
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  RevenueReportQuerySchema,
  type RevenueReportQueryInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateQueryParams,
  getAuthenticatedOrgId,
  successResponse,
} from '@/lib/errors/api-errors';
import type { RevenueRecognition } from '@/types/invoicing';

// =============================================
// GET /api/reports/revenue
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const query = validateQueryParams<RevenueReportQueryInput>(
      url,
      RevenueReportQuerySchema
    );

    // Query the revenue_recognition view
    let supabaseQuery = supabase
      .from('revenue_recognition')
      .select('*')
      .eq('org_id', orgId);

    // Apply date filters
    if (query.start_month) {
      const startDate = `${query.start_month}-01`;
      supabaseQuery = supabaseQuery.gte('revenue_month', startDate);
    }

    if (query.end_month) {
      // Last day of the end month
      const [year, month] = query.end_month.split('-').map(Number);
      const endDate = new Date(year, month, 0); // Last day of month
      supabaseQuery = supabaseQuery.lte('revenue_month', endDate.toISOString().split('T')[0]);
    }

    // Apply payment method filter
    if (query.payment_method) {
      supabaseQuery = supabaseQuery.eq('payment_method', query.payment_method);
    }

    // Apply sorting (chronological by default)
    supabaseQuery = supabaseQuery.order('revenue_month', { ascending: true });

    // Execute query
    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Error fetching revenue report:', error);
      throw error;
    }

    // Calculate totals
    const totalSummary = {
      total_invoiced: data?.reduce((sum, row) => sum + row.total_invoiced, 0) || 0,
      total_collected: data?.reduce((sum, row) => sum + row.total_collected, 0) || 0,
      total_outstanding: data?.reduce((sum, row) => sum + row.total_outstanding, 0) || 0,
      recognized_revenue: data?.reduce((sum, row) => sum + row.recognized_revenue, 0) || 0,
      deferred_revenue: data?.reduce((sum, row) => sum + row.deferred_revenue, 0) || 0,
    };

    // Group by requested dimension
    let groupedData = data || [];

    if (query.group_by === 'payment_method') {
      const grouped = new Map<string, any>();
      data?.forEach((row) => {
        const key = row.payment_method;
        if (!grouped.has(key)) {
          grouped.set(key, {
            payment_method: key,
            invoice_count: 0,
            total_invoiced: 0,
            total_collected: 0,
            total_outstanding: 0,
            recognized_revenue: 0,
            deferred_revenue: 0,
          });
        }
        const group = grouped.get(key)!;
        group.invoice_count += row.invoice_count;
        group.total_invoiced += row.total_invoiced;
        group.total_collected += row.total_collected;
        group.total_outstanding += row.total_outstanding;
        group.recognized_revenue += row.recognized_revenue;
        group.deferred_revenue += row.deferred_revenue;
      });
      groupedData = Array.from(grouped.values());
    } else if (query.group_by === 'status') {
      const grouped = new Map<string, any>();
      data?.forEach((row) => {
        const key = row.status;
        if (!grouped.has(key)) {
          grouped.set(key, {
            status: key,
            invoice_count: 0,
            total_invoiced: 0,
            total_collected: 0,
            total_outstanding: 0,
            recognized_revenue: 0,
            deferred_revenue: 0,
          });
        }
        const group = grouped.get(key)!;
        group.invoice_count += row.invoice_count;
        group.total_invoiced += row.total_invoiced;
        group.total_collected += row.total_collected;
        group.total_outstanding += row.total_outstanding;
        group.recognized_revenue += row.recognized_revenue;
        group.deferred_revenue += row.deferred_revenue;
      });
      groupedData = Array.from(grouped.values());
    }

    return successResponse<RevenueRecognition[]>(
      groupedData,
      undefined,
      {
        summary: totalSummary,
        group_by: query.group_by,
      } as any
    );
  } catch (error) {
    return handleApiError(error);
  }
}
