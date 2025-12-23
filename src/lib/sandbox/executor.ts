/**
 * P2.2: Sandbox Executor
 * Executes pre-approved template scripts in a controlled environment
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { checkRateLimit, getAgentConfig, recordAlert } from '@/lib/agent/agent-config';
import type {
  SandboxExecution,
  ExecutionResult,
  ExecutionRequest,
  ScriptTemplate,
  FileReference,
  TemplateType,
} from './types';
import { executeTemplate, getTemplateByName } from './templates';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MEMORY_LIMIT_MB = 256;
const DEFAULT_TIME_LIMIT_SECONDS = 30;

// ============================================================================
// Main Executor
// ============================================================================

/**
 * Execute a sandbox job
 */
export async function executeSandboxJob(
  tenantId: string,
  request: ExecutionRequest
): Promise<ExecutionResult> {
  const supabase = createServiceRoleClient();
  const startTime = Date.now();

  // Check rate limit for sandbox jobs
  const config = await getAgentConfig(tenantId);
  const rateLimitCheck = await checkRateLimit(
    tenantId,
    'sandbox_job',
    config.maxSandboxJobsPerHour
  );

  if (!rateLimitCheck.allowed) {
    console.warn(`[sandbox] Rate limit exceeded for tenant ${tenantId}: ${rateLimitCheck.currentCount}/${rateLimitCheck.maxAllowed}`);
    await recordAlert({
      type: 'rate_limit_exceeded',
      severity: 'warning',
      tenantId,
      message: `Sandbox job rate limit exceeded: ${rateLimitCheck.currentCount}/${rateLimitCheck.maxAllowed} per hour`,
      metadata: {
        actionType: 'sandbox_job',
        currentCount: rateLimitCheck.currentCount,
        maxAllowed: rateLimitCheck.maxAllowed,
        templateName: request.templateName,
      },
    });
    return {
      success: false,
      executionId: '',
      durationMs: Date.now() - startTime,
      error: `Rate limit exceeded: ${rateLimitCheck.currentCount}/${rateLimitCheck.maxAllowed} sandbox jobs per hour`,
    };
  }

  // Get template
  const template = await getTemplateByName(request.templateName);
  if (!template) {
    return {
      success: false,
      executionId: '',
      durationMs: Date.now() - startTime,
      error: `Template not found: ${request.templateName}`,
    };
  }

  // Validate template is active
  if (!template.isActive) {
    return {
      success: false,
      executionId: '',
      durationMs: Date.now() - startTime,
      error: `Template is not active: ${request.templateName}`,
    };
  }

  // Validate required parameters
  const paramValidation = validateParameters(template, request.inputParams);
  if (!paramValidation.valid) {
    return {
      success: false,
      executionId: '',
      durationMs: Date.now() - startTime,
      error: paramValidation.error,
    };
  }

  // Create execution record
  const { data: execution, error: insertError } = await supabase
    .from('sandbox_executions')
    .insert({
      tenant_id: tenantId,
      template_id: template.id,
      template_name: template.templateName,
      input_params: request.inputParams,
      input_file_refs: request.inputFileRefs || [],
      triggered_by: request.triggeredBy,
      run_id: request.runId,
      card_id: request.cardId,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !execution) {
    console.error('[sandbox] Failed to create execution record:', insertError);
    return {
      success: false,
      executionId: '',
      durationMs: Date.now() - startTime,
      error: 'Failed to create execution record',
    };
  }

  const executionId = execution.id;

  try {
    // Execute template with resource limits
    const result = await executeWithLimits(
      template,
      request.inputParams,
      request.inputFileRefs || [],
      {
        maxMemoryMb: template.resourceLimits.max_memory_mb || DEFAULT_MEMORY_LIMIT_MB,
        maxTimeSeconds: template.resourceLimits.max_time_seconds || DEFAULT_TIME_LIMIT_SECONDS,
      }
    );

    const durationMs = Date.now() - startTime;

    // Update execution record with success
    await supabase
      .from('sandbox_executions')
      .update({
        status: 'completed',
        output_data: result.outputData,
        output_file_refs: result.outputFileRefs || [],
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        memory_used_mb: result.memoryUsedMb,
      })
      .eq('id', executionId);

    console.log(`[sandbox] Execution ${executionId} completed in ${durationMs}ms`);

    return {
      success: true,
      executionId,
      outputData: result.outputData,
      outputFileRefs: result.outputFileRefs,
      durationMs,
      memoryUsedMb: result.memoryUsedMb,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Determine status based on error type
    const status = errorMessage.includes('timeout') ? 'timeout' : 'failed';

    // Update execution record with failure
    await supabase
      .from('sandbox_executions')
      .update({
        status,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        error_message: errorMessage,
        error_stack: errorStack,
      })
      .eq('id', executionId);

    console.error(`[sandbox] Execution ${executionId} failed:`, errorMessage);

    return {
      success: false,
      executionId,
      durationMs,
      error: errorMessage,
    };
  }
}

/**
 * Execute template with resource limits
 */
async function executeWithLimits(
  template: ScriptTemplate,
  inputParams: Record<string, unknown>,
  inputFileRefs: FileReference[],
  limits: { maxMemoryMb: number; maxTimeSeconds: number }
): Promise<{
  outputData: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  memoryUsedMb?: number;
}> {
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Execution timeout after ${limits.maxTimeSeconds} seconds`));
    }, limits.maxTimeSeconds * 1000);
  });

  // Execute template
  const executionPromise = executeTemplate(
    template.templateType,
    inputParams,
    inputFileRefs
  );

  // Race between execution and timeout
  return Promise.race([executionPromise, timeoutPromise]);
}

/**
 * Validate input parameters against template requirements
 */
function validateParameters(
  template: ScriptTemplate,
  inputParams: Record<string, unknown>
): { valid: boolean; error?: string } {
  for (const param of template.parameters) {
    if (param.required && !(param.name in inputParams)) {
      return {
        valid: false,
        error: `Missing required parameter: ${param.name}`,
      };
    }

    const value = inputParams[param.name];
    if (value !== undefined && value !== null) {
      const typeCheck = checkParameterType(value, param.type);
      if (!typeCheck.valid) {
        return {
          valid: false,
          error: `Parameter '${param.name}' ${typeCheck.error}`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Check parameter type
 */
function checkParameterType(
  value: unknown,
  expectedType: string
): { valid: boolean; error?: string } {
  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: 'must be a string' };
      }
      break;
    case 'number':
      if (typeof value !== 'number') {
        return { valid: false, error: 'must be a number' };
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: 'must be a boolean' };
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        return { valid: false, error: 'must be an array' };
      }
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { valid: false, error: 'must be an object' };
      }
      break;
  }

  return { valid: true };
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get pending sandbox jobs for a tenant
 */
export async function getPendingSandboxJobs(
  tenantId: string,
  limit: number = 5
): Promise<SandboxExecution[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('sandbox_executions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[sandbox] Failed to get pending jobs:', error);
    return [];
  }

  return (data || []).map(mapToExecution);
}

/**
 * Get execution by ID
 */
export async function getExecution(
  tenantId: string,
  executionId: string
): Promise<SandboxExecution | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('sandbox_executions')
    .select('*')
    .eq('id', executionId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToExecution(data);
}

/**
 * Get recent executions
 */
export async function getRecentExecutions(
  tenantId: string,
  options?: {
    templateName?: string;
    status?: string;
    limit?: number;
  }
): Promise<SandboxExecution[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('sandbox_executions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.templateName) {
    query = query.eq('template_name', options.templateName);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const limit = Math.min(options?.limit || 20, 100);
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('[sandbox] Failed to get recent executions:', error);
    return [];
  }

  return (data || []).map(mapToExecution);
}

/**
 * Get execution statistics
 */
export async function getExecutionStats(
  tenantId: string,
  days: number = 7
): Promise<{
  totalExecutions: number;
  successCount: number;
  failedCount: number;
  timeoutCount: number;
  avgDurationMs: number;
  byTemplate: Record<string, { count: number; successRate: number }>;
}> {
  const supabase = createServiceRoleClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('sandbox_executions')
    .select('template_name, status, duration_ms')
    .eq('tenant_id', tenantId)
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('[sandbox] Failed to get execution stats:', error);
    return {
      totalExecutions: 0,
      successCount: 0,
      failedCount: 0,
      timeoutCount: 0,
      avgDurationMs: 0,
      byTemplate: {},
    };
  }

  const executions = data || [];
  const byTemplate: Record<string, { total: number; success: number }> = {};

  let successCount = 0;
  let failedCount = 0;
  let timeoutCount = 0;
  let totalDuration = 0;
  let durationCount = 0;

  for (const exec of executions) {
    // Count by status
    if (exec.status === 'completed') {
      successCount++;
    } else if (exec.status === 'failed') {
      failedCount++;
    } else if (exec.status === 'timeout') {
      timeoutCount++;
    }

    // Track duration
    if (exec.duration_ms) {
      totalDuration += exec.duration_ms;
      durationCount++;
    }

    // Track by template
    if (!byTemplate[exec.template_name]) {
      byTemplate[exec.template_name] = { total: 0, success: 0 };
    }
    byTemplate[exec.template_name].total++;
    if (exec.status === 'completed') {
      byTemplate[exec.template_name].success++;
    }
  }

  return {
    totalExecutions: executions.length,
    successCount,
    failedCount,
    timeoutCount,
    avgDurationMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
    byTemplate: Object.fromEntries(
      Object.entries(byTemplate).map(([name, stats]) => [
        name,
        {
          count: stats.total,
          successRate: stats.total > 0 ? stats.success / stats.total : 0,
        },
      ])
    ),
  };
}

// ============================================================================
// Job Management
// ============================================================================

/**
 * Queue a sandbox job for execution
 */
export async function queueSandboxJob(
  tenantId: string,
  request: ExecutionRequest
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  // Verify template exists
  const template = await getTemplateByName(request.templateName);
  if (!template) {
    console.error(`[sandbox] Template not found: ${request.templateName}`);
    return null;
  }

  const { data, error } = await supabase
    .from('sandbox_executions')
    .insert({
      tenant_id: tenantId,
      template_id: template.id,
      template_name: template.templateName,
      input_params: request.inputParams,
      input_file_refs: request.inputFileRefs || [],
      triggered_by: request.triggeredBy,
      run_id: request.runId,
      card_id: request.cardId,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[sandbox] Failed to queue job:', error);
    return null;
  }

  return data.id;
}

/**
 * Run a pending sandbox execution by ID
 */
export async function runPendingExecution(
  tenantId: string,
  executionId: string
): Promise<ExecutionResult> {
  const supabase = createServiceRoleClient();
  const startTime = Date.now();

  // Get the pending execution
  const { data: execData, error: fetchError } = await supabase
    .from('sandbox_executions')
    .select('*, sandbox_script_templates!inner(*)')
    .eq('id', executionId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !execData) {
    return {
      success: false,
      executionId,
      durationMs: Date.now() - startTime,
      error: 'Execution not found',
    };
  }

  if (execData.status !== 'pending') {
    return {
      success: false,
      executionId,
      durationMs: Date.now() - startTime,
      error: `Execution is not pending: ${execData.status}`,
    };
  }

  // Get template
  const template = await getTemplateByName(execData.template_name);
  if (!template || !template.isActive) {
    return {
      success: false,
      executionId,
      durationMs: Date.now() - startTime,
      error: `Template not available: ${execData.template_name}`,
    };
  }

  // Mark as running
  await supabase
    .from('sandbox_executions')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', executionId);

  try {
    // Execute template with limits
    const limits = {
      maxMemoryMb: template.resourceLimits.max_memory_mb || DEFAULT_MEMORY_LIMIT_MB,
      maxTimeSeconds: template.resourceLimits.max_time_seconds || DEFAULT_TIME_LIMIT_SECONDS,
    };

    const result = await executeWithLimits(
      template,
      execData.input_params as Record<string, unknown>,
      (execData.input_file_refs as FileReference[]) || [],
      limits
    );

    const durationMs = Date.now() - startTime;

    // Update execution record with success
    await supabase
      .from('sandbox_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        output_data: result.outputData,
        output_file_refs: result.outputFileRefs || [],
        memory_used_mb: result.memoryUsedMb,
      })
      .eq('id', executionId);

    return {
      success: true,
      executionId,
      outputData: result.outputData,
      outputFileRefs: result.outputFileRefs,
      durationMs,
      memoryUsedMb: result.memoryUsedMb,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Determine status based on error type
    const status = errorMessage.includes('timeout') ? 'timeout' : 'failed';

    // Update execution record with failure
    await supabase
      .from('sandbox_executions')
      .update({
        status,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        error_message: errorMessage,
        error_stack: errorStack,
      })
      .eq('id', executionId);

    return {
      success: false,
      executionId,
      durationMs,
      error: errorMessage,
    };
  }
}

/**
 * Cancel a pending sandbox job
 */
export async function cancelSandboxJob(
  tenantId: string,
  executionId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('sandbox_executions')
    .update({
      status: 'killed',
      completed_at: new Date().toISOString(),
      error_message: 'Cancelled by user',
    })
    .eq('id', executionId)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending');

  if (error) {
    console.error('[sandbox] Failed to cancel job:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Template Management
// ============================================================================

/**
 * List available templates
 */
export async function listTemplates(): Promise<ScriptTemplate[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('sandbox_script_templates')
    .select('*')
    .eq('is_active', true)
    .order('template_name');

  if (error) {
    console.error('[sandbox] Failed to list templates:', error);
    return [];
  }

  return (data || []).map(mapToTemplate);
}

/**
 * Get template by type
 */
export async function getTemplatesByType(
  templateType: TemplateType
): Promise<ScriptTemplate[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('sandbox_script_templates')
    .select('*')
    .eq('template_type', templateType)
    .eq('is_active', true);

  if (error) {
    console.error('[sandbox] Failed to get templates by type:', error);
    return [];
  }

  return (data || []).map(mapToTemplate);
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToExecution(row: Record<string, unknown>): SandboxExecution {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    templateId: row.template_id as string,
    templateName: row.template_name as string,
    inputParams: row.input_params as Record<string, unknown>,
    inputFileRefs: row.input_file_refs as FileReference[] | undefined,
    outputData: row.output_data as Record<string, unknown> | undefined,
    outputFileRefs: row.output_file_refs as FileReference[] | undefined,
    runId: row.run_id as string | undefined,
    cardId: row.card_id as string | undefined,
    triggeredBy: row.triggered_by as string,
    status: row.status as SandboxExecution['status'],
    startedAt: row.started_at ? new Date(row.started_at as string) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
    durationMs: row.duration_ms as number | undefined,
    memoryUsedMb: row.memory_used_mb as number | undefined,
    cpuTimeMs: row.cpu_time_ms as number | undefined,
    errorMessage: row.error_message as string | undefined,
    errorStack: row.error_stack as string | undefined,
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
  };
}

function mapToTemplate(row: Record<string, unknown>): ScriptTemplate {
  return {
    id: row.id as string,
    templateName: row.template_name as string,
    templateType: row.template_type as TemplateType,
    description: row.description as string,
    language: row.language as 'typescript' | 'python',
    scriptCode: row.script_code as string,
    parameters: row.parameters as ScriptTemplate['parameters'],
    allowedImports: row.allowed_imports as string[],
    resourceLimits: row.resource_limits as ScriptTemplate['resourceLimits'],
    version: row.version as number,
    isActive: row.is_active as boolean,
  };
}
