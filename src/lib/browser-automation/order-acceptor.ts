/**
 * P2.3: Order Acceptor
 * Specialized workflow for accepting orders on vendor portals
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { createJob, executeJob, getJob } from './automation-engine';
import type { BrowserAutomationJob, JobExecutionResult } from './types';

// ============================================================================
// Types
// ============================================================================

export interface OrderAcceptRequest {
  portalConfigId: string;
  orderId: string;
  orderNumber: string;
  orderUrl?: string;
  fee: number;
  dueDate?: string;
  propertyAddress?: string;
  triggeredBy: string;
  runId?: string;
  cardId?: string;
}

export interface OrderAcceptResult {
  success: boolean;
  jobId?: string;
  status: string;
  message: string;
  orderDetails?: {
    orderId: string;
    orderNumber: string;
    fee: number;
    acceptedAt?: string;
  };
  error?: string;
}

// ============================================================================
// Order Acceptance
// ============================================================================

/**
 * Accept an order on a vendor portal
 */
export async function acceptOrder(
  tenantId: string,
  request: OrderAcceptRequest
): Promise<OrderAcceptResult> {
  // Validate request
  if (!request.orderId && !request.orderNumber) {
    return {
      success: false,
      status: 'validation_error',
      message: 'Either orderId or orderNumber is required',
    };
  }

  // Check if order is already being processed
  const existingJob = await findExistingJob(tenantId, request.orderId, request.orderNumber);
  if (existingJob) {
    return {
      success: false,
      jobId: existingJob.id,
      status: 'already_processing',
      message: `Order is already being processed (job ${existingJob.id})`,
    };
  }

  // Create job
  const jobId = await createJob(tenantId, {
    portalConfigId: request.portalConfigId,
    jobType: 'accept_order',
    targetUrl: request.orderUrl,
    orderId: request.orderId,
    orderNumber: request.orderNumber,
    parameters: {
      fee: request.fee,
      dueDate: request.dueDate,
      propertyAddress: request.propertyAddress,
    },
    triggeredBy: request.triggeredBy,
    runId: request.runId,
    cardId: request.cardId,
  });

  if (!jobId) {
    return {
      success: false,
      status: 'creation_failed',
      message: 'Failed to create order acceptance job',
    };
  }

  // Execute job
  const result = await executeJob(tenantId, jobId);

  return {
    success: result.success,
    jobId,
    status: result.status,
    message: result.success ? 'Order accepted successfully' : 'Order acceptance failed',
    orderDetails: result.success
      ? {
          orderId: request.orderId,
          orderNumber: request.orderNumber,
          fee: request.fee,
          acceptedAt: new Date().toISOString(),
        }
      : undefined,
    error: result.error,
  };
}

/**
 * Queue order acceptance for later execution
 */
export async function queueOrderAcceptance(
  tenantId: string,
  request: OrderAcceptRequest
): Promise<{ jobId: string | null; requiresApproval: boolean }> {
  // Check for existing job
  const existingJob = await findExistingJob(tenantId, request.orderId, request.orderNumber);
  if (existingJob) {
    return { jobId: existingJob.id, requiresApproval: false };
  }

  const jobId = await createJob(tenantId, {
    portalConfigId: request.portalConfigId,
    jobType: 'accept_order',
    targetUrl: request.orderUrl,
    orderId: request.orderId,
    orderNumber: request.orderNumber,
    parameters: {
      fee: request.fee,
      dueDate: request.dueDate,
      propertyAddress: request.propertyAddress,
    },
    triggeredBy: request.triggeredBy,
    runId: request.runId,
    cardId: request.cardId,
  });

  if (!jobId) {
    return { jobId: null, requiresApproval: false };
  }

  // Check if it requires approval
  const job = await getJob(tenantId, jobId);
  return {
    jobId,
    requiresApproval: job?.status === 'pending_approval',
  };
}

/**
 * Batch accept multiple orders
 */
