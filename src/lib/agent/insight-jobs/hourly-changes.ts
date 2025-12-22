/**
 * P2.1: Hourly Changes Insight Job
 * Analyzes changes since last hour and detects immediate patterns
 */

import { queryEvents, getEventStats, type WarehouseEventRecord } from '../warehouse-writer';
import { detectPatterns } from '../pattern-detector';
import { generateRecommendations, getCriticalRecommendations } from '../strategy-recommender';
import type { JobResult } from './index';

// ============================================================================
// Types
// ============================================================================

interface HourlyChangeSummary {
  period: {
    start: string;
    end: string;
  };
  eventCounts: Record<string, number>;
  keyChanges: KeyChange[];
  alerts: Alert[];
  metrics: HourlyMetrics;
}

interface KeyChange {
  category: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  value?: number;
  previousValue?: number;
}

interface Alert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  source: string;
}

interface HourlyMetrics {
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  cardsExecuted: number;
  cardsFailed: number;
  ordersCreated: number;
  dealsAdvanced: number;
}

// ============================================================================
// Main Processing Function
// ============================================================================

/**
 * Process hourly changes for a tenant
 */
export async function processHourlyChanges(tenantId: string): Promise<JobResult> {
  const endTime = new Date();
  const startTime = new Date(endTime);
  startTime.setHours(startTime.getHours() - 1);

  try {
    // Get events from the last hour
    const events = await queryEvents(tenantId, {
      startDate: startTime,
      endDate: endTime,
      limit: 1000,
    });

    if (events.length === 0) {
      return {
        success: true,
        eventsProcessed: 0,
        patternsDetected: 0,
        recommendationsCreated: 0,
        summary: {
          message: 'No events in the last hour',
          period: {
            start: startTime.toISOString(),
            end: endTime.toISOString(),
          },
        },
      };
    }

    // Analyze events
    const eventCounts = countEventsByType(events);
    const metrics = calculateMetrics(events);
    const keyChanges = identifyKeyChanges(events, metrics);
    const alerts = generateAlerts(events, metrics);

    // Run pattern detection (will process unprocessed events)
    const patternResult = await detectPatterns(tenantId, {
      windowHours: 1,
      limit: 500,
    });

    // Generate recommendations from patterns
    const recResult = await generateRecommendations(tenantId);

    // Check for critical recommendations
    const criticalRecs = await getCriticalRecommendations(tenantId);

    // Build summary
    const summary: HourlyChangeSummary = {
      period: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      },
      eventCounts,
      keyChanges,
      alerts,
      metrics,
    };

    // Add critical alerts to summary
    if (criticalRecs.length > 0) {
      for (const rec of criticalRecs) {
        alerts.push({
          severity: 'critical',
          message: rec.title,
          source: 'recommendations',
        });
      }
    }

    return {
      success: true,
      eventsProcessed: events.length,
      patternsDetected: patternResult.patternsDetected,
      recommendationsCreated: recResult.recommendationsCreated,
      summary: summary as unknown as Record<string, unknown>,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      eventsProcessed: 0,
      patternsDetected: 0,
      recommendationsCreated: 0,
      summary: {},
      error: errorMessage,
    };
  }
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Count events by type
 */
function countEventsByType(events: WarehouseEventRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const event of events) {
    counts[event.eventType] = (counts[event.eventType] || 0) + 1;
  }

  return counts;
}

/**
 * Calculate hourly metrics
 */
function calculateMetrics(events: WarehouseEventRecord[]): HourlyMetrics {
  return {
    emailsSent: events.filter(e => e.eventType === 'email_sent').length,
    emailsOpened: events.filter(e => e.eventType === 'email_opened').length,
    emailsReplied: events.filter(e => e.eventType === 'email_replied').length,
    cardsExecuted: events.filter(e => e.eventType === 'card_executed').length,
    cardsFailed: events.filter(e => e.eventType === 'card_failed').length,
    ordersCreated: events.filter(e => e.eventType === 'order_created').length,
    dealsAdvanced: events.filter(e => e.eventType === 'deal_stage_changed').length,
  };
}

/**
 * Identify key changes worth highlighting
 */
