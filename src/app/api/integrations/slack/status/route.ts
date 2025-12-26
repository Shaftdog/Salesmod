import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/slack/status
 * Returns the current Slack integration status for the user's tenant
 */
export async function GET() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }

  // Get user's tenant_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) {
    return NextResponse.json({ connected: false, error: 'No tenant' });
  }

  // Get Slack integration
  const { data: integration } = await supabase
    .from('slack_integrations')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!integration) {
    return NextResponse.json({
      connected: false,
      configured: !!process.env.SLACK_CLIENT_ID,
    });
  }

  return NextResponse.json({
    connected: true,
    enabled: integration.enabled,
    teamName: integration.slack_team_name,
    teamId: integration.slack_team_id,
    installedAt: integration.created_at,
    configured: true,
  });
}
