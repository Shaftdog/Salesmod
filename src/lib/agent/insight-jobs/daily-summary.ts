/**
 * P2.1: Daily Summary Insight Job
 * Generates daily rollup of activity and metrics
 */

import { queryEvents, getEventStats, type WarehouseEventRecord } from '../warehouse-writer';
import { detectPatterns, getActionablePatterns } from '../pattern-detector';
import { generateRecommendations, getPendingRecommendations } from '../strategy-recommender';
import type { JobResult } from './index';

// ============================================================================
// Types
// ============================================================================

interface DailySummary {
  date: string;
  period: {
    start: string;
    end: string;
  };
  highlights: Highlight[];
  metrics: DailyMetrics;
  comparisons: MetricComparison[];
  topClients: ClientActivity[];
  actionableInsights: ActionableInsight[];
}

interface Highlight {
  category: string;
  title: string;
  description: string;
  icon: string;
  trend: 'up' | 'down' | 'stable';
}

interface DailyMetrics {
  totalEvents: number;
  emailActivity: {
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    openRate: number;
    replyRate: number;
  };
  automation: {
    cardsCreated: number;
    cardsExecuted: number;
    cardsFailed: number;
    cardsBlocked: number;
    successRate: number;
  };
  business: {
    ordersCreated: number;
    ordersCompleted: number;
    dealsCreated: number;
    dealsWon: number;
    dealsLost: number;
    quotesCreated: number;
    quotesAccepted: number;
    quotesRejected: number;
  };
  engagement: {
    contactsTouched: number;
    avgResponseTime: number;
    complianceRate: number;
  };
}

