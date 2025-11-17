import { NextRequest } from 'next/server';
import {
  getApiContext,
  handleApiError,
  successResponse,
} from '@/lib/api-utils';
import { getAnalyticsDashboardSchema } from '@/lib/validations/field-services';

/**
 * GET /api/field-services/analytics/dashboard
 * Get dashboard analytics
 *
 * Phase 6: Reporting & Analytics
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;

    const { searchParams } = new URL(request.url);
    const validated = getAnalyticsDashboardSchema.parse({
      dateFrom: searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: searchParams.get('dateTo') || new Date().toISOString().split('T')[0],
    });

    const { dateFrom, dateTo } = validated;

    // Fetch analytics data
    const [
      { data: bookings },
      { data: timeEntries },
      { data: mileageLogs },
      { data: feedback }
    ] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, status, scheduled_start, scheduled_end, created_at')
        .eq('org_id', orgId)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo),

      supabase
        .from('time_entries')
        .select('id, duration_minutes, is_billable, entry_date')
        .eq('org_id', orgId)
        .gte('entry_date', dateFrom)
        .lte('entry_date', dateTo),

      supabase
        .from('mileage_logs')
        .select('id, distance_miles, reimbursement_amount, log_date')
        .eq('org_id', orgId)
        .gte('log_date', dateFrom)
        .lte('log_date', dateTo),

      supabase
        .from('customer_feedback')
        .select('id, rating, submitted_at')
        .eq('org_id', orgId)
        .gte('submitted_at', dateFrom)
        .lte('submitted_at', dateTo)
    ]);

    // Calculate metrics
    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;

    const totalHours = (timeEntries?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0) / 60;
    const billableHours = (timeEntries?.filter(t => t.is_billable).reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0) / 60;

    const totalMiles = mileageLogs?.reduce((sum, m) => sum + (m.distance_miles || 0), 0) || 0;
    const totalReimbursement = mileageLogs?.reduce((sum, m) => sum + (m.reimbursement_amount || 0), 0) || 0;

    const avgRating = feedback?.length > 0
      ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length
      : 0;

    const completionRate = totalBookings > 0
      ? (completedBookings / totalBookings) * 100
      : 0;

    const utilizationRate = totalHours > 0
      ? (billableHours / totalHours) * 100
      : 0;

    return successResponse({
      summary: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        completionRate: Math.round(completionRate * 10) / 10,
        totalHours: Math.round(totalHours * 10) / 10,
        billableHours: Math.round(billableHours * 10) / 10,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        totalMiles: Math.round(totalMiles * 10) / 10,
        totalReimbursement: Math.round(totalReimbursement * 100) / 100,
        avgCustomerRating: Math.round(avgRating * 10) / 10,
        feedbackCount: feedback?.length || 0,
      },
      dateRange: { from: dateFrom, to: dateTo }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
