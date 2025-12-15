/**
 * My Production Tasks API Routes
 * GET /api/production/my-tasks - Get current user's tasks sorted by due date
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ProductionTaskWithRelations,
  TaskStatus,
  ProductionStage,
} from '@/types/production';

// Query parameter validation schema
const QueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.string().optional(),
  stage: z.string().optional(),
  include_completed: z.enum(['true', 'false']).optional(),
});

// ============================================================================
// GET /api/production/my-tasks - Get My Tasks (Today)
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
      stage: searchParams.get('stage') || undefined,
      include_completed: searchParams.get('include_completed') || undefined,
    };

    const params = QueryParamsSchema.parse(rawParams);
    const includeCompleted = params.include_completed === 'true';

    // Build query - tasks assigned to current user, sorted by due date
    let query = supabase
      .from('production_tasks')
      .select(
        `
        *,
        production_card:production_cards!inner(
          id, order_id, current_stage, org_id, due_date, priority,
          order:orders(id, order_number, status, property_address)
        ),
        assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
      `
      )
      .eq('assigned_to', user.id)
      .is('parent_task_id', null) // Only parent tasks
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(params.limit);

    // Apply filters
    if (!includeCompleted) {
      query = query.in('status', ['pending', 'in_progress']);
    }
    if (params.status) {
      query = query.eq('status', params.status as TaskStatus);
    }
    if (params.stage) {
      query = query.eq('stage', params.stage as ProductionStage);
    }

    const { data: tasks, error: queryError } = await query;

    if (queryError) {
      console.error('Failed to fetch my tasks:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // Calculate stats
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const overdueCount = (tasks || []).filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < now;
    }).length;

    const dueTodayCount = (tasks || []).filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= now && dueDate <= todayEnd;
    }).length;

    const upcomingCount = (tasks || []).filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) > todayEnd;
    }).length;

    // Get active timers for these tasks
    const taskIds = (tasks || []).map(t => t.id);
    let activeTimers: Record<string, any> = {};
    let subtasksByParent: Record<string, any[]> = {};

    if (taskIds.length > 0) {
      // Fetch active timers
      const { data: timers } = await supabase
        .from('production_time_entries')
        .select('*')
        .in('task_id', taskIds)
        .eq('user_id', user.id)
        .is('ended_at', null);

      if (timers) {
        timers.forEach(timer => {
          activeTimers[timer.task_id] = timer;
        });
      }

      // Fetch subtasks for these parent tasks
      const { data: subtasks } = await supabase
        .from('production_tasks')
        .select('*')
        .in('parent_task_id', taskIds)
        .order('sort_order', { ascending: true });

      if (subtasks) {
        subtasks.forEach(subtask => {
          if (!subtasksByParent[subtask.parent_task_id]) {
            subtasksByParent[subtask.parent_task_id] = [];
          }
          subtasksByParent[subtask.parent_task_id].push(subtask);
        });
      }
    }

    // Add active timer and subtasks info to tasks
    const tasksWithTimers = (tasks || []).map(task => ({
      ...task,
      active_timer: activeTimers[task.id] || null,
      subtasks: subtasksByParent[task.id] || [],
    }));

    return NextResponse.json({
      tasks: tasksWithTimers as ProductionTaskWithRelations[],
      total: tasks?.length || 0,
      overdue_count: overdueCount,
      due_today_count: dueTodayCount,
      upcoming_count: upcomingCount,
    });
  } catch (error) {
    console.error('Error in GET /api/production/my-tasks:', error);

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
