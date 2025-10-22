import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';

/**
 * GET /api/migrations/errors?jobId=...&format=csv
 * Download error report as CSV
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
    const format = searchParams.get('format') || 'json';

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
    }

    // Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from('migration_jobs')
      .select('id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch errors
    const { data: errors, error } = await supabase
      .from('migration_errors')
      .select('*')
      .eq('job_id', jobId)
      .order('row_index', { ascending: true });

    if (error) {
      console.error('Error fetching migration errors:', error);
      return NextResponse.json({ error: 'Failed to fetch errors' }, { status: 500 });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = errors.map(e => ({
        row_index: e.row_index,
        field: e.field || '',
        error_message: e.error_message,
        raw_data: JSON.stringify(e.raw_data),
      }));

      const csv = Papa.unparse(csvData as any);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="migration_errors_${jobId}.csv"`,
        },
      });
    }

    return NextResponse.json({ errors });
  } catch (error: any) {
    console.error('Error fetching migration errors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}


