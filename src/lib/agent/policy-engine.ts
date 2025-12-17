/**
 * Policy Enforcement Engine
 * Validates agent actions against business rules and guardrails
 */

import { ProposedAction } from './planner';

// ============================================================================
// Types
// ============================================================================

export interface PolicyValidationResult {
  allowed: boolean;
  policyId?: string;
  policyName?: string;
  reason?: string;
  warnings?: string[];
}

export interface PolicyContext {
  tenantId: string;
  engagementViolations: EngagementViolation[];
  goalStatus: GoalStatus[];
  inboundRequest?: InboundRequest;
}

interface EngagementViolation {
  entityType: string;
  entityId: string;
  entityName?: string;
  daysOverdue: number;
  lastTouchType?: string;
  priority: number;
}

interface GoalStatus {
  goalId: string;
  metricType: string;
  currentProgress: number;
  targetValue: number;
  gapToTarget: number;
  daysRemaining: number;
  status: string;
}

interface InboundRequest {
  type: 'email' | 'call' | 'form';
  content: string;
  from: string;
  receivedAt: Date;
  hasExplicitAsk: boolean;
  extractedAsk?: string;
}

// ============================================================================
// Policy Rules
// ============================================================================

/**
 * Policy 1: No human tasks unless client-requested
 *
 * Default: No human tasks
 * Allow create_task only if:
 * - Inbound email/request contains explicit ask
 * - Compliance deadline is due
 * - Safety escalation required
 */
async function validateNoHumanTasksUnlessRequested(
  action: ProposedAction,
  context: PolicyContext
): Promise<PolicyValidationResult> {
  // Only applies to create_task actions
  if (action.type !== 'create_task') {
    return { allowed: true };
  }

  // Check 1: Was there an explicit client request?
  if (context.inboundRequest?.hasExplicitAsk) {
    return {
      allowed: true,
      warnings: [`Task created based on client request: "${context.inboundRequest.extractedAsk}"`],
    };
  }

  // Check 2: Is this a compliance deadline task?
  const isComplianceTask = isComplianceRelated(action);
  if (isComplianceTask) {
    return {
      allowed: true,
      warnings: ['Task created for compliance deadline'],
    };
  }

  // Check 3: Is this a safety escalation?
  const isSafetyEscalation = requiresSafetyEscalation(action);
  if (isSafetyEscalation) {
    return {
      allowed: true,
      warnings: ['Task created for safety escalation - requires human approval'],
    };
  }

  // Default: Block the task
  return {
    allowed: false,
    policyId: 'no-human-tasks',
    policyName: 'No Human Tasks Unless Requested',
    reason: 'Tasks can only be created when: (1) client explicitly requests it, (2) compliance deadline is due, or (3) safety escalation is required',
  };
}

/**
 * Policy 2: Research only after current contact list exhausted
 *
 * Allow research only if:
 * - Engagement compliance is met (no 21-day violations)
 * - Goals are behind pace OR pipeline coverage is thin
 */
async function validateResearchAfterExhaustion(
  action: ProposedAction,
  context: PolicyContext
): Promise<PolicyValidationResult> {
  // Only applies to research actions
  if (action.type !== 'research') {
    return { allowed: true };
  }

  // Check 1: Are there engagement violations?
  const hasViolations = context.engagementViolations.length > 0;

  if (hasViolations) {
    // Check if this research is specifically to find contacts for a client with no contacts
    // This is allowed even with violations
    const isContactDiscovery = action.rationale?.toLowerCase().includes('no contacts') ||
                               action.rationale?.toLowerCase().includes('find contacts') ||
                               action.title?.toLowerCase().includes('no contacts');

    if (isContactDiscovery) {
      return {
        allowed: true,
        warnings: ['Research allowed for contact discovery despite engagement violations'],
      };
    }

    return {
      allowed: false,
      policyId: 'research-after-exhaustion',
      policyName: 'Research After Exhaustion',
      reason: `Cannot run research while ${context.engagementViolations.length} contacts are overdue for engagement. Prioritize touching existing contacts first.`,
    };
  }

  // Check 2: Goals status - allow research if behind or thin pipeline
  const behindGoals = context.goalStatus.filter((g) => g.status === 'behind' || g.status === 'at_risk');
  const pipelineThin = isPipelineThin(context.goalStatus);

  if (behindGoals.length === 0 && !pipelineThin) {
    return {
      allowed: false,
      policyId: 'research-after-exhaustion',
      policyName: 'Research After Exhaustion',
      reason: 'Research is only allowed when goals are behind pace or pipeline coverage is thin. Current status: on track.',
    };
  }

  return {
    allowed: true,
    warnings: behindGoals.length > 0
      ? [`Research allowed: ${behindGoals.length} goals are behind pace`]
      : ['Research allowed: Pipeline coverage is thin'],
  };
}

