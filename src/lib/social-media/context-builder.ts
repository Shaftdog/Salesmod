import { createClient } from '@/lib/supabase/server';
import {
  SocialMediaContext,
  SocialMediaAccount,
  BrandVoiceProfile,
  ContentCalendar,
  SocialPost,
  PerformanceInsight,
  TrendingTopic,
  SocialContentTemplate,
} from '@/lib/types/social-media';

/**
 * Build comprehensive context for social media agents
 */
export async function buildSocialMediaContext(orgId: string): Promise<SocialMediaContext> {
  const supabase = await createClient();

  // Fetch all data in parallel for performance
  const [
    accountsResult,
    brandVoiceResult,
    calendarResult,
    recentPostsResult,
    topPostsResult,
    insightsResult,
    topicsResult,
    templatesResult,
  ] = await Promise.all([
    // Social media accounts
    supabase
      .from('social_media_accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true),

    // Default brand voice
    supabase
      .from('brand_voice_profiles')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_default', true)
      .single(),

    // Active calendar
    supabase
      .from('content_calendars')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .single(),

    // Recent posts (last 30 days)
    supabase
      .from('social_posts')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100),

    // Top performing posts (for learning)
    supabase
      .from('social_posts')
      .select(`
        *,
        analytics:post_analytics(*)
      `)
      .eq('org_id', orgId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50),

    // Active insights
    supabase
      .from('performance_insights')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('confidence_score', { ascending: false })
      .limit(20),

    // Active trending topics
    supabase
      .from('trending_topics')
      .select('*')
      .eq('org_id', orgId)
      .in('status', ['identified', 'approved'])
      .order('relevance_score', { ascending: false })
      .limit(30),

    // Active templates
    supabase
      .from('social_content_templates')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('avg_engagement_rate', { ascending: false, nullsFirst: false })
      .limit(50),
  ]);

  // Transform database results to typed objects
  const accounts: SocialMediaAccount[] = (accountsResult.data || []).map(transformAccount);

  const brandVoice: BrandVoiceProfile | null = brandVoiceResult.data
    ? transformBrandVoice(brandVoiceResult.data)
    : null;

  const calendar: ContentCalendar | null = calendarResult.data
    ? transformCalendar(calendarResult.data)
    : null;

  const recentPosts: SocialPost[] = (recentPostsResult.data || []).map(transformPost);

  // Sort top posts by engagement rate from analytics
  const topPerformingPosts: SocialPost[] = (topPostsResult.data || [])
    .filter((post: any) => post.analytics && post.analytics.length > 0)
    .sort((a: any, b: any) => {
      const aRate = Math.max(...a.analytics.map((an: any) => an.engagement_rate || 0));
      const bRate = Math.max(...b.analytics.map((an: any) => an.engagement_rate || 0));
      return bRate - aRate;
    })
    .slice(0, 20)
    .map((post: any) => transformPost(post));

  const insights: PerformanceInsight[] = (insightsResult.data || []).map(transformInsight);

  const trendingTopics: TrendingTopic[] = (topicsResult.data || []).map(transformTopic);

  const templates: SocialContentTemplate[] = (templatesResult.data || []).map(transformTemplate);

  return {
    orgId,
    accounts,
    brandVoice,
    calendar,
    recentPosts,
    topPerformingPosts,
    insights,
    trendingTopics,
    templates,
    currentTime: new Date(),
  };
}

// Transform functions for database to TypeScript type mapping

