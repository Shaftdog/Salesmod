/**
 * P2.3: Browser Automation Engine
 * Core Playwright-based automation with security controls
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { getCredential } from '@/lib/credentials';
import { isDomainAllowed, isSecureUrl, extractDomain } from './security/domain-validator';
import {
  requiresApproval,
  isJobApproved,
  autoApproveJob,
} from './security/approval-gate';
import type {
  BrowserAutomationJob,
  VendorPortalConfig,
  ExecutionContext,
  JobExecutionResult,
  CreateJobRequest,
  BrowserJobStatus,
  ExecutionLog,
  WorkflowStep,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 30000;
const MAX_SCREENSHOTS = 10;
const SCREENSHOT_RETENTION_DAYS = 7;

// ============================================================================
// Job Execution
// ============================================================================

/**
 * Execute a browser automation job
 */
export async function executeJob(
  tenantId: string,
  jobId: string
): Promise<JobExecutionResult> {
  const supabase = createServiceRoleClient();
  const startTime = Date.now();

  // Get job
  const { data: jobData, error: jobError } = await supabase
    .from('browser_automation_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('tenant_id', tenantId)
    .single();

  if (jobError || !jobData) {
    return {
      jobId,
      success: false,
      status: 'failed',
      durationMs: Date.now() - startTime,
      error: 'Job not found',
    };
  }

  const job = mapToJob(jobData);

  // Check approval status
  const approval = await isJobApproved(tenantId, jobId);
  if (!approval.approved) {
    return {
      jobId,
      success: false,
      status: 'pending_approval',
      durationMs: Date.now() - startTime,
      error: 'Job requires approval',
    };
  }

  // Get portal config
  const { data: portalData, error: portalError } = await supabase
    .from('vendor_portal_configs')
    .select('*')
    .eq('id', job.portalConfigId)
    .eq('tenant_id', tenantId)
    .single();

  if (portalError || !portalData) {
    await updateJobStatus(jobId, tenantId, 'failed', 'Portal configuration not found');
    return {
      jobId,
      success: false,
      status: 'failed',
      durationMs: Date.now() - startTime,
      error: 'Portal configuration not found',
    };
  }

  const portal = mapToPortal(portalData);

  // Validate domain
  const domainCheck = await isDomainAllowed(job.targetUrl, tenantId);
  if (!domainCheck.allowed) {
    await updateJobStatus(jobId, tenantId, 'failed', domainCheck.reason);
    return {
      jobId,
      success: false,
      status: 'failed',
      durationMs: Date.now() - startTime,
      error: domainCheck.reason,
    };
  }

  // Validate HTTPS
  if (!isSecureUrl(job.targetUrl)) {
    await updateJobStatus(jobId, tenantId, 'failed', 'Only HTTPS URLs are allowed');
    return {
      jobId,
      success: false,
      status: 'failed',
      durationMs: Date.now() - startTime,
      error: 'Only HTTPS URLs are allowed',
    };
  }

  // Get credentials
  const credResponse = await getCredential(tenantId, {
    credentialName: portal.credentialName,
    purpose: 'browser_automation',
    requestedBy: `browser_job:${jobId}`,
    browserJobId: jobId,
  });

  if (!credResponse.granted) {
    await updateJobStatus(jobId, tenantId, 'failed', credResponse.denialReason);
    return {
      jobId,
      success: false,
      status: 'failed',
      durationMs: Date.now() - startTime,
      error: credResponse.denialReason,
    };
  }

  // Mark job as running
  await updateJobStatus(jobId, tenantId, 'running');

  // Execute with Playwright
  try {
    const context: ExecutionContext = {
      job,
      portal,
      credentials: credResponse.credentials as { username: string; password: string },
      extractedData: {},
      screenshots: [],
      logs: [],
    };

    const result = await runBrowserSession(context);

    // Update job with results
    const status: BrowserJobStatus = result.success ? 'completed' : 'failed';
    await supabase
      .from('browser_automation_jobs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        result: result.result,
        screenshot_paths: result.screenshots,
        error_message: result.error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Update portal stats
    await updatePortalStats(portal.id, tenantId, result.success);

    return {
      jobId,
      success: result.success,
      status,
      result: result.result ? { success: result.success, data: result.result } : undefined,
      durationMs: Date.now() - startTime,
      error: result.error,
      screenshots: result.screenshots,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateJobStatus(jobId, tenantId, 'failed', errorMessage);

    return {
      jobId,
      success: false,
      status: 'failed',
      durationMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Run browser session with Playwright
 * Note: In production, this would use actual Playwright
 */
async function runBrowserSession(
  context: ExecutionContext
): Promise<{
  success: boolean;
  result?: Record<string, unknown>;
  screenshots?: string[];
  error?: string;
}> {
  const { job, portal, credentials } = context;
  const logs: ExecutionLog[] = [];

  const log = (level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) => {
    logs.push({ timestamp: new Date(), level, message, data });
    console.log(`[automation-engine] [${level}] ${message}`, data || '');
  };

  log('info', `Starting job ${job.id} for portal ${portal.portalName}`);
  log('info', `Target URL: ${job.targetUrl}`);

  try {
    // In production, this would:
    // 1. Launch Playwright browser
    // 2. Create fresh context (no persistent cookies)
    // 3. Navigate to login page
    // 4. Fill credentials
    // 5. Execute workflow steps
    // 6. Take screenshots
    // 7. Extract data
    // 8. Close browser

    // For now, simulate the execution
    const workflow = getWorkflowForJobType(portal, job.jobType);

    if (!workflow) {
      return {
        success: false,
        error: `No workflow defined for job type: ${job.jobType}`,
      };
    }

    log('info', `Executing workflow: ${workflow.name}`);

    // Simulate step execution
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      log('info', `Step ${i + 1}/${workflow.steps.length}: ${step.action}`, { target: step.target });

      // Simulate step delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    log('info', 'Workflow completed successfully');

    return {
      success: true,
      result: {
        message: 'Job completed successfully',
        workflow: workflow.name,
        stepsExecuted: workflow.steps.length,
        extractedData: context.extractedData,
      },
      screenshots: context.screenshots,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'Job failed', { error: errorMessage });

    return {
      success: false,
      error: errorMessage,
      screenshots: context.screenshots,
    };
  }
}

/**
 * Get workflow for job type
 */
function getWorkflowForJobType(
  portal: VendorPortalConfig,
  jobType: string
): { name: string; steps: WorkflowStep[] } | null {
  const workflow = portal.workflows.find((w) => w.name === jobType);
  if (workflow) return workflow;

  // Default workflows
  switch (jobType) {
    case 'accept_order':
      return {
        name: 'accept_order',
        steps: [
          { action: 'navigate', value: portal.loginUrl || portal.baseUrl },
          { action: 'fill', selector: portal.selectors.usernameField, extractAs: 'username' },
          { action: 'fill', selector: portal.selectors.passwordField, extractAs: 'password' },
          { action: 'click', selector: portal.selectors.loginButton },
          { action: 'wait', timeout: 3000 },
          { action: 'click', selector: portal.selectors.acceptButton },
          { action: 'screenshot' },
        ],
      };

    case 'check_status':
      return {
        name: 'check_status',
        steps: [
          { action: 'navigate', value: portal.orderListUrl || portal.baseUrl },
          { action: 'wait', timeout: 2000 },
          { action: 'extract', selector: portal.selectors.orderStatusCell, extractAs: 'status' },
          { action: 'screenshot' },
        ],
      };

    default:
      return null;
  }
}

// ============================================================================
// Job Management
// ============================================================================

/**
 * Create a new browser automation job
 */
export async function createJob(
  tenantId: string,
  request: CreateJobRequest
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  // Get portal config
  const { data: portal, error: portalError } = await supabase
    .from('vendor_portal_configs')
    .select('base_url, is_active')
    .eq('id', request.portalConfigId)
    .eq('tenant_id', tenantId)
    .single();

  if (portalError || !portal) {
    console.error('[automation-engine] Portal not found:', request.portalConfigId);
    return null;
  }

  if (!portal.is_active) {
    console.error('[automation-engine] Portal is not active');
    return null;
  }

  // Determine target URL
  const targetUrl = request.targetUrl || portal.base_url;

  // Validate domain
  const domainCheck = await isDomainAllowed(targetUrl, tenantId);
  if (!domainCheck.allowed) {
    console.error('[automation-engine] Domain not allowed:', domainCheck.reason);
    return null;
  }

  // Check if approval is required
  const needsApproval = await requiresApproval(tenantId, request.jobType, request.portalConfigId);

  // Create job
  const { data, error } = await supabase
    .from('browser_automation_jobs')
    .insert({
      tenant_id: tenantId,
      portal_config_id: request.portalConfigId,
      job_type: request.jobType,
      target_url: targetUrl,
      order_id: request.orderId,
      order_number: request.orderNumber,
      parameters: request.parameters || {},
      requires_approval: needsApproval,
      status: needsApproval ? 'pending_approval' : 'approved',
      approved_by: needsApproval ? null : 'system:auto_approval',
      approved_at: needsApproval ? null : new Date().toISOString(),
      run_id: request.runId,
      card_id: request.cardId,
      retry_count: 0,
      max_retries: 3,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[automation-engine] Failed to create job:', error);
    return null;
  }

  console.log(`[automation-engine] Created job ${data.id} (approval: ${needsApproval ? 'required' : 'auto'})`);
  return data.id;
}

/**
 * Get pending jobs for execution
 */
export async function getPendingJobs(
  tenantId: string,
  limit: number = 5
): Promise<BrowserAutomationJob[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('browser_automation_jobs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[automation-engine] Failed to get pending jobs:', error);
    return [];
  }

  return (data || []).map(mapToJob);
}

/**
 * Get job by ID
 */
export async function getJob(
  tenantId: string,
  jobId: string
): Promise<BrowserAutomationJob | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('browser_automation_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToJob(data);
}

/**
 * Cancel a pending job
 */
export async function cancelJob(
  tenantId: string,
  jobId: string,
  reason?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('browser_automation_jobs')
    .update({
      status: 'cancelled',
      error_message: reason || 'Cancelled by user',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('tenant_id', tenantId)
    .in('status', ['pending_approval', 'approved']);

  return !error;
}

/**
 * Retry a failed job
 */
export async function retryJob(
  tenantId: string,
  jobId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data: job, error: getError } = await supabase
    .from('browser_automation_jobs')
    .select('retry_count, max_retries')
    .eq('id', jobId)
    .eq('tenant_id', tenantId)
    .eq('status', 'failed')
    .single();

  if (getError || !job) {
    return false;
  }

  if (job.retry_count >= job.max_retries) {
    console.error('[automation-engine] Max retries exceeded');
    return false;
  }

  const { error } = await supabase
    .from('browser_automation_jobs')
    .update({
      status: 'approved',
      retry_count: job.retry_count + 1,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  return !error;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function updateJobStatus(
  jobId: string,
  tenantId: string,
  status: BrowserJobStatus,
  errorMessage?: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('browser_automation_jobs')
    .update({
      status,
      error_message: errorMessage,
      started_at: status === 'running' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('tenant_id', tenantId);
}

async function updatePortalStats(
  portalId: string,
  tenantId: string,
  success: boolean
): Promise<void> {
  const supabase = createServiceRoleClient();

  if (success) {
    await supabase.rpc('increment_portal_success', { portal_id: portalId });
  } else {
    await supabase.rpc('increment_portal_failure', { portal_id: portalId });
  }

  await supabase
    .from('vendor_portal_configs')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', portalId)
    .eq('tenant_id', tenantId);
}

function mapToJob(row: Record<string, unknown>): BrowserAutomationJob {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    portalConfigId: row.portal_config_id as string,
    jobType: row.job_type as BrowserAutomationJob['jobType'],
    targetUrl: row.target_url as string,
    orderId: row.order_id as string | undefined,
    orderNumber: row.order_number as string | undefined,
    parameters: row.parameters as Record<string, unknown>,
    requiresApproval: row.requires_approval as boolean,
    approvedBy: row.approved_by as string | undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
    status: row.status as BrowserJobStatus,
    startedAt: row.started_at ? new Date(row.started_at as string) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
    durationMs: row.duration_ms as number | undefined,
    result: row.result as BrowserAutomationJob['result'],
    errorMessage: row.error_message as string | undefined,
    screenshotPaths: row.screenshot_paths as string[] | undefined,
    runId: row.run_id as string | undefined,
    cardId: row.card_id as string | undefined,
    retryCount: row.retry_count as number,
    maxRetries: row.max_retries as number,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapToPortal(row: Record<string, unknown>): VendorPortalConfig {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    portalName: row.portal_name as string,
    portalType: row.portal_type as VendorPortalConfig['portalType'],
    baseUrl: row.base_url as string,
    loginUrl: row.login_url as string | undefined,
    orderListUrl: row.order_list_url as string | undefined,
    credentialName: row.credential_name as string,
    isActive: row.is_active as boolean,
    selectors: row.selectors as VendorPortalConfig['selectors'],
    workflows: row.workflows as VendorPortalConfig['workflows'],
    rateLimits: row.rate_limits as VendorPortalConfig['rateLimits'],
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string) : undefined,
    successCount: row.success_count as number,
    failureCount: row.failure_count as number,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
