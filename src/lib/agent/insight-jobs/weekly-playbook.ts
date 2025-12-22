/**
 * P2.1: Weekly Playbook Insight Job
 * Generates strategic weekly playbook with patterns and recommendations
 */

import { queryEvents, type WarehouseEventRecord } from '../warehouse-writer';
import { detectPatterns, getPatternsByType, type DetectedPattern } from '../pattern-detector';
import { generateRecommendations, getPendingRecommendations, type StrategyRecommendation } from '../strategy-recommender';
import type { JobResult } from './index';

// ============================================================================
// Types
// ============================================================================

interface WeeklyPlaybook {
  weekOf: string;
  period: { start: string; end: string };
  executiveSummary: ExecutiveSummary;
  weeklyMetrics: WeeklyMetrics;
  trends: Trend[];
  clientInsights: ClientInsight[];
  strategicPriorities: StrategicPriority[];
  playbook: PlaybookItem[];
  nextWeekFocus: string[];
}

interface ExecutiveSummary {
  headline: string;
  keyWins: string[];
  challenges: string[];
  opportunities: string[];
  overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical';
}

interface WeeklyMetrics {
  totalEvents: number;
  emailsSent: number;
  emailReplyRate: number;
  ordersCreated: number;
  ordersCompleted: number;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  winRate: number;
  quotesAccepted: number;
  quoteAcceptRate: number;
  automationSuccessRate: number;
  engagementComplianceRate: number;
}

interface Trend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  currentValue: number;
  previousValue: number;
  percentChange: number;
  insight: string;
}

interface ClientInsight {
  clientId: string;
  segment: 'high_value' | 'growing' | 'at_risk' | 'dormant';
  insight: string;
  suggestedAction: string;
  priority: number;
}

interface StrategicPriority {
  rank: number;
  area: string;
  objective: string;
  rationale: string;
  kpis: string[];
}

interface PlaybookItem {
  day: string;
  focus: string;
  actions: string[];
  targets: string[];
}

// ============================================================================
// Main Processing Function
// ============================================================================

