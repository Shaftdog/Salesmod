/**
 * Hourly Agent Cron Endpoint
 *
 * Runs the autonomous agent cycle for all enabled tenants.
 * Schedule: "0 * * * *" (every hour at minute 0)
 *
 * Authentication: Requires CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeAllTenantCycles } from '@/lib/agent/autonomous-cycle';
import { cleanupExpiredLocks } from '@/lib/agent/tenant-lock';
import { isAgentGloballyEnabled } from '@/lib/agent/agent-config';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max (Vercel limit)

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
    console.error('[AgentCron] CRON_SECRET not configured or too short (min 32 chars)');
    return NextResponse.json(
      { error: 'Cron not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('[AgentCron] Invalid cron secret');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[AgentCron] Starting hourly agent cycle');

  try {
    // Check global kill switch
    const globalEnabled = await isAgentGloballyEnabled();
    if (!globalEnabled) {
      console.log('[AgentCron] Agent is globally disabled');
      return NextResponse.json({
        success: false,
        message: 'Agent is globally disabled',
        duration: Date.now() - startTime,
      });
    }

    // Clean up any expired locks first
    const cleanedLocks = await cleanupExpiredLocks();
    if (cleanedLocks > 0) {
      console.log(`[AgentCron] Cleaned up ${cleanedLocks} expired locks`);
    }

    // Execute cycles for all enabled tenants
    // Note: With Vercel's 5-minute limit, we process a limited number
    const results = await executeAllTenantCycles({
      maxTenants: 10, // Process up to 10 tenants per cron run
      perTenantTimeout: 25 * 1000, // 25 seconds per tenant
    });

    const duration = Date.now() - startTime;

    console.log(`[AgentCron] Completed: ${results.successful}/${results.total} successful`, {
      successful: results.successful,
      failed: results.failed,
      skipped: results.skipped,
      duration,
    });

    return NextResponse.json({
      success: true,
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      skipped: results.skipped,
      duration,
      cleanedLocks,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AgentCron] Error:', error);

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