/**
 * Policy 3: Rate limiting - prevent spam
 */
async function validateRateLimiting(
  action: ProposedAction,
  context: PolicyContext
): Promise<PolicyValidationResult> {
  // Implement per-contact rate limiting
  // For now, this is handled in the context builder (lastContactDays check)
  return { allowed: true };
}

/**
 * Policy 4: Sensitive action restrictions
 */
async function validateSensitiveActions(
  action: ProposedAction,
  context: PolicyContext
): Promise<PolicyValidationResult> {
  // Block certain action patterns that could be harmful
  const sensitivePatterns = [
    /delete/i,
    /remove/i,
    /cancel subscription/i,
    /refund/i,
    /terminate/i,
  ];

  const actionText = `${action.title} ${action.rationale}`;

  for (const pattern of sensitivePatterns) {
    if (pattern.test(actionText)) {
      return {
        allowed: false,
        policyId: 'sensitive-actions',
        policyName: 'Sensitive Action Restriction',
        reason: `Action contains sensitive operation pattern: ${pattern.toString()}. Requires manual approval.`,
      };
    }
  }

  return { allowed: true };
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate an action against all policies
 */
export async function validateActionPolicy(
  action: ProposedAction,
  context: PolicyContext
): Promise<PolicyValidationResult> {
  const validators = [
    validateNoHumanTasksUnlessRequested,
    validateResearchAfterExhaustion,
    validateRateLimiting,
    validateSensitiveActions,
  ];

  const allWarnings: string[] = [];

  for (const validator of validators) {
    const result = await validator(action, context);

    if (!result.allowed) {
      return result;
    }

    if (result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }

  return {
    allowed: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}

/**
 * Validate multiple actions at once
 */
export async function validateActionsBatch(
  actions: ProposedAction[],
  context: PolicyContext
): Promise<Map<string, PolicyValidationResult>> {
  const results = new Map<string, PolicyValidationResult>();

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const key = `${action.type}-${action.clientId}-${i}`;
    const result = await validateActionPolicy(action, context);
    results.set(key, result);
  }

  return results;
}

// ============================================================================
// Helper Functions
// ============================================================================

function isComplianceRelated(action: ProposedAction): boolean {
  const complianceKeywords = [
    'compliance',
    'quarterly review',
    'audit',
    'regulatory',
    'insurance',
    'license',
    'certification',
    'vendor check',
    'vendor compliance',
  ];

  const actionText = `${action.title} ${action.rationale}`.toLowerCase();

  return complianceKeywords.some((keyword) => actionText.includes(keyword));
}

function requiresSafetyEscalation(action: ProposedAction): boolean {
  const safetyKeywords = [
    'cannot proceed',
    'requires approval',
    'escalate',
    'urgent review',
    'legal',
    'dispute',
    'complaint',
    'threat',
    'emergency',
  ];

  const actionText = `${action.title} ${action.rationale}`.toLowerCase();

  return safetyKeywords.some((keyword) => actionText.includes(keyword));
}

function isPipelineThin(goalStatus: GoalStatus[]): boolean {
  // Consider pipeline thin if:
  // - Revenue goal is behind
  // - Order goal has large gap
  // - Less than 50% progress with more than 50% time elapsed

  for (const goal of goalStatus) {
    if (goal.metricType === 'revenue' || goal.metricType === 'orders') {
      const timeElapsedPct = 1 - goal.daysRemaining / 30; // Assume 30-day period
      const progressPct = goal.currentProgress / goal.targetValue;

      if (progressPct < timeElapsedPct * 0.8) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// Request Analysis
// ============================================================================

/**
 * Analyze inbound request to detect explicit asks
 */
export function analyzeInboundRequest(content: string, from: string): InboundRequest {
  const explicitAskPatterns = [
    /can you (call|phone|contact|reach out)/i,
    /please (call|schedule|set up|arrange)/i,
    /need (a call|to speak|to talk|a meeting)/i,
    /could you (send|provide|prepare|create|draft)/i,
    /would like (a call|to discuss|a quote|a proposal)/i,
    /requesting (a call|information|a quote)/i,
    /by (3pm|5pm|eod|end of day|tomorrow|monday|friday)/i,
    /deadline/i,
    /urgent/i,
    /asap/i,
  ];

  let hasExplicitAsk = false;
  let extractedAsk: string | undefined;

  for (const pattern of explicitAskPatterns) {
    const match = content.match(pattern);
    if (match) {
      hasExplicitAsk = true;
      extractedAsk = match[0];
      break;
    }
  }

  return {
    type: 'email',
    content,
    from,
    receivedAt: new Date(),
    hasExplicitAsk,
    extractedAsk,
  };
}
