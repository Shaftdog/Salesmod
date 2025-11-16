import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getContentPerformance, getChannelPerformance } from '@/lib/marketing/analytics-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const orgId = profile.id;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'content';

    if (type === 'channel') {
      const channelPerformance = await getChannelPerformance(orgId);
      return NextResponse.json({ channelPerformance });
    }

    const contentPerformance = await getContentPerformance(orgId);
    return NextResponse.json({ contentPerformance });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/analytics/performance:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