function transformAccount(data: any): SocialMediaAccount {
  return {
    id: data.id,
    orgId: data.org_id,
    platform: data.platform,
    accountName: data.account_name,
    accountHandle: data.account_handle,
    accountId: data.account_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: data.token_expires_at,
    scopes: data.scopes,
    profileImageUrl: data.profile_image_url,
    followerCount: data.follower_count || 0,
    followingCount: data.following_count || 0,
    isActive: data.is_active,
    lastSyncedAt: data.last_synced_at,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformBrandVoice(data: any): BrandVoiceProfile {
  return {
    id: data.id,
    orgId: data.org_id,
    name: data.name,
    isDefault: data.is_default,
    tone: data.tone || ['professional', 'approachable'],
    personalityTraits: data.personality_traits || ['knowledgeable', 'helpful'],
    topicsToCover: data.topics_to_cover || [],
    topicsToAvoid: data.topics_to_avoid || [],
    preferredFormats: data.preferred_formats || ['educational', 'storytelling'],
    emojiUsage: data.emoji_usage || 'minimal',
    hashtagStrategy: data.hashtag_strategy || 'moderate',
    linkedinStyle: data.linkedin_style || { formal: true, ctaStyle: 'professional' },
    twitterStyle: data.twitter_style || { threads: true, quoteTweets: true },
    examplePosts: data.example_posts || [],
    prohibitedPhrases: data.prohibited_phrases || [],
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformCalendar(data: any): ContentCalendar {
  return {
    id: data.id,
    orgId: data.org_id,
    name: data.name,
    description: data.description,
    timezone: data.timezone || 'America/New_York',
    postingFrequency: data.posting_frequency || {
      linkedin: { postsPerWeek: 5, bestTimes: ['09:00', '12:00', '17:00'] },
      twitter: { postsPerWeek: 14, bestTimes: ['08:00', '12:00', '18:00', '21:00'] },
    },
    contentMix: data.content_mix || {
      educational: 40,
      engagement: 25,
      promotional: 15,
      curated: 10,
      personal: 10,
    },
    contentPillars: data.content_pillars || ['industry_insights', 'how_to', 'case_studies', 'news'],
    brandVoiceId: data.brand_voice_id,
    isActive: data.is_active,
    startDate: data.start_date,
    endDate: data.end_date,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformPost(data: any): SocialPost {
  return {
    id: data.id,
    orgId: data.org_id,
    calendarId: data.calendar_id,
    campaignId: data.campaign_id,
    content: data.content || {},
    twitterConfig: data.twitter_config || { isThread: false, threadCount: 1 },
    linkedinConfig: data.linkedin_config || { isArticle: false },
    mediaUrls: data.media_urls || [],
    mediaTypes: data.media_types || [],
    targetPlatforms: data.target_platforms || [],
    contentType: data.content_type || 'educational',
    contentPillar: data.content_pillar,
    scheduledFor: data.scheduled_for,
    optimalTimeCalculated: data.optimal_time_calculated || false,
    status: data.status || 'draft',
    twitterPostId: data.twitter_post_id,
    twitterUrl: data.twitter_url,
    linkedinPostId: data.linkedin_post_id,
    linkedinUrl: data.linkedin_url,
    publishedAt: data.published_at,
    generatedBy: data.generated_by || 'manual',
    generationPrompt: data.generation_prompt,
    trendingTopicId: data.trending_topic_id,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at,
    rejectionReason: data.rejection_reason,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformInsight(data: any): PerformanceInsight {
  return {
    id: data.id,
    orgId: data.org_id,
    insightType: data.insight_type,
    platform: data.platform,
    insight: data.insight,
    recommendation: data.recommendation,
    dataPoints: data.data_points || 0,
    confidenceScore: parseFloat(data.confidence_score) || 0,
    potentialImprovement: parseFloat(data.potential_improvement) || 1,
    details: data.details,
    status: data.status || 'active',
    appliedAt: data.applied_at,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformTopic(data: any): TrendingTopic {
  return {
    id: data.id,
    orgId: data.org_id,
    topic: data.topic,
    category: data.category,
    relevanceScore: parseFloat(data.relevance_score) || 0.5,
    momentumScore: parseFloat(data.momentum_score) || 0.5,
    competitionScore: parseFloat(data.competition_score) || 0.5,
    contentAngles: data.content_angles || [],
    sources: data.sources || [],
    sourceUrls: data.source_urls || [],
    status: data.status || 'identified',
    expiresAt: data.expires_at,
    usedInPosts: data.used_in_posts || [],
    identifiedAt: data.identified_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformTemplate(data: any): SocialContentTemplate {
  return {
    id: data.id,
    orgId: data.org_id,
    name: data.name,
    description: data.description,
    platform: data.platform,
    contentType: data.content_type,
    template: data.template,
    variables: data.variables || [],
    timesUsed: data.times_used || 0,
    avgEngagementRate: data.avg_engagement_rate ? parseFloat(data.avg_engagement_rate) : undefined,
    isActive: data.is_active,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get context summary for logging/debugging
 */
export function getContextSummary(context: SocialMediaContext): string {
  return `
Social Media Context Summary:
- Accounts: ${context.accounts.length} (${context.accounts.map(a => a.platform).join(', ')})
- Brand Voice: ${context.brandVoice?.name || 'Not configured'}
- Calendar: ${context.calendar?.name || 'Not configured'}
- Recent Posts: ${context.recentPosts.length}
- Top Performing Posts: ${context.topPerformingPosts.length}
- Active Insights: ${context.insights.length}
- Trending Topics: ${context.trendingTopics.length}
- Templates: ${context.templates.length}
- Current Time: ${context.currentTime.toISOString()}
  `.trim();
}
