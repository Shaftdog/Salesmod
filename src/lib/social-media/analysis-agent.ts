import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  SocialMediaContext,
  SocialPost,
  PostAnalytics,
  PerformanceInsight,
  AnalysisResult,
  Pattern,
  Recommendation,
  WeeklyPerformance,
  InsightType,
} from '@/lib/types/social-media';

// Schema for analysis results
const PatternSchema = z.object({
  type: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  dataPoints: z.number(),
  actionable: z.boolean(),
});

const RecommendationSchema = z.object({
  type: z.enum(['content', 'timing', 'format', 'topic']),
  priority: z.enum(['high', 'medium', 'low']),
  recommendation: z.string(),
  expectedImpact: z.string(),
  implementation: z.string(),
});

const InsightSchema = z.object({
  insightType: z.enum([
    'best_posting_time', 'top_content_type', 'optimal_post_length',
    'hashtag_performance', 'topic_performance', 'format_performance',
    'audience_insight', 'trend_correlation', 'weekly_pattern'
  ]),
  platform: z.enum(['twitter', 'linkedin']).optional(),
  insight: z.string(),
  recommendation: z.string().optional(),
  confidenceScore: z.number().min(0).max(1),
  potentialImprovement: z.number(),
  details: z.record(z.any()).optional(),
});

const AnalysisResultSchema = z.object({
  insights: z.array(InsightSchema).min(1).max(15),
  patterns: z.array(PatternSchema).max(10),
  recommendations: z.array(RecommendationSchema).min(1).max(10),
  weeklyPerformanceSummary: z.string(),
  topPerformingFactors: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
});

/**
 * Analysis Agent: Tracks engagement, identifies patterns, optimizes performance
 */
