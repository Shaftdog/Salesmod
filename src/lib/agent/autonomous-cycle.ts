/**
 * Autonomous Agent Cycle
 * Implements the hourly Plan → Act → React → Reflect loop
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { buildContext, AgentContext } from './context-builder';
import { generatePlan, AgentPlan, ProposedAction } from './planner';
import { executeCard, ExecutionResult } from './executor';
import { promoteScheduledCards } from './scheduler';
import { withTenantLock } from './tenant-lock';
import { validateActionPolicy, PolicyValidationResult } from './policy-engine';
import { getEngagementViolations, selectNextContactsToTouch } from './engagement-engine';

// ============================================================================
// Types
// ============================================================================

export interface PlanOutput {
  actionQueue: PrioritizedAction[];
  goalStatus: GoalStatus[];
  engagementViolations: EngagementViolation[];
  contextSnapshot: ContextSnapshot;
  planRationale: string;
}

export interface ActOutput {
  results: ActionResult[];
  summary: string;
  systemActionsExecuted: number;
  humanActionsCreated: number;
  blockers: Blocker[];
}

export interface ReactOutput {
  statusUpdates: StatusUpdate[];
  nextActions: DeferredAction[];
  metricChanges: MetricChange[];
}

export interface ReflectOutput {
  whatWeDid: string;
  whatMovedMetrics: Record<string, number>;
  whatGotBlocked: Blocker[];
  whatWeWillTryNext: DeferredAction[];
  hypotheses: Hypothesis[];
  insights: Insight[];
}

export interface WorkBlock {
  id: string;
  tenantId: string;
  cycleNumber: number;
  startedAt: Date;
  endedAt?: Date;
  currentPhase: 'plan' | 'act' | 'react' | 'reflect';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  planOutput?: PlanOutput;
  actOutput?: ActOutput;
  reactOutput?: ReactOutput;
  reflectOutput?: ReflectOutput;
  metrics: CycleMetrics;
}

export interface CycleMetrics {
  planDurationMs: number;
  actDurationMs: number;
  reactDurationMs: number;
  reflectDurationMs: number;
  totalDurationMs: number;
  actionsPlanned: number;
  actionsExecuted: number;
  actionsFailed: number;
  actionsBlocked: number;
  policyViolations: number;
  engagementTouchesCompleted: number;
}

interface PrioritizedAction extends ProposedAction {
  goalLink: string;
  policyValidation?: PolicyValidationResult;
}

interface GoalStatus {
  goalId: string;
  metricType: string;
  currentProgress: number;
  targetValue: number;
  gapToTarget: number;
  daysRemaining: number;
  status: 'on_track' | 'behind' | 'at_risk' | 'completed';
}

interface EngagementViolation {
  entityType: 'contact' | 'account' | 'client';
  entityId: string;
  entityName: string;
  daysSinceLastTouch: number;
  lastTouchType?: string;
  priority: number;
}

interface ContextSnapshot {
  timestamp: Date;
  clientCount: number;
  activeDealsCount: number;
  pendingOrdersCount: number;
  openCasesCount: number;
}

interface ActionResult {
  action: PrioritizedAction;
  success: boolean;
  error?: string;
  executionResult?: ExecutionResult;
  wasSystemAction: boolean;
}

interface Blocker {
  type: string;
  reason: string;
  actionTitle?: string;
  suggestedResolution?: string;
}

interface StatusUpdate {
  entityType: string;
  entityId: string;
  field: string;
  oldValue: any;
  newValue: any;
}

interface DeferredAction {
  action: ProposedAction;
  reason: string;
  scheduledFor?: Date;
}

interface MetricChange {
  metric: string;
  before: number;
  after: number;
  delta: number;
}

interface Hypothesis {
  observation: string;
  hypothesis: string;
  confidence: number;
  testPlan?: string;
}

interface Insight {
  type: string;
  description: string;
  evidence: any;
  recommendedAction?: string;
}

// ============================================================================
// Main Cycle Function
// ============================================================================

/**
 * Run a complete autonomous cycle for a tenant
 * This is the main entry point called by the cron job
 */
