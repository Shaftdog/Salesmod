/**
 * Cashflow Board API Route
 * GET /api/cashflow/board - Get cashflow board grouped by columns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CashflowBoardQuerySchema,
  type CashflowBoardQuery,
} from '@/lib/validations/cashflow';
import {
  handleApiError,
  validateQueryParams,
  getAuthenticatedOrgId,
  successResponse,
} from '@/lib/errors/api-errors';
import type { CashflowBoard, CashflowBoardItem, BoardColumn } from '@/types/cashflow';

// =============================================
// GET /api/cashflow/board - Get cashflow board
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const query = validateQueryParams<CashflowBoardQuery>(url, CashflowBoardQuerySchema);

    // Build the base query
    let supabaseQuery = supabase
      .from('cashflow_board')
      .select('*')
      .eq('org_id', orgId);

    // Apply filters
    if (query.transaction_type) {
      supabaseQuery = supabaseQuery.eq('transaction_type', query.transaction_type);
    }

    if (query.client_id) {
      supabaseQuery = supabaseQuery.eq('client_id', query.client_id);
    }

    if (query.category) {
      supabaseQuery = supabaseQuery.eq('category', query.category);
    }

    // Exclude collected column unless requested
    if (!query.include_collected) {
      supabaseQuery = supabaseQuery.neq('board_column', 'collected');
    }

    // Order by column, then position, then due date
    supabaseQuery = supabaseQuery
      .order('board_column')
      .order('board_position')
      .order('due_date');

    // Execute query
    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Cashflow board query error:', error);
      throw error;
    }

    // Group by board column
    const board: CashflowBoard = {
      overdue: [],
      current_week: [],
      next_week: [],
      later: [],
      collected: [],
    };

    const items = (data || []) as CashflowBoardItem[];

    items.forEach((item) => {
      const column = item.board_column as BoardColumn;
      if (board[column]) {
        board[column].push(item);
      }
    });

    // Calculate summary stats per column
    const summary = {
      overdue: calculateColumnSummary(board.overdue),
      current_week: calculateColumnSummary(board.current_week),
      next_week: calculateColumnSummary(board.next_week),
      later: calculateColumnSummary(board.later),
      collected: calculateColumnSummary(board.collected),
    };

    return successResponse({
      board,
      summary,
      total: items.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

interface ColumnSummary {
  count: number;
  total_amount: number;
  income_amount: number;
  expense_amount: number;
  net_amount: number;
}

function calculateColumnSummary(items: CashflowBoardItem[]): ColumnSummary {
  const summary: ColumnSummary = {
    count: items.length,
    total_amount: 0,
    income_amount: 0,
    expense_amount: 0,
    net_amount: 0,
  };

  items.forEach((item) => {
    summary.total_amount += item.amount;

    if (item.transaction_type === 'income') {
      summary.income_amount += item.amount;
    } else {
      summary.expense_amount += item.amount;
    }
  });

  summary.net_amount = summary.income_amount - summary.expense_amount;

  return summary;
}
