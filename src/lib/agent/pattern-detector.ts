/**
 * P2.1: Pattern Detector
 * Analyzes warehouse events to detect patterns and anomalies
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  queryEvents,
  getEventsInWindow,
  markEventsProcessed,
  EVENT_TYPES,
  type WarehouseEventRecord,
} from './warehouse-writer';

// ============================================================================
// Types
// ============================================================================

export interface DetectedPattern {
  id?: string;
  tenantId: string;
  patternType: PatternType;
  patternName: string;
  description: string;
  patternConfig: PatternConfig;
  metrics: PatternMetrics;
  confidenceScore: number;
  sampleSize: number;
  isActive: boolean;
  isActionable: boolean;
}

export interface PatternConfig {
  conditions: PatternCondition[];
  timeWindow?: string; // e.g., '7d', '30d'
  threshold?: number;
  entityType?: string;
  entityId?: string;
}

export interface PatternCondition {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface PatternMetrics {
  count?: number;
  average?: number;
  median?: number;
  stddev?: number;
  min?: number;
  max?: number;
  trend?: 'up' | 'down' | 'stable';
  percentChange?: number;
  percentiles?: Record<string, number>;
}

export type PatternType =
  | 'client_behavior'
  | 'seasonal'
  | 'response_time'
  | 'win_loss'
  | 'engagement'
  | 'conversion'
  | 'anomaly';

export interface PatternDetectionResult {
  patternsDetected: number;
  patternsUpdated: number;
  eventsProcessed: number;
  patterns: DetectedPattern[];
}

export interface ClientBehaviorPattern {
  clientId: string;
  clientName: string;
  orderFrequency: number; // orders per month
  averageOrderValue: number;
  preferredContactMethod: string;
  responseTimeAvg: number; // hours
  engagementScore: number;
  churnRisk: 'low' | 'medium' | 'high';
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Run pattern detection for a tenant
 */
export async function detectPatterns(
  tenantId: string,
  options: { windowHours?: number; limit?: number } = {}
): Promise<PatternDetectionResult> {
  const windowHours = options.windowHours || 24;
  const limit = Math.max(1, Math.min(options.limit || 1000, 5000));

  // Get events to process
  const events = await queryEvents(tenantId, {
    processed: false,
    limit,
  });

  if (events.length === 0) {
    return {
      patternsDetected: 0,
      patternsUpdated: 0,
      eventsProcessed: 0,
      patterns: [],
    };
  }

  const detectedPatterns: DetectedPattern[] = [];

  // Run different pattern detectors
  const [
    clientPatterns,
    engagementPatterns,
    conversionPatterns,
    anomalies,
  ] = await Promise.all([
    detectClientBehaviorPatterns(tenantId, events),
    detectEngagementPatterns(tenantId, events),
    detectConversionPatterns(tenantId, events),
    detectAnomalies(tenantId, events),
  ]);

  detectedPatterns.push(...clientPatterns, ...engagementPatterns, ...conversionPatterns, ...anomalies);

  // Save patterns to database
  let patternsCreated = 0;
  let patternsUpdated = 0;

  for (const pattern of detectedPatterns) {
    const result = await savePattern(pattern);
    if (result.created) patternsCreated++;
    if (result.updated) patternsUpdated++;
  }

  // Mark events as processed
  const eventIds = events.map((e) => e.id);
  await markEventsProcessed(eventIds);

  return {
    patternsDetected: patternsCreated,
    patternsUpdated,
    eventsProcessed: events.length,
    patterns: detectedPatterns,
  };
}

/**
 * Detect client behavior patterns
 */
