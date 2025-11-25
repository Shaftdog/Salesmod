/**
 * Production Task Time Entries API Routes
 * GET /api/production/tasks/[id]/time-entries - List time entries for a task
 * POST /api/production/tasks/[id]/time-entries - Start/create a time entry
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ProductionTimeEntry,
  CreateTimeEntrySchema,
} from '@/types/production';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/production/tasks/[id]/time-entries - List Time Entries
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify task exists and user has access
    const { data: task, error: taskError } = await supabase
      .from('production_tasks')
      .select(
        `
        id,
        production_card:production_cards!inner(org_id)
      `
      )
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if ((task as any).production_card.org_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get time entries
    const { data: entries, error: entriesError } = await supabase
      .from('production_time_entries')
      .select(
        `
        *,
        user:profiles!production_time_entries_user_id_fkey(id, name, email)
      `
      )
      .eq('task_id', taskId)
      .order('started_at', { ascending: false });

    if (entriesError) {
      console.error('Failed to fetch time entries:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch time entries', details: entriesError.message },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalMinutes = (entries || [])
      .filter(e => e.duration_minutes)
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

    const activeEntry = (entries || []).find(e => !e.ended_at);

    return NextResponse.json({
      entries: entries as ProductionTimeEntry[],
      total_minutes: totalMinutes,
      active_entry: activeEntry || null,
    });
  } catch (error: any) {
    console.error('Error in GET /api/production/tasks/[id]/time-entries:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/production/tasks/[id]/time-entries - Start Timer / Create Entry
// ============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify task exists and user has access
    const { data: task, error: taskError } = await supabase
      .from('production_tasks')
      .select(
        `
        id, status,
        production_card:production_cards!inner(org_id)
      `
      )
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if ((task as any).production_card.org_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const action = body.action || 'start';

    if (action === 'start') {
      // Check for existing active timer on this task for this user
      const { data: existing } = await supabase
        .from('production_time_entries')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .is('ended_at', null)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Timer already running for this task', entry_id: existing.id },
          { status: 400 }
        );
      }

      // Create new time entry
      const { data: entry, error: createError } = await supabase
        .from('production_time_entries')
        .insert({
          task_id: taskId,
          user_id: user.id,
          started_at: new Date().toISOString(),
          entry_type: 'stopwatch',
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create time entry:', createError);
        return NextResponse.json(
          { error: 'Failed to start timer', details: createError.message },
          { status: 500 }
        );
      }

      // Update task status to in_progress if pending
      if (task.status === 'pending') {
        await supabase
          .from('production_tasks')
          .update({ status: 'in_progress' })
          .eq('id', taskId);
      }

      return NextResponse.json({ entry: entry as ProductionTimeEntry, action: 'started' }, { status: 201 });
    }

    if (action === 'stop') {
      // Find active timer
      const { data: activeEntry, error: findError } = await supabase
        .from('production_time_entries')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .is('ended_at', null)
        .single();

      if (findError || !activeEntry) {
        return NextResponse.json({ error: 'No active timer found' }, { status: 404 });
      }

      // Calculate duration
      const endedAt = new Date();
      const startedAt = new Date(activeEntry.started_at);
      const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));

      // Update entry
      const { data: entry, error: updateError } = await supabase
        .from('production_time_entries')
        .update({
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes,
          notes: body.notes || null,
        })
        .eq('id', activeEntry.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to stop timer:', updateError);
        return NextResponse.json(
          { error: 'Failed to stop timer', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ entry: entry as ProductionTimeEntry, action: 'stopped' });
    }

    if (action === 'manual') {
      // Validate manual entry data
      const manualData = CreateTimeEntrySchema.parse({
        task_id: taskId,
        started_at: body.started_at,
        ended_at: body.ended_at,
        entry_type: 'manual',
        notes: body.notes,
      });

      // Calculate duration
      let durationMinutes: number | null = null;
      if (manualData.ended_at) {
        const startedAt = new Date(manualData.started_at);
        const endedAt = new Date(manualData.ended_at);
        durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
      }

      // Create manual entry
      const { data: entry, error: createError } = await supabase
        .from('production_time_entries')
        .insert({
          task_id: taskId,
          user_id: user.id,
          started_at: manualData.started_at,
          ended_at: manualData.ended_at,
          duration_minutes: durationMinutes,
          entry_type: 'manual',
          notes: manualData.notes,
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create manual entry:', createError);
        return NextResponse.json(
          { error: 'Failed to create time entry', details: createError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ entry: entry as ProductionTimeEntry, action: 'created' }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/production/tasks/[id]/time-entries:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
