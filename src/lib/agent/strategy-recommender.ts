/**
 * P2.1: Strategy Recommender
 * Generates actionable recommendations from detected patterns
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  getActionablePatterns,
  type DetectedPattern,
  type PatternType,
} from './pattern-detector';

// ============================================================================
// Types
// ============================================================================

export interface StrategyRecommendation {
  id?: string;
  tenantId: string;
  recommendationType: RecommendationType;
  title: string;
  description: string;
  sourcePatternIds: string[];
  actionItems: ActionItem[];
  expectedImpact: ImpactEstimate;
  priority: Priority;
  validFrom: Date;
  validUntil?: Date;
  status: RecommendationStatus;
}

export interface ActionItem {
  order: number;
  action: string;
  target?: string;
  details?: string;
  automated?: boolean;
}

export interface ImpactEstimate {
  metric: string;
  currentValue?: number;
  estimatedValue: number;
  confidence: number; // 0-1
  timeframe?: string;
}

export type RecommendationType =
  | 'outreach_strategy'
  | 'pricing'
  | 'timing'
  | 'engagement'
  | 'follow_up'
  | 'process_improvement'
  | 'risk_mitigation';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type RecommendationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'implemented'
  | 'expired';

export interface RecommendationResult {
  recommendationsCreated: number;
  patternsProcessed: number;
  recommendations: StrategyRecommendation[];
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate recommendations from actionable patterns
 */
export async function generateRecommendations(
  tenantId: string
): Promise<RecommendationResult> {
  // Get actionable patterns
  const patterns = await getActionablePatterns(tenantId, 50);

  if (patterns.length === 0) {
    return {
      recommendationsCreated: 0,
      patternsProcessed: 0,
      recommendations: [],
    };
  }

  const recommendations: StrategyRecommendation[] = [];

  // Generate recommendations based on pattern types
  for (const pattern of patterns) {
    const patternRecommendations = await generatePatternRecommendations(
      tenantId,
      pattern
    );
    recommendations.push(...patternRecommendations);
  }

  // Dedupe similar recommendations
  const uniqueRecommendations = dedupeRecommendations(recommendations);

  // Save recommendations
  let created = 0;
  for (const rec of uniqueRecommendations) {
    const saved = await saveRecommendation(rec);
    if (saved) created++;
  }

  return {
    recommendationsCreated: created,
    patternsProcessed: patterns.length,
    recommendations: uniqueRecommendations,
  };
}

/**
 * Generate recommendations for a specific pattern
 */