async function detectClientBehaviorPatterns(
  tenantId: string,
  events: WarehouseEventRecord[]
): Promise<DetectedPattern[]> {
  const patterns: DetectedPattern[] = [];

  // Group events by client
  const clientEvents = new Map<string, WarehouseEventRecord[]>();
  for (const event of events) {
    if (event.clientId) {
      const existing = clientEvents.get(event.clientId) || [];
      existing.push(event);
      clientEvents.set(event.clientId, existing);
    }
  }

  for (const [clientId, clientEventList] of clientEvents) {
    // Analyze order frequency
    const orderEvents = clientEventList.filter(
      (e) => e.eventType === EVENT_TYPES.ORDER_CREATED
    );

    // Analyze response times
    const emailEvents = clientEventList.filter(
      (e) =>
        e.eventType === EVENT_TYPES.EMAIL_SENT ||
        e.eventType === EVENT_TYPES.EMAIL_REPLIED
    );

    // Calculate engagement score
    const engagementEvents = clientEventList.filter(
      (e) =>
        e.eventType === EVENT_TYPES.EMAIL_OPENED ||
        e.eventType === EVENT_TYPES.EMAIL_CLICKED ||
        e.eventType === EVENT_TYPES.EMAIL_REPLIED
    );

    // Create pattern if significant activity
    if (clientEventList.length >= 5) {
      const orderCount = orderEvents.length;
      const engagementRate =
        emailEvents.length > 0 ? engagementEvents.length / emailEvents.length : 0;

      patterns.push({
        tenantId,
        patternType: 'client_behavior',
        patternName: `client_activity_${clientId.slice(0, 8)}`,
        description: `Activity pattern for client ${clientId}`,
        patternConfig: {
          conditions: [{ field: 'client_id', operator: 'eq', value: clientId }],
          timeWindow: '30d',
          entityType: 'client',
          entityId: clientId,
        },
        metrics: {
          count: clientEventList.length,
          average: orderCount,
          trend: orderCount > 3 ? 'up' : orderCount > 0 ? 'stable' : 'down',
          percentiles: {
            engagement_rate: Math.round(engagementRate * 100),
          },
        },
        confidenceScore: Math.min(0.9, clientEventList.length / 20),
        sampleSize: clientEventList.length,
        isActive: true,
        isActionable: engagementRate < 0.2, // Low engagement is actionable
      });
    }
  }

  return patterns;
}

/**
 * Detect engagement patterns
 */
async function detectEngagementPatterns(
  tenantId: string,
  events: WarehouseEventRecord[]
): Promise<DetectedPattern[]> {
  const patterns: DetectedPattern[] = [];

  // Group by email events
  const emailSent = events.filter((e) => e.eventType === EVENT_TYPES.EMAIL_SENT);
  const emailOpened = events.filter((e) => e.eventType === EVENT_TYPES.EMAIL_OPENED);
  const emailClicked = events.filter((e) => e.eventType === EVENT_TYPES.EMAIL_CLICKED);
  const emailReplied = events.filter((e) => e.eventType === EVENT_TYPES.EMAIL_REPLIED);

  if (emailSent.length >= 10) {
    const openRate = emailOpened.length / emailSent.length;
    const clickRate = emailClicked.length / emailSent.length;
    const replyRate = emailReplied.length / emailSent.length;

    patterns.push({
      tenantId,
      patternType: 'engagement',
      patternName: 'email_engagement_trend',
      description: 'Email engagement metrics and trends',
      patternConfig: {
        conditions: [
          { field: 'event_type', operator: 'in', value: ['email_sent', 'email_opened', 'email_clicked', 'email_replied'] },
        ],
        timeWindow: '7d',
      },
      metrics: {
        count: emailSent.length,
        percentiles: {
          open_rate: Math.round(openRate * 100),
          click_rate: Math.round(clickRate * 100),
          reply_rate: Math.round(replyRate * 100),
        },
        trend: replyRate > 0.1 ? 'up' : replyRate > 0.05 ? 'stable' : 'down',
      },
      confidenceScore: Math.min(0.95, emailSent.length / 50),
      sampleSize: emailSent.length,
      isActive: true,
      isActionable: replyRate < 0.05, // Low reply rate is actionable
    });
  }

  return patterns;
}

/**
 * Detect conversion patterns (deal/quote outcomes)
 */