interface MetricComparison {
  metric: string;
  today: number;
  yesterday: number;
  weekAgo: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

interface ClientActivity {
  clientId: string;
  eventCount: number;
  ordersCreated: number;
  emailsSent: number;
  engagementScore: number;
}

interface ActionableInsight {
  priority: 'high' | 'medium' | 'low';
  insight: string;
  suggestedAction: string;
  relatedPatternId?: string;
}

// ============================================================================
// Main Processing Function
// ============================================================================

/**
 * Process daily summary for a tenant
 */
export async function processDailySummary(tenantId: string): Promise<JobResult> {
  const endTime = new Date();
  endTime.setHours(0, 0, 0, 0); // Start of today

  const startTime = new Date(endTime);
  startTime.setDate(startTime.getDate() - 1); // Start of yesterday

  try {
    // Get yesterday's events
    const events = await queryEvents(tenantId, {
      startDate: startTime,
      endDate: endTime,
      limit: 5000,
    });

    // Get comparison data
    const weekAgoStart = new Date(startTime);
    weekAgoStart.setDate(weekAgoStart.getDate() - 6);
    const weekAgoEnd = new Date(startTime);
    weekAgoEnd.setDate(weekAgoEnd.getDate() - 5);

    const weekAgoEvents = await queryEvents(tenantId, {
      startDate: weekAgoStart,
      endDate: weekAgoEnd,
      limit: 5000,
    });

    // Calculate metrics
    const metrics = calculateDailyMetrics(events);
    const weekAgoMetrics = calculateDailyMetrics(weekAgoEvents);

    // Generate comparisons
    const comparisons = generateComparisons(metrics, weekAgoMetrics);

    // Get top clients
    const topClients = getTopClients(events);

    // Generate highlights
    const highlights = generateHighlights(metrics, comparisons);

    // Run pattern detection
    const patternResult = await detectPatterns(tenantId, {
      windowHours: 24,
      limit: 2000,
    });

    // Generate recommendations
    const recResult = await generateRecommendations(tenantId);

    // Get actionable insights
    const patterns = await getActionablePatterns(tenantId, 10);
    const recommendations = await getPendingRecommendations(tenantId, 10);
    const actionableInsights = generateActionableInsights(patterns, recommendations);

    // Build summary
    const summary: DailySummary = {
      date: startTime.toISOString().split('T')[0],
      period: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      },
      highlights,
      metrics,
      comparisons,
      topClients,
      actionableInsights,
    };

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
 * Calculate daily metrics from events
 */
function calculateDailyMetrics(events: WarehouseEventRecord[]): DailyMetrics {
  const emailSent = events.filter(e => e.eventType === 'email_sent').length;
  const emailOpened = events.filter(e => e.eventType === 'email_opened').length;
  const emailClicked = events.filter(e => e.eventType === 'email_clicked').length;
  const emailReplied = events.filter(e => e.eventType === 'email_replied').length;
  const emailBounced = events.filter(e => e.eventType === 'email_bounced').length;

  const cardsCreated = events.filter(e => e.eventType === 'card_created').length;
  const cardsExecuted = events.filter(e => e.eventType === 'card_executed').length;
  const cardsFailed = events.filter(e => e.eventType === 'card_failed').length;
  const cardsBlocked = events.filter(e => e.eventType === 'card_blocked').length;

  const ordersCreated = events.filter(e => e.eventType === 'order_created').length;
  const ordersCompleted = events.filter(e => e.eventType === 'order_completed').length;
  const dealsCreated = events.filter(e => e.eventType === 'deal_created').length;
  const dealsWon = events.filter(e => e.eventType === 'deal_won').length;
  const dealsLost = events.filter(e => e.eventType === 'deal_lost').length;
  const quotesCreated = events.filter(e => e.eventType === 'quote_created').length;
  const quotesAccepted = events.filter(e => e.eventType === 'quote_accepted').length;
  const quotesRejected = events.filter(e => e.eventType === 'quote_rejected').length;

  // Get unique contacts touched
  const contactsTouched = new Set(
    events.filter(e => e.contactId).map(e => e.contactId)
  ).size;

  return {
    totalEvents: events.length,
    emailActivity: {
      sent: emailSent,
      opened: emailOpened,
      clicked: emailClicked,
      replied: emailReplied,
      bounced: emailBounced,
      openRate: emailSent > 0 ? Math.round((emailOpened / emailSent) * 100) : 0,
      replyRate: emailSent > 0 ? Math.round((emailReplied / emailSent) * 100) : 0,
    },
    automation: {
      cardsCreated,
      cardsExecuted,
      cardsFailed,
      cardsBlocked,
      successRate: cardsExecuted + cardsFailed > 0
        ? Math.round((cardsExecuted / (cardsExecuted + cardsFailed)) * 100)
        : 100,
    },
    business: {
      ordersCreated,
      ordersCompleted,
      dealsCreated,
      dealsWon,
      dealsLost,
      quotesCreated,
      quotesAccepted,
      quotesRejected,
    },
    engagement: {
      contactsTouched,
      avgResponseTime: 0, // Would need to calculate from event payload timestamps
      complianceRate: 0, // Would need to check engagement clocks
    },
  };
}

/**
 * Generate metric comparisons
 */
function generateComparisons(
  today: DailyMetrics,
  weekAgo: DailyMetrics
): MetricComparison[] {
  const comparisons: MetricComparison[] = [];

  // Email metrics
  comparisons.push(createComparison('Emails Sent', today.emailActivity.sent, weekAgo.emailActivity.sent));
  comparisons.push(createComparison('Open Rate %', today.emailActivity.openRate, weekAgo.emailActivity.openRate));
  comparisons.push(createComparison('Reply Rate %', today.emailActivity.replyRate, weekAgo.emailActivity.replyRate));

  // Automation metrics
  comparisons.push(createComparison('Cards Executed', today.automation.cardsExecuted, weekAgo.automation.cardsExecuted));
  comparisons.push(createComparison('Success Rate %', today.automation.successRate, weekAgo.automation.successRate));

  // Business metrics
  comparisons.push(createComparison('Orders Created', today.business.ordersCreated, weekAgo.business.ordersCreated));
  comparisons.push(createComparison('Deals Won', today.business.dealsWon, weekAgo.business.dealsWon));
  comparisons.push(createComparison('Quotes Accepted', today.business.quotesAccepted, weekAgo.business.quotesAccepted));

  return comparisons;
}

function createComparison(
  metric: string,
  today: number,
  weekAgo: number
): MetricComparison {
  const percentChange = weekAgo > 0
    ? Math.round(((today - weekAgo) / weekAgo) * 100)
    : today > 0 ? 100 : 0;

  return {
    metric,
    today,
    yesterday: today, // Placeholder - would need actual yesterday data
    weekAgo,
    trend: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable',
    percentChange,
  };
}

/**
 * Get top clients by activity
 */
function getTopClients(events: WarehouseEventRecord[]): ClientActivity[] {
  const clientMap = new Map<string, {
    eventCount: number;
    ordersCreated: number;
    emailsSent: number;
  }>();

  for (const event of events) {
    if (!event.clientId) continue;

    const existing = clientMap.get(event.clientId) || {
      eventCount: 0,
      ordersCreated: 0,
      emailsSent: 0,
    };

    existing.eventCount++;
    if (event.eventType === 'order_created') existing.ordersCreated++;
    if (event.eventType === 'email_sent') existing.emailsSent++;

    clientMap.set(event.clientId, existing);
  }

  return Array.from(clientMap.entries())
    .map(([clientId, data]) => ({
      clientId,
      ...data,
      engagementScore: Math.min(100, data.eventCount * 10 + data.ordersCreated * 30 + data.emailsSent * 5),
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 10);
}

/**
 * Generate highlights
 */
function generateHighlights(
  metrics: DailyMetrics,
  comparisons: MetricComparison[]
): Highlight[] {
  const highlights: Highlight[] = [];

  // Email performance
  if (metrics.emailActivity.sent > 0) {
    const replyTrend = comparisons.find(c => c.metric === 'Reply Rate %')?.trend || 'stable';
    highlights.push({
      category: 'email',
      title: 'Email Activity',
      description: `${metrics.emailActivity.sent} emails sent with ${metrics.emailActivity.replyRate}% reply rate`,
      icon: 'mail',
      trend: replyTrend,
    });
  }

  // Automation health
  highlights.push({
    category: 'automation',
    title: 'Automation Health',
    description: `${metrics.automation.cardsExecuted} actions completed with ${metrics.automation.successRate}% success`,
    icon: 'robot',
    trend: metrics.automation.successRate >= 90 ? 'up' : metrics.automation.successRate >= 70 ? 'stable' : 'down',
  });

  // Business activity
  if (metrics.business.ordersCreated > 0 || metrics.business.dealsWon > 0) {
    highlights.push({
      category: 'business',
      title: 'Business Activity',
      description: `${metrics.business.ordersCreated} orders, ${metrics.business.dealsWon} deals won`,
      icon: 'trending-up',
      trend: metrics.business.dealsWon > 0 ? 'up' : 'stable',
    });
  }

  // Quote performance
  if (metrics.business.quotesCreated > 0) {
    const totalQuoteOutcomes = metrics.business.quotesAccepted + metrics.business.quotesRejected;
    const acceptRate = totalQuoteOutcomes > 0
      ? Math.round((metrics.business.quotesAccepted / totalQuoteOutcomes) * 100)
      : 0;
    highlights.push({
      category: 'sales',
      title: 'Quote Performance',
      description: `${metrics.business.quotesCreated} quotes, ${acceptRate}% acceptance rate`,
      icon: 'file-text',
      trend: acceptRate >= 50 ? 'up' : acceptRate >= 30 ? 'stable' : 'down',
    });
  }

  return highlights;
}

/**
 * Generate actionable insights from patterns and recommendations
 */
function generateActionableInsights(
  patterns: Array<{ patternName: string; description: string; isActionable: boolean; id?: string }>,
  recommendations: Array<{ title: string; description: string; priority: string }>
): ActionableInsight[] {
  const insights: ActionableInsight[] = [];

  // From patterns
  for (const pattern of patterns.filter(p => p.isActionable).slice(0, 3)) {
    insights.push({
      priority: 'medium',
      insight: pattern.description,
      suggestedAction: `Review ${pattern.patternName} pattern and take corrective action`,
      relatedPatternId: pattern.id,
    });
  }

  // From recommendations
  for (const rec of recommendations.slice(0, 5)) {
    insights.push({
      priority: rec.priority as 'high' | 'medium' | 'low',
      insight: rec.title,
      suggestedAction: rec.description,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