async function generatePatternRecommendations(
  tenantId: string,
  pattern: DetectedPattern
): Promise<StrategyRecommendation[]> {
  const recommendations: StrategyRecommendation[] = [];
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 30);

  switch (pattern.patternType) {
    case 'client_behavior': {
      const engagement = pattern.metrics.percentiles?.engagement_rate || 0;
      if (engagement < 20) {
        recommendations.push({
          tenantId,
          recommendationType: 'engagement',
          title: 'Re-engage Low-Activity Client',
          description: `Client has low engagement rate (${engagement}%). Consider a personalized outreach campaign to re-establish connection.`,
          sourcePatternIds: [pattern.id!],
          actionItems: [
            {
              order: 1,
              action: 'Review client history and recent interactions',
              automated: false,
            },
            {
              order: 2,
              action: 'Draft personalized re-engagement email',
              target: pattern.patternConfig.entityId,
              automated: true,
            },
            {
              order: 3,
              action: 'Schedule follow-up call within 7 days',
              automated: false,
            },
          ],
          expectedImpact: {
            metric: 'engagement_rate',
            currentValue: engagement,
            estimatedValue: Math.min(engagement + 30, 80),
            confidence: 0.6,
            timeframe: '30 days',
          },
          priority: engagement < 10 ? 'high' : 'medium',
          validFrom: now,
          validUntil,
          status: 'pending',
        });
      }
      break;
    }

    case 'engagement': {
      const replyRate = pattern.metrics.percentiles?.reply_rate || 0;
      const openRate = pattern.metrics.percentiles?.open_rate || 0;

      if (replyRate < 5) {
        recommendations.push({
          tenantId,
          recommendationType: 'outreach_strategy',
          title: 'Improve Email Reply Rate',
          description: `Email reply rate is very low (${replyRate}%). Consider revising email templates and subject lines.`,
          sourcePatternIds: [pattern.id!],
          actionItems: [
            {
              order: 1,
              action: 'Audit current email templates for effectiveness',
              automated: false,
            },
            {
              order: 2,
              action: 'Test new subject line variations (A/B test)',
              automated: true,
            },
            {
              order: 3,
              action: 'Shorten email content and add clear CTAs',
              automated: false,
            },
            {
              order: 4,
              action: 'Adjust send times based on open patterns',
              automated: true,
            },
          ],
          expectedImpact: {
            metric: 'reply_rate',
            currentValue: replyRate,
            estimatedValue: Math.min(replyRate + 5, 20),
            confidence: 0.5,
            timeframe: '14 days',
          },
          priority: replyRate < 3 ? 'high' : 'medium',
          validFrom: now,
          validUntil,
          status: 'pending',
        });
      }

      if (openRate < 30) {
        recommendations.push({
          tenantId,
          recommendationType: 'timing',
          title: 'Optimize Email Send Times',
          description: `Email open rate is below average (${openRate}%). Experiment with different send times.`,
          sourcePatternIds: [pattern.id!],
          actionItems: [
            {
              order: 1,
              action: 'Analyze historical open times by recipient segment',
              automated: true,
            },
            {
              order: 2,
              action: 'Schedule emails during optimal engagement windows',
              automated: true,
            },
          ],
          expectedImpact: {
            metric: 'open_rate',
            currentValue: openRate,
            estimatedValue: Math.min(openRate + 15, 60),
            confidence: 0.65,
            timeframe: '7 days',
          },
          priority: 'medium',
          validFrom: now,
          validUntil,
          status: 'pending',
        });
      }
      break;
    }

    case 'conversion': {
      const winRate = pattern.metrics.percentiles?.win_rate;
      const acceptRate = pattern.metrics.percentiles?.accept_rate;

      if (winRate !== undefined && winRate < 30) {
        recommendations.push({
          tenantId,
          recommendationType: 'process_improvement',
          title: 'Improve Deal Win Rate',
          description: `Deal win rate is low (${winRate}%). Review qualification process and competitive positioning.`,
          sourcePatternIds: [pattern.id!],
          actionItems: [
            {
              order: 1,
              action: 'Review lost deals for common patterns',
              automated: false,
            },
            {
              order: 2,
              action: 'Update deal qualification criteria',
              automated: false,
            },
            {
              order: 3,
              action: 'Create competitive battle cards',
              automated: false,
            },
            {
              order: 4,
              action: 'Increase follow-up frequency on high-value deals',
              automated: true,
            },
          ],
          expectedImpact: {
            metric: 'win_rate',
            currentValue: winRate,
            estimatedValue: Math.min(winRate + 15, 60),
            confidence: 0.5,
            timeframe: '60 days',
          },
          priority: 'high',
          validFrom: now,
          validUntil,
          status: 'pending',
        });
      }

      if (acceptRate !== undefined && acceptRate < 40) {
        recommendations.push({
          tenantId,
          recommendationType: 'pricing',
          title: 'Review Quote Pricing Strategy',
          description: `Quote acceptance rate is low (${acceptRate}%). Consider reviewing pricing or value proposition.`,
          sourcePatternIds: [pattern.id!],
          actionItems: [
            {
              order: 1,
              action: 'Analyze competitor pricing if available',
              automated: false,
            },
            {
              order: 2,
              action: 'Review rejected quote feedback',
              automated: true,
            },
            {
              order: 3,
              action: 'Test tiered pricing options',
              automated: false,
            },
            {
              order: 4,
              action: 'Improve quote follow-up cadence',
              automated: true,
            },
          ],
          expectedImpact: {
            metric: 'accept_rate',
            currentValue: acceptRate,
            estimatedValue: Math.min(acceptRate + 20, 70),
            confidence: 0.45,
            timeframe: '30 days',
          },
          priority: acceptRate < 25 ? 'high' : 'medium',
          validFrom: now,
          validUntil,
          status: 'pending',
        });
      }
      break;
    }

    case 'anomaly': {
      // Anomalies always generate high-priority recommendations
      if (pattern.patternName.includes('failure')) {
        recommendations.push({
          tenantId,
          recommendationType: 'risk_mitigation',
          title: 'Address High Failure Rate',
          description: pattern.description,
          sourcePatternIds: [pattern.id!],
          actionItems: [
            {
              order: 1,
              action: 'Review recent failure logs for patterns',
              automated: true,
            },
            {
              order: 2,
              action: 'Check API integrations and rate limits',
              automated: false,
            },
            {
              order: 3,
              action: 'Temporarily reduce automated actions until resolved',
              automated: true,
            },
          ],
          expectedImpact: {
            metric: 'failure_rate',
            currentValue: (pattern.metrics.average || 0) * 100,
            estimatedValue: 5,
            confidence: 0.7,
            timeframe: '24 hours',
          },
          priority: 'critical',
          validFrom: now,
          validUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'pending',
        });
      }

      if (pattern.patternName.includes('bounce')) {
        recommendations.push({
          tenantId,
          recommendationType: 'risk_mitigation',
          title: 'Address Email Deliverability Issues',
          description: pattern.description,
          sourcePatternIds: [pattern.id!],
          actionItems: [
            {
              order: 1,
              action: 'Review bounced email addresses',
              automated: true,
            },
            {
              order: 2,
              action: 'Update suppression list',
              automated: true,
            },
            {
              order: 3,
              action: 'Check email domain reputation',
              automated: false,
            },
            {
              order: 4,
              action: 'Verify DKIM/SPF/DMARC settings',
              automated: false,
            },
          ],
          expectedImpact: {
            metric: 'bounce_rate',
            currentValue: (pattern.metrics.average || 0) * 100,
            estimatedValue: 2,
            confidence: 0.8,
            timeframe: '48 hours',
          },
          priority: 'high',
          validFrom: now,
          validUntil: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days
          status: 'pending',
        });
      }
      break;
    }
  }

  return recommendations;
}

