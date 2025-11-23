import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  runSocialMediaOrchestrator,
  getAgentRuns,
  runWeeklyPerformanceLoop,
} from '@/lib/social-media/orchestrator';
import { SocialAgentType } from '@/lib/types/social-media';

/**
 * POST /api/social-media/run
 * Run the social media agent orchestrator
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await request.json();
    const agentType: SocialAgentType = body.agentType || 'full_cycle';
    const isWeeklyLoop = body.weeklyLoop === true;

    // Run the appropriate orchestrator
    const result = isWeeklyLoop
      ? await runWeeklyPerformanceLoop(profile.org_id, user.id)
      : await runSocialMediaOrchestrator(profile.org_id, user.id, agentType);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Social media agent run error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run agent' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social-media/run
 * Get recent agent runs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const runs = await getAgentRuns(profile.org_id, limit);

    return NextResponse.json({ runs });
  } catch (error: any) {
    console.error('Get agent runs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get runs' },
      { status: 500 }
    );
  }
}
