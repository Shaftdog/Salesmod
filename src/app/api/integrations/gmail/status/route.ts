import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Gets Gmail connection status and sync statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile with tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const tenantId = profile.tenant_id;

    // Check for OAuth tokens (get the most recently updated one if multiple exist)
    const { data: tokens } = await supabase
      .from('oauth_tokens')
      .select('account_email, expires_at, scopes, updated_at')
      .eq('org_id', profile.id)
      .eq('provider', 'google')
      .order('updated_at', { ascending: false })
      .limit(1);

    const token = tokens?.[0] || null;

    // Get sync state using tenant_id for multi-tenant isolation
    const { data: syncState } = await supabase
      .from('gmail_sync_state')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    // Get stats from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: messagesProcessed } = await supabase
      .from('gmail_messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', profile.id)
      .gte('processed_at', oneDayAgo);

    const { count: cardsCreated } = await supabase
      .from('kanban_cards')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', profile.id)
      .not('gmail_message_id', 'is', null)
      .gte('created_at', oneDayAgo);

    const { count: autoResponded } = await supabase
      .from('kanban_cards')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', profile.id)
      .eq('type', 'reply_to_email')
      .eq('state', 'done')
      .gte('executed_at', oneDayAgo);

    const { count: escalated } = await supabase
      .from('kanban_cards')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', profile.id)
      .eq('type', 'needs_human_response')
      .gte('created_at', oneDayAgo);

    const isConnected = !!token;
    const isTokenExpired = token?.expires_at
      ? new Date(token.expires_at) < new Date()
      : false;

    return NextResponse.json({
      connected: isConnected,
      tokenExpired: isTokenExpired,
      accountEmail: token?.account_email || null,
      scopes: token?.scopes || [],
      syncEnabled: syncState?.is_enabled || false,
      autoProcess: syncState?.auto_process || false,
      lastSyncAt: syncState?.last_sync_at || null,
      pollIntervalMinutes: syncState?.poll_interval_minutes || 2,
      autoHandleCategories: syncState?.auto_handle_categories || [],
      stats: {
        messagesProcessed: messagesProcessed || 0,
        cardsCreated: cardsCreated || 0,
        autoResponded: autoResponded || 0,
        escalated: escalated || 0,
      },
    });
  } catch (error) {
    console.error('Gmail status error:', error);
    return NextResponse.json(
      { error: 'Failed to get Gmail status' },
      { status: 500 }
    );
  }
}
