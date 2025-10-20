import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/migrations/history
 * List past migration jobs for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: jobs, error, count } = await supabase
      .from('migration_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching migration history:', error);
      return NextResponse.json({ error: 'Failed to fetch migration history' }, { status: 500 });
    }

    return NextResponse.json({ jobs, total: count || 0 });
  } catch (error: any) {
    console.error('Error fetching migration history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch migration history' },
      { status: 500 }
    );
  }
}


