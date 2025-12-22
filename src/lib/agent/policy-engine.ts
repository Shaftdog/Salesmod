/**
 * Policy Engine - Action validation and guardrails
 *
 * Hard Guardrails:
 * 1. Do not create human tasks unless client explicitly requested it
 * 2. Do not run research until engagement/follow-up list is exhausted
 * 3. No spam behaviors - rate limits + suppression/bounce + opt-out compliance
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { checkRateLimit, recordPolicyBlock } from './agent-config';

export interface PolicyContext {
  tenantId: string;
  runId?: string;
  actionType: string;
  actionData: Record<string, unknown>;

  // For create_task policy
  clientRequestedTask?: boolean;
  complianceDeadline?: boolean;
  safetyEscalation?: boolean;

  // For research policy
  engagementViolationsCount?: number;
  goalsOnTrack?: boolean;
  pipelineHealthy?: boolean;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  policyType?: string;
}

// ============================================================================
// Policy Checks
// ============================================================================

/**
 * Check if an action is allowed by all policies
 */
export async function checkPolicies(context: PolicyContext): Promise<PolicyResult> {
  const checks = [
    checkHumanTaskPolicy,
    checkResearchPolicy,
    checkRateLimitPolicy,
    checkSensitiveActionPolicy,
    checkSuppressionPolicy,
  ];

  for (const check of checks) {
    const result = await check(context);
    if (!result.allowed) {
      // Log policy violation
      await logPolicyViolation(context, result);
      return result;
    }
  }

  return { allowed: true };
}

/**
 * Policy: No human tasks unless explicitly requested
 *
 * Allowed when:
 * - Client explicitly requested the task in an email
 * - Compliance deadline is due
 * - Safety escalation is required
 */
async function checkHumanTaskPolicy(context: PolicyContext): Promise<PolicyResult> {
  if (context.actionType !== 'create_task') {
    return { allowed: true };
  }

  // Check if any exception applies
  if (context.clientRequestedTask) {
    return { allowed: true };
  }

  if (context.complianceDeadline) {
    return { allowed: true };
  }

  if (context.safetyEscalation) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Human task creation requires explicit client request, compliance deadline, or safety escalation',
    policyType: 'human_task_no_request',
  };
}

/**
 * Policy: Research only after engagement exhaustion
 *
 * Blocked unless:
 * - All engagement compliance is met (no 21-day violations)
 * - Goals are behind pace OR pipeline is thin
 * - Exception: Contact discovery is always allowed
 */
async function checkResearchPolicy(context: PolicyContext): Promise<PolicyResult> {
  if (context.actionType !== 'research') {
    return { allowed: true };
  }

  // Contact discovery is always allowed
  const researchType = context.actionData?.researchType as string;
  if (researchType === 'contact_discovery') {
    return { allowed: true };
  }

  // Check engagement compliance
  const violationsCount = context.engagementViolationsCount ?? 0;
  if (violationsCount > 0) {
    return {
      allowed: false,
      reason: `Research blocked: ${violationsCount} engagement violations pending. Complete follow-ups first.`,
      policyType: 'research_before_exhaustion',
    };
  }

  // Check if goals/pipeline justify research
  if (!context.goalsOnTrack || !context.pipelineHealthy) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Research not needed: goals on track and pipeline healthy. Focus on engagement.',
    policyType: 'research_before_exhaustion',
  };
}

/**
 * Policy: Rate limiting
 *
 * Enforces per-tenant hourly limits on:
 * - Email sends
 * - Research runs
 * - Sandbox jobs (future)
 */
