import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

/**
 * GET /api/agent/learning/dashboard
 * Returns aggregated learning metrics for the agent dashboard
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'User has no tenant_id assigned' },
        { status: 403 }
      );
    }

    // Fetch all feedback from agent_memories
    const { data: allFeedback, error: feedbackError } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .or('key.ilike.%rejection_%,key.ilike.%deletion_%,key.ilike.%batch_%')
      .order('created_at', { ascending: false });

    if (feedbackError) {
      console.error('[Learning Dashboard] Error fetching feedback:', feedbackError);
      return NextResponse.json({ error: feedbackError.message }, { status: 500 });
    }

    // Fetch all cards for success rate calculation
    const { data: allCards, error: cardsError } = await supabase
      .from('kanban_cards')
      .select('id, state, created_at, type')
      .eq('tenant_id', profile.tenant_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: true });

    if (cardsError) {
      console.error('[Learning Dashboard] Error fetching cards:', cardsError);
      return NextResponse.json({ error: cardsError.message }, { status: 500 });
    }

    // Calculate metrics
    const metrics = calculateLearningMetrics(allFeedback || [], allCards || []);

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('[Learning Dashboard] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate learning metrics from feedback and cards data
 */
function calculateLearningMetrics(feedback: any[], cards: any[]) {
  // Total feedback count
  const totalFeedback = feedback.length;

  // Feedback by type
  const rejectionCount = feedback.filter((f) => f.content?.type === 'rejection_feedback').length;
  const deletionCount = feedback.filter((f) => f.content?.type === 'deletion_feedback').length;
  const batchCount = feedback.filter((f) => f.content?.type === 'batch_rejection_feedback').length;

  // Extract rules
  const rulesWithFeedback = feedback
    .filter((f) => f.content?.rule && f.content.rule.length > 0)
    .map((f) => ({
      rule: f.content.rule,
      reason: f.content.reason,
      createdAt: f.created_at,
      importance: f.importance,
      cardType: f.content.card_type,
      isBatch: f.content.type === 'batch_rejection_feedback',
    }));

  const totalRules = rulesWithFeedback.length;

  // Most common rejection reasons
  const reasonCounts = new Map<string, number>();
  feedback.forEach((f) => {
    if (f.content?.reason) {
      const existing = reasonCounts.get(f.content.reason) || 0;
      reasonCounts.set(f.content.reason, existing + 1);
    }
  });

  const topReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Card type distribution in rejections
  const cardTypeCounts = new Map<string, number>();
  feedback.forEach((f) => {
    if (f.content?.card_type) {
      const existing = cardTypeCounts.get(f.content.card_type) || 0;
      cardTypeCounts.set(f.content.card_type, existing + 1);
    }
  });

  const cardTypeDistribution = Array.from(cardTypeCounts.entries())
    .map(([cardType, count]) => ({ cardType, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate success rate over time (last 30 days)
  const now = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const successRateByDay = last30Days.map((date) => {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const cardsOnDay = cards.filter((c) => {
      const cardDate = new Date(c.created_at);
      return cardDate >= dayStart && cardDate < dayEnd;
    });

    const approved = cardsOnDay.filter((c) => c.state === 'approved' || c.state === 'done').length;
    const total = cardsOnDay.length;
    const successRate = total > 0 ? (approved / total) * 100 : 0;

    return {
      date,
      successRate: Math.round(successRate * 10) / 10,
      total,
      approved,
    };
  });

  // Overall success rate
  const totalCardsCreated = cards.length;
  const totalApproved = cards.filter((c) => c.state === 'approved' || c.state === 'done').length;
  const totalRejected = cards.filter((c) => c.state === 'rejected').length;
  const overallSuccessRate = totalCardsCreated > 0 ? (totalApproved / totalCardsCreated) * 100 : 0;

  // Recent feedback (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentFeedback = feedback.filter((f) => new Date(f.created_at) >= sevenDaysAgo);

  // Learning velocity (feedback per day, last 7 days)
  const learningVelocity = recentFeedback.length / 7;

  // Rule effectiveness (how many rules vs total feedback)
  const ruleEffectiveness = totalFeedback > 0 ? (totalRules / totalFeedback) * 100 : 0;

  // Batch operation stats
  const batchOperationsSaved = batchCount * 5; // Estimate 5 cards saved per batch on average

  return {
    overview: {
      totalFeedback,
      totalRules,
      totalCardsCreated,
      totalApproved,
      totalRejected,
      overallSuccessRate: Math.round(overallSuccessRate * 10) / 10,
      learningVelocity: Math.round(learningVelocity * 10) / 10,
      ruleEffectiveness: Math.round(ruleEffectiveness * 10) / 10,
    },
    feedbackBreakdown: {
      rejections: rejectionCount,
      deletions: deletionCount,
      batchOperations: batchCount,
      batchOperationsSaved,
    },
    topReasons,
    cardTypeDistribution,
    successRateByDay,
    recentRules: rulesWithFeedback.slice(0, 10),
    trends: {
      last7Days: recentFeedback.length,
      improvementRate: calculateImprovementRate(successRateByDay),
    },
  };
}

/**
 * Calculate improvement rate based on success rate trend
 */
function calculateImprovementRate(successRateByDay: any[]): number {
  if (successRateByDay.length < 7) return 0;

  // Compare first 7 days vs last 7 days
  const first7 = successRateByDay.slice(0, 7);
  const last7 = successRateByDay.slice(-7);

  const avgFirst = first7.reduce((sum, d) => sum + d.successRate, 0) / first7.length;
  const avgLast = last7.reduce((sum, d) => sum + d.successRate, 0) / last7.length;

  const improvement = avgLast - avgFirst;
  return Math.round(improvement * 10) / 10;
}
