/**
 * Cashflow Forecast API Route
 * GET /api/cashflow/forecast - Get cashflow forecast for upcoming weeks/months
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CashflowForecastQuerySchema,
  type CashflowForecastQuery,
} from '@/lib/validations/cashflow';
import {
  handleApiError,
  validateQueryParams,
  getAuthenticatedOrgId,
  successResponse,
} from '@/lib/errors/api-errors';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const query = validateQueryParams<CashflowForecastQuery>(url, CashflowForecastQuerySchema);

    // Calculate date range
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (query.weeks * 7));
    const endDateStr = endDate.toISOString().split('T')[0];

    // Build query
    let supabaseQuery = supabase
      .from('cashflow_transactions')
      .select('*')
      .eq('org_id', orgId)
      .in('status', ['pending', 'scheduled', 'overdue'])
      .gte('due_date', startDate)
      .lte('due_date', endDateStr);

    // Apply filters
    if (!query.include_income) {
      supabaseQuery = supabaseQuery.neq('transaction_type', 'income');
    }

    if (!query.include_expenses) {
      supabaseQuery = supabaseQuery.neq('transaction_type', 'expense');
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Cashflow forecast query error:', error);
      throw error;
    }

    // Group by week or month
    const forecast = groupByPeriod(data || [], query.group_by);

    // Calculate running balance
    let runningBalance = 0;
    const forecastWithBalance = forecast.map((period) => {
      runningBalance += period.net_cashflow;
      return {
        ...period,
        running_balance: runningBalance,
      };
    });

    return successResponse({
      forecast: forecastWithBalance,
      summary: {
        total_expected_income: forecast.reduce((sum, p) => sum + p.expected_income, 0),
        total_expected_expenses: forecast.reduce((sum, p) => sum + p.expected_expenses, 0),
        total_net_cashflow: forecast.reduce((sum, p) => sum + p.net_cashflow, 0),
        final_balance: runningBalance,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

interface ForecastPeriod {
  period_start: string;
  period_end: string;
  period_label: string;
  transaction_count: number;
  expected_income: number;
  expected_expenses: number;
  net_cashflow: number;
}

function groupByPeriod(
  transactions: any[],
  groupBy: 'week' | 'month'
): ForecastPeriod[] {
  const periods = new Map<string, ForecastPeriod>();

  transactions.forEach((tx) => {
    const dueDate = new Date(tx.due_date);
    let periodKey: string;
    let periodStart: Date;
    let periodEnd: Date;
    let periodLabel: string;

    if (groupBy === 'week') {
      // Get week start (Monday)
      const dayOfWeek = dueDate.getDay();
      const diff = dueDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      periodStart = new Date(dueDate.setDate(diff));
      periodStart.setHours(0, 0, 0, 0);

      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);

      periodKey = periodStart.toISOString().split('T')[0];
      periodLabel = `Week of ${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      // Get month start
      periodStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
      periodEnd = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0);

      periodKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
      periodLabel = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }

    if (!periods.has(periodKey)) {
      periods.set(periodKey, {
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        period_label: periodLabel,
        transaction_count: 0,
        expected_income: 0,
        expected_expenses: 0,
        net_cashflow: 0,
      });
    }

    const period = periods.get(periodKey)!;
    period.transaction_count++;

    if (tx.transaction_type === 'income') {
      period.expected_income += tx.amount;
      period.net_cashflow += tx.amount;
    } else {
      period.expected_expenses += tx.amount;
      period.net_cashflow -= tx.amount;
    }
  });

  return Array.from(periods.values()).sort((a, b) =>
    a.period_start.localeCompare(b.period_start)
  );
}