async function detectConversionPatterns(
  tenantId: string,
  events: WarehouseEventRecord[]
): Promise<DetectedPattern[]> {
  const patterns: DetectedPattern[] = [];

  // Deal conversion
  const dealCreated = events.filter((e) => e.eventType === EVENT_TYPES.DEAL_CREATED);
  const dealWon = events.filter((e) => e.eventType === EVENT_TYPES.DEAL_WON);
  const dealLost = events.filter((e) => e.eventType === EVENT_TYPES.DEAL_LOST);

  if (dealCreated.length + dealWon.length + dealLost.length >= 5) {
    const totalDeals = dealCreated.length + dealWon.length + dealLost.length;
    const winRate = dealWon.length / Math.max(1, dealWon.length + dealLost.length);

    patterns.push({
      tenantId,
      patternType: 'conversion',
      patternName: 'deal_conversion_rate',
      description: 'Deal win/loss conversion metrics',
      patternConfig: {
        conditions: [
          { field: 'event_type', operator: 'in', value: ['deal_won', 'deal_lost'] },
        ],
        timeWindow: '30d',
      },
      metrics: {
        count: totalDeals,
        average: winRate,
        percentiles: {
          win_rate: Math.round(winRate * 100),
        },
        trend: winRate > 0.5 ? 'up' : winRate > 0.3 ? 'stable' : 'down',
      },
      confidenceScore: Math.min(0.9, totalDeals / 20),
      sampleSize: totalDeals,
      isActive: true,
      isActionable: winRate < 0.3, // Low win rate is actionable
    });
  }

  // Quote conversion
  const quoteCreated = events.filter((e) => e.eventType === EVENT_TYPES.QUOTE_CREATED);
  const quoteAccepted = events.filter((e) => e.eventType === EVENT_TYPES.QUOTE_ACCEPTED);
  const quoteRejected = events.filter((e) => e.eventType === EVENT_TYPES.QUOTE_REJECTED);

  if (quoteCreated.length + quoteAccepted.length + quoteRejected.length >= 5) {
    const totalQuotes = quoteCreated.length + quoteAccepted.length + quoteRejected.length;
    const acceptRate = quoteAccepted.length / Math.max(1, quoteAccepted.length + quoteRejected.length);

    patterns.push({
      tenantId,
      patternType: 'conversion',
      patternName: 'quote_conversion_rate',
      description: 'Quote acceptance rate metrics',
      patternConfig: {
        conditions: [
          { field: 'event_type', operator: 'in', value: ['quote_accepted', 'quote_rejected'] },
        ],
        timeWindow: '30d',
      },
      metrics: {
        count: totalQuotes,
        average: acceptRate,
        percentiles: {
          accept_rate: Math.round(acceptRate * 100),
        },
        trend: acceptRate > 0.6 ? 'up' : acceptRate > 0.4 ? 'stable' : 'down',
      },
      confidenceScore: Math.min(0.9, totalQuotes / 15),
      sampleSize: totalQuotes,
      isActive: true,
      isActionable: acceptRate < 0.4, // Low accept rate is actionable
    });
  }

  return patterns;
}

/**
 * Detect anomalies in event patterns
 */
async function detectAnomalies(
  tenantId: string,
  events: WarehouseEventRecord[]
): Promise<DetectedPattern[]> {
  const patterns: DetectedPattern[] = [];

  // Look for unusual failure rates
  const cardFailed = events.filter((e) => e.eventType === EVENT_TYPES.CARD_FAILED);
  const cardExecuted = events.filter((e) => e.eventType === EVENT_TYPES.CARD_EXECUTED);
  const cardBlocked = events.filter((e) => e.eventType === EVENT_TYPES.CARD_BLOCKED);

  const totalCards = cardExecuted.length + cardFailed.length + cardBlocked.length;

  if (totalCards >= 10) {
    const failureRate = cardFailed.length / totalCards;
    const blockRate = cardBlocked.length / totalCards;

    // High failure rate anomaly
    if (failureRate > 0.2) {
      patterns.push({
        tenantId,
        patternType: 'anomaly',
        patternName: 'high_card_failure_rate',
        description: `Unusually high card failure rate: ${Math.round(failureRate * 100)}%`,
        patternConfig: {
          conditions: [
            { field: 'event_type', operator: 'eq', value: 'card_failed' },
          ],
          threshold: 0.2,
          timeWindow: '24h',
        },
        metrics: {
          count: cardFailed.length,
          average: failureRate,
          percentChange: 0,
        },
        confidenceScore: Math.min(0.95, totalCards / 30),
        sampleSize: totalCards,
        isActive: true,
        isActionable: true,
      });
    }

    // High block rate anomaly
    if (blockRate > 0.3) {
      patterns.push({
        tenantId,
        patternType: 'anomaly',
        patternName: 'high_policy_block_rate',
        description: `Unusually high policy block rate: ${Math.round(blockRate * 100)}%`,
        patternConfig: {
          conditions: [
            { field: 'event_type', operator: 'eq', value: 'card_blocked' },
          ],
          threshold: 0.3,
          timeWindow: '24h',
        },
        metrics: {
          count: cardBlocked.length,
          average: blockRate,
        },
        confidenceScore: Math.min(0.95, totalCards / 30),
        sampleSize: totalCards,
        isActive: true,
        isActionable: true,
      });
    }
  }

  // Email bounce anomaly
  const emailBounced = events.filter((e) => e.eventType === EVENT_TYPES.EMAIL_BOUNCED);
  const emailSentCount = events.filter((e) => e.eventType === EVENT_TYPES.EMAIL_SENT).length;

  if (emailSentCount >= 10) {
    const bounceRate = emailBounced.length / emailSentCount;

    if (bounceRate > 0.1) {
      patterns.push({
        tenantId,
        patternType: 'anomaly',
        patternName: 'high_email_bounce_rate',
        description: `Unusually high email bounce rate: ${Math.round(bounceRate * 100)}%`,
        patternConfig: {
          conditions: [
            { field: 'event_type', operator: 'eq', value: 'email_bounced' },
          ],
          threshold: 0.1,
          timeWindow: '24h',
        },
        metrics: {
          count: emailBounced.length,
          average: bounceRate,
        },
        confidenceScore: Math.min(0.9, emailSentCount / 30),
        sampleSize: emailSentCount,
        isActive: true,
        isActionable: true,
      });
    }
  }

  return patterns;
}