export async function runAnalysisAgent(context: SocialMediaContext): Promise<AnalysisResult> {
  // First, fetch analytics data for recent posts
  const analyticsData = await fetchPostAnalytics(context.orgId, context.recentPosts);

  const prompt = buildAnalysisPrompt(context, analyticsData);

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250929'),
      schema: AnalysisResultSchema,
      prompt,
      temperature: 0.3, // Lower temperature for analytical accuracy
    });

    console.log('Analysis completed:', {
      insightsCount: object.insights.length,
      patternsCount: object.patterns.length,
      recommendationsCount: object.recommendations.length,
    });

    // Calculate weekly performance
    const weeklyPerformance = calculateWeeklyPerformance(context.recentPosts, analyticsData);

    // Transform to our types
    const result: AnalysisResult = {
      postsAnalyzed: analyticsData.length,
      insights: object.insights.map(i => ({
        id: crypto.randomUUID(),
        orgId: context.orgId,
        insightType: i.insightType as InsightType,
        platform: i.platform,
        insight: i.insight,
        recommendation: i.recommendation,
        dataPoints: analyticsData.length,
        confidenceScore: i.confidenceScore,
        potentialImprovement: i.potentialImprovement,
        details: i.details,
        status: 'active' as const,
        periodStart: getWeekStart().toISOString(),
        periodEnd: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      patterns: object.patterns as Pattern[],
      recommendations: object.recommendations as Recommendation[],
      weeklyPerformance,
    };

    return result;
  } catch (error: any) {
    console.error('Analysis Agent failed:', error);

    return {
      postsAnalyzed: 0,
      insights: [],
      patterns: [],
      recommendations: [{
        type: 'content',
        priority: 'high',
        recommendation: 'Analysis failed - please check configuration',
        expectedImpact: 'Unable to determine',
        implementation: 'Review error logs and retry',
      }],
      weeklyPerformance: {
        totalPosts: 0,
        totalImpressions: 0,
        totalEngagements: 0,
        avgEngagementRate: 0,
        growthVsPrevious: 0,
      },
    };
  }
}

/**
 * Fetch analytics for posts
 */
async function fetchPostAnalytics(
  orgId: string,
  posts: SocialPost[]
): Promise<(SocialPost & { analytics: PostAnalytics[] })[]> {
  const supabase = await createClient();

  const postIds = posts.map(p => p.id);

  const { data: analyticsData } = await supabase
    .from('post_analytics')
    .select('*')
    .in('post_id', postIds);

  // Merge analytics with posts
  return posts.map(post => ({
    ...post,
    analytics: (analyticsData || [])
      .filter(a => a.post_id === post.id)
      .map(a => ({
        id: a.id,
        postId: a.post_id,
        platform: a.platform,
        impressions: a.impressions || 0,
        reach: a.reach || 0,
        engagements: a.engagements || 0,
        likes: a.likes || 0,
        comments: a.comments || 0,
        shares: a.shares || 0,
        saves: a.saves || 0,
        clicks: a.clicks || 0,
        profileVisits: a.profile_visits || 0,
        follows: a.follows || 0,
        engagementRate: parseFloat(a.engagement_rate) || 0,
        viralityRate: parseFloat(a.virality_rate) || 0,
        hourlySnapshots: a.hourly_snapshots || [],
        audienceDemographics: a.audience_demographics,
        performanceVsAvg: parseFloat(a.performance_vs_avg) || 1,
        lastSyncedAt: a.last_synced_at,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
  }));
}

/**
 * Build analysis prompt
 */
function buildAnalysisPrompt(
  context: SocialMediaContext,
  postsWithAnalytics: (SocialPost & { analytics: PostAnalytics[] })[]
): string {
  const { insights: existingInsights, currentTime } = context;

  // Group posts by various dimensions
  const byContentType = groupBy(postsWithAnalytics, 'contentType');
  const byPlatform = groupByPlatform(postsWithAnalytics);
  const byDayOfWeek = groupByDayOfWeek(postsWithAnalytics);
  const byHour = groupByHour(postsWithAnalytics);

  // Calculate aggregate metrics
  const totalPosts = postsWithAnalytics.length;
  const totalImpressions = sum(postsWithAnalytics, p =>
    p.analytics.reduce((acc, a) => acc + a.impressions, 0)
  );
  const totalEngagements = sum(postsWithAnalytics, p =>
    p.analytics.reduce((acc, a) => acc + a.engagements, 0)
  );
  const avgEngagementRate = totalImpressions > 0
    ? (totalEngagements / totalImpressions) * 100
    : 0;

  // Content type performance
  const contentTypePerformance = Object.entries(byContentType).map(([type, posts]) => {
    const typeEngagements = sum(posts, p =>
      p.analytics.reduce((acc, a) => acc + a.engagements, 0)
    );
    const typeImpressions = sum(posts, p =>
      p.analytics.reduce((acc, a) => acc + a.impressions, 0)
    );
    return {
      type,
      count: posts.length,
      engagementRate: typeImpressions > 0 ? (typeEngagements / typeImpressions) * 100 : 0,
    };
  }).sort((a, b) => b.engagementRate - a.engagementRate);

  // Platform performance
  const platformPerformance = Object.entries(byPlatform).map(([platform, analytics]) => {
    const totalEng = sum(analytics, a => a.engagements);
    const totalImp = sum(analytics, a => a.impressions);
    return {
      platform,
      posts: analytics.length,
      engagementRate: totalImp > 0 ? (totalEng / totalImp) * 100 : 0,
      avgLikes: avg(analytics, a => a.likes),
      avgComments: avg(analytics, a => a.comments),
      avgShares: avg(analytics, a => a.shares),
    };
  });

  // Day of week performance
  const dayPerformance = Object.entries(byDayOfWeek).map(([day, posts]) => {
    const dayEngagements = sum(posts, p =>
      p.analytics.reduce((acc, a) => acc + a.engagements, 0)
    );
    const dayImpressions = sum(posts, p =>
      p.analytics.reduce((acc, a) => acc + a.impressions, 0)
    );
    return {
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
      count: posts.length,
      engagementRate: dayImpressions > 0 ? (dayEngagements / dayImpressions) * 100 : 0,
    };
  }).sort((a, b) => b.engagementRate - a.engagementRate);

  // Hour performance
  const hourPerformance = Object.entries(byHour).map(([hour, posts]) => {
    const hourEngagements = sum(posts, p =>
      p.analytics.reduce((acc, a) => acc + a.engagements, 0)
    );
    const hourImpressions = sum(posts, p =>
      p.analytics.reduce((acc, a) => acc + a.impressions, 0)
    );
    return {
      hour: parseInt(hour),
      count: posts.length,
      engagementRate: hourImpressions > 0 ? (hourEngagements / hourImpressions) * 100 : 0,
    };
  }).sort((a, b) => b.engagementRate - a.engagementRate);

  // Top performing posts
  const topPosts = [...postsWithAnalytics]
    .filter(p => p.analytics.length > 0)
    .sort((a, b) => {
      const aRate = Math.max(...a.analytics.map(an => an.engagementRate));
      const bRate = Math.max(...b.analytics.map(an => an.engagementRate));
      return bRate - aRate;
    })
    .slice(0, 5);

  // Worst performing posts
  const worstPosts = [...postsWithAnalytics]
    .filter(p => p.analytics.length > 0)
    .sort((a, b) => {
      const aRate = Math.max(...a.analytics.map(an => an.engagementRate));
      const bRate = Math.max(...b.analytics.map(an => an.engagementRate));
      return aRate - bRate;
    })
    .slice(0, 5);

  // Existing insights to consider
  const existingInsightsSummary = existingInsights.length > 0 ? `
## Previous Insights (still active)
${existingInsights.slice(0, 5).map(i => `
- ${i.insightType}: ${i.insight}
  Status: ${i.status}, Confidence: ${(i.confidenceScore * 100).toFixed(0)}%
`).join('')}

Consider whether these insights are still valid based on new data.
` : '';

  return `You are a Social Media Analysis Agent for a property appraisal management company. Your job is to analyze post performance, identify patterns, and generate actionable insights.

## Current Date & Time
${currentTime.toISOString()}

## Overall Performance Summary
- Total Posts Analyzed: ${totalPosts}
- Total Impressions: ${totalImpressions.toLocaleString()}
- Total Engagements: ${totalEngagements.toLocaleString()}
- Average Engagement Rate: ${avgEngagementRate.toFixed(2)}%

## Content Type Performance
${contentTypePerformance.map(ct =>
  `- ${ct.type}: ${ct.count} posts, ${ct.engagementRate.toFixed(2)}% engagement`
).join('\n')}

## Platform Performance
${platformPerformance.map(pp =>
  `- ${pp.platform}: ${pp.posts} posts, ${pp.engagementRate.toFixed(2)}% engagement
    Avg Likes: ${pp.avgLikes.toFixed(0)}, Avg Comments: ${pp.avgComments.toFixed(1)}, Avg Shares: ${pp.avgShares.toFixed(1)}`
).join('\n')}

## Day of Week Performance
${dayPerformance.map(dp =>
  `- ${dp.day}: ${dp.count} posts, ${dp.engagementRate.toFixed(2)}% engagement`
).join('\n')}

## Hour Performance (Top 5)
${hourPerformance.slice(0, 5).map(hp =>
  `- ${hp.hour}:00: ${hp.count} posts, ${hp.engagementRate.toFixed(2)}% engagement`
).join('\n')}

## Top Performing Posts
${topPosts.map((post, i) => {
  const bestAnalytics = post.analytics.sort((a, b) => b.engagementRate - a.engagementRate)[0];
  return `
${i + 1}. Type: ${post.contentType} | Platform: ${post.targetPlatforms.join(', ')}
   Engagement Rate: ${(bestAnalytics?.engagementRate * 100 || 0).toFixed(2)}%
   Impressions: ${bestAnalytics?.impressions || 0} | Engagements: ${bestAnalytics?.engagements || 0}
   Content: "${getPostPreview(post)}"
   Published: ${post.publishedAt || 'N/A'}`;
}).join('\n')}

## Worst Performing Posts
${worstPosts.map((post, i) => {
  const worstAnalytics = post.analytics.sort((a, b) => a.engagementRate - b.engagementRate)[0];
  return `
${i + 1}. Type: ${post.contentType} | Platform: ${post.targetPlatforms.join(', ')}
   Engagement Rate: ${(worstAnalytics?.engagementRate * 100 || 0).toFixed(2)}%
   Impressions: ${worstAnalytics?.impressions || 0} | Engagements: ${worstAnalytics?.engagements || 0}
   Content: "${getPostPreview(post)}"`;
}).join('\n')}

${existingInsightsSummary}

## Your Task: Generate Performance Analysis

### 1. Insights (5-15)
Identify specific, actionable insights about:
- **Best Posting Times**: When posts get most engagement
- **Top Content Types**: What types resonate most
- **Optimal Post Length**: Character count sweet spots
- **Hashtag Performance**: Which hashtags drive engagement
- **Topic Performance**: What subjects perform best
- **Format Performance**: Threads vs singles, polls, etc.
- **Audience Insights**: Who's engaging most
- **Weekly Patterns**: Day-by-day trends

Each insight should have:
- Clear, specific finding
- Confidence score (based on data volume)
- Potential improvement percentage
- Platform specificity when relevant

### 2. Patterns (up to 10)
Identify recurring patterns in the data:
- Engagement spikes at certain times
- Content type preferences
- Platform-specific behaviors
- Seasonal or cyclical trends

### 3. Recommendations (1-10)
Provide specific, implementable recommendations:
- What to change
- Why it will help
- How to implement
- Expected impact

Prioritize recommendations by potential impact.

### Analysis Guidelines
- Base insights on statistical significance (minimum 3 data points)
- Higher confidence for larger data sets
- Distinguish correlation from causation
- Consider platform algorithm factors
- Account for external factors (holidays, news events)

Be data-driven, specific, and actionable.`;
}

/**
 * Calculate weekly performance metrics
 */
function calculateWeeklyPerformance(
  posts: SocialPost[],
  postsWithAnalytics: (SocialPost & { analytics: PostAnalytics[] })[]
): WeeklyPerformance {
  const weekStart = getWeekStart();
  const weekPosts = postsWithAnalytics.filter(p =>
    p.publishedAt && new Date(p.publishedAt) >= weekStart
  );

  const totalImpressions = sum(weekPosts, p =>
    p.analytics.reduce((acc, a) => acc + a.impressions, 0)
  );
  const totalEngagements = sum(weekPosts, p =>
    p.analytics.reduce((acc, a) => acc + a.engagements, 0)
  );

  // Find top post
  const topPost = weekPosts.length > 0
    ? weekPosts.sort((a, b) => {
        const aRate = Math.max(...a.analytics.map(an => an.engagementRate), 0);
        const bRate = Math.max(...b.analytics.map(an => an.engagementRate), 0);
        return bRate - aRate;
      })[0]
    : undefined;

  // Find best day
  const dayPerformance = groupByDayOfWeek(weekPosts);
  const bestDay = Object.entries(dayPerformance)
    .sort((a, b) => {
      const aEng = sum(a[1], p => p.analytics.reduce((acc, an) => acc + an.engagements, 0));
      const bEng = sum(b[1], p => p.analytics.reduce((acc, an) => acc + an.engagements, 0));
      return bEng - aEng;
    })[0];

  return {
    totalPosts: weekPosts.length,
    totalImpressions,
    totalEngagements,
    avgEngagementRate: totalImpressions > 0 ? totalEngagements / totalImpressions : 0,
    topPost: topPost ? {
      ...topPost,
      analytics: undefined as any, // Remove analytics from the post object
    } : undefined,
    bestDay: bestDay ? parseInt(bestDay[0]) : undefined,
    growthVsPrevious: 0, // Would need previous week data to calculate
  };
}

// Helper functions
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  return new Date(now.setDate(diff));
}

function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const value = String(item[key] || 'unknown');
    if (!acc[value]) acc[value] = [];
    acc[value].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function groupByPlatform(posts: (SocialPost & { analytics: PostAnalytics[] })[]): Record<string, PostAnalytics[]> {
  const result: Record<string, PostAnalytics[]> = {};
  posts.forEach(post => {
    post.analytics.forEach(analytics => {
      if (!result[analytics.platform]) result[analytics.platform] = [];
      result[analytics.platform].push(analytics);
    });
  });
  return result;
}

function groupByDayOfWeek(posts: (SocialPost & { analytics: PostAnalytics[] })[]): Record<string, (SocialPost & { analytics: PostAnalytics[] })[]> {
  return posts.reduce((acc, post) => {
    const day = post.publishedAt ? new Date(post.publishedAt).getDay().toString() : '0';
    if (!acc[day]) acc[day] = [];
    acc[day].push(post);
    return acc;
  }, {} as Record<string, (SocialPost & { analytics: PostAnalytics[] })[]>);
}

function groupByHour(posts: (SocialPost & { analytics: PostAnalytics[] })[]): Record<string, (SocialPost & { analytics: PostAnalytics[] })[]> {
  return posts.reduce((acc, post) => {
    const hour = post.publishedAt ? new Date(post.publishedAt).getHours().toString() : '12';
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(post);
    return acc;
  }, {} as Record<string, (SocialPost & { analytics: PostAnalytics[] })[]>);
}

function sum<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((acc, item) => acc + fn(item), 0);
}

function avg<T>(items: T[], fn: (item: T) => number): number {
  if (items.length === 0) return 0;
  return sum(items, fn) / items.length;
}

function getPostPreview(post: SocialPost): string {
  const content = post.content.linkedin || post.content.twitter || post.content.both || '';
  return content.substring(0, 100) + (content.length > 100 ? '...' : '');
}

/**
 * Save insights to database
 */
export async function saveInsights(
  orgId: string,
  insights: PerformanceInsight[]
): Promise<string[]> {
  const supabase = await createClient();
  const ids: string[] = [];

  for (const insight of insights) {
    const { data, error } = await supabase
      .from('performance_insights')
      .insert({
        org_id: orgId,
        insight_type: insight.insightType,
        platform: insight.platform,
        insight: insight.insight,
        recommendation: insight.recommendation,
        data_points: insight.dataPoints,
        confidence_score: insight.confidenceScore,
        potential_improvement: insight.potentialImprovement,
        details: insight.details,
        status: 'active',
        period_start: insight.periodStart,
        period_end: insight.periodEnd,
      })
      .select('id')
      .single();

    if (data) {
      ids.push(data.id);
    } else if (error) {
      console.error('Error saving insight:', error);
    }
  }

  return ids;
}