export async function runAutonomousCycle(tenantId: string): Promise<WorkBlock> {
  const result = await withTenantLock(tenantId, async () => {
    return await executeAutonomousCycle(tenantId);
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to acquire lock');
  }

  return result.result!;
}

/**
 * Execute the autonomous cycle (assumes lock is held)
 */
async function executeAutonomousCycle(tenantId: string): Promise<WorkBlock> {
  const supabase = createServiceRoleClient();
  const startTime = Date.now();

  // Get cycle number
  const cycleNumber = await getNextCycleNumber(tenantId);

  // Create work block record
  const { data: run, error: runError } = await supabase
    .from('agent_autonomous_runs')
    .insert({
      tenant_id: tenantId,
      cycle_number: cycleNumber,
      started_at: new Date().toISOString(),
      status: 'running',
      current_phase: 'plan',
    })
    .select()
    .single();

  if (runError || !run) {
    throw new Error(`Failed to create autonomous run: ${runError?.message}`);
  }

  const workBlock: WorkBlock = {
    id: run.id,
    tenantId,
    cycleNumber,
    startedAt: new Date(run.started_at),
    currentPhase: 'plan',
    status: 'running',
    metrics: {
      planDurationMs: 0,
      actDurationMs: 0,
      reactDurationMs: 0,
      reflectDurationMs: 0,
      totalDurationMs: 0,
      actionsPlanned: 0,
      actionsExecuted: 0,
      actionsFailed: 0,
      actionsBlocked: 0,
      policyViolations: 0,
      engagementTouchesCompleted: 0,
    },
  };

  try {
    // Get org_id for this tenant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1)
      .single();

    if (profileError || !profile) {
      throw new Error(`No profile found for tenant ${tenantId}: ${profileError?.message || 'Unknown error'}`);
    }

    const orgId = profile.id;

    // ========================================================================
    // PHASE 1: PLAN
    // ========================================================================
    console.log(`[Cycle ${cycleNumber}] Starting PLAN phase...`);
    const planStart = Date.now();

    await updatePhase(supabase, run.id, 'plan');

    // Promote scheduled cards first
    const promotedCount = await promoteScheduledCards(tenantId);
    if (promotedCount > 0) {
      console.log(`[Cycle ${cycleNumber}] Promoted ${promotedCount} scheduled cards`);
    }

    const planOutput = await planPhase(orgId, tenantId);
    workBlock.planOutput = planOutput;
    workBlock.metrics.planDurationMs = Date.now() - planStart;
    workBlock.metrics.actionsPlanned = planOutput.actionQueue.length;

    await supabase
      .from('agent_autonomous_runs')
      .update({ plan_output: planOutput })
      .eq('id', run.id);

    // ========================================================================
    // PHASE 2: ACT
    // ========================================================================
    console.log(`[Cycle ${cycleNumber}] Starting ACT phase...`);
    const actStart = Date.now();

    await updatePhase(supabase, run.id, 'act');

    const actOutput = await actPhase(orgId, tenantId, planOutput.actionQueue, run.id);
    workBlock.actOutput = actOutput;
    workBlock.metrics.actDurationMs = Date.now() - actStart;
    workBlock.metrics.actionsExecuted = actOutput.systemActionsExecuted;
    workBlock.metrics.actionsBlocked = actOutput.blockers.length;

    await supabase
      .from('agent_autonomous_runs')
      .update({ act_output: actOutput })
      .eq('id', run.id);

    // ========================================================================
    // PHASE 3: REACT
    // ========================================================================
    console.log(`[Cycle ${cycleNumber}] Starting REACT phase...`);
    const reactStart = Date.now();

    await updatePhase(supabase, run.id, 'react');

    const reactOutput = await reactPhase(tenantId, actOutput);
    workBlock.reactOutput = reactOutput;
    workBlock.metrics.reactDurationMs = Date.now() - reactStart;

    await supabase
      .from('agent_autonomous_runs')
      .update({ react_output: reactOutput })
      .eq('id', run.id);

    // ========================================================================
    // PHASE 4: REFLECT
    // ========================================================================
    console.log(`[Cycle ${cycleNumber}] Starting REFLECT phase...`);
    const reflectStart = Date.now();

    await updatePhase(supabase, run.id, 'reflect');

    const reflectOutput = await reflectPhase(tenantId, run.id, planOutput, actOutput, reactOutput);
    workBlock.reflectOutput = reflectOutput;
    workBlock.metrics.reflectDurationMs = Date.now() - reflectStart;

    await supabase
      .from('agent_autonomous_runs')
      .update({ reflect_output: reflectOutput })
      .eq('id', run.id);

    // ========================================================================
    // COMPLETE
    // ========================================================================
    workBlock.metrics.totalDurationMs = Date.now() - startTime;
    workBlock.status = 'completed';
    workBlock.endedAt = new Date();

    await supabase
      .from('agent_autonomous_runs')
      .update({
        status: 'completed',
        ended_at: workBlock.endedAt.toISOString(),
        metrics: workBlock.metrics,
        work_block: workBlock,
      })
      .eq('id', run.id);

    console.log(`[Cycle ${cycleNumber}] Completed in ${workBlock.metrics.totalDurationMs}ms`);
    console.log(`  - Actions: ${workBlock.metrics.actionsPlanned} planned, ${workBlock.metrics.actionsExecuted} executed`);

    return workBlock;
  } catch (error: any) {
    console.error(`[Cycle ${cycleNumber}] Failed:`, error);

    workBlock.status = 'failed';
    workBlock.endedAt = new Date();
    workBlock.metrics.totalDurationMs = Date.now() - startTime;

    await supabase
      .from('agent_autonomous_runs')
      .update({
        status: 'failed',
        ended_at: workBlock.endedAt.toISOString(),
        error_message: error.message,
        error_details: { stack: error.stack },
        metrics: workBlock.metrics,
      })
      .eq('id', run.id);

    throw error;
  }
}

// ============================================================================
// Phase Implementations
// ============================================================================

/**
 * PLAN Phase: Gather inputs and prioritize actions
 */
async function planPhase(orgId: string, tenantId: string): Promise<PlanOutput> {
  const supabase = createServiceRoleClient();

  // Build context
  const context = await buildContext(orgId);

  // Get engagement violations (21-day compliance)
  const engagementViolations = await getEngagementViolations(tenantId);

  // Get contacts that need touching
  const contactsToTouch = await selectNextContactsToTouch(tenantId, 10);

  // Generate AI plan
  const plan = await generatePlan(context);

  // Build goal status
  const goalStatus: GoalStatus[] = context.goals.map((g) => ({
    goalId: g.goal.id,
    metricType: g.goal.metricType,
    currentProgress: g.progress,
    targetValue: g.goal.targetValue,
    gapToTarget: g.gapToTarget,
    daysRemaining: g.daysRemaining,
    status:
      g.progress >= 100
        ? 'completed'
        : g.pressureScore > 0.7
          ? 'at_risk'
          : g.pressureScore > 0.4
            ? 'behind'
            : 'on_track',
  }));

  // Prioritize and validate actions against policy
  const actionQueue: PrioritizedAction[] = [];

  for (const action of plan.actions) {
    // Determine goal link
    const goalLink = determineGoalLink(action, goalStatus);

    // Validate against policy
    const policyValidation = await validateActionPolicy(action, {
      tenantId,
      engagementViolations,
      goalStatus,
    });

    const prioritizedAction: PrioritizedAction = {
      ...action,
      goalLink,
      policyValidation,
    };

    // Only add actions that pass policy validation
    if (policyValidation.allowed) {
      actionQueue.push(prioritizedAction);
    } else {
      console.log(`[Plan] Action blocked by policy: ${action.title} - ${policyValidation.reason}`);

      // Log policy violation
      await supabase.from('agent_policy_violations').insert({
        tenant_id: tenantId,
        policy_id: policyValidation.policyId || 'unknown',
        policy_name: policyValidation.policyName || 'Unknown Policy',
        action_type: action.type,
        action_data: action,
        violation_reason: policyValidation.reason || 'Policy violation',
        severity: 'warning',
        was_blocked: true,
      });
    }
  }

  // Add engagement-driven actions for overdue contacts
  for (const contact of contactsToTouch.slice(0, 5)) {
    // These are system-driven actions for engagement compliance
    const engagementAction: PrioritizedAction = {
      type: 'follow_up',
      clientId: contact.clientId,
      contactId: contact.contactId,
      priority: 'high',
      title: `21-day engagement: Follow up with ${contact.contactName}`,
      rationale: `Contact has not been touched in ${contact.daysSinceLastTouch} days (exceeds 21-day threshold)`,
      goalLink: 'engagement_compliance',
    };

    actionQueue.push(engagementAction);
  }

  // Sort by priority
  actionQueue.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return {
    actionQueue,
    goalStatus,
    engagementViolations: engagementViolations.map((v) => ({
      entityType: v.entityType as 'contact' | 'account' | 'client',
      entityId: v.entityId,
      entityName: v.entityName || 'Unknown',
      daysSinceLastTouch: v.daysOverdue + 21,
      lastTouchType: v.lastTouchType,
      priority: v.priority,
    })),
    contextSnapshot: {
      timestamp: new Date(),
      clientCount: context.clients.length,
      activeDealsCount: context.clients.reduce(
        (sum, c) => sum + (c.recentActivities?.filter((a: any) => a.activityType === 'deal').length || 0),
        0
      ),
      pendingOrdersCount: context.allOrders.filter((o) => o.status === 'pending').length,
      openCasesCount: context.cases.filter((c) => ['new', 'open', 'in_progress'].includes(c.status)).length,
    },
    planRationale: plan.summary,
  };
}

/**
 * ACT Phase: Execute prioritized actions
 */
async function actPhase(
  orgId: string,
  tenantId: string,
  actionQueue: PrioritizedAction[],
  runId: string
): Promise<ActOutput> {
  const supabase = createServiceRoleClient();
  const results: ActionResult[] = [];
  const blockers: Blocker[] = [];
  let systemActionsExecuted = 0;
  let humanActionsCreated = 0;

  // Classify and execute actions
  for (const action of actionQueue) {
    const isSystemAction = isAutonomousAction(action);

    try {
      if (isSystemAction) {
        // Execute system action directly
        const result = await executeSystemAction(orgId, tenantId, action, runId);
        results.push({
          action,
          success: result.success,
          error: result.error,
          executionResult: result,
          wasSystemAction: true,
        });

        if (result.success) {
          systemActionsExecuted++;
        }
      } else {
        // Create card for human review
        const cardId = await createCardForReview(orgId, tenantId, action, runId);
        results.push({
          action,
          success: true,
          wasSystemAction: false,
        });
        humanActionsCreated++;
      }
    } catch (error: any) {
      console.error(`[Act] Error executing action ${action.title}:`, error);
      results.push({
        action,
        success: false,
        error: error.message,
        wasSystemAction: isSystemAction,
      });

      blockers.push({
        type: 'execution_error',
        reason: error.message,
        actionTitle: action.title,
        suggestedResolution: 'Review error and retry',
      });
    }
  }

  // Also execute any previously approved cards
  const approvedResults = await executeApprovedCards(orgId, tenantId);
  systemActionsExecuted += approvedResults.filter((r) => r.success).length;

  return {
    results,
    summary: `Executed ${systemActionsExecuted} system actions, created ${humanActionsCreated} cards for review`,
    systemActionsExecuted,
    humanActionsCreated,
    blockers,
  };
}

/**
 * REACT Phase: Process outcomes and update state
 */
async function reactPhase(tenantId: string, actOutput: ActOutput): Promise<ReactOutput> {
  const supabase = createServiceRoleClient();
  const statusUpdates: StatusUpdate[] = [];
  const nextActions: DeferredAction[] = [];
  const metricChanges: MetricChange[] = [];

  // Update engagement clocks for successful touches
  for (const result of actOutput.results) {
    if (result.success && result.action.contactId) {
      const { error: clockError } = await supabase.rpc('update_engagement_clock', {
        p_tenant_id: tenantId,
        p_entity_type: 'contact',
        p_entity_id: result.action.contactId,
        p_touch_type: result.action.type,
        p_touch_by: 'agent',
      });

      if (clockError) {
        console.error('[React] Failed to update engagement clock:', clockError);
        continue;
      }

      statusUpdates.push({
        entityType: 'contact',
        entityId: result.action.contactId,
        field: 'last_touch_at',
        oldValue: null,
        newValue: new Date().toISOString(),
      });
    }
  }

  // Schedule follow-ups for actions that need them
  for (const result of actOutput.results) {
    if (result.success && result.action.type === 'send_email') {
      // Schedule follow-up if no reply in 3 days
      nextActions.push({
        action: {
          ...result.action,
          type: 'follow_up',
          title: `Follow up on: ${result.action.title}`,
          rationale: 'No response received within 3 days',
        },
        reason: 'Automated follow-up for sent email',
        scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });
    }
  }

  // Calculate metric changes (would need before/after snapshots)
  metricChanges.push({
    metric: 'emails_sent',
    before: 0,
    after: actOutput.systemActionsExecuted,
    delta: actOutput.systemActionsExecuted,
  });

  return {
    statusUpdates,
    nextActions,
    metricChanges,
  };
}

/**
 * REFLECT Phase: Write reflection record with insights
 */
async function reflectPhase(
  tenantId: string,
  runId: string,
  planOutput: PlanOutput,
  actOutput: ActOutput,
  reactOutput: ReactOutput
): Promise<ReflectOutput> {
  const supabase = createServiceRoleClient();

  // Summarize what we did
  const whatWeDid = `
Planned ${planOutput.actionQueue.length} actions based on ${planOutput.goalStatus.length} active goals.
Executed ${actOutput.systemActionsExecuted} system actions and created ${actOutput.humanActionsCreated} cards for human review.
${actOutput.blockers.length > 0 ? `Encountered ${actOutput.blockers.length} blockers.` : 'No blockers encountered.'}
`;

  // Summarize metric changes
  const whatMovedMetrics: Record<string, number> = {};
  for (const change of reactOutput.metricChanges) {
    whatMovedMetrics[change.metric] = change.delta;
  }

  // Generate hypotheses based on outcomes
  const hypotheses: Hypothesis[] = [];

  if (actOutput.blockers.length > 0) {
    hypotheses.push({
      observation: `${actOutput.blockers.length} actions were blocked`,
      hypothesis: 'There may be systematic issues preventing certain action types',
      confidence: 0.6,
      testPlan: 'Analyze blocker patterns over next 5 cycles',
    });
  }

  if (planOutput.engagementViolations.length > 5) {
    hypotheses.push({
      observation: `${planOutput.engagementViolations.length} contacts exceeded 21-day threshold`,
      hypothesis: 'Engagement capacity may be insufficient for contact base size',
      confidence: 0.7,
      testPlan: 'Increase touch actions per cycle',
    });
  }

  // Generate insights
  const insights: Insight[] = [];

  const successRate =
    actOutput.results.length > 0
      ? actOutput.results.filter((r) => r.success).length / actOutput.results.length
      : 1;

  if (successRate < 0.8) {
    insights.push({
      type: 'execution_quality',
      description: `Action success rate is ${(successRate * 100).toFixed(0)}%, below 80% threshold`,
      evidence: { successRate, totalActions: actOutput.results.length },
      recommendedAction: 'Review failed actions for common patterns',
    });
  }

  // Save reflection to database
  await supabase.from('agent_hourly_reflections').insert({
    tenant_id: tenantId,
    run_id: runId,
    cycle_hour: new Date().toISOString(),
    what_we_did: whatWeDid,
    actions_taken: actOutput.results.map((r) => ({
      title: r.action.title,
      type: r.action.type,
      success: r.success,
      error: r.error,
    })),
    what_moved_metrics: whatMovedMetrics,
    goal_progress: planOutput.goalStatus,
    what_got_blocked: actOutput.blockers,
    blocker_reasons: actOutput.blockers.map((b) => b.reason),
    what_we_will_try_next: reactOutput.nextActions.map((na) => na.action.title),
    deferred_actions: reactOutput.nextActions,
    hypotheses,
    insights,
  });

  return {
    whatWeDid: whatWeDid.trim(),
    whatMovedMetrics,
    whatGotBlocked: actOutput.blockers,
    whatWeWillTryNext: reactOutput.nextActions,
    hypotheses,
    insights,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getNextCycleNumber(tenantId: string): Promise<number> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('agent_autonomous_runs')
    .select('cycle_number')
    .eq('tenant_id', tenantId)
    .order('cycle_number', { ascending: false })
    .limit(1)
    .single();

  // If no previous runs exist, error is expected
  if (error && error.code !== 'PGRST116') {
    console.error('[Cycle] Error fetching cycle number:', error);
  }

  return (data?.cycle_number || 0) + 1;
}

async function updatePhase(supabase: any, runId: string, phase: string): Promise<void> {
  await supabase
    .from('agent_autonomous_runs')
    .update({
      current_phase: phase,
      phase_started_at: new Date().toISOString(),
    })
    .eq('id', runId);
}

function determineGoalLink(action: ProposedAction, goalStatus: GoalStatus[]): string {
  // Link actions to goals based on type
  if (action.type === 'send_email' || action.type === 'follow_up') {
    const revenueGoal = goalStatus.find((g) => g.metricType === 'revenue');
    if (revenueGoal && revenueGoal.status !== 'completed') {
      return `revenue_goal_${revenueGoal.goalId}`;
    }
    return 'engagement';
  }

  if (action.type === 'create_deal') {
    return 'pipeline_growth';
  }

  if (action.type === 'research') {
    return 'lead_generation';
  }

  return 'general';
}

function isAutonomousAction(action: ProposedAction): boolean {
  // System actions that can execute without human approval
  const autonomousTypes = ['research', 'send_email', 'follow_up'];

  // For now, only research is truly autonomous
  // Emails require approval unless auto-execute is enabled
  return action.type === 'research';
}

async function executeSystemAction(
  orgId: string,
  tenantId: string,
  action: PrioritizedAction,
  runId: string
): Promise<ExecutionResult> {
  const supabase = createServiceRoleClient();

  // Create card in 'approved' state for system actions
  const { data: card, error } = await supabase
    .from('kanban_cards')
    .insert({
      org_id: orgId,
      tenant_id: tenantId,
      run_id: runId,
      client_id: action.clientId,
      contact_id: action.contactId,
      type: action.type,
      title: action.title,
      rationale: action.rationale,
      priority: action.priority,
      state: 'approved', // Auto-approved for system actions
      action_payload: action.emailDraft || action.taskDetails || action.dealDetails || {},
      created_by: null, // Agent-created
    })
    .select()
    .single();

  if (error || !card) {
    return {
      success: false,
      cardId: '',
      message: 'Failed to create card',
      error: error?.message,
    };
  }

  // Execute the card
  return await executeCard(card.id);
}

async function createCardForReview(
  orgId: string,
  tenantId: string,
  action: PrioritizedAction,
  runId: string
): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data: card, error } = await supabase
    .from('kanban_cards')
    .insert({
      org_id: orgId,
      tenant_id: tenantId,
      run_id: runId,
      client_id: action.clientId,
      contact_id: action.contactId,
      type: action.type,
      title: action.title,
      rationale: action.rationale,
      priority: action.priority,
      state: 'suggested', // Needs human review
      action_payload: action.emailDraft || action.taskDetails || action.dealDetails || {},
      created_by: null,
    })
    .select()
    .single();

  if (error || !card) {
    throw new Error(`Failed to create card: ${error?.message}`);
  }

  return card.id;
}

async function executeApprovedCards(orgId: string, tenantId: string): Promise<ExecutionResult[]> {
  const supabase = createServiceRoleClient();

  const { data: approvedCards } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('state', 'approved')
    .order('priority', { ascending: false });

  if (!approvedCards || approvedCards.length === 0) {
    return [];
  }

  const results: ExecutionResult[] = [];

  for (const card of approvedCards) {
    try {
      const result = await executeCard(card.id);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      results.push({
        success: false,
        cardId: card.id,
        message: 'Execution error',
        error: error.message,
      });
    }
  }

  return results;
}
