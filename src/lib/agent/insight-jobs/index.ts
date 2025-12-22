/**
 * P2.1: Insight Jobs Scheduler
 * Manages scheduled insight generation jobs (hourly, daily, weekly)
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { processHourlyChanges } from './hourly-changes';
import { processDailySummary } from './daily-summary';
import { processWeeklyPlaybook } from './weekly-playbook';

// ============================================================================
// Types
// ============================================================================

export type InsightJobType = 'hourly_changes' | 'daily_summary' | 'weekly_playbook';

export interface InsightJob {
  id: string;
  tenantId: string;
  jobType: InsightJobType;
  scheduledFor: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  eventsProcessed: number;
  patternsDetected: number;
  recommendationsCreated: number;
  summary?: Record<string, unknown>;
  errorMessage?: string;
}

export interface JobResult {
  success: boolean;
  eventsProcessed: number;
  patternsDetected: number;
  recommendationsCreated: number;
  summary: Record<string, unknown>;
  error?: string;
}

// ============================================================================
// Job Scheduling
// ============================================================================

/**
 * Get pending insight jobs for a tenant
 */
export async function getInsightJobsDue(
  tenantId: string,
  limit: number = 5
): Promise<InsightJob[]> {
  const supabase = createServiceRoleClient();
  const safeLimit = Math.max(1, Math.min(limit, 20));

  const { data, error } = await supabase
    .from('insight_jobs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(safeLimit);

  if (error) {
    console.error('[insight-jobs] Failed to get pending jobs:', error);
    return [];
  }

  return (data || []).map(mapToInsightJob);
}

/**
 * Schedule a new insight job
 */
export async function scheduleInsightJob(
  tenantId: string,
  jobType: InsightJobType,
  scheduledFor: Date
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  // Check if job already scheduled
  const { data: existing } = await supabase
    .from('insight_jobs')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('job_type', jobType)
    .eq('status', 'pending')
    .gte('scheduled_for', scheduledFor.toISOString())
    .single();

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from('insight_jobs')
    .insert({
      tenant_id: tenantId,
      job_type: jobType,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[insight-jobs] Failed to schedule job:', error);
    return null;
  }

  return data.id;
}

/**
 * Schedule all recurring jobs for a tenant
 */
export async function scheduleRecurringJobs(tenantId: string): Promise<{
  hourly: string | null;
  daily: string | null;
  weekly: string | null;
}> {
  const now = new Date();

  // Schedule hourly job for next hour
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);

  // Schedule daily job for tomorrow at 2 AM
  const tomorrow2am = new Date(now);
  tomorrow2am.setDate(tomorrow2am.getDate() + 1);
  tomorrow2am.setHours(2, 0, 0, 0);

  // Schedule weekly job for next Monday at 6 AM
  const nextMonday = new Date(now);
  const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(6, 0, 0, 0);

  const [hourly, daily, weekly] = await Promise.all([
    scheduleInsightJob(tenantId, 'hourly_changes', nextHour),
    scheduleInsightJob(tenantId, 'daily_summary', tomorrow2am),
    scheduleInsightJob(tenantId, 'weekly_playbook', nextMonday),
  ]);

  return { hourly, daily, weekly };
}

// ============================================================================
// Job Execution
// ============================================================================

/**
 * Process an insight job
 */
export async function processInsightJob(jobId: string): Promise<JobResult> {
  const supabase = createServiceRoleClient();

  // Get job details
  const { data: job, error: fetchError } = await supabase
    .from('insight_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    return {
      success: false,
      eventsProcessed: 0,
      patternsDetected: 0,
      recommendationsCreated: 0,
      summary: {},
      error: 'Job not found',
    };
  }

  // Mark as running
  await supabase
    .from('insight_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  let result: JobResult;

  try {
    // Execute based on job type
    switch (job.job_type as InsightJobType) {
      case 'hourly_changes':
        result = await processHourlyChanges(job.tenant_id);
        break;
      case 'daily_summary':
        result = await processDailySummary(job.tenant_id);
        break;
      case 'weekly_playbook':
        result = await processWeeklyPlaybook(job.tenant_id);
        break;
      default:
        result = {
          success: false,
          eventsProcessed: 0,
          patternsDetected: 0,
          recommendationsCreated: 0,
          summary: {},
          error: `Unknown job type: ${job.job_type}`,
        };
    }

    // Update job status
    await supabase
      .from('insight_jobs')
      .update({
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        events_processed: result.eventsProcessed,
        patterns_detected: result.patternsDetected,
        recommendations_created: result.recommendationsCreated,
        summary: result.summary,
        error_message: result.error,
      })
      .eq('id', jobId);

    // Schedule next occurrence
    await scheduleNextOccurrence(job.tenant_id, job.job_type as InsightJobType);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('insight_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq('id', jobId);

    return {
      success: false,
      eventsProcessed: 0,
      patternsDetected: 0,
      recommendationsCreated: 0,
      summary: {},
      error: errorMessage,
    };
  }
}

/**
 * Schedule the next occurrence of a job
 */
async function scheduleNextOccurrence(
  tenantId: string,
  jobType: InsightJobType
): Promise<void> {
  const now = new Date();
  let nextSchedule: Date;

  switch (jobType) {
    case 'hourly_changes':
      nextSchedule = new Date(now);
      nextSchedule.setMinutes(0, 0, 0);
      nextSchedule.setHours(nextSchedule.getHours() + 1);
      break;
    case 'daily_summary':
      nextSchedule = new Date(now);
      nextSchedule.setDate(nextSchedule.getDate() + 1);
      nextSchedule.setHours(2, 0, 0, 0);
      break;
    case 'weekly_playbook':
      nextSchedule = new Date(now);
      nextSchedule.setDate(nextSchedule.getDate() + 7);
      nextSchedule.setHours(6, 0, 0, 0);
      break;
    default:
      return;
  }

  await scheduleInsightJob(tenantId, jobType, nextSchedule);
}

// ============================================================================
// Job Management
// ============================================================================

/**
 * Cancel a pending job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('insight_jobs')
    .delete()
    .eq('id', jobId)
    .eq('status', 'pending');

  return !error;
}

/**
 * Get job history for a tenant
 */
export async function getJobHistory(
  tenantId: string,
  limit: number = 20
): Promise<InsightJob[]> {
  const supabase = createServiceRoleClient();
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const { data, error } = await supabase
    .from('insight_jobs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error('[insight-jobs] Failed to get job history:', error);
    return [];
  }

  return (data || []).map(mapToInsightJob);
}

/**
 * Get job statistics
 */
export async function getJobStats(
  tenantId: string,
  days: number = 7
): Promise<{
  totalJobs: number;
  completed: number;
  failed: number;
  avgEventsProcessed: number;
  avgPatternsDetected: number;
  avgRecommendationsCreated: number;
}> {
  const supabase = createServiceRoleClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('insight_jobs')
    .select('status, events_processed, patterns_detected, recommendations_created')
    .eq('tenant_id', tenantId)
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('[insight-jobs] Failed to get job stats:', error);
    return {
      totalJobs: 0,
      completed: 0,
      failed: 0,
      avgEventsProcessed: 0,
      avgPatternsDetected: 0,
      avgRecommendationsCreated: 0,
    };
  }

  const jobs = data || [];
  const completed = jobs.filter((j) => j.status === 'completed');
  const failed = jobs.filter((j) => j.status === 'failed');

  const avgEvents = completed.length > 0
    ? completed.reduce((sum, j) => sum + (j.events_processed || 0), 0) / completed.length
    : 0;

  const avgPatterns = completed.length > 0
    ? completed.reduce((sum, j) => sum + (j.patterns_detected || 0), 0) / completed.length
    : 0;

  const avgRecs = completed.length > 0
    ? completed.reduce((sum, j) => sum + (j.recommendations_created || 0), 0) / completed.length
    : 0;

  return {
    totalJobs: jobs.length,
    completed: completed.length,
    failed: failed.length,
    avgEventsProcessed: Math.round(avgEvents),
    avgPatternsDetected: Math.round(avgPatterns),
    avgRecommendationsCreated: Math.round(avgRecs),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToInsightJob(row: Record<string, unknown>): InsightJob {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    jobType: row.job_type as InsightJobType,
    scheduledFor: new Date(row.scheduled_for as string),
    status: row.status as InsightJob['status'],
    startedAt: row.started_at ? new Date(row.started_at as string) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
    eventsProcessed: (row.events_processed as number) || 0,
    patternsDetected: (row.patterns_detected as number) || 0,
    recommendationsCreated: (row.recommendations_created as number) || 0,
    summary: row.summary as Record<string, unknown> | undefined,
    errorMessage: row.error_message as string | undefined,
  };
}

// Re-export job processors
export { processHourlyChanges } from './hourly-changes';
export { processDailySummary } from './daily-summary';
export { processWeeklyPlaybook } from './weekly-playbook';
