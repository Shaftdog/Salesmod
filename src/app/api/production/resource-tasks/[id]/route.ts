/**
 * Resource Task Drop Action API Route
 * PATCH /api/production/resource-tasks/[id] - Handle task drop to a kanban column
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ResourceTaskDropSchema, ResourceTaskColumn } from '@/types/production';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// PATCH /api/production/resource-tasks/[id] - Handle task drop action
// ============================================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ResourceTaskDropSchema.parse(body);
    const { target_column, issue_description } = validatedData;

    // Verify task exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from('production_tasks')
      .select(
        `
        id, status, due_date, assigned_to, production_card_id,
        production_card:production_cards!inner(id, org_id, current_stage)
      `
      )
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user is in the same tenant
    const productionCard = (existing as any).production_card;
    if (productionCard.org_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Cannot drop to OVERDUE column
    if (target_column === 'OVERDUE') {
      return NextResponse.json(
        { error: 'Cannot manually move tasks to OVERDUE column' },
        { status: 400 }
      );
    }

    // Build updates based on target column
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 2);

    let updates: Record<string, any> = {};

    switch (target_column as ResourceTaskColumn) {
      case 'NOT_STARTED':
        updates = {
          status: 'pending',
          due_date: null,
          has_issue: false,
          issue_description: null,
          issue_created_at: null,
          issue_created_by: null,
        };
        break;

      case 'NEXT_DAY':
        updates = {
          status: 'pending',
          due_date: nextDay.toISOString().split('T')[0],
          has_issue: false,
          issue_description: null,
        };
        break;

      case 'TOMORROW':
        updates = {
          status: 'pending',
          due_date: tomorrow.toISOString().split('T')[0],
          has_issue: false,
          issue_description: null,
        };
        break;

      case 'TODAY':
        updates = {
          status: 'pending',
          due_date: today.toISOString().split('T')[0],
          has_issue: false,
          issue_description: null,
        };
        break;

      case 'STARTED':
        updates = {
          status: 'in_progress',
          has_issue: false,
          issue_description: null,
        };
        break;

      case 'ISSUES':
        // Require issue description
        if (!issue_description || issue_description.trim() === '') {
          return NextResponse.json(
            { error: 'Issue description is required when moving to ISSUES column' },
            { status: 400 }
          );
        }
        updates = {
          status: 'blocked',
          has_issue: true,
          issue_description: issue_description.trim(),
          issue_created_at: new Date().toISOString(),
          issue_created_by: user.id,
        };
        break;

      case 'IMPEDED':
        updates = {
          status: 'blocked',
          has_issue: false,
          issue_description: null,
        };
        break;

      case 'CORRECTION':
        // Move the production card to CORRECTION stage
        const { error: moveError } = await supabase.rpc('move_production_card', {
          p_card_id: existing.production_card_id,
          p_target_stage: 'CORRECTION',
        });

        if (moveError) {
          console.error('Failed to move card to CORRECTION:', moveError);
          return NextResponse.json(
            { error: 'Failed to move card to CORRECTION stage' },
            { status: 500 }
          );
        }

        // Task stays with its status, but clear any issues
        updates = {
          has_issue: false,
          issue_description: null,
        };
        break;

      case 'COMPLETED':
        const now = new Date();
        const isOnTime = existing.due_date ? now <= new Date(existing.due_date) : true;
        updates = {
          status: 'completed',
          completed_at: now.toISOString(),
          is_on_time: isOnTime,
          has_issue: false,
          issue_description: null,
        };
        break;

      default:
        return NextResponse.json(
          { error: `Invalid target column: ${target_column}` },
          { status: 400 }
        );
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

    return NextResponse.json({
      task,
      target_column,
      message: `Task moved to ${target_column}`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/production/resource-tasks/[id]:', error);

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
