/**
 * Gmail Polling Cron Endpoint
 *
 * This endpoint is called by Vercel Cron every 5 minutes to poll Gmail
 * for all tenants with Gmail sync enabled.
 *
 * Schedule: every 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { pollGmailInbox } from '@/lib/agent/gmail-poller';

// Vercel cron authorization header
const CRON_SECRET = process.env.CRON_SECRET;

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max

export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization');

  if (!CRON_SECRET) {
    console.error('[Cron Gmail] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[Cron Gmail] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Cron Gmail] Starting Gmail polling cycle');

  try {
    const supabase = createServiceRoleClient();

    // Get all tenants with Gmail sync enabled
    const { data: syncStates, error: syncError } = await supabase
      .from('gmail_sync_state')
      .select(`
        tenant_id,
        is_enabled,
        auto_process,
        last_sync_at,
        tenants!gmail_sync_state_tenant_id_fkey(
          id,
          name,
          is_active
        )
      `)
      .eq('is_enabled', true);

    if (syncError) {
      console.error('[Cron Gmail] Failed to fetch sync states:', syncError);
      return NextResponse.json(
        { error: 'Failed to fetch sync states', details: syncError.message },
        { status: 500 }
      );
    }

    if (!syncStates || syncStates.length === 0) {
      console.log('[Cron Gmail] No tenants with Gmail sync enabled');
      return NextResponse.json({
        success: true,
        message: 'No tenants with Gmail sync enabled',
        tenantsProcessed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Filter to active tenants only
    const activeSyncStates = syncStates.filter(
      (s) => s.tenants && (s.tenants as any).is_active
    );

    console.log(`[Cron Gmail] Processing ${activeSyncStates.length} tenants with Gmail sync`);

    // Process each tenant
    const results: Array<{
      tenantId: string;
      tenantName: string;
      success: boolean;
      messagesProcessed?: number;
      cardsCreated?: number;
      errors?: string[];
      duration: number;
    }> = [];

    for (const syncState of activeSyncStates) {
      const tenant = syncState.tenants as any;
      const tenantStart = Date.now();

      try {
        console.log(`[Cron Gmail] Polling Gmail for tenant: ${tenant.name} (${tenant.id})`);

        // Get an org_id for this tenant (we need it for the Gmail poller)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('tenant_id', syncState.tenant_id)
          .limit(1)
          .single();

        if (!profile) {
          console.log(`[Cron Gmail] No profile found for tenant ${tenant.name}`);
          results.push({
            tenantId: syncState.tenant_id,
            tenantName: tenant.name,
            success: false,
            errors: ['No profile found for tenant'],
            duration: Date.now() - tenantStart,
          });
          continue;
        }

        const pollResult = await pollGmailInbox(profile.id);

        results.push({
          tenantId: syncState.tenant_id,
          tenantName: tenant.name,
          success: pollResult.success,
          messagesProcessed: pollResult.messagesProcessed,
          cardsCreated: pollResult.cardsCreated,
          errors: pollResult.errors.length > 0 ? pollResult.errors : undefined,
          duration: Date.now() - tenantStart,
        });

        console.log(`[Cron Gmail] Completed tenant ${tenant.name}: ${pollResult.messagesProcessed} messages, ${pollResult.cardsCreated} cards`);
      } catch (error: any) {
        console.error(`[Cron Gmail] Error polling tenant ${tenant.name}:`, error);

        results.push({
          tenantId: syncState.tenant_id,
          tenantName: tenant.name,
          success: false,
          errors: [error.message],
          duration: Date.now() - tenantStart,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const totalMessages = results.reduce((sum, r) => sum + (r.messagesProcessed || 0), 0);
    const totalCards = results.reduce((sum, r) => sum + (r.cardsCreated || 0), 0);
    const totalDuration = Date.now() - startTime;

    console.log(`[Cron Gmail] Completed: ${successCount} success, ${failCount} failed, ${totalMessages} messages, ${totalCards} cards, ${totalDuration}ms`);

    return NextResponse.json({
      success: true,
      tenantsProcessed: activeSyncStates.length,
      successCount,
      failCount,
      totalMessages,
      totalCards,
      duration: totalDuration,
      results,
    });
  } catch (error: any) {
    console.error('[Cron Gmail] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Fatal error during Gmail polling',
        details: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// POST handler for manual triggering
export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();

  const authHeader = request.headers.get('authorization');

  // Allow cron secret or authenticated user
  if (!CRON_SECRET) {
    console.error('[Cron Gmail] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    // Check if user is authenticated
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session, error: authError } = await supabase.auth.getUser(token);

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Parse optional tenant filter from body
  let targetTenantId: string | null = null;
  try {
    const body = await request.json();
    targetTenantId = body.tenantId || null;
  } catch {
    // No body is fine
  }

  const startTime = Date.now();
  console.log('[Cron Gmail] Manual trigger initiated');

  try {
    // Build sync state query
    let query = supabase
      .from('gmail_sync_state')
      .select('tenant_id, tenants!gmail_sync_state_tenant_id_fkey(id, name)')
      .eq('is_enabled', true);

    if (targetTenantId) {
      query = query.eq('tenant_id', targetTenantId);
    }

    const { data: syncStates } = await query;

    if (!syncStates || syncStates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matching tenants with Gmail sync enabled',
        tenantsProcessed: 0,
      });
    }

    const results = [];

    for (const syncState of syncStates) {
      const tenant = syncState.tenants as any;

      // Get org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', syncState.tenant_id)
        .limit(1)
        .single();

      if (!profile) {
        results.push({
          tenantId: syncState.tenant_id,
          tenantName: tenant?.name || 'Unknown',
          success: false,
          error: 'No profile found',
        });
        continue;
      }

      try {
        const pollResult = await pollGmailInbox(profile.id);
        results.push({
          tenantId: syncState.tenant_id,
          tenantName: tenant?.name || 'Unknown',
          success: pollResult.success,
          messagesProcessed: pollResult.messagesProcessed,
          cardsCreated: pollResult.cardsCreated,
          errors: pollResult.errors,
        });
      } catch (error: any) {
        results.push({
          tenantId: syncState.tenant_id,
          tenantName: tenant?.name || 'Unknown',
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      tenantsProcessed: syncStates.length,
      duration: Date.now() - startTime,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
