/**
 * P2.3: Approval Gate
 * Human-in-the-loop approval for browser automation jobs
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { BrowserAutomationJob, BrowserJobType } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ApprovalRequest {
  jobId: string;
  tenantId: string;
  jobType: BrowserJobType;
  targetUrl: string;
  portalName: string;
  description: string;
  parameters: Record<string, unknown>;
  requestedBy: string;
  requestedAt: Date;
}

export interface ApprovalDecision {
  approved: boolean;
  approvedBy?: string;
  reason?: string;
}

// ============================================================================
// Approval Checks
// ============================================================================

/**
 * Check if job requires approval
 */
export async function requiresApproval(
  tenantId: string,
  jobType: BrowserJobType,
  portalConfigId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // Check portal config for approval requirements
  const { data: portal, error } = await supabase
    .from('vendor_portal_configs')
    .select('workflows')
    .eq('id', portalConfigId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !portal) {
    // Default to requiring approval if portal not found
    return true;
  }

  // Check if workflow requires approval
  const workflows = portal.workflows as Array<{ name: string; requiresApproval: boolean }>;
  const workflow = workflows.find((w) => w.name === jobType);

  if (workflow) {
    return workflow.requiresApproval;
  }

  // Default approval requirements by job type
  return getDefaultApprovalRequirement(jobType);
}

/**
 * Get default approval requirement by job type
 */
function getDefaultApprovalRequirement(jobType: BrowserJobType): boolean {
  switch (jobType) {
    case 'accept_order':
      return false; // Auto-approve order acceptance
    case 'check_status':
      return false; // Auto-approve status checks
    case 'download_documents':
      return false; // Auto-approve downloads
    case 'submit_report':
      return true; // Require approval for submissions
    case 'custom_workflow':
      return true; // Always require approval for custom workflows
    default:
      return true;
  }
}

/**
 * Check if job is approved
 */
export async function isJobApproved(
  tenantId: string,
  jobId: string
): Promise<{ approved: boolean; approvedBy?: string; approvedAt?: Date }> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('browser_automation_jobs')
    .select('status, approved_by, approved_at')
    .eq('id', jobId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return { approved: false };
  }

  const isApproved = data.status !== 'pending_approval';

  return {
    approved: isApproved,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
  };
}

// ============================================================================
// Approval Actions
// ============================================================================

/**
 * Approve a job
 */
export async function approveJob(
  tenantId: string,
  jobId: string,
  approvedBy: string,
  reason?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('browser_automation_jobs')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending_approval');

  if (error) {
    console.error('[approval-gate] Failed to approve job:', error);
    return false;
  }

  // Log approval
  await logApprovalDecision(tenantId, jobId, {
    approved: true,
    approvedBy,
    reason,
  });

  console.log(`[approval-gate] Job ${jobId} approved by ${approvedBy}`);
  return true;
}

/**
 * Reject a job
 */
export async function rejectJob(
  tenantId: string,
  jobId: string,
  rejectedBy: string,
  reason?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('browser_automation_jobs')
    .update({
      status: 'cancelled',
      error_message: reason || 'Rejected by user',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending_approval');

  if (error) {
    console.error('[approval-gate] Failed to reject job:', error);
    return false;
  }

  // Log rejection
  await logApprovalDecision(tenantId, jobId, {
    approved: false,
    approvedBy: rejectedBy,
    reason,
  });

  console.log(`[approval-gate] Job ${jobId} rejected by ${rejectedBy}`);
  return true;
}

/**
 * Auto-approve a job (for jobs that don't require approval)
 */
export async function autoApproveJob(
  tenantId: string,
  jobId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('browser_automation_jobs')
    .update({
      status: 'approved',
      approved_by: 'system:auto_approval',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending_approval');

  if (error) {
    console.error('[approval-gate] Failed to auto-approve job:', error);
    return false;
  }

  console.log(`[approval-gate] Job ${jobId} auto-approved`);
  return true;
}

// ============================================================================
// Pending Approvals
// ============================================================================

/**
 * Get pending approval requests for tenant
 */
export async function getPendingApprovals(
  tenantId: string,
  limit: number = 10
): Promise<ApprovalRequest[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('browser_automation_jobs')
    .select(`
      id,
      tenant_id,
      job_type,
      target_url,
      parameters,
      created_at,
      vendor_portal_configs!inner(portal_name)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[approval-gate] Failed to get pending approvals:', error);
    return [];
  }

  return (data || []).map((row) => ({
    jobId: row.id,
    tenantId: row.tenant_id,
    jobType: row.job_type as BrowserJobType,
    targetUrl: row.target_url,
    portalName: (row.vendor_portal_configs as unknown as { portal_name: string })?.portal_name || 'Unknown',
    description: generateJobDescription(row.job_type, row.parameters),
    parameters: row.parameters as Record<string, unknown>,
    requestedBy: 'system',
    requestedAt: new Date(row.created_at),
  }));
}

/**
 * Get count of pending approvals
 */
export async function getPendingApprovalCount(tenantId: string): Promise<number> {
  const supabase = createServiceRoleClient();

  const { count, error } = await supabase
    .from('browser_automation_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'pending_approval');

  if (error) {
    console.error('[approval-gate] Failed to count pending approvals:', error);
    return 0;
  }

  return count || 0;
}

// ============================================================================
// Approval Logging
// ============================================================================

/**
 * Log approval decision
 */
async function logApprovalDecision(
  tenantId: string,
  jobId: string,
  decision: ApprovalDecision
): Promise<void> {
  // Log to console for now
  // In production, this could log to an audit table
  console.log(`[approval-gate] Decision logged:`, {
    tenantId,
    jobId,
    decision,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate human-readable job description
 */
function generateJobDescription(
  jobType: string,
  parameters: Record<string, unknown>
): string {
  switch (jobType) {
    case 'accept_order':
      return `Accept order ${parameters.orderNumber || parameters.orderId || 'Unknown'}`;
    case 'check_status':
      return `Check status of order ${parameters.orderNumber || parameters.orderId || 'Unknown'}`;
    case 'download_documents':
      return `Download documents for order ${parameters.orderNumber || parameters.orderId || 'Unknown'}`;
    case 'submit_report':
      return `Submit report for order ${parameters.orderNumber || parameters.orderId || 'Unknown'}`;
    case 'custom_workflow':
      return `Run custom workflow: ${parameters.workflowName || 'Unknown'}`;
    default:
      return `Browser automation job: ${jobType}`;
  }
}
