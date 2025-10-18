import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/migrations/cancel
 * Cancel a running migration job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
    }

    // Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from('migration_jobs')
      .select('id, status, user_id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Only cancel if job is pending or processing
    if (job.status !== 'pending' && job.status !== 'processing') {
      return NextResponse.json(
        { error: `Cannot cancel job with status: ${job.status}` },
        { status: 400 }
      );
    }

    // Update job status to cancelled
    const { error: updateError } = await supabase
      .from('migration_jobs')
      .update({
        status: 'cancelled',
        finished_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Error cancelling job:', updateError);
      return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Migration cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling migration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel migration' },
      { status: 500 }
    );
  }
}

