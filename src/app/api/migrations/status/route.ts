import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/migrations/status?jobId=...
 * Poll endpoint for migration job status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
    }

    const { data: job, error } = await supabase
      .from('migration_jobs')
      .select('id, status, totals, started_at, finished_at, error_message')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Calculate progress percentage
    const totals = (job.totals as any) || { total: 0, inserted: 0, updated: 0, errors: 0 };
    const processed = (totals.inserted || 0) + (totals.updated || 0) + (totals.skipped || 0) + (totals.errors || 0);
    const progress = totals.total > 0 ? Math.round((processed / totals.total) * 100) : 0;

    return NextResponse.json({
      status: job.status,
      totals,
      progress,
      started_at: job.started_at,
      finished_at: job.finished_at,
      error_message: job.error_message,
    });
  } catch (error: any) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