function identifyKeyChanges(
  events: WarehouseEventRecord[],
  metrics: HourlyMetrics
): KeyChange[] {
  const changes: KeyChange[] = [];

  // Email activity
  if (metrics.emailsSent > 0) {
    const replyRate = metrics.emailsReplied / metrics.emailsSent;
    changes.push({
      category: 'email',
      description: `${metrics.emailsSent} emails sent, ${metrics.emailsReplied} replies received`,
      impact: replyRate > 0.1 ? 'positive' : replyRate > 0.05 ? 'neutral' : 'negative',
      value: Math.round(replyRate * 100),
    });
  }

  // Card execution
  if (metrics.cardsExecuted > 0 || metrics.cardsFailed > 0) {
    const total = metrics.cardsExecuted + metrics.cardsFailed;
    const successRate = metrics.cardsExecuted / total;
    changes.push({
      category: 'automation',
      description: `${metrics.cardsExecuted}/${total} cards executed successfully`,
      impact: successRate > 0.9 ? 'positive' : successRate > 0.7 ? 'neutral' : 'negative',
      value: Math.round(successRate * 100),
    });
  }

  // Orders
  if (metrics.ordersCreated > 0) {
    changes.push({
      category: 'orders',
      description: `${metrics.ordersCreated} new orders created`,
      impact: 'positive',
      value: metrics.ordersCreated,
    });
  }

  // Deals
  if (metrics.dealsAdvanced > 0) {
    changes.push({
      category: 'deals',
      description: `${metrics.dealsAdvanced} deals advanced to new stage`,
      impact: 'positive',
      value: metrics.dealsAdvanced,
    });
  }

  // Won deals
  const dealsWon = events.filter(e => e.eventType === 'deal_won').length;
  if (dealsWon > 0) {
    changes.push({
      category: 'deals',
      description: `${dealsWon} deals won`,
      impact: 'positive',
      value: dealsWon,
    });
  }

  // Lost deals
  const dealsLost = events.filter(e => e.eventType === 'deal_lost').length;
  if (dealsLost > 0) {
    changes.push({
      category: 'deals',
      description: `${dealsLost} deals lost`,
      impact: 'negative',
      value: dealsLost,
    });
  }

  return changes;
}

/**
 * Generate alerts based on events
 */
function generateAlerts(
  events: WarehouseEventRecord[],
  metrics: HourlyMetrics
): Alert[] {
  const alerts: Alert[] = [];

  // High failure rate alert
  const totalCards = metrics.cardsExecuted + metrics.cardsFailed;
  if (totalCards >= 5) {
    const failureRate = metrics.cardsFailed / totalCards;
    if (failureRate > 0.3) {
      alerts.push({
        severity: 'critical',
        message: `High card failure rate: ${Math.round(failureRate * 100)}%`,
        source: 'automation',
      });
    } else if (failureRate > 0.15) {
      alerts.push({
        severity: 'warning',
        message: `Elevated card failure rate: ${Math.round(failureRate * 100)}%`,
        source: 'automation',
      });
    }
  }

  // Email bounce alert
  const emailBounces = events.filter(e => e.eventType === 'email_bounced').length;
  if (metrics.emailsSent >= 5 && emailBounces > 0) {
    const bounceRate = emailBounces / metrics.emailsSent;
    if (bounceRate > 0.1) {
      alerts.push({
        severity: 'warning',
        message: `High email bounce rate: ${Math.round(bounceRate * 100)}%`,
        source: 'email',
      });
    }
  }

  // Policy blocks alert
  const policyBlocks = events.filter(e => e.eventType === 'card_blocked').length;
  if (policyBlocks > 5) {
    alerts.push({
      severity: 'warning',
      message: `${policyBlocks} actions blocked by policy`,
      source: 'policy',
    });
  }

  // Cycle failures
  const cycleFailed = events.filter(e => e.eventType === 'cycle_failed').length;
  if (cycleFailed > 0) {
    alerts.push({
      severity: 'critical',
      message: `${cycleFailed} autonomous cycle failures`,
      source: 'cycle',
    });
  }

  // Negative feedback
  const negativeFeedback = events.filter(e => e.eventType === 'feedback_negative').length;
  if (negativeFeedback > 0) {
    alerts.push({
      severity: 'warning',
      message: `${negativeFeedback} negative feedback received`,
      source: 'feedback',
    });
  }

  return alerts;
}
