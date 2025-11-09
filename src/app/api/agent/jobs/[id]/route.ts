/**
 * Job Detail API Routes
 * GET /api/agent/jobs/:id - Get job with metrics
 * PATCH /api/agent/jobs/:id - Update job (name, params, status)
 * DELETE /api/agent/jobs/:id - Delete job (soft delete via status)
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  GetJobResponse,
  Job,
  JobMetrics,
  JobTask,
  UpdateJobRequest,
  UpdateJobRequestSchema,
} from '@/types/jobs';

// ============================================================================
// GET /api/agent/jobs/:id - Get Job Details
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

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('org_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch metrics from materialized view
    const { data: metricsData, error: metricsError } = await supabase
      .from('job_metrics')
      .select('*')
      .eq('job_id', id)
      .single();

    if (metricsError) {
      console.error('Failed to fetch job metrics:', metricsError);
    }

    // Fetch recent tasks (last 10)
    const { data: tasks, error: tasksError } = await supabase
      .from('job_tasks')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (tasksError) {
      console.error('Failed to fetch job tasks:', tasksError);
    }

    const response: GetJobResponse = {
      job: job as Job,
      metrics: (metricsData as JobMetrics) || null,
      recent_tasks: (tasks as JobTask[]) || [],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in GET /api/agent/jobs/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/agent/jobs/:id - Update Job
// ============================================================================

export async function PATCH(
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData: UpdateJobRequest = UpdateJobRequestSchema.parse(body);

    // Check if job exists and belongs to user
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', id)
      .eq('org_id', user.id)
      .single();

    if (checkError || !existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Build update object for non-status fields
    const updates: any = {};
    if (validatedData.name) updates.name = validatedData.name;
    if (validatedData.description !== undefined) updates.description = validatedData.description;
    if (validatedData.params) updates.params = validatedData.params;

    // Handle status transitions using database function for consistency and validation
    if (validatedData.status) {
      const { error: transitionError } = await supabase.rpc('transition_job_status', {
        p_job_id: id,
        p_new_status: validatedData.status,
      });

      if (transitionError) {
        console.error('Status transition failed:', transitionError);
        return NextResponse.json(
          {
            error: 'Status transition failed',
            details: transitionError.message,
          },
          { status: 400 }
        );
      }
    }

    // Perform update for other fields (if any)
    let updatedJob;
    if (Object.keys(updates).length > 0) {
      const { data, error: updateError } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .eq('org_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update job:', updateError);
        return NextResponse.json(
          { error: 'Failed to update job', details: updateError.message },
          { status: 500 }
        );
      }

      updatedJob = data;
    } else {
      // If only status was updated, fetch the updated job
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('org_id', user.id)
        .single();

      if (fetchError) {
        console.error('Failed to fetch updated job:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch updated job', details: fetchError.message },
          { status: 500 }
        );
      }

      updatedJob = data;
    }

    return NextResponse.json({ job: updatedJob as Job });
  } catch (error: any) {
    console.error('Error in PATCH /api/agent/jobs/:id:', error);

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

// ============================================================================
// DELETE /api/agent/jobs/:id - Delete Job
// ============================================================================

export async function DELETE(
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

    // Check if job exists and belongs to user
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', id)
      .eq('org_id', user.id)
      .single();

    if (checkError || !existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Soft delete: mark as cancelled instead of hard delete
    const { error: deleteError } = await supabase
      .from('jobs')
      .update({
        status: 'cancelled',
        finished_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', user.id);

    if (deleteError) {
      console.error('Failed to delete job:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete job', details: deleteError.message },
        { status: 500 }
      );
    }

    // Skip all pending tasks
    const { error: skipError } = await supabase
      .from('job_tasks')
      .update({
        status: 'skipped',
        finished_at: new Date().toISOString(),
      })
      .eq('job_id', id)
      .in('status', ['pending', 'running']);

    if (skipError) {
      console.error('Failed to skip tasks:', skipError);
      // Don't fail the delete if task skip fails
    }

    return NextResponse.json({ success: true, message: 'Job cancelled' });
  } catch (error: any) {
    console.error('Error in DELETE /api/agent/jobs/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate if a status transition is allowed
 */
function validateStatusTransition(from: string, to: string): boolean {
  const allowedTransitions: Record<string, string[]> = {
    pending: ['running', 'cancelled'],
    running: ['paused', 'succeeded', 'failed', 'cancelled'],
    paused: ['running', 'cancelled'],
    succeeded: [], // Terminal state
    failed: ['running'], // Allow retry
    cancelled: [], // Terminal state
  };

  return allowedTransitions[from]?.includes(to) || false;
}
