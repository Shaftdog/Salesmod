/**
 * Production Tasks API Routes
 * GET /api/production/tasks - List tasks with filters
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ProductionTaskWithRelations,
  ProductionStage,
  TaskStatus,
} from '@/types/production';

// Query parameter validation schema
const QueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  card_id: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.string().optional(),
  stage: z.string().optional(),
  parent_only: z.enum(['true', 'false']).optional(),
});

// ============================================================================
// GET /api/production/tasks - List Tasks
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      card_id: searchParams.get('card_id') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      status: searchParams.get('status') || undefined,
      stage: searchParams.get('stage') || undefined,
      parent_only: searchParams.get('parent_only') || undefined,
    };

    const params = QueryParamsSchema.parse(rawParams);
    const parent_only = params.parent_only !== 'false';

    // Build query - filter by tenant_id for multi-tenant isolation
    let query = supabase
      .from('production_tasks')
      .select(
        `
        *,
        production_card:production_cards!inner(
          id, order_id, current_stage, tenant_id,
          order:orders(id, order_number)
        ),
        assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
      `,
        { count: 'exact' }
      )
      .eq('production_card.tenant_id', profile.tenant_id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(params.offset, params.offset + params.limit - 1);

    // Apply filters
    if (params.card_id) {
      query = query.eq('production_card_id', params.card_id);
    }
    if (params.assigned_to) {
      query = query.eq('assigned_to', params.assigned_to);
    }
    if (params.status) {
      query = query.eq('status', params.status as TaskStatus);
    }
    if (params.stage) {
      query = query.eq('stage', params.stage as ProductionStage);
    }
    if (parent_only) {
      query = query.is('parent_task_id', null);
    }

    const { data: tasks, error: queryError, count } = await query;

    if (queryError) {
      console.error('Failed to fetch tasks:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tasks: tasks as ProductionTaskWithRelations[],
      total: count || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/production/tasks:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
