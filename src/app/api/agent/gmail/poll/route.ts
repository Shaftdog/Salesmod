import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { pollGmailInbox } from '@/lib/agent/gmail-poller';

/**
 * Polls Gmail inbox for new messages and processes them
 * This endpoint can be called:
 * 1. By a cron job every 2 minutes (polls all enabled orgs)
 * 2. Manually by the user via the UI (polls single org)
 * 3. As a webhook from Gmail push notifications (future)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if this is a cron job request (no user authentication)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    const isCronJob = !user || userError;

    if (isCronJob) {
      // Cron job: Poll all organizations with Gmail sync enabled
      console.log('[Gmail Poll Route] Cron job: Polling all enabled organizations...');
      return await handleCronPoll();
    } else {
      // Manual user request: Poll single organization
      console.log(`[Gmail Poll Route] Manual poll request from user: ${user.id}`);
      return await handleManualPoll(user.id);
    }
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
 * Handles cron job polling - polls all organizations with Gmail sync enabled
 */
async function handleCronPoll(): Promise<NextResponse> {
  try {
    const supabase = await createServiceRoleClient();

    // Get all organizations with Gmail sync enabled
    const { data: syncStates, error: syncError } = await supabase
      .from('gmail_sync_state')
      .select('org_id, is_enabled')
      .eq('is_enabled', true);

    if (syncError) {
      console.error('[Gmail Poll Route] Failed to fetch sync states:', syncError);
      return NextResponse.json(
        { error: 'Failed to fetch Gmail sync states' },
        { status: 500 }
      );
    }

    if (!syncStates || syncStates.length === 0) {
      console.log('[Gmail Poll Route] No organizations with Gmail sync enabled');
      return NextResponse.json({
        success: true,
        message: 'No organizations with Gmail sync enabled',
        data: {
          organizationsPolled: 0,
          totalMessagesProcessed: 0,
          totalCardsCreated: 0,
        },
      });
    }

    console.log(`[Gmail Poll Route] Polling ${syncStates.length} organizations...`);

    // Poll each organization
    const results = await Promise.allSettled(
      syncStates.map(async (state) => {
        console.log(`[Gmail Poll Route] Polling org: ${state.org_id}`);
        return await pollGmailInbox(state.org_id);
      })
    );

    // Aggregate results
    let totalMessagesProcessed = 0;
    let totalCardsCreated = 0;
    let totalAutoExecuted = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      const orgId = syncStates[index].org_id;
      if (result.status === 'fulfilled') {
        totalMessagesProcessed += result.value.messagesProcessed;
        totalCardsCreated += result.value.cardsCreated;
        totalAutoExecuted += result.value.autoExecutedCards;

        if (result.value.errors.length > 0) {
          errors.push(`Org ${orgId}: ${result.value.errors.join(', ')}`);
        }
      } else {
        errors.push(`Org ${orgId}: ${result.reason}`);
      }
    });

    console.log('[Gmail Poll Route] Cron poll complete:', {
      organizationsPolled: syncStates.length,
      totalMessagesProcessed,
      totalCardsCreated,
      totalAutoExecuted,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      message: `Polled ${syncStates.length} organization(s)`,
      data: {
        organizationsPolled: syncStates.length,
        totalMessagesProcessed,
        totalCardsCreated,
        totalAutoExecuted,
        errors,
      },
    });
  } catch (error) {
    console.error('[Gmail Poll Route] Cron poll error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Cron poll failed',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * Handles manual user polling - polls single organization
 */
async function handleManualPoll(userId: string): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Get org_id
    console.log('[Gmail Poll Route] Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Gmail Poll Route] Profile lookup error:', profileError);
      return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
    }

    if (!profile) {
      console.error('[Gmail Poll Route] Profile not found for user:', userId);
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
    console.error('[Gmail Poll Route] Manual poll error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Manual poll failed',
        error: (error as Error).message,
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

    // Get sync state
    const { data: syncState } = await supabase
      .from('gmail_sync_state')
      .select('*')
      .eq('org_id', profile.id)
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
