/**
 * Gmail Polling Cron Endpoint
 *
 * Polls Gmail for new messages across all enabled tenants.
 * Schedule: Every 5 minutes
 *
 * Authentication: Requires CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { pollGmailInbox } from '@/lib/agent/gmail-poller';
import { isAgentGloballyEnabled } from '@/lib/agent/agent-config';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute max

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.length < 32) {
    console.error('[GmailCron] CRON_SECRET not configured or too short (min 32 chars)');
    return NextResponse.json(
      { error: 'Cron not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('[GmailCron] Invalid cron secret');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[GmailCron] Starting Gmail poll');

  try {
    // Check global kill switch
    const globalEnabled = await isAgentGloballyEnabled();
    if (!globalEnabled) {
      console.log('[GmailCron] Agent is globally disabled, skipping Gmail poll');
      return NextResponse.json({
        success: false,
        message: 'Agent is globally disabled',
        duration: Date.now() - startTime,
      });
    }

    const supabase = createServiceRoleClient();

    // Get all tenants with Gmail sync enabled
    const { data: syncStates } = await supabase
      .from('gmail_sync_state')
      .select(`
        tenant_id,
        is_enabled,
        auto_process,
        tenant:tenants!inner(id, is_active, agent_enabled)
      `)
      .eq('is_enabled', true);

    if (!syncStates || syncStates.length === 0) {
      console.log('[GmailCron] No tenants with Gmail sync enabled');
      return NextResponse.json({
        success: true,
        message: 'No tenants with Gmail sync enabled',
        tenantsProcessed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Filter to active tenants with agent enabled
    const activeTenants = syncStates.filter(
      (s) => (s.tenant as any)?.is_active && (s.tenant as any)?.agent_enabled
    );

    console.log(`[GmailCron] Processing ${activeTenants.length} tenants`);

    const results = {
      processed: 0,
      messagesTotal: 0,
      cardsCreated: 0,
      errors: 0,
    };

    // Get org_id for each tenant and poll
    for (const syncState of activeTenants) {
      try {
        // Get a user (org_id) for this tenant to use for Gmail API
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('tenant_id', syncState.tenant_id)
          .limit(1)
          .single();

        if (!profile) {
          console.warn(`[GmailCron] No profile found for tenant ${syncState.tenant_id}`);
          continue;
        }

        const pollResult = await pollGmailInbox(profile.id);

        results.processed++;
        results.messagesTotal += pollResult.messagesProcessed;
        results.cardsCreated += pollResult.cardsCreated;

        if (pollResult.errors.length > 0) {
          results.errors++;
          console.warn(`[GmailCron] Errors for tenant ${syncState.tenant_id}:`, pollResult.errors);
        }
      } catch (error) {
        results.errors++;
        console.error(`[GmailCron] Error polling tenant ${syncState.tenant_id}:`, error);
      }
    }

    const duration = Date.now() - startTime;

    console.log('[GmailCron] Completed:', {
      tenantsProcessed: results.processed,
      messagesTotal: results.messagesTotal,
      cardsCreated: results.cardsCreated,
      errors: results.errors,
      duration,
    });

    return NextResponse.json({
      success: true,
      tenantsProcessed: results.processed,
      messagesTotal: results.messagesTotal,
      cardsCreated: results.cardsCreated,
      errors: results.errors,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[GmailCron] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        duration,
      },
      { status: 500 }
    );
  }
}