export async function processWeeklyPlaybook(tenantId: string): Promise<JobResult> {
  const endTime = new Date();
  endTime.setHours(0, 0, 0, 0);

  const startTime = new Date(endTime);
  startTime.setDate(startTime.getDate() - 7);

  const prevWeekEnd = new Date(startTime);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  try {
    // Get this week's and last week's events
    const [thisWeekEvents, lastWeekEvents] = await Promise.all([
      queryEvents(tenantId, { startDate: startTime, endDate: endTime, limit: 10000 }),
      queryEvents(tenantId, { startDate: prevWeekStart, endDate: prevWeekEnd, limit: 10000 }),
    ]);

    // Calculate metrics
    const thisWeekMetrics = calculateWeeklyMetrics(thisWeekEvents);
    const lastWeekMetrics = calculateWeeklyMetrics(lastWeekEvents);

    // Generate trends
    const trends = generateTrends(thisWeekMetrics, lastWeekMetrics);

    // Run pattern detection
    const patternResult = await detectPatterns(tenantId, { windowHours: 168, limit: 5000 });

    // Generate recommendations
    const recResult = await generateRecommendations(tenantId);

    // Get patterns and recommendations for playbook
    const [behaviorPatterns, conversionPatterns, recommendations] = await Promise.all([
      getPatternsByType(tenantId, 'client_behavior', 20),
      getPatternsByType(tenantId, 'conversion', 10),
      getPendingRecommendations(tenantId, 20),
    ]);

    // Generate insights
    const executiveSummary = generateExecutiveSummary(thisWeekMetrics, trends, recommendations);
    const clientInsights = generateClientInsights(thisWeekEvents, behaviorPatterns);
    const strategicPriorities = generateStrategicPriorities(trends, recommendations);
    const playbook = generatePlaybook(strategicPriorities, clientInsights);
    const nextWeekFocus = generateNextWeekFocus(trends, recommendations);

    const summary: WeeklyPlaybook = {
      weekOf: startTime.toISOString().split('T')[0],
      period: { start: startTime.toISOString(), end: endTime.toISOString() },
      executiveSummary,
      weeklyMetrics: thisWeekMetrics,
      trends,
      clientInsights,
      strategicPriorities,
      playbook,
      nextWeekFocus,
    };

    return {
      success: true,
      eventsProcessed: thisWeekEvents.length,
      patternsDetected: patternResult.patternsDetected,
      recommendationsCreated: recResult.recommendationsCreated,
      summary: summary as unknown as Record<string, unknown>,
    };
  } catch (error) {
    return {
      success: false,
      eventsProcessed: 0,
      patternsDetected: 0,
      recommendationsCreated: 0,
      summary: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Analysis Functions
// ============================================================================

function calculateWeeklyMetrics(events: WarehouseEventRecord[]): WeeklyMetrics {
  const emailsSent = events.filter(e => e.eventType === 'email_sent').length;
  const emailsReplied = events.filter(e => e.eventType === 'email_replied').length;
  const ordersCreated = events.filter(e => e.eventType === 'order_created').length;
  const ordersCompleted = events.filter(e => e.eventType === 'order_completed').length;
  const dealsWon = events.filter(e => e.eventType === 'deal_won').length;
  const dealsLost = events.filter(e => e.eventType === 'deal_lost').length;
  const quotesAccepted = events.filter(e => e.eventType === 'quote_accepted').length;
  const quotesRejected = events.filter(e => e.eventType === 'quote_rejected').length;
  const cardsExecuted = events.filter(e => e.eventType === 'card_executed').length;
  const cardsFailed = events.filter(e => e.eventType === 'card_failed').length;

  // Calculate revenue from order payloads
  const revenue = events
    .filter(e => e.eventType === 'order_completed')
    .reduce((sum, e) => sum + ((e.payload?.amount as number) || 0), 0);

  return {
    totalEvents: events.length,
    emailsSent,
    emailReplyRate: emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100) : 0,
    ordersCreated,
    ordersCompleted,
    revenue,
    dealsWon,
    dealsLost,
    winRate: dealsWon + dealsLost > 0 ? Math.round((dealsWon / (dealsWon + dealsLost)) * 100) : 0,
    quotesAccepted,
    quoteAcceptRate: quotesAccepted + quotesRejected > 0
      ? Math.round((quotesAccepted / (quotesAccepted + quotesRejected)) * 100) : 0,
    automationSuccessRate: cardsExecuted + cardsFailed > 0
      ? Math.round((cardsExecuted / (cardsExecuted + cardsFailed)) * 100) : 100,
    engagementComplianceRate: 0, // Would need engagement clock data
  };
}

function generateTrends(current: WeeklyMetrics, previous: WeeklyMetrics): Trend[] {
  const createTrend = (metric: string, curr: number, prev: number, insight: string): Trend => {
    const change = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;
    return {
      metric,
      direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      currentValue: curr,
      previousValue: prev,
      percentChange: change,
      insight,
    };
  };

  return [
    createTrend('Email Reply Rate', current.emailReplyRate, previous.emailReplyRate,
      current.emailReplyRate > previous.emailReplyRate
        ? 'Email engagement improving' : 'Email engagement needs attention'),
    createTrend('Orders Created', current.ordersCreated, previous.ordersCreated,
      current.ordersCreated > previous.ordersCreated
        ? 'Order volume growing' : 'Order volume declining'),
    createTrend('Deal Win Rate', current.winRate, previous.winRate,
      current.winRate > previous.winRate
        ? 'Sales effectiveness improving' : 'Review sales process'),
    createTrend('Quote Accept Rate', current.quoteAcceptRate, previous.quoteAcceptRate,
      current.quoteAcceptRate > previous.quoteAcceptRate
        ? 'Pricing resonating with clients' : 'Review pricing strategy'),
    createTrend('Automation Success', current.automationSuccessRate, previous.automationSuccessRate,
      current.automationSuccessRate >= 90
        ? 'Automation running smoothly' : 'Review automation health'),
  ];
}

function generateExecutiveSummary(
  metrics: WeeklyMetrics,
  trends: Trend[],
  recommendations: StrategyRecommendation[]
): ExecutiveSummary {
  const improvingTrends = trends.filter(t => t.direction === 'improving');
  const decliningTrends = trends.filter(t => t.direction === 'declining');
  const criticalRecs = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high');

  const keyWins = improvingTrends.map(t => t.insight);
  const challenges = decliningTrends.map(t => t.insight);
  const opportunities = recommendations.slice(0, 3).map(r => r.title);

  let overallHealth: ExecutiveSummary['overallHealth'] = 'good';
  if (criticalRecs.length > 2 || decliningTrends.length > 3) overallHealth = 'needs_attention';
  if (criticalRecs.length > 4 || metrics.automationSuccessRate < 70) overallHealth = 'critical';
  if (improvingTrends.length > 3 && criticalRecs.length === 0) overallHealth = 'excellent';

  const headline = overallHealth === 'excellent'
    ? `Strong week with ${metrics.ordersCreated} orders and ${metrics.dealsWon} deals won`
    : overallHealth === 'critical'
    ? 'Attention needed: Multiple areas require immediate focus'
    : `Steady progress: ${metrics.ordersCreated} orders, ${improvingTrends.length} improving metrics`;

  return { headline, keyWins, challenges, opportunities, overallHealth };
}

function generateClientInsights(
  events: WarehouseEventRecord[],
  patterns: DetectedPattern[]
): ClientInsight[] {
  const clientActivity = new Map<string, { events: number; orders: number; engagement: number }>();

  for (const event of events) {
    if (!event.clientId) continue;
    const curr = clientActivity.get(event.clientId) || { events: 0, orders: 0, engagement: 0 };
    curr.events++;
    if (event.eventType === 'order_created') curr.orders++;
    if (['email_opened', 'email_clicked', 'email_replied'].includes(event.eventType)) curr.engagement++;
    clientActivity.set(event.clientId, curr);
  }

  const insights: ClientInsight[] = [];

  for (const [clientId, activity] of clientActivity) {
    let segment: ClientInsight['segment'] = 'growing';
    let insight = '';
    let action = '';
    let priority = 50;

    if (activity.orders >= 3) {
      segment = 'high_value';
      insight = `High activity client with ${activity.orders} orders this week`;
      action = 'Schedule strategic review call';
      priority = 90;
    } else if (activity.engagement === 0 && activity.events < 5) {
      segment = 'dormant';
      insight = 'Low engagement detected';
      action = 'Initiate re-engagement campaign';
      priority = 70;
    } else if (activity.engagement > 0 && activity.orders === 0) {
      segment = 'at_risk';
      insight = 'Engaged but not ordering';
      action = 'Send targeted offer';
      priority = 80;
    }

    if (insight) {
      insights.push({ clientId, segment, insight, suggestedAction: action, priority });
    }
  }

  return insights.sort((a, b) => b.priority - a.priority).slice(0, 10);
}

function generateStrategicPriorities(
  trends: Trend[],
  recommendations: StrategyRecommendation[]
): StrategicPriority[] {
  const priorities: StrategicPriority[] = [];
  let rank = 1;

  // Priority from declining trends
  for (const trend of trends.filter(t => t.direction === 'declining').slice(0, 2)) {
    priorities.push({
      rank: rank++,
      area: trend.metric,
      objective: `Improve ${trend.metric} by 10%`,
      rationale: trend.insight,
      kpis: [`${trend.metric}: ${trend.currentValue}% → ${trend.currentValue + 10}%`],
    });
  }

  // Priority from high recommendations
  for (const rec of recommendations.filter(r => r.priority === 'high').slice(0, 2)) {
    priorities.push({
      rank: rank++,
      area: rec.recommendationType,
      objective: rec.title,
      rationale: rec.description,
      kpis: rec.actionItems.slice(0, 2).map(a => a.action),
    });
  }

  return priorities.slice(0, 5);
}

function generatePlaybook(
  priorities: StrategicPriority[],
  clientInsights: ClientInsight[]
): PlaybookItem[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const highValueClients = clientInsights.filter(c => c.segment === 'high_value');
  const atRiskClients = clientInsights.filter(c => c.segment === 'at_risk');

  return days.map((day, i) => ({
    day,
    focus: priorities[i % priorities.length]?.area || 'General outreach',
    actions: [
      priorities[i % priorities.length]?.objective || 'Review and follow up on pending items',
      i < 2 ? 'Review automation health' : 'Follow up on quotes',
    ],
    targets: i === 0
      ? highValueClients.slice(0, 2).map(c => c.clientId)
      : atRiskClients.slice(i - 1, i + 1).map(c => c.clientId),
  }));
}

function generateNextWeekFocus(trends: Trend[], recommendations: StrategyRecommendation[]): string[] {
  const focus: string[] = [];

  const declining = trends.filter(t => t.direction === 'declining');
  if (declining.length > 0) {
    focus.push(`Address declining ${declining[0].metric}`);
  }

  const topRecs = recommendations.slice(0, 2);
  for (const rec of topRecs) {
    focus.push(rec.title);
  }

  focus.push('Review and optimize automation performance');
  focus.push('Ensure 21-day engagement compliance');

  return focus.slice(0, 5);
}
