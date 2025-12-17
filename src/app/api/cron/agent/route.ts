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

// Vercel cron authorization header
const CRON_SECRET = process.env.CRON_SECRET;

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization');

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[Cron Agent] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Cron Agent] Starting hourly autonomous agent cycle');

  try {
    const supabase = createServiceRoleClient();

    // Clean up any expired locks first
    await cleanupExpiredLocks();

    // Get all active tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('is_active', true);

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
    }> = [];

    for (const tenant of tenants) {
      const tenantStart = Date.now();

      try {
        console.log(`[Cron Agent] Processing tenant: ${tenant.name} (${tenant.id})`);

        const workBlock = await runAutonomousCycle(tenant.id);

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
      } catch (error: any) {
        console.error(`[Cron Agent] Error processing tenant ${tenant.name}:`, error);

        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          success: false,
          error: error.message,
          duration: Date.now() - tenantStart,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const totalDuration = Date.now() - startTime;

    console.log(`[Cron Agent] Completed: ${successCount} success, ${failCount} failed, ${totalDuration}ms total`);

    return NextResponse.json({
      success: true,
      tenantsProcessed: tenants.length,
      successCount,
      failCount,
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

  // Allow cron secret or service role
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    // Check if user is authenticated and is admin
    const { data: session } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    );

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
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
    const supabase = createServiceRoleClient();

    // Build tenant query
    let tenantQuery = supabase.from('tenants').select('id, name').eq('is_active', true);

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
