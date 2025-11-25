/**
 * Single Production Task API Routes
 * GET /api/production/tasks/[id] - Get task details
 * PUT /api/production/tasks/[id] - Update task
 * POST /api/production/tasks/[id]/complete - Mark task complete
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ProductionTask,
  UpdateTaskSchema,
} from '@/types/production';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/production/tasks/[id] - Get Single Task
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get task with relations
    const { data: task, error: taskError } = await supabase
      .from('production_tasks')
      .select(
        `
        *,
        production_card:production_cards!inner(
          id, order_id, current_stage, org_id,
          order:orders(id, order_number)
        ),
        assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
      `
      )
      .eq('id', id)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      console.error('Failed to fetch task:', taskError);
      return NextResponse.json(
        { error: 'Failed to fetch task' },
        { status: 500 }
      );
    }

    // Verify user has access
    if ((task as any).production_card.org_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get subtasks
    const { data: subtasks } = await supabase
      .from('production_tasks')
      .select(
        `
        *,
        assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
      `
      )
      .eq('parent_task_id', id)
      .order('sort_order');

    // Get time entries
    const { data: timeEntries } = await supabase
      .from('production_time_entries')
      .select('*')
      .eq('task_id', id)
      .order('started_at', { ascending: false });

    return NextResponse.json({
      task: {
        ...task,
        subtasks: subtasks || [],
        time_entries: timeEntries || [],
        active_timer: (timeEntries || []).find(te => !te.ended_at) || null,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/production/tasks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/production/tasks/[id] - Update Task
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateTaskSchema.parse(body);

    // Verify task exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from('production_tasks')
      .select(
        `
        id,
        production_card:production_cards!inner(org_id)
      `
      )
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if ((existing as any).production_card.org_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build updates
    const updates: Record<string, any> = {};
    if (validatedData.title !== undefined) updates.title = validatedData.title;
    if (validatedData.description !== undefined) updates.description = validatedData.description;
    if (validatedData.assigned_to !== undefined) updates.assigned_to = validatedData.assigned_to;
    if (validatedData.status !== undefined) {
      updates.status = validatedData.status;
      // If completing, set completed_at
      if (validatedData.status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (validatedData.due_date !== undefined) updates.due_date = validatedData.due_date;
    if (validatedData.notes !== undefined) updates.notes = validatedData.notes;

    // Update task
    const { data: task, error: updateError } = await supabase
      .from('production_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update task:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: task as ProductionTask });
  } catch (error) {
    console.error('Error in PUT /api/production/tasks/[id]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/production/tasks/[id] - Actions (complete, start, etc.)
// ============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse action
    const body = await request.json();
    const action = body.action;

    // Verify task exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from('production_tasks')
      .select(
        `
        id, status, due_date,
        production_card:production_cards!inner(org_id)
      `
      )
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if ((existing as any).production_card.org_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let updates: Record<string, any> = {};

    switch (action) {
      case 'complete':
        const now = new Date();
        const isOnTime = existing.due_date ? now <= new Date(existing.due_date) : true;
        updates = {
          status: 'completed',
          completed_at: now.toISOString(),
          is_on_time: isOnTime,
        };
        break;

      case 'start':
        updates = {
          status: 'in_progress',
        };
        break;

      case 'block':
        updates = {
          status: 'blocked',
          notes: body.reason || 'Task blocked',
        };
        break;

      case 'unblock':
        updates = {
          status: 'pending',
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update task
    const { data: task, error: updateError } = await supabase
      .from('production_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update task:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: task as ProductionTask, action });
  } catch (error) {
    console.error('Error in POST /api/production/tasks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
