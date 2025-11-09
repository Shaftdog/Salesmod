/**
 * Job Tasks API Routes
 * GET /api/agent/jobs/:id/tasks - List tasks for a job
 * POST /api/agent/jobs/:id/tasks - Create new tasks for a job
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  BulkCreateTasksRequest,
  BulkCreateTasksRequestSchema,
  CreateTaskRequest,
  CreateTaskRequestSchema,
  JobTask,
  ListJobTasksResponse,
} from '@/types/jobs';

// ============================================================================
// GET /api/agent/jobs/:id/tasks - List Job Tasks
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', id)
      .eq('org_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const batch = searchParams.get('batch');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('job_tasks')
      .select('*', { count: 'exact' })
      .eq('job_id', id)
      .order('batch', { ascending: true })
      .order('step', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (batch !== null) {
      query = query.eq('batch', parseInt(batch, 10));
    }

    const { data: tasks, error: queryError, count } = await query;

    if (queryError) {
      console.error('Failed to fetch job tasks:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: queryError.message },
        { status: 500 }
      );
    }

    const response: ListJobTasksResponse = {
      tasks: (tasks || []) as JobTask[],
      total: count || 0,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in GET /api/agent/jobs/:id/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/agent/jobs/:id/tasks - Create Job Tasks
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', id)
      .eq('org_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if job is in a state that allows adding tasks
    if (job.status === 'cancelled' || job.status === 'succeeded') {
      return NextResponse.json(
        {
          error: 'Cannot add tasks to completed job',
          message: `Job is in ${job.status} status`,
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Support both single task and bulk task creation
    let tasksToCreate: Array<Omit<JobTask, 'id' | 'created_at' | 'started_at' | 'finished_at' | 'error_message' | 'retry_count'>>;

    if (Array.isArray(body)) {
      // Legacy: direct array of tasks
      tasksToCreate = body.map((task) => {
        const validated: CreateTaskRequest = CreateTaskRequestSchema.parse(task);
        return {
          job_id: id,
          step: validated.step,
          batch: validated.batch,
          kind: validated.kind,
          input: validated.input,
          output: null,
          status: 'pending',
        };
      });
    } else if (body.tasks) {
      // New: bulk create with tasks array
      const bulkRequest: BulkCreateTasksRequest = BulkCreateTasksRequestSchema.parse(body);
      tasksToCreate = bulkRequest.tasks.map((task) => ({
        job_id: id,
        step: task.step,
        batch: task.batch,
        kind: task.kind,
        input: task.input,
        output: null,
        status: 'pending',
      }));
    } else {
      // Single task
      const validated: CreateTaskRequest = CreateTaskRequestSchema.parse(body);
      tasksToCreate = [
        {
          job_id: id,
          step: validated.step,
          batch: validated.batch,
          kind: validated.kind,
          input: validated.input,
          output: null,
          status: 'pending',
        },
      ];
    }

    // Insert tasks
    const { data: createdTasks, error: insertError } = await supabase
      .from('job_tasks')
      .insert(tasksToCreate)
      .select();

    if (insertError) {
      console.error('Failed to create tasks:', insertError);
      return NextResponse.json(
        { error: 'Failed to create tasks', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        tasks: (createdTasks || []) as JobTask[],
        count: createdTasks?.length || 0,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/agent/jobs/:id/tasks:', error);

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
