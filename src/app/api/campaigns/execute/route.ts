/**
 * Campaign Execution Endpoint
 *
 * POST /api/campaigns/execute
 * - Triggers execution of all active campaign jobs
 * - Respects rate limits
 * - Can be called by cron or manually
 *
 * POST /api/campaigns/:id/execute
 * - Triggers execution of a specific campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeCampaignJobs, triggerCampaignExecution } from '@/lib/campaigns/job-executor';

/**
 * Execute all active campaigns
 * Can be triggered by cron or admin
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Allow execution if:
    // 1. User is authenticated with admin/sales_manager role
    // 2. Request has valid cron secret (for automated execution)
    const cronSecret = request.headers.get('x-cron-secret');
    const isAutomated = cronSecret === process.env.CRON_SECRET;

    if (!isAutomated && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If user-triggered, check permissions
    if (!isAutomated) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single();

      if (!profile || !['admin', 'sales_manager'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    console.log(`🚀 Executing campaign jobs (${isAutomated ? 'automated' : 'manual'})`);

    // Execute all pending jobs
    const results = await executeCampaignJobs();

    const summary = {
      jobsProcessed: results.length,
      totalEmailsSent: results.reduce((sum, r) => sum + r.emailsSent, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors, 0),
      rateLimitedCampaigns: results.filter(r => r.rateLimitReached).length,
      results,
    };

    console.log('✅ Campaign execution complete:', summary);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Error executing campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
