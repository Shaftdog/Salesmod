/**
 * Cashflow Transaction CRUD API Routes
 * GET  /api/cashflow - List cashflow transactions with filters and pagination
 * POST /api/cashflow - Create new cashflow transaction (expense)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CreateCashflowTransactionSchema,
  CashflowListQuerySchema,
  type CreateCashflowTransactionInput,
  type CashflowListQuery,
} from '@/lib/validations/cashflow';
import {
  handleApiError,
  validateRequestBody,
  validateQueryParams,
  getAuthenticatedOrgId,
  successResponse,
  createdResponse,
} from '@/lib/errors/api-errors';
import type { CashflowTransaction } from '@/types/cashflow';

// =============================================
// GET /api/cashflow - List cashflow transactions
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Get authenticated user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const query = validateQueryParams<CashflowListQuery>(url, CashflowListQuerySchema);

    // Build the base query using cashflow_board view for joined data
    let supabaseQuery = supabase
      .from('cashflow_board')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.transaction_type) {
      if (Array.isArray(query.transaction_type)) {
        supabaseQuery = supabaseQuery.in('transaction_type', query.transaction_type);
      } else {
        supabaseQuery = supabaseQuery.eq('transaction_type', query.transaction_type);
      }
    }

    if (query.status) {
      if (Array.isArray(query.status)) {
        supabaseQuery = supabaseQuery.in('status', query.status);
      } else {
        supabaseQuery = supabaseQuery.eq('status', query.status);
      }
    }

    if (query.board_column) {
      if (Array.isArray(query.board_column)) {
        supabaseQuery = supabaseQuery.in('board_column', query.board_column);
      } else {
        supabaseQuery = supabaseQuery.eq('board_column', query.board_column);
      }
    }

    if (query.category) {
      supabaseQuery = supabaseQuery.eq('category', query.category);
    }

    if (query.client_id) {
      supabaseQuery = supabaseQuery.eq('client_id', query.client_id);
    }

    if (query.date_from) {
      supabaseQuery = supabaseQuery.gte('due_date', query.date_from);
    }

    if (query.date_to) {
      supabaseQuery = supabaseQuery.lte('due_date', query.date_to);
    }

    if (!query.include_recurring) {
      supabaseQuery = supabaseQuery.is('parent_transaction_id', null);
    }

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      supabaseQuery = supabaseQuery.or(
        `description.ilike.${searchPattern},client_name.ilike.${searchPattern},invoice_number.ilike.${searchPattern}`
      );
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(query.sort_by, {
      ascending: query.sort_order === 'asc',
    });

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    supabaseQuery = supabaseQuery.range(offset, offset + query.limit - 1);

    // Execute query
    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Cashflow query error:', error);
      throw error;
    }

    return successResponse({
      transactions: data || [],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / query.limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/cashflow - Create cashflow transaction
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Get authenticated user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await validateRequestBody<CreateCashflowTransactionInput>(
      request,
      CreateCashflowTransactionSchema
    );

    // Prevent creating transactions linked to invoices (those are auto-created)
    if (body.invoice_id) {
      return NextResponse.json(
        { error: 'Cannot manually create invoice-linked transactions. They are auto-synced.' },
        { status: 400 }
      );
    }

    // Prepare transaction data
    const transactionData = {
      org_id: orgId,
      user_id: user.id,
      transaction_type: body.transaction_type,
      category: body.category || null,
      order_id: body.order_id || null,
      client_id: body.client_id || null,
      description: body.description,
      amount: body.amount,
      due_date: body.due_date || null,
      expected_date: body.expected_date || null,
      is_recurring: body.is_recurring,
      recurrence_pattern: body.recurrence_pattern || null,
      priority_score: body.priority_score || 50,
      ai_extracted: body.ai_extracted || false,
      ai_metadata: body.ai_metadata || null,
      ai_confidence: body.ai_confidence || null,
      // board_column and status are auto-calculated by trigger
    };

    // Insert transaction
    const { data, error } = await supabase
      .from('cashflow_transactions')
      .insert(transactionData)
      .select(`
        *,
        client:clients(id, name, email),
        order:orders(id, order_number, property_address)
      `)
      .single();

    if (error) {
      console.error('Failed to create cashflow transaction:', error);
      throw error;
    }

    // If recurring, create future instances
    if (body.is_recurring && body.recurrence_pattern && data) {
      await createRecurringInstances(supabase, data.id, transactionData, body.recurrence_pattern);
    }

    return createdResponse(data, 'Cashflow transaction created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Create future instances of a recurring transaction
 */
async function createRecurringInstances(
  supabase: any,
  parentId: string,
  baseData: any,
  pattern: NonNullable<CreateCashflowTransactionInput['recurrence_pattern']>
) {
  try {
    const instances: any[] = [];
    let currentDate = new Date(baseData.due_date || new Date());
    const maxInstances = pattern.count || 12; // Default to 12 if no count/end_date

    for (let i = 0; i < maxInstances; i++) {
      // Calculate next date
      switch (pattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + pattern.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * pattern.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + pattern.interval);
          break;
      }

      // Check if past end date
      if (pattern.end_date && currentDate > new Date(pattern.end_date)) {
        break;
      }

      const nextDateStr = currentDate.toISOString().split('T')[0];

      instances.push({
        ...baseData,
        due_date: nextDateStr,
        expected_date: nextDateStr,
        parent_transaction_id: parentId,
        status: 'scheduled',
      });
    }

    if (instances.length > 0) {
      await supabase
        .from('cashflow_transactions')
        .insert(instances);
    }
  } catch (error) {
    console.error('Failed to create recurring instances:', error);
    // Don't fail the main request if recurring instances fail
  }
}
