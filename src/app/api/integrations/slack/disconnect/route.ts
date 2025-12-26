import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/integrations/slack/disconnect
 * Disconnects Slack integration for the user's tenant
 */
export async function POST() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's tenant_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'No tenant' }, { status: 403 });
  }

  // Delete Slack integration
  const { error: deleteError } = await supabase
    .from('slack_integrations')
    .delete()
    .eq('tenant_id', profile.tenant_id);

  if (deleteError) {
    console.error('[Slack Disconnect] Error:', deleteError);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }

  // Also delete any user mappings
  await supabase
    .from('slack_user_mappings')
    .delete()
    .eq('tenant_id', profile.tenant_id);

  return NextResponse.json({ success: true });
}
