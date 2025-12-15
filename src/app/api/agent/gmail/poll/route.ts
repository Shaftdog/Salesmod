import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pollGmailInbox } from '@/lib/agent/gmail-poller';

/**
 * Polls Gmail inbox for new messages and processes them
 * This endpoint can be called:
 * 1. By a cron job every 2 minutes
 * 2. Manually by the user via the UI
 * 3. As a webhook from Gmail push notifications (future)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Gmail Poll Route] Starting manual poll request...');
    const supabase = await createClient();

    // Get authenticated user
    console.log('[Gmail Poll Route] Authenticating user...');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[Gmail Poll Route] Authentication failed:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Gmail Poll Route] Authenticated user: ${user.id}`);

    // Get org_id
    console.log('[Gmail Poll Route] Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Gmail Poll Route] Profile lookup error:', profileError);
      return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
    }

    if (!profile) {
      console.error('[Gmail Poll Route] Profile not found for user:', user.id);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log(`[Gmail Poll Route] Profile found: ${profile.id}`);

    // Poll Gmail inbox
    console.log('[Gmail Poll Route] Starting Gmail inbox poll...');
    const result = await pollGmailInbox(profile.id);

    if (!result.success) {
      console.error('[Gmail Poll Route] Polling failed with errors:', result.errors);

      // Determine the most specific error message
      const mainError = result.errors.length > 0
        ? result.errors[0]
        : 'Unknown polling error';

      return NextResponse.json(
        {
          success: false,
          message: mainError,
          errors: result.errors,
          details: {
            messagesProcessed: result.messagesProcessed,
            cardsCreated: result.cardsCreated,
          }
        },
        { status: 500 }
      );
    }

    console.log('[Gmail Poll Route] Polling succeeded:', {
      messagesProcessed: result.messagesProcessed,
      cardsCreated: result.cardsCreated,
      autoExecutedCards: result.autoExecutedCards,
    });

    return NextResponse.json({
      success: true,
      message: result.messagesProcessed > 0
        ? `Successfully processed ${result.messagesProcessed} message${result.messagesProcessed === 1 ? '' : 's'}`
        : 'No new messages',
      data: {
        messagesProcessed: result.messagesProcessed,
        cardsCreated: result.cardsCreated,
        autoExecutedCards: result.autoExecutedCards,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('[Gmail Poll Route] Unexpected error:', error);
    const errorMessage = (error as Error).message;
    const errorStack = (error as Error).stack;

    console.error('[Gmail Poll Route] Error stack:', errorStack);

    return NextResponse.json(
      {
        success: false,
        message: 'Gmail sync failed',
        error: errorMessage,
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if polling is enabled and get last sync time
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

    // Get org_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: tenantProfile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', profile.id)
      .single();

    if (!tenantProfile?.tenant_id) {
      return NextResponse.json(
        { error: 'User has no tenant_id assigned' },
        { status: 403 }
      );
    }

    // Get sync state
    const { data: syncState } = await supabase
      .from('gmail_sync_state')
      .select('*')
      .eq('tenant_id', tenantProfile.tenant_id)
      .single();

    if (!syncState) {
      return NextResponse.json({
        enabled: false,
        message: 'Gmail sync not configured',
      });
    }

    return NextResponse.json({
      enabled: syncState.is_enabled,
      autoProcess: syncState.auto_process,
      lastSyncAt: syncState.last_sync_at,
      totalMessagesSynced: syncState.total_messages_synced || 0,
      pollIntervalMinutes: syncState.poll_interval_minutes || 2,
    });
  } catch (error) {
    console.error('Error getting Gmail sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