/**
 * Deduplicate similar recommendations
 */
function dedupeRecommendations(
  recommendations: StrategyRecommendation[]
): StrategyRecommendation[] {
  const seen = new Map<string, StrategyRecommendation>();

  for (const rec of recommendations) {
    const key = `${rec.recommendationType}-${rec.title}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, rec);
    } else {
      // Merge source pattern IDs
      existing.sourcePatternIds = [
        ...new Set([...existing.sourcePatternIds, ...rec.sourcePatternIds]),
      ];
      // Keep higher priority
      if (getPriorityValue(rec.priority) > getPriorityValue(existing.priority)) {
        existing.priority = rec.priority;
      }
    }
  }

  return Array.from(seen.values());
}

function getPriorityValue(priority: Priority): number {
  switch (priority) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

/**
 * Save recommendation to database
 */
async function saveRecommendation(
  recommendation: StrategyRecommendation
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // Check for existing similar recommendation
  const { data: existing } = await supabase
    .from('strategy_recommendations')
    .select('id')
    .eq('tenant_id', recommendation.tenantId)
    .eq('recommendation_type', recommendation.recommendationType)
    .eq('title', recommendation.title)
    .eq('status', 'pending')
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('strategy_recommendations')
      .update({
        description: recommendation.description,
        source_pattern_ids: recommendation.sourcePatternIds,
        action_items: recommendation.actionItems,
        expected_impact: recommendation.expectedImpact,
        priority: recommendation.priority,
        valid_until: recommendation.validUntil?.toISOString(),
      })
      .eq('id', existing.id);

    return !error;
  } else {
    // Insert new
    const { error } = await supabase.from('strategy_recommendations').insert({
      tenant_id: recommendation.tenantId,
      recommendation_type: recommendation.recommendationType,
      title: recommendation.title,
      description: recommendation.description,
      source_pattern_ids: recommendation.sourcePatternIds,
      action_items: recommendation.actionItems,
      expected_impact: recommendation.expectedImpact,
      priority: recommendation.priority,
      valid_from: recommendation.validFrom.toISOString(),
      valid_until: recommendation.validUntil?.toISOString(),
      status: recommendation.status,
    });

    return !error;
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get pending recommendations
 */
export async function getPendingRecommendations(
  tenantId: string,
  limit: number = 20
): Promise<StrategyRecommendation[]> {
  const supabase = createServiceRoleClient();
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const { data, error } = await supabase
    .from('strategy_recommendations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .gte('valid_until', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error('[strategy-recommender] Failed to get pending recommendations:', error);
    return [];
  }

  return (data || []).map(mapToRecommendation);
}

/**
 * Get recommendations by type
 */
export async function getRecommendationsByType(
  tenantId: string,
  type: RecommendationType,
  limit: number = 10
): Promise<StrategyRecommendation[]> {
  const supabase = createServiceRoleClient();
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const { data, error } = await supabase
    .from('strategy_recommendations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('recommendation_type', type)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error('[strategy-recommender] Failed to get recommendations by type:', error);
    return [];
  }

  return (data || []).map(mapToRecommendation);
}

/**
 * Get high-priority recommendations
 */
export async function getCriticalRecommendations(
  tenantId: string
): Promise<StrategyRecommendation[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('strategy_recommendations')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('priority', ['critical', 'high'])
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[strategy-recommender] Failed to get critical recommendations:', error);
    return [];
  }

  return (data || []).map(mapToRecommendation);
}

// ============================================================================
// Action Functions
// ============================================================================

/**
 * Accept a recommendation
 */
export async function acceptRecommendation(
  recommendationId: string,
  acceptedBy: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('strategy_recommendations')
    .update({
      status: 'accepted',
      implemented_by: acceptedBy,
    })
    .eq('id', recommendationId);

  return !error;
}

/**
 * Reject a recommendation
 */
export async function rejectRecommendation(
  recommendationId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('strategy_recommendations')
    .update({ status: 'rejected' })
    .eq('id', recommendationId);

  return !error;
}

/**
 * Mark recommendation as implemented
 */
export async function markImplemented(
  recommendationId: string,
  outcome?: Record<string, unknown>
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('strategy_recommendations')
    .update({
      status: 'implemented',
      implemented_at: new Date().toISOString(),
      outcome,
    })
    .eq('id', recommendationId);

  return !error;
}

/**
 * Expire old recommendations
 */
export async function expireOldRecommendations(
  tenantId: string
): Promise<number> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('strategy_recommendations')
    .update({ status: 'expired' })
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .lt('valid_until', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('[strategy-recommender] Failed to expire recommendations:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Get recommendation stats
 */
export async function getRecommendationStats(
  tenantId: string
): Promise<{
  pending: number;
  accepted: number;
  rejected: number;
  implemented: number;
  expired: number;
  byType: Record<string, number>;
}> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('strategy_recommendations')
    .select('status, recommendation_type')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[strategy-recommender] Failed to get stats:', error);
    return {
      pending: 0,
      accepted: 0,
      rejected: 0,
      implemented: 0,
      expired: 0,
      byType: {},
    };
  }

  const stats = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    implemented: 0,
    expired: 0,
    byType: {} as Record<string, number>,
  };

  for (const row of data || []) {
    const status = row.status as RecommendationStatus;
    if (status in stats) {
      stats[status]++;
    }
    const type = row.recommendation_type;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  }

  return stats;
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToRecommendation(row: Record<string, unknown>): StrategyRecommendation {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    recommendationType: row.recommendation_type as RecommendationType,
    title: row.title as string,
    description: row.description as string,
    sourcePatternIds: (row.source_pattern_ids as string[]) || [],
    actionItems: (row.action_items as ActionItem[]) || [],
    expectedImpact: row.expected_impact as ImpactEstimate,
    priority: row.priority as Priority,
    validFrom: new Date(row.valid_from as string),
    validUntil: row.valid_until ? new Date(row.valid_until as string) : undefined,
    status: row.status as RecommendationStatus,
  };
}
