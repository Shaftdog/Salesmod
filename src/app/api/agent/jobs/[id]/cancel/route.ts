/**
 * Cancel Job API Route
 * POST /api/agent/jobs/:id/cancel - Cancel a running or paused job
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { CancelJobResponse, Job } from '@/types/jobs';

// ============================================================================
// POST /api/agent/jobs/:id/cancel - Cancel Job
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

    // Check if job exists and belongs to tenant
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (checkError || !existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if job can be cancelled
    const cancellableStatuses = ['pending', 'running', 'paused'];
    if (!cancellableStatuses.includes(existingJob.status)) {
      return NextResponse.json(
        {
          error: 'Job cannot be cancelled',
          message: `Job is in ${existingJob.status} status and cannot be cancelled`,
        },
        { status: 400 }
      );
    }

    // Use the cancel_job database function for atomicity
    const { error: cancelError } = await supabase.rpc('cancel_job', {
      p_job_id: id,
    });

    if (cancelError) {
      console.error('Failed to cancel job:', cancelError);
      return NextResponse.json(
        { error: 'Failed to cancel job', details: cancelError.message },
        { status: 500 }
      );
    }

    // Fetch updated job
    const { data: cancelledJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !cancelledJob) {
      console.error('Failed to fetch cancelled job:', fetchError);
      return NextResponse.json(
        { error: 'Job cancelled but failed to fetch updated data' },
        { status: 500 }
      );
    }

    // Count how many tasks were skipped
    const { count: skippedCount, error: countError } = await supabase
      .from('job_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', id)
      .eq('status', 'skipped');

    if (countError) {
      console.error('Failed to count skipped tasks:', countError);
    }

    const response: CancelJobResponse = {
      job: cancelledJob as Job,
      tasks_skipped: skippedCount || 0,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in POST /api/agent/jobs/:id/cancel:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