/**
 * Save or update a pattern in the database
 */
async function savePattern(
  pattern: DetectedPattern
): Promise<{ created: boolean; updated: boolean; id: string }> {
  const supabase = createServiceRoleClient();

  // Check if pattern already exists
  const { data: existing } = await supabase
    .from('detected_patterns')
    .select('id')
    .eq('tenant_id', pattern.tenantId)
    .eq('pattern_name', pattern.patternName)
    .single();

  if (existing) {
    // Update existing pattern
    const { data, error } = await supabase
      .from('detected_patterns')
      .update({
        description: pattern.description,
        pattern_config: pattern.patternConfig,
        metrics: pattern.metrics,
        confidence_score: pattern.confidenceScore,
        sample_size: pattern.sampleSize,
        is_actionable: pattern.isActionable,
        last_validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id')
      .single();

    if (error) {
      console.error('[pattern-detector] Failed to update pattern:', error);
      return { created: false, updated: false, id: '' };
    }

    return { created: false, updated: true, id: data.id };
  } else {
    // Create new pattern
    const { data, error } = await supabase
      .from('detected_patterns')
      .insert({
        tenant_id: pattern.tenantId,
        pattern_type: pattern.patternType,
        pattern_name: pattern.patternName,
        description: pattern.description,
        pattern_config: pattern.patternConfig,
        metrics: pattern.metrics,
        confidence_score: pattern.confidenceScore,
        sample_size: pattern.sampleSize,
        is_active: pattern.isActive,
        is_actionable: pattern.isActionable,
        first_detected_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[pattern-detector] Failed to create pattern:', error);
      return { created: false, updated: false, id: '' };
    }

    return { created: true, updated: false, id: data.id };
  }
}

/**
 * Get actionable patterns for a tenant
 */
export async function getActionablePatterns(
  tenantId: string,
  limit: number = 20
): Promise<DetectedPattern[]> {
  const supabase = createServiceRoleClient();
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const { data, error } = await supabase
    .from('detected_patterns')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('is_actionable', true)
    .order('confidence_score', { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error('[pattern-detector] Failed to get actionable patterns:', error);
    return [];
  }

  return (data || []).map(mapToPattern);
}

/**
 * Get patterns by type
 */
export async function getPatternsByType(
  tenantId: string,
  patternType: PatternType,
  limit: number = 20
): Promise<DetectedPattern[]> {
  const supabase = createServiceRoleClient();
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const { data, error } = await supabase
    .from('detected_patterns')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('pattern_type', patternType)
    .eq('is_active', true)
    .order('confidence_score', { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error('[pattern-detector] Failed to get patterns by type:', error);
    return [];
  }

  return (data || []).map(mapToPattern);
}

/**
 * Validate a pattern (recheck if still valid)
 */
export async function validatePattern(patternId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data: pattern, error } = await supabase
    .from('detected_patterns')
    .select('*')
    .eq('id', patternId)
    .single();

  if (error || !pattern) {
    return false;
  }

  // Get recent events matching pattern conditions
  const events = await queryEvents(pattern.tenant_id, {
    limit: 100,
    // Could add more specific filtering based on pattern_config
  });

  // Simple validation: pattern is valid if we still have matching events
  const isValid = events.length > 0;

  // Update validation timestamp
  await supabase
    .from('detected_patterns')
    .update({
      last_validated_at: new Date().toISOString(),
      is_active: isValid,
    })
    .eq('id', patternId);

  return isValid;
}

/**
 * Deactivate a pattern
 */
export async function deactivatePattern(patternId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('detected_patterns')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', patternId);

  return !error;
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToPattern(row: Record<string, unknown>): DetectedPattern {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    patternType: row.pattern_type as PatternType,
    patternName: row.pattern_name as string,
    description: row.description as string,
    patternConfig: row.pattern_config as PatternConfig,
    metrics: row.metrics as PatternMetrics,
    confidenceScore: row.confidence_score as number,
    sampleSize: row.sample_size as number,
    isActive: row.is_active as boolean,
    isActionable: row.is_actionable as boolean,
  };
}
