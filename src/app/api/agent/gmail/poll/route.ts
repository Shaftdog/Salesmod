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
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Poll Gmail inbox
    const result = await pollGmailInbox(profile.id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gmail polling failed',
          errors: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${result.messagesProcessed} messages`,
      data: {
        messagesProcessed: result.messagesProcessed,
        cardsCreated: result.cardsCreated,
        autoExecutedCards: result.autoExecutedCards,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Gmail polling error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to poll Gmail',
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
      .eq('user_id', user.id)
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
