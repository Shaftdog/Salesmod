/**
 * Autonomous Cycle - Plan → Act → React → Reflect hourly loop
 *
 * The core autonomous agent loop that runs hourly per tenant:
 * 1. PLAN: Pull goals, orders, engagement compliance, Gmail updates
 * 2. ACT: Execute policy-allowed actions
 * 3. REACT: Ingest outcomes (replies, bounces, order updates)
 * 4. REFLECT: Write run record with insights and next-hour hints
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  acquireTenantLock,
  releaseTenantLock,
  updateRunPhase,
  updateRunMetrics,
  markRunFailed,
  extendTenantLock,
  getNextCycleNumber,
} from './tenant-lock';
import { checkPolicies, buildPolicyContext } from './policy-engine';
import {
  getEngagementViolations,
  recordEngagementTouch,
  getEngagementStats,
} from './engagement-engine';
import { processNewOrders, getUnresolvedExceptions } from './order-processor';
import { isAgentEnabledForTenant, checkRateLimit } from './agent-config';
import { logCycleStart, logCycleEnd, logAction, evaluateAlerts } from './observability';

export interface CycleResult {
  success: boolean;
  runId: string | null;
  tenantId: string;
  cycleNumber: number;
  phase: string;
  metrics: CycleMetrics;
  error?: string;
}

export interface CycleMetrics {
  actionsPlanned: number;
  actionsExecuted: number;
  actionsBlocked: number;
  emailsSent: number;
  cardsCreated: number;
  durationMs: number;
}

export interface PlannedAction {
  type: string;
  priority: 'high' | 'medium' | 'low';
  targetId?: string; // client_id, contact_id, or order_id
  targetType?: 'client' | 'contact' | 'order';
  data: Record<string, unknown>;
  reason: string;
}

// ============================================================================
// Main Cycle Execution
// ============================================================================

/**
 * Execute a full autonomous cycle for a tenant
 */
export async function executeAutonomousCycle(
  tenantId: string,
  options: {
    timeout?: number; // Max duration in ms (default: 55 minutes)
    lockHolder?: string;
  } = {}
): Promise<CycleResult> {
  const startTime = Date.now();
  const timeout = options.timeout || 55 * 60 * 1000; // 55 minutes default
  const deadline = startTime + timeout;

  const metrics: CycleMetrics = {
    actionsPlanned: 0,
    actionsExecuted: 0,
    actionsBlocked: 0,
    emailsSent: 0,
    cardsCreated: 0,
    durationMs: 0,
  };

  // Check if agent is enabled for this tenant
  const isEnabled = await isAgentEnabledForTenant(tenantId);
  if (!isEnabled) {
    return {
      success: false,
      runId: null,
      tenantId,
      cycleNumber: 0,
      phase: 'blocked',
      metrics,
      error: 'Agent is disabled for this tenant',
    };
  }

  // Acquire lock
  const lockResult = await acquireTenantLock(
    tenantId,
    options.lockHolder || 'autonomous-cycle'
  );

  if (!lockResult.acquired || !lockResult.runId) {
    return {
      success: false,
      runId: null,
      tenantId,
      cycleNumber: 0,
      phase: 'locked',
      metrics,
      error: lockResult.reason || 'Failed to acquire lock',
    };
  }

  const runId = lockResult.runId;
  const cycleNumber = await getNextCycleNumber(tenantId);

  logCycleStart(tenantId, runId, cycleNumber);

  try {
    // ========================================================================
    // PHASE 1: PLAN
    // ========================================================================
    await updateRunPhase(runId, 'plan');
    const plannedActions = await executePlanPhase(tenantId, runId);
    metrics.actionsPlanned = plannedActions.length;

    // Check deadline
    if (Date.now() > deadline) {
      throw new Error('Cycle timeout during plan phase');
    }

    // Extend lock if we have many actions
    if (plannedActions.length > 20) {
      await extendTenantLock(tenantId, 30);
    }

    // ========================================================================
    // PHASE 2: ACT
    // ========================================================================
    await updateRunPhase(runId, 'act');
    const actResults = await executeActPhase(tenantId, runId, plannedActions, deadline);
    metrics.actionsExecuted = actResults.executed;
    metrics.actionsBlocked = actResults.blocked;
    metrics.emailsSent = actResults.emailsSent;
    metrics.cardsCreated = actResults.cardsCreated;

    // Check if too many errors occurred
    if (actResults.criticalErrors > 5) {
      console.error(`[AutonomousCycle] Act phase had ${actResults.criticalErrors} critical errors`);
    }

    // Check deadline
    if (Date.now() > deadline) {
      throw new Error('Cycle timeout during act phase');
    }

    // ========================================================================
    // PHASE 3: REACT
    // ========================================================================
    await updateRunPhase(runId, 'react');
    await executeReactPhase(tenantId, runId);

    // Check deadline
    if (Date.now() > deadline) {
      throw new Error('Cycle timeout during react phase');
    }

    // ========================================================================
    // PHASE 4: REFLECT
    // ========================================================================
    await updateRunPhase(runId, 'reflect');
    await executeReflectPhase(tenantId, runId, metrics);

    // Complete
    metrics.durationMs = Date.now() - startTime;
    await updateRunPhase(runId, 'completed');
    await updateRunMetrics(runId, metrics);
    await releaseTenantLock(tenantId, runId, 'completed');

    // Evaluate alerts
    await evaluateAlerts(tenantId);

    logCycleEnd(tenantId, runId, 'completed', metrics.durationMs, metrics);

    return {
      success: true,
      runId,
      tenantId,
      cycleNumber,
      phase: 'completed',
      metrics,
    };
  } catch (error) {
    metrics.durationMs = Date.now() - startTime;
    const errorMessage = (error as Error).message;

    await markRunFailed(runId, errorMessage);
    await releaseTenantLock(tenantId, runId, 'failed');

    logCycleEnd(tenantId, runId, 'failed', metrics.durationMs, metrics);

    return {
      success: false,
      runId,
      tenantId,
      cycleNumber,
      phase: 'failed',
      metrics,
      error: errorMessage,
    };
  }
}

