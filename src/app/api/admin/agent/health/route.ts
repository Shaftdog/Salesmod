/**
 * Agent Health Check Endpoint
 *
 * Returns comprehensive health status for monitoring and dashboards.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAgentHealth, getAgentMetrics } from '@/lib/agent/observability';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
  }

  try {
    const health = await getAgentHealth(profile.tenant_id);

    // Set appropriate HTTP status based on health
    const status = health.status === 'unhealthy' ? 503 : health.status === 'degraded' ? 200 : 200;

    return NextResponse.json(health, { status });
  } catch (error) {
    console.error('[AgentHealth] Error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
