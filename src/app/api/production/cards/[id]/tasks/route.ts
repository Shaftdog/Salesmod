/**
 * Production Card Tasks API Routes
 * POST /api/production/cards/[id]/tasks - Add tasks from library to card
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema for adding library tasks to a card
const AddTasksSchema = z.object({
  libraryTaskIds: z.array(z.string().uuid())
    .min(1, 'At least one task ID is required')
    .max(50, 'Cannot add more than 50 tasks at once'),
});

// ============================================================================
// POST /api/production/cards/[id]/tasks - Add Tasks from Library
// ============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cardId } = await params;
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

    // Parse and validate request body
    const body = await request.json();
    const { libraryTaskIds } = AddTasksSchema.parse(body);

    // Get the production card with its role assignments
    const { data: card, error: cardError } = await supabase
      .from('production_cards')
      .select(`
        id, tenant_id, current_stage, total_tasks,
        assigned_appraiser_id, assigned_reviewer_id, assigned_admin_id,
        assigned_trainee_id, assigned_researcher_level_1_id,
        assigned_researcher_level_2_id, assigned_researcher_level_3_id,
        assigned_inspector_id
      `)
      .eq('id', cardId)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Get library tasks with their subtasks - SECURITY: enforce tenant isolation
    const { data: libraryTasks, error: libError } = await supabase
      .from('task_library')
      .select(`
        *,
        subtasks:task_library_subtasks(*)
      `)
      .in('id', libraryTaskIds)
      .eq('tenant_id', profile.tenant_id);

    if (libError) {
      console.error('Failed to fetch library tasks:', libError);
      return NextResponse.json({ error: 'Failed to fetch library tasks' }, { status: 500 });
    }

    if (!libraryTasks || libraryTasks.length === 0) {
      return NextResponse.json({ error: 'No valid library tasks found' }, { status: 400 });
    }

    // SECURITY: Verify all requested tasks were found (prevents access to other tenant's tasks)
    if (libraryTasks.length !== libraryTaskIds.length) {
      return NextResponse.json({ error: 'One or more library tasks not found or access denied' }, { status: 403 });
    }

    // Get the max sort_order for tasks in this card
    const { data: existingTasks } = await supabase
      .from('production_tasks')
      .select('sort_order')
      .eq('production_card_id', cardId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const startSortOrder = (existingTasks?.[0]?.sort_order ?? -1) + 1;

    // Role assignment mapping helper
    const getRoleAssignment = (role: string): string | null => {
      const roleMap: Record<string, string | null> = {
        appraiser: card.assigned_appraiser_id,
        reviewer: card.assigned_reviewer_id,
        admin: card.assigned_admin_id,
        trainee: card.assigned_trainee_id,
        researcher_level_1: card.assigned_researcher_level_1_id,
        researcher_level_2: card.assigned_researcher_level_2_id,
        researcher_level_3: card.assigned_researcher_level_3_id,
        inspector: card.assigned_inspector_id,
      };
      return roleMap[role] || null;
    };

    // Create production tasks from library tasks
    const createdTasks: any[] = [];

    for (let i = 0; i < libraryTasks.length; i++) {
      const libTask = libraryTasks[i];

      // Create parent task
      const { data: parentTask, error: parentError } = await supabase
        .from('production_tasks')
        .insert({
          production_card_id: cardId,
          template_task_id: null, // Not from template
          title: libTask.title,
          description: libTask.description,
          stage: libTask.stage,
          role: libTask.default_role,
          assigned_to: getRoleAssignment(libTask.default_role),
          status: 'pending',
          estimated_minutes: libTask.estimated_minutes,
          is_required: libTask.is_required,
          sort_order: startSortOrder + i,
          metadata: { source: 'library', library_task_id: libTask.id },
        })
        .select()
        .single();

      if (parentError) {
        console.error('Failed to create task:', parentError);
        continue;
      }

      createdTasks.push(parentTask);

      // Create subtasks if any
      if (libTask.subtasks && libTask.subtasks.length > 0) {
        const subtaskInserts = libTask.subtasks.map((sub: any, subIndex: number) => ({
          production_card_id: cardId,
          parent_task_id: parentTask.id,
          title: sub.title,
          description: sub.description,
          stage: libTask.stage,
          role: sub.default_role,
          assigned_to: getRoleAssignment(sub.default_role),
          status: 'pending',
          estimated_minutes: sub.estimated_minutes,
          is_required: sub.is_required,
          sort_order: subIndex,
          metadata: { source: 'library', library_subtask_id: sub.id },
        }));

        const { error: subError } = await supabase
          .from('production_tasks')
          .insert(subtaskInserts);

        if (subError) {
          console.error('Failed to create subtasks:', subError);
        }
      }
    }

    // Update total_tasks count on the card
    const { data: taskCount } = await supabase
      .from('production_tasks')
      .select('id', { count: 'exact' })
      .eq('production_card_id', cardId);

    const newTotalTasks = taskCount?.length || card.total_tasks;

    await supabase
      .from('production_cards')
      .update({ total_tasks: newTotalTasks })
      .eq('id', cardId);

    return NextResponse.json({
      success: true,
      tasks_created: createdTasks.length,
      message: `${createdTasks.length} task(s) added to the production card.`,
    });

  } catch (error) {
    console.error('Error in POST /api/production/cards/[id]/tasks:', error);

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
