/**
 * Resource Tasks Kanban API Route
 * GET /api/production/resource-tasks - Fetch tasks grouped by kanban columns
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ResourceTaskColumn,
  ResourceTaskWithRelations,
  ResourceTaskKanbanColumn,
  ResourceTaskKanbanData,
  RESOURCE_TASK_COLUMNS,
  RESOURCE_TASK_COLUMN_LABELS,
  RESOURCE_TASK_COLUMN_COLORS,
} from '@/types/production';

// Query parameter validation schema
const QueryParamsSchema = z.object({
  assigned_to: z.string().uuid().optional(),
});

/**
 * Determines which kanban column a task belongs to based on status, due date, and card stage
 */
function getTaskColumn(task: ResourceTaskWithRelations): ResourceTaskColumn {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextDay = new Date(today);
  nextDay.setDate(nextDay.getDate() + 2);

  // Check for completed first
  if (task.status === 'completed') {
    return 'COMPLETED';
  }

  // Check if card is in CORRECTION stage
  if (task.production_card.current_stage === 'CORRECTION') {
    return 'CORRECTION';
  }

  // Check blocked status - differentiate between ISSUES and IMPEDED
  if (task.status === 'blocked') {
    if (task.has_issue) {
      return 'ISSUES';
    }
    return 'IMPEDED';
  }

  // Check in_progress
  if (task.status === 'in_progress') {
    return 'STARTED';
  }

  // Pending tasks - categorize by due date
  if (task.status === 'pending') {
    if (!task.due_date) {
      return 'NOT_STARTED';
    }

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);

    // Overdue
    if (dueDate < today) {
      return 'OVERDUE';
    }

    // Today
    if (dueDate.getTime() === today.getTime()) {
      return 'TODAY';
    }

    // Tomorrow
    if (dueDate.getTime() === tomorrow.getTime()) {
      return 'TOMORROW';
    }

    // Next day (day after tomorrow)
    if (dueDate.getTime() === nextDay.getTime()) {
      return 'NEXT_DAY';
    }

    // Future tasks (more than 2 days out)
    return 'NOT_STARTED';
  }

  // Default fallback
  return 'NOT_STARTED';
}

// ============================================================================
// GET /api/production/resource-tasks - Get tasks grouped by kanban columns
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
      assigned_to: searchParams.get('assigned_to') || undefined,
    };

    const params = QueryParamsSchema.parse(rawParams);

    // Build query for parent tasks only
    let query = supabase
      .from('production_tasks')
      .select(
        `
        *,
        production_card:production_cards!inner(
          id, order_id, current_stage, due_date, tenant_id,
          order:orders(id, order_number, property_address)
        ),
        assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
      `
      )
      .eq('production_card.tenant_id', profile.tenant_id)
      .is('parent_task_id', null) // Parent tasks only
      .order('due_date', { ascending: true, nullsFirst: false });

    // Apply assigned_to filter if provided
    if (params.assigned_to) {
      query = query.eq('assigned_to', params.assigned_to);
    }

    const { data: tasks, error: queryError } = await query;

    if (queryError) {
      console.error('Failed to fetch resource tasks:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // Fetch subtasks for all parent tasks
    const parentTaskIds = (tasks || []).map((t: any) => t.id);
    let subtasksByParent: Record<string, any[]> = {};

    if (parentTaskIds.length > 0) {
      const { data: subtasks, error: subtasksError } = await supabase
        .from('production_tasks')
        .select(
          `
          *,
          assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
        `
        )
        .in('parent_task_id', parentTaskIds)
        .order('sort_order', { ascending: true });

      if (subtasksError) {
        console.error('Failed to fetch subtasks:', subtasksError);
      } else {
        // Group subtasks by parent_task_id
        for (const subtask of subtasks || []) {
          if (!subtasksByParent[subtask.parent_task_id]) {
            subtasksByParent[subtask.parent_task_id] = [];
          }
          subtasksByParent[subtask.parent_task_id].push(subtask);
        }
      }
    }

    // Attach subtasks to parent tasks
    const tasksWithSubtasks = (tasks || []).map((task: any) => ({
      ...task,
      subtasks: subtasksByParent[task.id] || [],
    }));

    // Group tasks by column
    const tasksByColumn: Record<ResourceTaskColumn, ResourceTaskWithRelations[]> = {
      NOT_STARTED: [],
      NEXT_DAY: [],
      TOMORROW: [],
      TODAY: [],
      OVERDUE: [],
      STARTED: [],
      ISSUES: [],
      IMPEDED: [],
      CORRECTION: [],
      COMPLETED: [],
    };

    for (const task of tasksWithSubtasks as ResourceTaskWithRelations[]) {
      const column = getTaskColumn(task);
      tasksByColumn[column].push(task);
    }

    // Build column response
    const columns: ResourceTaskKanbanColumn[] = RESOURCE_TASK_COLUMNS.map((columnId) => ({
      id: columnId,
      title: RESOURCE_TASK_COLUMN_LABELS[columnId],
      color: RESOURCE_TASK_COLUMN_COLORS[columnId],
      tasks: tasksByColumn[columnId],
      count: tasksByColumn[columnId].length,
    }));

    const response: ResourceTaskKanbanData = {
      columns,
      total_tasks: tasks?.length || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/production/resource-tasks:', error);

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