export async function batchAcceptOrders(
  tenantId: string,
  requests: OrderAcceptRequest[]
): Promise<{
  successful: OrderAcceptResult[];
  failed: OrderAcceptResult[];
}> {
  const successful: OrderAcceptResult[] = [];
  const failed: OrderAcceptResult[] = [];

  for (const request of requests) {
    try {
      const result = await acceptOrder(tenantId, request);
      if (result.success) {
        successful.push(result);
      } else {
        failed.push(result);
      }

      // Rate limit between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      failed.push({
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { successful, failed };
}

// ============================================================================
// Order Status Check
// ============================================================================

/**
 * Check order status on portal
 */
export async function checkOrderStatus(
  tenantId: string,
  portalConfigId: string,
  orderIdentifier: { orderId?: string; orderNumber?: string },
  triggeredBy: string
): Promise<{
  success: boolean;
  status?: string;
  lastUpdated?: string;
  error?: string;
}> {
  const jobId = await createJob(tenantId, {
    portalConfigId,
    jobType: 'check_status',
    orderId: orderIdentifier.orderId,
    orderNumber: orderIdentifier.orderNumber,
    triggeredBy,
  });

  if (!jobId) {
    return { success: false, error: 'Failed to create status check job' };
  }

  const result = await executeJob(tenantId, jobId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const extractedData = result.result?.data as Record<string, unknown> | undefined;

  return {
    success: true,
    status: extractedData?.status as string | undefined,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// Order Statistics
// ============================================================================

/**
 * Get order acceptance statistics
 */
export async function getAcceptanceStats(
  tenantId: string,
  days: number = 7
): Promise<{
  totalAccepted: number;
  totalFailed: number;
  successRate: number;
  averageDurationMs: number;
  byPortal: Record<string, { accepted: number; failed: number }>;
}> {
  const supabase = createServiceRoleClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('browser_automation_jobs')
    .select('portal_config_id, status, duration_ms')
    .eq('tenant_id', tenantId)
    .eq('job_type', 'accept_order')
    .gte('created_at', startDate.toISOString());

  if (error || !data) {
    return {
      totalAccepted: 0,
      totalFailed: 0,
      successRate: 0,
      averageDurationMs: 0,
      byPortal: {},
    };
  }

  const jobs = data;
  let totalAccepted = 0;
  let totalFailed = 0;
  let totalDuration = 0;
  let durationCount = 0;
  const byPortal: Record<string, { accepted: number; failed: number }> = {};

  for (const job of jobs) {
    const portalId = job.portal_config_id;

    if (!byPortal[portalId]) {
      byPortal[portalId] = { accepted: 0, failed: 0 };
    }

    if (job.status === 'completed') {
      totalAccepted++;
      byPortal[portalId].accepted++;
    } else if (job.status === 'failed') {
      totalFailed++;
      byPortal[portalId].failed++;
    }

    if (job.duration_ms) {
      totalDuration += job.duration_ms;
      durationCount++;
    }
  }

  return {
    totalAccepted,
    totalFailed,
    successRate: totalAccepted + totalFailed > 0 ? totalAccepted / (totalAccepted + totalFailed) : 0,
    averageDurationMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
    byPortal,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find existing job for an order
 */
async function findExistingJob(
  tenantId: string,
  orderId?: string,
  orderNumber?: string
): Promise<BrowserAutomationJob | null> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('browser_automation_jobs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('job_type', 'accept_order')
    .in('status', ['pending_approval', 'approved', 'running']);

  if (orderId) {
    query = query.eq('order_id', orderId);
  } else if (orderNumber) {
    query = query.eq('order_number', orderNumber);
  } else {
    return null;
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    portalConfigId: data.portal_config_id,
    jobType: data.job_type,
    targetUrl: data.target_url,
    orderId: data.order_id,
    orderNumber: data.order_number,
    parameters: data.parameters,
    requiresApproval: data.requires_approval,
    status: data.status,
    retryCount: data.retry_count,
    maxRetries: data.max_retries,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
