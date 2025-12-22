/**
 * P2.3: Workflow Recorder
 * Records and replays browser workflows
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { RecordedWorkflow, RecordedStep, WorkflowStep } from './types';

// ============================================================================
// Types
// ============================================================================

export interface RecordingSession {
  id: string;
  tenantId: string;
  portalConfigId: string;
  name: string;
  startedAt: Date;
  steps: RecordedStep[];
  isActive: boolean;
}

export interface RecordedAction {
  action: 'click' | 'fill' | 'select' | 'navigate' | 'scroll';
  selector?: string;
  value?: string;
  url?: string;
  coordinates?: { x: number; y: number };
  timestamp: number;
}

// ============================================================================
// Recording Management
// ============================================================================

/**
 * Start a new recording session
 */
export async function startRecording(
  tenantId: string,
  portalConfigId: string,
  name: string,
  createdBy: string
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('recorded_workflows')
    .insert({
      tenant_id: tenantId,
      portal_config_id: portalConfigId,
      name,
      steps: [],
      start_url: '',
      is_validated: false,
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[workflow-recorder] Failed to start recording:', error);
    return null;
  }

  console.log(`[workflow-recorder] Started recording session ${data.id}`);
  return data.id;
}

/**
 * Add a step to recording
 */
export async function addRecordedStep(
  tenantId: string,
  workflowId: string,
  step: RecordedAction
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // Get current steps
  const { data: workflow, error: getError } = await supabase
    .from('recorded_workflows')
    .select('steps')
    .eq('id', workflowId)
    .eq('tenant_id', tenantId)
    .single();

  if (getError || !workflow) {
    console.error('[workflow-recorder] Failed to get workflow:', getError);
    return false;
  }

  const steps = (workflow.steps as RecordedStep[]) || [];
  const newStep: RecordedStep = {
    sequence: steps.length + 1,
    action: step.action,
    selector: step.selector,
    value: step.value,
    url: step.url,
    timestamp: step.timestamp || Date.now(),
  };

  steps.push(newStep);

  // Update workflow
  const { error: updateError } = await supabase
    .from('recorded_workflows')
    .update({
      steps,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId)
    .eq('tenant_id', tenantId);

  if (updateError) {
    console.error('[workflow-recorder] Failed to add step:', updateError);
    return false;
  }

  return true;
}

/**
 * Stop recording and finalize workflow
 */
export async function stopRecording(
  tenantId: string,
  workflowId: string,
  startUrl: string
): Promise<RecordedWorkflow | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('recorded_workflows')
    .update({
      start_url: startUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) {
    console.error('[workflow-recorder] Failed to stop recording:', error);
    return null;
  }

  return mapToWorkflow(data);
}

// ============================================================================
// Workflow Management
// ============================================================================

/**
 * Get recorded workflow by ID
 */
export async function getWorkflow(
  tenantId: string,
  workflowId: string
): Promise<RecordedWorkflow | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('recorded_workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToWorkflow(data);
}

/**
 * List workflows for portal
 */
export async function listWorkflows(
  tenantId: string,
  portalConfigId?: string
): Promise<RecordedWorkflow[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('recorded_workflows')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (portalConfigId) {
    query = query.eq('portal_config_id', portalConfigId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[workflow-recorder] Failed to list workflows:', error);
    return [];
  }

  return (data || []).map(mapToWorkflow);
}

/**
 * Delete a recorded workflow
 */
export async function deleteWorkflow(
  tenantId: string,
  workflowId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('recorded_workflows')
    .delete()
    .eq('id', workflowId)
    .eq('tenant_id', tenantId);

  return !error;
}

/**
 * Update workflow name/description
 */
export async function updateWorkflow(
  tenantId: string,
  workflowId: string,
  updates: { name?: string; description?: string }
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('recorded_workflows')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId)
    .eq('tenant_id', tenantId);

  return !error;
}

// ============================================================================
// Workflow Validation
// ============================================================================

/**
 * Validate a recorded workflow by running it
 */
export async function validateWorkflow(
  tenantId: string,
  workflowId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const workflow = await getWorkflow(tenantId, workflowId);

  if (!workflow) {
    return { valid: false, errors: ['Workflow not found'] };
  }

  const errors: string[] = [];

  // Check for required elements
  if (!workflow.startUrl) {
    errors.push('Start URL is required');
  }

  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push('Workflow must have at least one step');
  }

  // Validate steps
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const stepErrors = validateStep(step, i + 1);
    errors.push(...stepErrors);
  }

  // Check for selector uniqueness issues
  const selectorCounts = new Map<string, number>();
  for (const step of workflow.steps) {
    if (step.selector) {
      const count = selectorCounts.get(step.selector) || 0;
      selectorCounts.set(step.selector, count + 1);
    }
  }

  // Update validation status
  if (errors.length === 0) {
    const supabase = createServiceRoleClient();
    await supabase
      .from('recorded_workflows')
      .update({
        is_validated: true,
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .eq('tenant_id', tenantId);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single step
 */
function validateStep(step: RecordedStep, stepNumber: number): string[] {
  const errors: string[] = [];

  if (!step.action) {
    errors.push(`Step ${stepNumber}: Action is required`);
  }

  if (['click', 'fill', 'select'].includes(step.action) && !step.selector) {
    errors.push(`Step ${stepNumber}: Selector is required for ${step.action} action`);
  }

  if (step.action === 'fill' && !step.value) {
    errors.push(`Step ${stepNumber}: Value is required for fill action`);
  }

  if (step.action === 'navigate' && !step.url) {
    errors.push(`Step ${stepNumber}: URL is required for navigate action`);
  }

  return errors;
}

// ============================================================================
// Workflow Conversion
// ============================================================================

/**
 * Convert recorded workflow to executable workflow steps
 */
export function convertToWorkflowSteps(workflow: RecordedWorkflow): WorkflowStep[] {
  const steps: WorkflowStep[] = [];

  // Add initial navigation
  if (workflow.startUrl) {
    steps.push({
      action: 'navigate',
      value: workflow.startUrl,
    });
  }

  // Convert recorded steps
  for (const step of workflow.steps) {
    const workflowStep = convertStep(step);
    if (workflowStep) {
      steps.push(workflowStep);
    }
  }

  return steps;
}

/**
 * Convert a single recorded step to workflow step
 */
function convertStep(step: RecordedStep): WorkflowStep | null {
  switch (step.action) {
    case 'click':
      return {
        action: 'click',
        selector: step.selector,
        timeout: 5000,
      };

    case 'fill':
      return {
        action: 'fill',
        selector: step.selector,
        value: step.value,
        timeout: 5000,
      };

    case 'select':
      return {
        action: 'select',
        selector: step.selector,
        value: step.value,
        timeout: 5000,
      };

    case 'navigate':
      return {
        action: 'navigate',
        value: step.url,
        timeout: 30000,
      };

    default:
      return null;
  }
}

/**
 * Generate workflow definition from recorded workflow
 */
export async function generateWorkflowDefinition(
  tenantId: string,
  workflowId: string
): Promise<{
  name: string;
  description: string;
  steps: WorkflowStep[];
  requiresApproval: boolean;
  timeout: number;
} | null> {
  const workflow = await getWorkflow(tenantId, workflowId);

  if (!workflow) {
    return null;
  }

  const steps = convertToWorkflowSteps(workflow);
  const totalTimeout = steps.reduce((sum, s) => sum + (s.timeout || 5000), 0);

  return {
    name: workflow.name,
    description: workflow.description || `Custom workflow: ${workflow.name}`,
    steps,
    requiresApproval: true, // Always require approval for custom workflows
    timeout: Math.min(totalTimeout + 30000, 300000), // Max 5 minutes
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToWorkflow(row: Record<string, unknown>): RecordedWorkflow {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    portalConfigId: row.portal_config_id as string,
    steps: (row.steps as RecordedStep[]) || [],
    startUrl: row.start_url as string,
    isValidated: row.is_validated as boolean,
    validatedAt: row.validated_at ? new Date(row.validated_at as string) : undefined,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
