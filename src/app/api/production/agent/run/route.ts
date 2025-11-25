import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runProductionAgentCycle } from '@/lib/production/agent-orchestrator';

export const maxDuration = 180; // 3 minutes

/**
 * POST /api/production/agent/run
 * Trigger a production agent work cycle
 *
 * This can be called:
 * 1. Manually by an admin
 * 2. Via cron job (scheduled, e.g., hourly)
 * 3. Event-driven (e.g., when a card moves stages)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get trigger type from request body
    const body = await request.json().catch(() => ({}));
    const triggerType = body.trigger || 'manual';

    console.log(`Starting production agent cycle for user ${user.id} (trigger: ${triggerType})`);

    // Run the production agent cycle
    const result = await runProductionAgentCycle(user.id, triggerType);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Production agent run failed:', error);
    return NextResponse.json(
      { error: error.message || 'Production agent run failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/production/agent/run
 * Get recent production agent runs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const { data: runs, error } = await supabase
      .from('production_agent_runs')
      .select('*')
      .eq('org_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({ runs: runs || [] });
  } catch (error: any) {
    console.error('Failed to fetch production agent runs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch runs' },
      { status: 500 }
    );
  }
}