async function checkRateLimitPolicy(context: PolicyContext): Promise<PolicyResult> {
  const rateLimitedActions: Record<string, { type: string; limit: number }> = {
    send_email: { type: 'email_send', limit: 20 },
    reply_to_email: { type: 'email_send', limit: 20 },
    research: { type: 'research', limit: 10 },
    sandbox_job: { type: 'sandbox', limit: 5 },
  };

  const config = rateLimitedActions[context.actionType];
  if (!config) {
    return { allowed: true };
  }

  const result = await checkRateLimit(context.tenantId, config.type, config.limit);
  if (!result.allowed) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${result.currentCount}/${result.maxAllowed} ${config.type} actions this hour`,
      policyType: 'rate_limit',
    };
  }

  return { allowed: true };
}

/**
 * Policy: Sensitive action restrictions
 *
 * Blocks actions with dangerous patterns
 */
async function checkSensitiveActionPolicy(context: PolicyContext): Promise<PolicyResult> {
  const dangerousPatterns = [
    'delete_all',
    'drop_database',
    'truncate',
    'mass_delete',
    'unsubscribe_all',
  ];

  const actionString = JSON.stringify(context.actionData).toLowerCase();
  for (const pattern of dangerousPatterns) {
    if (actionString.includes(pattern)) {
      return {
        allowed: false,
        reason: `Sensitive action blocked: detected pattern "${pattern}"`,
        policyType: 'sensitive_action',
      };
    }
  }

  return { allowed: true };
}

/**
 * Policy: Email suppression check
 *
 * Prevents sending to suppressed/bounced contacts
 */
async function checkSuppressionPolicy(context: PolicyContext): Promise<PolicyResult> {
  if (!['send_email', 'reply_to_email'].includes(context.actionType)) {
    return { allowed: true };
  }

  const contactId = context.actionData?.contactId as string;
  const recipientEmail = context.actionData?.to as string;

  if (!contactId && !recipientEmail) {
    return { allowed: true };
  }

  const supabase = createServiceRoleClient();

  // Check suppression list
  let query = supabase
    .from('email_suppressions')
    .select('reason, bounce_type')
    .eq('tenant_id', context.tenantId);

  if (contactId) {
    query = query.eq('contact_id', contactId);
  } else if (recipientEmail) {
    query = query.eq('email', recipientEmail);
  }

  const { data: suppression, error } = await query.single();

  // PGRST116 = no rows found, which is fine (not suppressed)
  if (error && error.code !== 'PGRST116') {
    console.error('[PolicyEngine] Error checking suppression:', error);
    // Fail closed on error - block the email for safety
    return {
      allowed: false,
      reason: 'Email blocked: unable to verify suppression status',
      policyType: 'suppression_check_error',
    };
  }

  if (suppression) {
    return {
      allowed: false,
      reason: `Email blocked: recipient is suppressed due to ${suppression.reason}${suppression.bounce_type ? ` (${suppression.bounce_type} bounce)` : ''}`,
      policyType: 'suppression',
    };
  }

  return { allowed: true };
}

// ============================================================================
// Policy Violation Logging
// ============================================================================

async function logPolicyViolation(context: PolicyContext, result: PolicyResult): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    await supabase.from('agent_policy_violations').insert({
      tenant_id: context.tenantId,
      run_id: context.runId || null,
      violation_type: result.policyType || 'unknown',
      action_type: context.actionType,
      action_data: context.actionData,
      reason: result.reason || 'Policy violation',
      blocked: true,
    });

    // Record for alerting
    await recordPolicyBlock(
      context.tenantId,
      result.policyType || 'unknown',
      result.reason || 'Policy violation'
    );
  } catch (err) {
    console.error('[PolicyEngine] Failed to log violation:', err);
  }
}

// ============================================================================
// Context Helpers
// ============================================================================

/**
 * Build policy context from action and tenant state
 */
export async function buildPolicyContext(
  tenantId: string,
  runId: string | undefined,
  actionType: string,
  actionData: Record<string, unknown>
): Promise<PolicyContext> {
  const supabase = createServiceRoleClient();

  // Get engagement violations count
  const { count: violationsCount } = await supabase
    .from('engagement_clocks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_compliant', false);

  // TODO: Add goal tracking and pipeline health checks
  const goalsOnTrack = true; // Placeholder
  const pipelineHealthy = true; // Placeholder

  // Check if client requested task (from email context)
  let clientRequestedTask = false;
  if (actionType === 'create_task' && actionData.sourceEmailId) {
    // Check if the source email contains task request patterns
    const { data: email } = await supabase
      .from('gmail_messages')
      .select('body_text, intent')
      .eq('id', actionData.sourceEmailId)
      .single();

    if (email) {
      const taskPatterns = [
        'can you call',
        'please call',
        'give me a call',
        'call me',
        'schedule a call',
        'set up a meeting',
        'let\'s meet',
        'can we meet',
      ];
      const bodyLower = (email.body_text || '').toLowerCase();
      clientRequestedTask = taskPatterns.some((p) => bodyLower.includes(p));
    }
  }

  return {
    tenantId,
    runId,
    actionType,
    actionData,
    clientRequestedTask,
    complianceDeadline: false, // TODO: Check compliance calendar
    safetyEscalation: actionData.urgency === 'critical' || actionData.category === 'ESCALATE',
    engagementViolationsCount: violationsCount || 0,
    goalsOnTrack,
    pipelineHealthy,
  };
}

/**
 * Quick check if action type is allowed (without full context)
 */
export function isActionTypeAllowed(actionType: string): boolean {
  const blockedTypes = [
    'delete_account',
    'delete_tenant',
    'drop_data',
    'admin_override',
  ];

  return !blockedTypes.includes(actionType);
}
