/**
 * Single Production Card API Routes
 * GET /api/production/cards/[id] - Get card with tasks
 * PUT /api/production/cards/[id] - Update card
 * DELETE /api/production/cards/[id] - Delete card
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ProductionCard,
  ProductionCardWithTasks,
  MoveCardSchema,
} from '@/types/production';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/production/cards/[id] - Get Single Card with Tasks
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

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    // Get card with order, template, and all role assignments (filtered by tenant_id)
    const { data: card, error: cardError } = await supabase
      .from('production_cards')
      .select(
        `
        *,
        order:orders(id, order_number, status, property_address, property_id),
        template:production_templates(id, name),
        assigned_appraiser:profiles!production_cards_assigned_appraiser_id_fkey(id, name, email),
        assigned_reviewer:profiles!production_cards_assigned_reviewer_id_fkey(id, name, email),
        assigned_admin:profiles!production_cards_assigned_admin_id_fkey(id, name, email),
        assigned_trainee:profiles!production_cards_assigned_trainee_id_fkey(id, name, email),
        assigned_researcher_level_1:profiles!production_cards_assigned_researcher_level_1_id_fkey(id, name, email),
        assigned_researcher_level_2:profiles!production_cards_assigned_researcher_level_2_id_fkey(id, name, email),
        assigned_researcher_level_3:profiles!production_cards_assigned_researcher_level_3_id_fkey(id, name, email),
        assigned_inspector:profiles!production_cards_assigned_inspector_id_fkey(id, name, email)
      `
      )
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (cardError) {
      if (cardError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }
      console.error('Failed to fetch card:', cardError);
      return NextResponse.json(
        { error: 'Failed to fetch card' },
        { status: 500 }
      );
    }

    // Get tasks with assigned users
    const { data: tasks, error: tasksError } = await supabase
      .from('production_tasks')
      .select(
        `
        *,
        assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
      `
      )
      .eq('production_card_id', id)
      .order('stage')
      .order('sort_order');

    if (tasksError) {
      console.error('Failed to fetch tasks:', tasksError);
    }

    // Get time entries for all tasks
    const taskIds = tasks?.map(t => t.id) || [];
    let timeEntries: any[] = [];
    if (taskIds.length > 0) {
      const { data: entriesData } = await supabase
        .from('production_time_entries')
        .select('*')
        .in('task_id', taskIds)
        .order('started_at', { ascending: false });
      timeEntries = entriesData || [];
    }

    // Build task hierarchy with time entries
    const parentTasks = (tasks || []).filter(t => !t.parent_task_id);
    const tasksWithSubtasks = parentTasks.map(task => ({
      ...task,
      subtasks: (tasks || []).filter(t => t.parent_task_id === task.id),
      time_entries: timeEntries.filter(te => te.task_id === task.id),
      active_timer: timeEntries.find(te => te.task_id === task.id && !te.ended_at) || null,
    }));

    // Check if can move to next stage
    const currentStageTasks = tasksWithSubtasks.filter(t => t.stage === card.current_stage);
    const incompleteTasks = currentStageTasks.filter(
      t => t.is_required && t.status !== 'completed'
    ).length;

    return NextResponse.json({
      card: {
        ...card,
        tasks: tasksWithSubtasks,
      } as ProductionCardWithTasks,
      can_move_to_next_stage: incompleteTasks === 0,
      incomplete_tasks: incompleteTasks,
    });
  } catch (error) {
    console.error('Error in GET /api/production/cards/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/production/cards/[id] - Update Card
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

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Verify card exists and belongs to user's tenant
    const { data: existing, error: checkError } = await supabase
      .from('production_cards')
      .select('id, current_stage')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Handle stage move separately
    if (body.move_to_stage) {
      const moveData = MoveCardSchema.parse({ target_stage: body.move_to_stage });

      // Use database function for safe stage transition
      const { error: moveError } = await supabase.rpc('move_production_card', {
        p_card_id: id,
        p_target_stage: moveData.target_stage,
      });

      if (moveError) {
        console.error('Failed to move card:', moveError);
        return NextResponse.json(
          { error: moveError.message || 'Cannot move card: incomplete required tasks' },
          { status: 400 }
        );
      }

      // Generate tasks for new stage
      const { data: tasksCreated, error: genError } = await supabase.rpc('generate_stage_tasks', {
        p_card_id: id,
        p_stage: moveData.target_stage,
      });

      if (genError) {
        console.error('Error generating tasks:', genError);
      }

      // Fetch updated card
      const { data: updatedCard } = await supabase
        .from('production_cards')
        .select(
          `
          *,
          order:orders(id, order_number, status, property_address, property_id),
          template:production_templates(id, name),
          assigned_appraiser:profiles!production_cards_assigned_appraiser_id_fkey(id, name, email)
        `
        )
        .eq('id', id)
        .single();

      return NextResponse.json({
        card: updatedCard,
        moved_to_stage: moveData.target_stage,
        tasks_created: tasksCreated || 0,
      });
    }

    // Regular update
    const updates: Record<string, any> = {};
    if (body.due_date !== undefined) updates.due_date = body.due_date;
    if (body.priority !== undefined) updates.priority = body.priority;
    // Role assignments - all 8 roles
    if (body.assigned_appraiser_id !== undefined) updates.assigned_appraiser_id = body.assigned_appraiser_id;
    if (body.assigned_reviewer_id !== undefined) updates.assigned_reviewer_id = body.assigned_reviewer_id;
    if (body.assigned_admin_id !== undefined) updates.assigned_admin_id = body.assigned_admin_id;
    if (body.assigned_trainee_id !== undefined) updates.assigned_trainee_id = body.assigned_trainee_id;
    if (body.assigned_researcher_level_1_id !== undefined) updates.assigned_researcher_level_1_id = body.assigned_researcher_level_1_id;
    if (body.assigned_researcher_level_2_id !== undefined) updates.assigned_researcher_level_2_id = body.assigned_researcher_level_2_id;
    if (body.assigned_researcher_level_3_id !== undefined) updates.assigned_researcher_level_3_id = body.assigned_researcher_level_3_id;
    if (body.assigned_inspector_id !== undefined) updates.assigned_inspector_id = body.assigned_inspector_id;

    const { data: card, error: updateError } = await supabase
      .from('production_cards')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        order:orders(id, order_number, status, property_address, property_id),
        template:production_templates(id, name),
        assigned_appraiser:profiles!production_cards_assigned_appraiser_id_fkey(id, name, email)
      `
      )
      .single();

    if (updateError) {
      console.error('Failed to update card:', updateError);
      return NextResponse.json(
        { error: 'Failed to update card' },
        { status: 500 }
      );
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Error in PUT /api/production/cards/[id]:', error);

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
// DELETE /api/production/cards/[id] - Delete Card
// ============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    // Verify card exists and belongs to user's tenant
    const { data: existing, error: checkError } = await supabase
      .from('production_cards')
      .select('id, current_stage')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Delete card (cascade will delete tasks, time entries, etc.)
    const { error: deleteError } = await supabase
      .from('production_cards')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete card:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete card' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Production card deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/production/cards/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
