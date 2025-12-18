/**
 * Hourly Autonomous Agent Cron Endpoint
 *
 * This endpoint is called by Vercel Cron every hour to run the autonomous agent cycle
 * for all active tenants.
 *
 * Schedule: 0 * * * * (every hour at minute 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { runAutonomousCycle } from '@/lib/agent/autonomous-cycle';
import { cleanupExpiredLocks } from '@/lib/agent/tenant-lock';
import {
  isAgentGloballyEnabled,
  isAgentEnabledForTenant,
  cleanupOldRateLimits,
} from '@/lib/agent/agent-config';

// Vercel cron authorization header
const CRON_SECRET = process.env.CRON_SECRET;

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

// Timeout constants
const MAX_DURATION_MS = 300 * 1000; // 5 minutes in ms
const DEADLINE_BUFFER_MS = 30 * 1000; // 30 second buffer before deadline
const PER_TENANT_TIMEOUT_MS = 60 * 1000; // 60 seconds per tenant max

/**
 * Run a function with a timeout
 * Returns { success: true, result } or { success: false, error: 'timeout' }
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  label: string
): Promise<{ success: true; result: T } | { success: false; error: string }> {
  return Promise.race([
    fn().then((result) => ({ success: true as const, result })),
    new Promise<{ success: false; error: string }>((resolve) =>
      setTimeout(
        () => resolve({ success: false, error: `Timeout after ${timeoutMs}ms` }),
        timeoutMs
      )
    ),
  ]);
}

export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization');

  if (!CRON_SECRET) {
    console.error('[Cron Agent] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[Cron Agent] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Cron Agent] Starting hourly autonomous agent cycle');

  try {
    // Check global kill switch FIRST
    const globalStatus = await isAgentGloballyEnabled();
    if (!globalStatus.enabled) {
      console.log(`[Cron Agent] KILL SWITCH ACTIVE: ${globalStatus.reason}`);
      return NextResponse.json({
        success: false,
        killSwitchActive: true,
        reason: globalStatus.reason,
        source: globalStatus.source,
        duration: Date.now() - startTime,
      });
    }

    const supabase = createServiceRoleClient();

    // Clean up any expired locks and old rate limits
    await Promise.all([
      cleanupExpiredLocks(),
      cleanupOldRateLimits(),
    ]);

    // Get all active tenants with agent enabled
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, agent_enabled')
      .eq('is_active', true)
      .eq('agent_enabled', true);

    if (tenantsError) {
      console.error('[Cron Agent] Failed to fetch tenants:', tenantsError);
      return NextResponse.json(
        { error: 'Failed to fetch tenants', details: tenantsError.message },
        { status: 500 }
      );
    }

    if (!tenants || tenants.length === 0) {
      console.log('[Cron Agent] No active tenants found');
      return NextResponse.json({
        success: true,
        message: 'No active tenants',
        tenantsProcessed: 0,
        duration: Date.now() - startTime,
      });
    }

    console.log(`[Cron Agent] Processing ${tenants.length} active tenants`);

    // Calculate deadline (leave buffer for cleanup)
    const deadline = startTime + MAX_DURATION_MS - DEADLINE_BUFFER_MS;

    // Process each tenant
    const results: Array<{
      tenantId: string;
      tenantName: string;
      success: boolean;
      cycleNumber?: number;
      actionsPlanned?: number;
      actionsExecuted?: number;
      error?: string;
      duration: number;
      skipped?: boolean;
    }> = [];

    for (const tenant of tenants) {
      // Check if we're approaching the deadline
      const remainingTime = deadline - Date.now();
      if (remainingTime < PER_TENANT_TIMEOUT_MS) {
        console.log(`[Cron Agent] Approaching deadline, skipping remaining ${tenants.length - results.length} tenants`);
        // Record skipped tenants
        const remaining = tenants.slice(results.length);
        for (const skippedTenant of remaining) {
          results.push({
            tenantId: skippedTenant.id,
            tenantName: skippedTenant.name,
            success: false,
            error: 'Skipped due to deadline',
            duration: 0,
            skipped: true,
          });
        }
        break;
      }

      // Re-check global kill switch before each tenant (may have been activated mid-cycle)
      const midCycleGlobalStatus = await isAgentGloballyEnabled();
      if (!midCycleGlobalStatus.enabled) {
        console.log(`[Cron Agent] KILL SWITCH ACTIVATED mid-cycle: ${midCycleGlobalStatus.reason}`);
        // Mark remaining tenants as skipped
        const remainingTenants = tenants.slice(results.length);
        for (const skippedTenant of remainingTenants) {
          results.push({
            tenantId: skippedTenant.id,
            tenantName: skippedTenant.name,
            success: false,
            error: `Kill switch activated: ${midCycleGlobalStatus.reason}`,
            duration: 0,
            skipped: true,
          });
        }
        break;
      }

      // Double-check tenant is still enabled (settings may have changed)
      const tenantStatus = await isAgentEnabledForTenant(tenant.id);
      if (!tenantStatus.enabled) {
        console.log(`[Cron Agent] Skipping tenant ${tenant.name}: ${tenantStatus.reason}`);
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          success: false,
          error: tenantStatus.reason || 'Agent disabled for tenant',
          duration: 0,
          skipped: true,
        });
        continue;
      }

      const tenantStart = Date.now();
      // Use the lesser of remaining time or per-tenant timeout
      const tenantTimeout = Math.min(remainingTime, PER_TENANT_TIMEOUT_MS);

      console.log(`[Cron Agent] Processing tenant: ${tenant.name} (${tenant.id}) [timeout: ${Math.round(tenantTimeout / 1000)}s]`);

      const timeoutResult = await withTimeout(
        () => runAutonomousCycle(tenant.id),
        tenantTimeout,
        `tenant-${tenant.id}`
      );

      if (timeoutResult.success) {
        const workBlock = timeoutResult.result;
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          success: true,
          cycleNumber: workBlock.cycleNumber,
          actionsPlanned: workBlock.metrics.actionsPlanned,
          actionsExecuted: workBlock.metrics.actionsExecuted,
          duration: Date.now() - tenantStart,
        });

        console.log(`[Cron Agent] Completed tenant ${tenant.name}: Cycle ${workBlock.cycleNumber}, ${workBlock.metrics.actionsExecuted}/${workBlock.metrics.actionsPlanned} actions`);
      } else {
        console.error(`[Cron Agent] Tenant ${tenant.name} failed:`, timeoutResult.error);

        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          success: false,
          error: timeoutResult.error,
          duration: Date.now() - tenantStart,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success && !r.skipped).length;
    const skippedCount = results.filter((r) => r.skipped).length;
    const totalDuration = Date.now() - startTime;

    console.log(`[Cron Agent] Completed: ${successCount} success, ${failCount} failed, ${skippedCount} skipped, ${totalDuration}ms total`);

    return NextResponse.json({
      success: true,
      tenantsProcessed: tenants.length,
      successCount,
      failCount,
      skippedCount,
      duration: totalDuration,
      results,
    });
  } catch (error: any) {
    console.error('[Cron Agent] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Fatal error during cron execution',
        details: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// POST handler for manual triggering (useful for testing)
export async function POST(request: NextRequest) {
  // Check for admin authorization for manual triggers
  const supabase = createServiceRoleClient();

  const authHeader = request.headers.get('authorization');

  // Allow cron secret or admin user
  if (!CRON_SECRET) {
    console.error('[Cron Agent] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    // Check if user is authenticated and is admin
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session, error: authError } = await supabase.auth.getUser(token);

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
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
  console.log('[Cron Agent] Manual trigger initiated');

  try {
    // Check global kill switch FIRST
    const globalStatus = await isAgentGloballyEnabled();
    if (!globalStatus.enabled) {
      console.log(`[Cron Agent] KILL SWITCH ACTIVE: ${globalStatus.reason}`);
      return NextResponse.json({
        success: false,
        killSwitchActive: true,
        reason: globalStatus.reason,
        source: globalStatus.source,
        duration: Date.now() - startTime,
      });
    }

    const supabase = createServiceRoleClient();

    // Build tenant query (also filter by agent_enabled unless targeting specific tenant)
    let tenantQuery = supabase.from('tenants').select('id, name, agent_enabled').eq('is_active', true);

    if (targetTenantId) {
      tenantQuery = tenantQuery.eq('id', targetTenantId);
    }

    const { data: tenants, error: tenantsError } = await tenantQuery;

    if (tenantsError) {
      return NextResponse.json(
        { error: 'Failed to fetch tenants' },
        { status: 500 }
      );
    }

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({
        success: true,
        message: targetTenantId ? 'Tenant not found' : 'No active tenants',
        tenantsProcessed: 0,
      });
    }

    const results = [];

    for (const tenant of tenants) {
      // Check tenant-level agent enabled status
      const tenantStatus = await isAgentEnabledForTenant(tenant.id);
      if (!tenantStatus.enabled) {
        console.log(`[Cron Agent] Skipping tenant ${tenant.name}: ${tenantStatus.reason}`);
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          success: false,
          error: tenantStatus.reason || 'Agent disabled for tenant',
          skipped: true,
        });
        continue;
      }

      try {
        const workBlock = await runAutonomousCycle(tenant.id);
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          success: true,
          cycleNumber: workBlock.cycleNumber,
          metrics: workBlock.metrics,
        });
      } catch (error: any) {
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      tenantsProcessed: tenants.length,
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
