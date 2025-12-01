/**
 * Jobs API Routes
 * POST /api/agent/jobs - Create a new job
 * GET /api/agent/jobs - List jobs with optional filtering
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  CreateJobRequest,
  CreateJobRequestSchema,
  CreateJobResponse,
  Job,
  ListJobsResponse,
} from '@/types/jobs';

// ============================================================================
// POST /api/agent/jobs - Create Job
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData: CreateJobRequest = CreateJobRequestSchema.parse(body);

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'User has no tenant_id assigned' },
        { status: 403 }
      );
    }

    // Create job record
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        org_id: user.id,
        tenant_id: profile.tenant_id,
        owner_id: user.id,
        name: validatedData.name,
        description: validatedData.description || null,
        params: validatedData.params,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create job:', insertError);
      return NextResponse.json(
        { error: 'Failed to create job', details: insertError.message },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Job creation returned no data' },
        { status: 500 }
      );
    }

    // Create initial batch of tasks (batch 0)
    // This is a seed - the runner will create more tasks incrementally
    const initialTasks = generateInitialTasks(job);

    let tasksCreated = 0;
    if (initialTasks.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('job_tasks')
        .insert(initialTasks)
        .select();

      if (tasksError) {
        console.error('Failed to create initial tasks:', tasksError);

        // ROLLBACK: Delete the job since task creation failed
        await supabase
          .from('jobs')
          .delete()
          .eq('id', job.id);

        return NextResponse.json(
          {
            error: 'Failed to initialize job',
            details: tasksError.message,
          },
          { status: 500 }
        );
      }

      tasksCreated = tasks?.length || 0;
    }

    const response: CreateJobResponse = {
      job: job as Job,
      initial_tasks_created: tasksCreated,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/agent/jobs:', error);

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
// GET /api/agent/jobs - List Jobs
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('org_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error: queryError, count } = await query;

    if (queryError) {
      console.error('Failed to fetch jobs:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: queryError.message },
        { status: 500 }
      );
    }

    const response: ListJobsResponse = {
      jobs: (jobs || []) as Job[],
      total: count || 0,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in GET /api/agent/jobs:', error);
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
 * Generate initial batch of tasks for a new job
 * This creates a "seed" task that the runner will expand into actual work
 */
function generateInitialTasks(job: any): Array<{
  job_id: string;
  step: number;
  batch: number;
  kind: string;
  input: Record<string, any>;
  status: string;
}> {
  const tasks: Array<any> = [];
  const params = job.params;

  // Determine if this is an email campaign
  const hasTemplates = params.templates && Object.keys(params.templates).length > 0;
  const hasCadence = params.cadence;

  if (hasTemplates && hasCadence) {
    // Email campaign job
    let step = 0;

    // Day 0 - Initial outreach (if enabled)
    if (params.cadence.day0) {
      tasks.push({
        job_id: job.id,
        step: step++,
        batch: 0,
        kind: 'draft_email',
        input: {
          target_type: 'contact_group',
          target_filter: params.target_filter || {},
          contact_ids: params.target_contact_ids || [],
          template: Object.keys(params.templates)[0], // First template
          variables: {},
        },
        status: 'pending',
      });

      // Task to send the drafted emails (will be created by runner after approval)
      tasks.push({
        job_id: job.id,
        step: step++,
        batch: 0,
        kind: 'send_email',
        input: {
          depends_on_step: 0, // Wait for draft to be approved
        },
        status: 'pending',
      });
    }

    // Portal checks (if enabled)
    if (params.portal_checks && params.portal_urls) {
      tasks.push({
        job_id: job.id,
        step: step++,
        batch: 0,
        kind: 'check_portal',
        input: {
          portal_urls: params.portal_urls,
        },
        status: 'pending',
      });
    }

    // Follow-up tasks will be created incrementally by the runner
    // based on cadence (day4, day10, etc.)
  } else {
    // Generic job - create a placeholder task
    tasks.push({
      job_id: job.id,
      step: 0,
      batch: 0,
      kind: 'follow_up',
      input: {
        message: 'Job created - awaiting runner to generate tasks',
      },
      status: 'pending',
    });
  }

  return tasks;
}
