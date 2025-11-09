import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runWorkBlock } from '@/lib/agent/orchestrator';

export const maxDuration = 180; // 3 minutes (Vercel Pro tier)

/**
 * POST /api/agent/run
 * Trigger a new agent work cycle
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

    // Get mode from request body (default: review)
    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'auto' ? 'auto' : 'review';

    // Get agent settings to check if enabled
    const { data: settings } = await supabase
      .from('agent_settings')
      .select('*')
      .eq('org_id', user.id)
      .single();

    if (settings && !settings.enabled) {
      return NextResponse.json(
        { error: 'Agent is disabled for this organization' },
        { status: 403 }
      );
    }

    // Run the work block
    console.log(`Starting agent work block for user ${user.id} in ${mode} mode`);
    const run = await runWorkBlock(user.id, mode);

    return NextResponse.json({
      success: true,
      run,
    });
  } catch (error: any) {
    console.error('Agent run failed:', error);
    return NextResponse.json(
      { error: error.message || 'Agent run failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/run
 * Get recent runs
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const { data: runs, error } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('org_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({ runs: runs || [] });
  } catch (error: any) {
    console.error('Failed to fetch runs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch runs' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agent/run
 * Stop the currently running agent
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the currently running agent run
    const { data: runningRun, error: fetchError } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('org_id', user.id)
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !runningRun) {
      return NextResponse.json(
        { error: 'No running agent found' },
        { status: 404 }
      );
    }

    // Update the run status to cancelled
    const { data: updatedRun, error: updateError } = await supabase
      .from('agent_runs')
      .update({
        status: 'cancelled',
        ended_at: new Date().toISOString(),
      })
      .eq('id', runningRun.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`Stopped agent run ${runningRun.id} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      run: updatedRun,
    });
  } catch (error: any) {
    console.error('Failed to stop agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop agent' },
      { status: 500 }
    );
  }
}


