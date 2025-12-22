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

// P1 Engine imports
import { getFeedbackDue, sendFeedbackRequest } from './feedback-engine';
import { detectStalledDeals, getDealFollowUpsDue, scheduleFollowUp } from './deals-engine';
import { getQuotesNeedingFollowUp, followUpQuote } from './bids-engine';
import { getUnactionedSignals, processEnrichmentQueue } from './contact-enricher';
import { getComplianceDue, sendComplianceReminder, escalateOverdueCompliance } from './compliance-engine';
import { getBroadcastsDue, getInProgressBroadcasts, processBroadcastBatch } from './broadcast-integration';

// P2 Engine imports
import { getInsightJobsDue, processInsightJob, type JobResult as InsightJobResult } from './insight-jobs';
import { captureEvent, EVENT_TYPES, EVENT_SOURCES } from './warehouse-writer';
import { getPendingSandboxJobs, runPendingExecution, type ExecutionResult as SandboxExecutionResult } from '@/lib/sandbox';
import { getPendingJobs as getBrowserJobsDue, executeJob as executeBrowserJob, type JobExecutionResult } from '@/lib/browser-automation';

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

  // =========================================================================
  // P1 ENGINE INTEGRATIONS
  // =========================================================================

  // P1.3: Feedback requests due (7 days post-delivery)
  try {
    const feedbackDue = await getFeedbackDue(tenantId, 10);
    for (const feedback of feedbackDue) {
      actions.push({
        type: 'send_feedback_request',
        priority: 'medium',
        targetId: feedback.id,
        targetType: 'order',
        data: {
          feedbackRequestId: feedback.id,
          orderId: feedback.orderId,
          clientId: feedback.clientId,
          contactId: feedback.contactId,
          contactEmail: feedback.contactEmail,
          deliveryDate: feedback.deliveryDate,
        },
        reason: `Feedback request due for order delivered on ${new Date(feedback.deliveryDate).toLocaleDateString()}`,
      });
    }
  } catch (err) {
    console.error('[AutonomousCycle] Error checking feedback due:', err);
  }

  // P1.4: Stalled deals needing follow-up
  try {
    const stalledDeals = await detectStalledDeals(tenantId, 10);
    for (const deal of stalledDeals) {
      actions.push({
        type: 'deal_follow_up',
        priority: deal.daysSinceActivity > 14 ? 'high' : 'medium',
        targetId: deal.dealId,
        data: {
          dealId: deal.dealId,
          title: deal.title,
          stage: deal.stage,
          clientId: deal.clientId,
          contactId: deal.contactId,
          contactEmail: deal.contactEmail,
          daysSinceActivity: deal.daysSinceActivity,
          value: deal.value,
        },
        reason: `Deal stalled for ${deal.daysSinceActivity} days (threshold: ${deal.stalledThreshold})`,
      });
    }

    // Also check deals with scheduled follow-ups that are now due
    const followUpsDue = await getDealFollowUpsDue(tenantId, 10);
    for (const deal of followUpsDue) {
      // Avoid duplicates with stalled deals
      if (!stalledDeals.some(s => s.dealId === deal.dealId)) {
        actions.push({
          type: 'deal_follow_up',
          priority: deal.followUpCount >= 3 ? 'high' : 'medium',
          targetId: deal.dealId,
          data: {
            dealId: deal.dealId,
            title: deal.title,
            stage: deal.stage,
            clientId: deal.clientId,
            contactId: deal.contactId,
            contactEmail: deal.contactEmail,
            followUpCount: deal.followUpCount,
            value: deal.value,
          },
          reason: `Scheduled follow-up #${deal.followUpCount + 1} is due`,
        });
      }
    }
  } catch (err) {
    console.error('[AutonomousCycle] Error checking stalled deals:', err);
  }

  // P1.5: Quotes needing follow-up
  try {
    const quotesDue = await getQuotesNeedingFollowUp(tenantId, 10);
    for (const quote of quotesDue) {
      actions.push({
        type: 'quote_follow_up',
        priority: quote.totalAmount > 10000 ? 'high' : 'medium',
        targetId: quote.quoteId,
        data: {
          quoteId: quote.quoteId,
          quoteNumber: quote.quoteNumber,
          title: quote.title,
          clientId: quote.clientId,
          contactId: quote.contactId,
          contactEmail: quote.contactEmail,
          totalAmount: quote.totalAmount,
          followUpCount: quote.followUpCount,
          daysSinceSent: quote.daysSinceSent,
        },
        reason: `Quote follow-up #${quote.followUpCount + 1} due (sent ${quote.daysSinceSent} days ago)`,
      });
    }
  } catch (err) {
    console.error('[AutonomousCycle] Error checking quotes due:', err);
  }

  // P1.6: Opportunity signals to action
  try {
    const signals = await getUnactionedSignals(tenantId, 5);
    for (const signal of signals) {
      actions.push({
        type: 'action_opportunity_signal',
        priority: signal.signalStrength > 0.7 ? 'high' : 'medium',
        targetId: signal.id,
        data: {
          signalId: signal.id,
          signalType: signal.signalType,
          signalStrength: signal.signalStrength,
          extractedText: signal.extractedText,
          sourceType: signal.sourceType,
          clientId: signal.clientId,
          contactId: signal.contactId,
        },
        reason: `Opportunity signal detected: ${signal.signalType} (strength: ${Math.round(signal.signalStrength * 100)}%)`,
      });
    }

    // Also process enrichment queue
    await processEnrichmentQueue(tenantId, 10);
  } catch (err) {
    console.error('[AutonomousCycle] Error checking opportunity signals:', err);
  }

  // P1.7: Compliance checks due
  try {
    const complianceDue = await getComplianceDue(tenantId, 10);
    for (const check of complianceDue) {
      const isOverdue = check.dueAt < new Date();
      const isEscalation = isOverdue && check.reminderCount >= 2;

      actions.push({
        type: isEscalation ? 'escalate_compliance' : 'compliance_reminder',
        priority: isOverdue ? 'high' : 'medium',
        targetId: check.id,
        data: {
          checkId: check.id,
          entityType: check.entityType,
          entityId: check.entityId,
          entityName: check.entityName,
          complianceType: check.complianceType,
          dueAt: check.dueAt,
          missingFields: check.missingFields,
          reminderCount: check.reminderCount,
        },
        reason: isEscalation
          ? `Compliance overdue - escalating (${check.reminderCount} reminders sent)`
          : `Compliance ${isOverdue ? 'overdue' : 'due soon'}: ${check.complianceType} for ${check.entityName}`,
      });
    }
  } catch (err) {
    console.error('[AutonomousCycle] Error checking compliance due:', err);
  }

  // P1.2: Scheduled broadcasts
  try {
    const broadcastsDue = await getBroadcastsDue(tenantId, 5);
    for (const broadcast of broadcastsDue) {
      actions.push({
        type: 'process_broadcast_batch',
        priority: 'medium',
        targetId: broadcast.campaignId,
        data: {
          campaignId: broadcast.campaignId,
          name: broadcast.name,
          totalRecipients: broadcast.totalRecipients,
          sentCount: broadcast.sentCount,
          remainingCount: broadcast.remainingCount,
        },
        reason: `Scheduled broadcast ready: ${broadcast.name} (${broadcast.remainingCount} remaining)`,
      });
    }

    // Also check in-progress broadcasts
    const inProgress = await getInProgressBroadcasts(tenantId, 5);
    for (const broadcast of inProgress) {
      // Avoid duplicates
      if (!broadcastsDue.some(b => b.campaignId === broadcast.campaignId)) {
        actions.push({
          type: 'process_broadcast_batch',
          priority: 'low',
          targetId: broadcast.campaignId,
          data: {
            campaignId: broadcast.campaignId,
            name: broadcast.name,
            totalRecipients: broadcast.totalRecipients,
            sentCount: broadcast.sentCount,
            remainingCount: broadcast.remainingCount,
          },
          reason: `Continue broadcast: ${broadcast.name} (${broadcast.remainingCount} remaining)`,
        });
      }
    }
  } catch (err) {
    console.error('[AutonomousCycle] Error checking broadcasts:', err);
  }

  // =========================================================================
  // P2 ENGINE INTEGRATIONS
  // =========================================================================

  // P2.1: Insight jobs due (hourly, daily, weekly)
  try {
    const insightJobs = await getInsightJobsDue(tenantId, 5);
    for (const job of insightJobs) {
      actions.push({
        type: 'process_insight_job',
        priority: job.jobType === 'weekly_playbook' ? 'low' : 'medium',
        targetId: job.id,
        data: {
          jobId: job.id,
          jobType: job.jobType,
          scheduledFor: job.scheduledFor,
        },
        reason: `Insight job due: ${job.jobType}`,
      });
    }
  } catch (err) {
    console.error('[AutonomousCycle] Error checking insight jobs:', err);
  }

  // P2.2: Pending sandbox jobs
  try {
    const sandboxJobs = await getPendingSandboxJobs(tenantId, 3);
    for (const job of sandboxJobs) {
      actions.push({
        type: 'execute_sandbox_job',
        priority: 'medium',
        targetId: job.id,
        data: {
          executionId: job.id,
          templateName: job.templateName,
          inputParams: job.inputParams,
        },
        reason: `Sandbox job pending: ${job.templateName}`,
      });
    }
  } catch (err) {
    console.error('[AutonomousCycle] Error checking sandbox jobs:', err);
  }

  // P2.3: Browser automation jobs (approved only)
  try {
    const browserJobs = await getBrowserJobsDue(tenantId, 2);
    for (const job of browserJobs) {
      // Only process approved jobs
      if (job.status === 'approved') {
        actions.push({
          type: 'execute_browser_job',
          priority: job.jobType === 'accept_order' ? 'high' : 'medium',
          targetId: job.id,
          data: {
            jobId: job.id,
            jobType: job.jobType,
            portalConfigId: job.portalConfigId,
            parameters: job.parameters,
          },
          reason: `Browser job approved: ${job.jobType}`,
        });
      }
    }
  } catch (err) {
    console.error('[AutonomousCycle] Error checking browser jobs:', err);
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
          // For engagement follow-ups, create a card with email content
          const contactName = (action.data.contactName || action.data.clientName || 'there') as string;
          const firstName = contactName.split(' ')[0];
          const companyName = (action.data.clientName || 'your company') as string;
          const daysOverdue = (action.data.daysOverdue || 0) as number;

          // Generate engagement follow-up email content
          const emailSubject = `Checking in - ${companyName}`;
          let emailBody: string;

          if (daysOverdue >= 21) {
            // Long overdue - more direct
            emailBody = `<p>Hi ${firstName},</p>
<p>It's been a while since we last connected, and I wanted to reach out to see how things are going with ${companyName}.</p>
<p>I'd love to catch up and learn about any upcoming appraisal needs you might have. Even if you don't have anything immediate, I'm happy to be a resource.</p>
<p>Would you have a few minutes for a quick call this week?</p>
<p>Best regards</p>`;
          } else if (daysOverdue >= 14) {
            // Moderately overdue
            emailBody = `<p>Hi ${firstName},</p>
<p>I hope this message finds you well. I realized it's been a couple of weeks since we last touched base, and I wanted to check in.</p>
<p>Is there anything I can help you with regarding appraisals or any questions you might have? I'm here to help.</p>
<p>Looking forward to hearing from you.</p>
<p>Best regards</p>`;
          } else {
            // Recently overdue
            emailBody = `<p>Hi ${firstName},</p>
<p>Just wanted to quickly touch base and see how things are going. Is there anything I can assist you with?</p>
<p>Feel free to reach out if you have any appraisal needs or questions.</p>
<p>Best regards</p>`;
          }

          const { data: newCard } = await supabase
            .from('kanban_cards')
            .insert({
              tenant_id: tenantId,
              client_id: action.data.clientId,
              contact_id: action.data.contactId,
              type: 'send_email',
              title: `Follow up with ${contactName}`,
              description: action.reason,
              rationale: `Engagement overdue by ${daysOverdue} days`,
              priority: action.priority,
              state: 'suggested',
              action_payload: {
                to: action.data.contactEmail,
                subject: emailSubject,
                body: emailBody,
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

        // P1.3: Feedback requests
        case 'send_feedback_request': {
          const feedbackResult = await sendFeedbackRequest(action.data.feedbackRequestId as string);
          if (feedbackResult.success) {
            results.executed++;
            results.cardsCreated++;
          }
          logAction(tenantId, runId, action.type, feedbackResult.success, {
            feedbackRequestId: action.data.feedbackRequestId,
            message: feedbackResult.message,
          });
          break;
        }

        // P1.4: Deal follow-ups
        case 'deal_follow_up': {
          const dealResult = await scheduleFollowUp(action.data.dealId as string);
          if (dealResult.success) {
            results.executed++;
            results.cardsCreated++;
          }
          logAction(tenantId, runId, action.type, dealResult.success, {
            dealId: action.data.dealId,
            message: dealResult.message,
            cardId: dealResult.cardId,
          });
          break;
        }

        // P1.5: Quote follow-ups
        case 'quote_follow_up': {
          const quoteResult = await followUpQuote(action.data.quoteId as string);
          if (quoteResult.success) {
            results.executed++;
            results.cardsCreated++;
          }
          logAction(tenantId, runId, action.type, quoteResult.success, {
            quoteId: action.data.quoteId,
            message: quoteResult.message,
            cardId: quoteResult.cardId,
          });
          break;
        }

        // P1.6: Opportunity signals (creates follow-up card)
        case 'action_opportunity_signal': {
          // Create a card for the opportunity signal
          const { data: signalCard } = await supabase
            .from('kanban_cards')
            .insert({
              tenant_id: tenantId,
              type: 'follow_up',
              title: `Opportunity: ${action.data.signalType}`,
              description: `Detected opportunity signal: ${action.data.extractedText}`,
              rationale: action.reason,
              priority: action.priority,
              state: 'suggested',
              client_id: action.data.clientId || null,
              contact_id: action.data.contactId || null,
              action_payload: {
                signalId: action.data.signalId,
                signalType: action.data.signalType,
                sourceType: action.data.sourceType,
              },
            })
            .select('id')
            .single();

          // Mark signal as actioned
          if (signalCard) {
            await supabase
              .from('opportunity_signals')
              .update({ actioned: true })
              .eq('id', action.data.signalId);
            results.cardsCreated++;
          }
          results.executed++;
          logAction(tenantId, runId, action.type, true, {
            signalId: action.data.signalId,
            cardId: signalCard?.id,
          });
          break;
        }

        // P1.7: Compliance reminders
        case 'compliance_reminder': {
          const reminderResult = await sendComplianceReminder(action.data.checkId as string);
          if (reminderResult.success) {
            results.executed++;
            results.cardsCreated++;
          }
          logAction(tenantId, runId, action.type, reminderResult.success, {
            checkId: action.data.checkId,
            message: reminderResult.message,
          });
          break;
        }

        case 'escalate_compliance': {
          const escalateResult = await escalateOverdueCompliance(action.data.checkId as string);
          if (escalateResult.success) {
            results.executed++;
            results.cardsCreated++;
          }
          logAction(tenantId, runId, action.type, escalateResult.success, {
            checkId: action.data.checkId,
            message: escalateResult.message,
          });
          break;
        }

        // P1.2: Broadcast batch processing
        case 'process_broadcast_batch': {
          const batchResult = await processBroadcastBatch(action.data.campaignId as string, 50);
          if (batchResult.success) {
            results.executed++;
            results.emailsSent += batchResult.sentCount;
          }
          logAction(tenantId, runId, action.type, batchResult.success, {
            campaignId: action.data.campaignId,
            sentCount: batchResult.sentCount,
            failedCount: batchResult.failedCount,
          });
          break;
        }

        // =====================================================================
        // P2 ENGINE ACTIONS
        // =====================================================================

        // P2.1: Process insight job
        case 'process_insight_job': {
          const insightResult = await processInsightJob(action.data.jobId as string);
          if (insightResult.success) {
            results.executed++;

            // Capture event to warehouse
            await captureEvent(tenantId, {
              eventType: EVENT_TYPES.SANDBOX_EXECUTED,
              eventSource: EVENT_SOURCES.AUTONOMOUS_CYCLE,
              payload: {
                jobId: action.data.jobId,
                jobType: action.data.jobType,
                summary: insightResult.summary,
              },
              runId,
            });
          }
          logAction(tenantId, runId, action.type, insightResult.success, {
            jobId: action.data.jobId,
            jobType: action.data.jobType,
            error: insightResult.error,
          });
          break;
        }

        // P2.2: Execute sandbox job
        case 'execute_sandbox_job': {
          const sandboxResult = await runPendingExecution(tenantId, action.data.executionId as string);
          if (sandboxResult.success) {
            results.executed++;

            // Capture event to warehouse
            await captureEvent(tenantId, {
              eventType: EVENT_TYPES.SANDBOX_EXECUTED,
              eventSource: EVENT_SOURCES.SANDBOX,
              payload: {
                executionId: action.data.executionId,
                templateName: action.data.templateName,
                outputData: sandboxResult.outputData,
              },
              runId,
            });
          }
          logAction(tenantId, runId, action.type, sandboxResult.success, {
            executionId: action.data.executionId,
            templateName: action.data.templateName,
            error: sandboxResult.error,
          });
          break;
        }

        // P2.3: Execute browser automation job
        case 'execute_browser_job': {
          const browserResult = await executeBrowserJob(tenantId, action.data.jobId as string);
          if (browserResult.success) {
            results.executed++;

            // Capture event to warehouse
            await captureEvent(tenantId, {
              eventType: EVENT_TYPES.BROWSER_JOB_COMPLETED,
              eventSource: EVENT_SOURCES.BROWSER_AUTOMATION,
              payload: {
                jobId: action.data.jobId,
                jobType: action.data.jobType,
                extractedData: browserResult.result?.data,
                screenshots: browserResult.screenshots?.length || 0,
              },
              runId,
            });
          }
          logAction(tenantId, runId, action.type, browserResult.success, {
            jobId: action.data.jobId,
            jobType: action.data.jobType,
            error: browserResult.error,
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