// ============================================================================
// PLAN Phase
// ============================================================================

async function executePlanPhase(
  tenantId: string,
  runId: string
): Promise<PlannedAction[]> {
  const actions: PlannedAction[] = [];

  // 1. Check engagement violations (21-day rule)
  const violations = await getEngagementViolations(tenantId, 20);
  for (const v of violations) {
    actions.push({
      type: v.contactEmail ? 'send_email' : 'create_task',
      priority: v.daysOverdue > 14 ? 'high' : v.daysOverdue > 7 ? 'medium' : 'low',
      targetId: v.contactId || v.clientId || undefined,
      targetType: v.contactId ? 'contact' : 'client',
      data: {
        contactId: v.contactId,
        clientId: v.clientId,
        contactEmail: v.contactEmail,
        contactName: v.contactName,
        clientName: v.clientName,
        daysOverdue: v.daysOverdue,
      },
      reason: `Engagement overdue by ${v.daysOverdue} days`,
    });
  }

  // 2. Check new orders requiring processing
  const orderExceptions = await getUnresolvedExceptions(tenantId, 10);
  for (const e of orderExceptions) {
    if (e.severity === 'error' || e.severity === 'critical') {
      actions.push({
        type: 'create_task',
        priority: e.severity === 'critical' ? 'high' : 'medium',
        targetId: e.orderId,
        targetType: 'order',
        data: {
          orderId: e.orderId,
          exceptionType: e.exceptionType,
          message: e.message,
        },
        reason: `Order exception: ${e.message}`,
      });
    }
  }

  // 3. Check for approved cards waiting for execution
  const supabase = createServiceRoleClient();
  const { data: approvedCards } = await supabase
    .from('kanban_cards')
    .select('id, type, client_id, contact_id, title, priority')
    .eq('tenant_id', tenantId)
    .eq('state', 'approved')
    .limit(20);

  for (const card of approvedCards || []) {
    actions.push({
      type: 'execute_card',
      priority: card.priority === 'high' ? 'high' : card.priority === 'low' ? 'low' : 'medium',
      targetId: card.id,
      data: {
        cardId: card.id,
        cardType: card.type,
        clientId: card.client_id,
        contactId: card.contact_id,
      },
      reason: `Execute approved card: ${card.title}`,
    });
  }

  // 4. Check scheduled cards that are now due
  const { data: dueCards } = await supabase
    .from('kanban_cards')
    .select('id, type, client_id, contact_id, title, priority')
    .eq('tenant_id', tenantId)
    .eq('state', 'scheduled')
    .lte('due_at', new Date().toISOString())
    .limit(10);

  for (const card of dueCards || []) {
    actions.push({
      type: 'activate_scheduled_card',
      priority: 'medium',
      targetId: card.id,
      data: {
        cardId: card.id,
        cardType: card.type,
      },
      reason: `Scheduled card is now due: ${card.title}`,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  console.log(`[AutonomousCycle] Plan phase: ${actions.length} actions planned`);
  return actions;
}

// ============================================================================
// ACT Phase
// ============================================================================

async function executeActPhase(
  tenantId: string,
  runId: string,
  actions: PlannedAction[],
  deadline: number
): Promise<{
  executed: number;
  blocked: number;
  emailsSent: number;
  cardsCreated: number;
  criticalErrors: number;
}> {
  const results = {
    executed: 0,
    blocked: 0,
    emailsSent: 0,
    cardsCreated: 0,
    criticalErrors: 0,
  };

  const supabase = createServiceRoleClient();

  for (const action of actions) {
    // Check deadline
    if (Date.now() > deadline - 5000) {
      console.log('[AutonomousCycle] Approaching deadline, stopping act phase');
      break;
    }

    // Build policy context and check policies
    const policyContext = await buildPolicyContext(
      tenantId,
      runId,
      action.type,
      action.data
    );
    const policyResult = await checkPolicies(policyContext);

    if (!policyResult.allowed) {
      results.blocked++;
      logAction(tenantId, runId, action.type, false, {
        reason: policyResult.reason,
        policyType: policyResult.policyType,
      });
      continue;
    }

    try {
      // Execute based on action type
      switch (action.type) {
        case 'execute_card': {
          // Import executor dynamically to avoid circular deps
          const executorModule = await import('./executor');

          // Verify the function exists
          if (typeof executorModule.executeCard !== 'function') {
            console.error('[AutonomousCycle] executeCard function not found in executor module');
            logAction(tenantId, runId, action.type, false, {
              cardId: action.data.cardId,
              error: 'executeCard function not available',
            });
            break;
          }

          // Execute with 30-second timeout
          const cardResultPromise = executorModule.executeCard(action.data.cardId as string);
          const timeoutPromise = new Promise<{ success: false; message: string }>((resolve) =>
            setTimeout(() => resolve({ success: false, message: 'Card execution timeout (30s)' }), 30000)
          );

          const cardResult = await Promise.race([cardResultPromise, timeoutPromise]);

          if (cardResult.success) {
            results.executed++;
            if (['send_email', 'reply_to_email'].includes(action.data.cardType as string)) {
              results.emailsSent++;
            }

            // Record engagement touch
            if (action.data.contactId || action.data.clientId) {
              await recordEngagementTouch(
                tenantId,
                'email',
                'agent',
                action.data.clientId as string,
                action.data.contactId as string
              );
            }
          }
          logAction(tenantId, runId, action.type, cardResult.success, {
            cardId: action.data.cardId,
            message: cardResult.message,
          });
          break;
        }

        case 'activate_scheduled_card': {
          // Move scheduled card to suggested state
          await supabase
            .from('kanban_cards')
            .update({ state: 'suggested' })
            .eq('id', action.data.cardId);
          results.executed++;
          logAction(tenantId, runId, action.type, true, {
            cardId: action.data.cardId,
          });
          break;
        }

        case 'send_email': {
          // For engagement follow-ups, create a card instead of sending directly
          const { data: newCard } = await supabase
            .from('kanban_cards')
            .insert({
              tenant_id: tenantId,
              client_id: action.data.clientId,
              contact_id: action.data.contactId,
              type: 'follow_up',
              title: `Follow up with ${action.data.contactName || action.data.clientName}`,
              description: action.reason,
              rationale: `Engagement overdue by ${action.data.daysOverdue} days`,
              priority: action.priority,
              state: 'suggested',
              action_payload: {
                to: action.data.contactEmail,
                engagementFollowUp: true,
              },
            })
            .select()
            .single();

          if (newCard) {
            results.cardsCreated++;
          }
          results.executed++;
          logAction(tenantId, runId, action.type, true, {
            contactId: action.data.contactId,
          });
          break;
        }

        case 'create_task': {
          // For order exceptions, create a card for human review
          await supabase.from('kanban_cards').insert({
            tenant_id: tenantId,
            type: 'needs_human_response',
            title: `Review: ${action.data.message}`,
            description: `Order exception requires attention: ${action.data.exceptionType}`,
            rationale: action.reason,
            priority: action.priority,
            state: 'suggested',
            action_payload: action.data,
          });
          results.cardsCreated++;
          results.executed++;
          logAction(tenantId, runId, action.type, true, {
            orderId: action.data.orderId,
          });
          break;
        }

        default:
          console.warn(`[AutonomousCycle] Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`[AutonomousCycle] Action failed:`, error);
      results.criticalErrors++;
      logAction(tenantId, runId, action.type, false, {
        error: (error as Error).message,
      });
    }

    // Small delay between actions
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`[AutonomousCycle] Act phase: ${results.executed} executed, ${results.blocked} blocked, ${results.criticalErrors} errors`);

  // Fail the act phase if too many critical errors
  if (results.criticalErrors > 5) {
    throw new Error(`Too many critical errors during act phase: ${results.criticalErrors}`);
  }

  return results;
}

// ============================================================================
// REACT Phase
// ============================================================================

async function executeReactPhase(tenantId: string, runId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // 1. Process any new orders that came in
  const orderResults = await processNewOrders(tenantId);
  console.log(`[AutonomousCycle] React phase: processed ${orderResults.processed} orders`);

  // 2. Check for new Gmail messages (if Gmail sync is enabled)
  const { data: syncState } = await supabase
    .from('gmail_sync_state')
    .select('is_enabled, last_sync_at')
    .eq('tenant_id', tenantId)
    .single();

  if (syncState?.is_enabled) {
    // Note: Gmail polling happens in a separate cron job
    // Here we just note that we checked
    console.log(`[AutonomousCycle] Gmail sync enabled, last sync: ${syncState.last_sync_at}`);
  }

  // 3. Check for bounce/delivery notifications
  // This would integrate with webhook handling for email providers
  const { data: recentFailures } = await supabase
    .from('email_provider_failures')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

  if (recentFailures && recentFailures.length > 0) {
    console.log(`[AutonomousCycle] React phase: ${recentFailures.length} email failures in last hour`);
  }
}

// ============================================================================
// REFLECT Phase
// ============================================================================

async function executeReflectPhase(
  tenantId: string,
  runId: string,
  metrics: CycleMetrics
): Promise<void> {
  const supabase = createServiceRoleClient();

  // Get engagement stats for comparison
  const engagementStats = await getEngagementStats(tenantId);

  // Build reflection summary
  const changes: string[] = [];
  if (metrics.actionsExecuted > 0) {
    changes.push(`Executed ${metrics.actionsExecuted} actions`);
  }
  if (metrics.emailsSent > 0) {
    changes.push(`Sent ${metrics.emailsSent} emails`);
  }
  if (metrics.cardsCreated > 0) {
    changes.push(`Created ${metrics.cardsCreated} cards`);
  }
  if (metrics.actionsBlocked > 0) {
    changes.push(`Blocked ${metrics.actionsBlocked} actions by policy`);
  }

  // Identify blockers
  const blockers: string[] = [];
  if (engagementStats.overdueContacts > 10) {
    blockers.push(`${engagementStats.overdueContacts} overdue engagement contacts need attention`);
  }
  if (metrics.actionsBlocked > metrics.actionsExecuted) {
    blockers.push('More actions blocked than executed - check policy configuration');
  }

  // Generate next hour priorities
  const nextHourPriorities: string[] = [];
  if (engagementStats.overdueContacts > 0) {
    nextHourPriorities.push('Continue engagement follow-ups');
  }
  if (metrics.cardsCreated > 0) {
    nextHourPriorities.push('Review and approve new cards');
  }

  // Store reflection
  await supabase.from('agent_hourly_reflections').insert({
    tenant_id: tenantId,
    run_id: runId,
    summary: changes.length > 0 ? changes.join('. ') : 'No significant actions this cycle.',
    changes,
    metrics_delta: {
      engagementComplianceRate: engagementStats.complianceRate,
      overdueContacts: engagementStats.overdueContacts,
    },
    blockers,
    insights: [],
    next_hour_priorities: nextHourPriorities,
  });

  console.log(`[AutonomousCycle] Reflect phase: ${changes.length} changes recorded`);
}

// ============================================================================
// Batch Execution (for cron)
// ============================================================================

/**
 * Execute cycles for all enabled tenants
 */
export async function executeAllTenantCycles(
  options: {
    maxTenants?: number;
    perTenantTimeout?: number;
  } = {}
): Promise<{
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: CycleResult[];
}> {
  const supabase = createServiceRoleClient();
  const maxTenants = options.maxTenants || 50;
  const perTenantTimeout = options.perTenantTimeout || 50 * 60 * 1000; // 50 minutes

  // Get all enabled tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_active', true)
    .eq('agent_enabled', true)
    .limit(maxTenants);

  if (!tenants || tenants.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };
  }

  const results: CycleResult[] = [];
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    const result = await executeAutonomousCycle(tenant.id, {
      timeout: perTenantTimeout,
    });

    results.push(result);

    if (result.success) {
      successful++;
    } else if (result.phase === 'locked' || result.phase === 'blocked') {
      skipped++;
    } else {
      failed++;
    }
  }

  return {
    total: tenants.length,
    successful,
    failed,
    skipped,
    results,
  };
}
