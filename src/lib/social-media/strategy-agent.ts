import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  SocialMediaContext,
  TrendingTopic,
  CalendarItem,
  StrategyPlan,
  ContentAngle,
  SocialPlatform,
  SocialContentType,
} from '@/lib/types/social-media';

// Schema for trending topic identification
const TrendingTopicSchema = z.object({
  topic: z.string().describe('The trending topic or theme'),
  category: z.enum(['industry', 'general', 'seasonal', 'news', 'evergreen']),
  relevanceScore: z.number().min(0).max(1).describe('How relevant to our industry (0-1)'),
  momentumScore: z.number().min(0).max(1).describe('Is it growing or declining (0-1)'),
  competitionScore: z.number().min(0).max(1).describe('How saturated the topic is (0-1, lower = less competition)'),
  contentAngles: z.array(z.object({
    angle: z.string().describe('Unique perspective or hook for this topic'),
    platform: z.enum(['twitter', 'linkedin']),
    format: z.enum(['thread', 'single_post', 'poll', 'story', 'article', 'carousel']),
    hook: z.string().optional().describe('Opening line or hook'),
    estimatedEngagement: z.enum(['high', 'medium', 'low']),
  })).min(1).max(5),
  sources: z.array(z.string()).describe('Where this trend was identified'),
  expiresAt: z.string().optional().describe('When this topic will no longer be relevant'),
});

// Schema for calendar items
const CalendarItemSchema = z.object({
  scheduledFor: z.string().describe('ISO date string for when to post'),
  platform: z.enum(['twitter', 'linkedin']),
  contentType: z.enum(['educational', 'engagement', 'promotional', 'curated', 'personal', 'news']),
  topic: z.string().describe('Main topic or theme'),
  angle: z.string().describe('Specific angle or perspective'),
  hook: z.string().optional().describe('Opening line to grab attention'),
  priority: z.enum(['high', 'medium', 'low']),
});

// Schema for the complete strategy plan
const StrategyPlanSchema = z.object({
  topics: z.array(TrendingTopicSchema).min(1).max(10),
  calendarItems: z.array(CalendarItemSchema).min(1).max(30),
  recommendations: z.array(z.string()).describe('Strategic recommendations based on analysis'),
  weeklyTheme: z.string().optional().describe('Overarching theme for the week'),
});

export type GeneratedStrategyPlan = z.infer<typeof StrategyPlanSchema>;

/**
 * Strategy Agent: Monitors trends, identifies content angles, builds calendars
 */
export async function runStrategyAgent(context: SocialMediaContext): Promise<StrategyPlan> {
  const prompt = buildStrategyPrompt(context);

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250929'),
      schema: StrategyPlanSchema,
      prompt,
      temperature: 0.7, // Higher creativity for trend identification
    });

    console.log('Strategy Plan generated:', {
      topicsCount: object.topics.length,
      calendarItemsCount: object.calendarItems.length,
      recommendationsCount: object.recommendations.length,
    });

    // Transform to our types
    const plan: StrategyPlan = {
      topics: object.topics.map(t => ({
        id: crypto.randomUUID(),
        orgId: context.orgId,
        topic: t.topic,
        category: t.category,
        relevanceScore: t.relevanceScore,
        momentumScore: t.momentumScore,
        competitionScore: t.competitionScore,
        contentAngles: t.contentAngles as ContentAngle[],
        sources: t.sources,
        sourceUrls: [],
        status: 'identified' as const,
        expiresAt: t.expiresAt,
        usedInPosts: [],
        identifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      calendarItems: object.calendarItems as CalendarItem[],
      recommendations: object.recommendations,
      weeklyTheme: object.weeklyTheme,
    };

    return plan;
  } catch (error: any) {
    console.error('Strategy Agent failed:', error);

    // Return empty plan as fallback
    return {
      topics: [],
      calendarItems: [],
      recommendations: ['Strategy generation failed - please check configuration and try again'],
      weeklyTheme: undefined,
    };
  }
}

/**
 * Build the strategy planning prompt
 */
function buildStrategyPrompt(context: SocialMediaContext): string {
  const {
    accounts,
    brandVoice,
    calendar,
    recentPosts,
    topPerformingPosts,
    insights,
    trendingTopics,
    currentTime,
  } = context;

  // Active platforms
  const platforms = accounts.map(a => a.platform).join(', ') || 'twitter, linkedin';

  // Brand voice summary
  const voiceSummary = brandVoice ? `
Brand Voice: ${brandVoice.name}
- Tone: ${brandVoice.tone.join(', ')}
- Personality: ${brandVoice.personalityTraits.join(', ')}
- Topics to Cover: ${brandVoice.topicsToCover.join(', ') || 'General industry topics'}
- Topics to Avoid: ${brandVoice.topicsToAvoid.join(', ') || 'None specified'}
- Preferred Formats: ${brandVoice.preferredFormats.join(', ')}
- Emoji Usage: ${brandVoice.emojiUsage}
- Hashtag Strategy: ${brandVoice.hashtagStrategy}
` : 'No brand voice configured - use professional, approachable tone';

  // Calendar settings
  const calendarSummary = calendar ? `
Content Calendar: ${calendar.name}
- Posting Frequency: ${JSON.stringify(calendar.postingFrequency)}
- Content Mix Target: ${JSON.stringify(calendar.contentMix)}
- Content Pillars: ${calendar.contentPillars.join(', ')}
` : 'No calendar configured - suggest reasonable defaults';

  // Recent post analysis
  const recentPostSummary = recentPosts.length > 0 ? `
Recent Posts (Last 30 days): ${recentPosts.length}
- Content Types: ${getContentTypeBreakdown(recentPosts)}
- Platforms: ${getPlatformBreakdown(recentPosts)}
` : 'No recent posts - this appears to be a new account';

  // Top performing content
  const topPostsSummary = topPerformingPosts.length > 0 ? `
Top Performing Posts:
${topPerformingPosts.slice(0, 5).map((post, i) => `
${i + 1}. ${post.contentType} on ${post.targetPlatforms.join(', ')}
   Content: ${getPostPreview(post)}
   Pillar: ${post.contentPillar || 'N/A'}
`).join('')}
` : 'No performance data yet - focus on establishing baseline';

  // Performance insights
  const insightsSummary = insights.length > 0 ? `
Active Performance Insights:
${insights.slice(0, 10).map(insight => `
- ${insight.insightType}: ${insight.insight}
  Recommendation: ${insight.recommendation || 'N/A'}
  Confidence: ${(insight.confidenceScore * 100).toFixed(0)}%
`).join('')}
` : 'No insights yet - will generate after publishing posts';

  // Existing trending topics
  const existingTopics = trendingTopics.filter(t => t.status === 'identified' || t.status === 'approved');
  const topicsSummary = existingTopics.length > 0 ? `
Previously Identified Topics (still active):
${existingTopics.slice(0, 5).map(topic => `
- ${topic.topic} (${topic.category})
  Relevance: ${(topic.relevanceScore * 100).toFixed(0)}%, Momentum: ${(topic.momentumScore * 100).toFixed(0)}%
  Status: ${topic.status}
`).join('')}
` : 'No previously identified topics';

  // Calculate what content types are needed
  const contentGaps = calendar ? calculateContentGaps(recentPosts, calendar.contentMix) : null;
  const gapsSummary = contentGaps ? `
Content Gaps (based on target mix):
${Object.entries(contentGaps).map(([type, gap]) => `- ${type}: ${gap > 0 ? `Need ${gap}% more` : 'On target'}`).join('\n')}
` : '';

  return `You are a Social Media Strategy Agent for a property appraisal management company. Your job is to identify trending topics, create compelling content angles, and build an optimized content calendar.

## Current Date & Time
${currentTime.toISOString()}

## Active Platforms
${platforms}

## ${voiceSummary}

## ${calendarSummary}

## ${recentPostSummary}

## ${topPostsSummary}

## ${insightsSummary}

## ${topicsSummary}

## ${gapsSummary}

## Your Task: Create a Strategic Content Plan

### 1. Identify Trending Topics (3-10 topics)
Research and identify topics that are:
- **Relevant**: Connected to real estate, appraisals, property valuation, market trends, lending, investing
- **Timely**: Current trends, news, or seasonal relevance
- **Unique**: Angles competitors aren't covering
- **Actionable**: Topics we can create quality content about

Consider these categories:
- **Industry**: Real estate market trends, appraisal standards, regulation changes
- **Seasonal**: Quarterly/yearly patterns, tax season, buying seasons
- **News**: Current events affecting real estate/finance
- **Evergreen**: Timeless educational content that always performs

For each topic, provide 1-5 content angles with specific platforms and formats.

### 2. Build a Content Calendar (7-30 items)
Create calendar items for the next 7 days. For each item:
- Schedule at optimal times based on insights (or use defaults: LinkedIn 9AM/12PM/5PM, Twitter 8AM/12PM/6PM/9PM)
- Mix content types according to target ratios
- Vary platforms appropriately
- Include engaging hooks that stop the scroll

### 3. Provide Strategic Recommendations
Based on your analysis, provide 3-5 actionable recommendations for:
- Content strategy improvements
- Platform-specific tactics
- Engagement optimization
- Competitive differentiation

### Content Type Guidelines
- **Educational**: Industry insights, how-to's, explainers, tips (40% target)
- **Engagement**: Questions, polls, discussions, hot takes (25% target)
- **Promotional**: Company updates, case studies, testimonials (15% target)
- **Curated**: Sharing industry news, commenting on trends (10% target)
- **Personal**: Behind-the-scenes, team culture, celebrations (10% target)

### Platform Best Practices
**LinkedIn**:
- Professional, value-focused tone
- Longer form content performs well
- Include clear CTAs
- Post 1x per weekday
- Best times: 9AM, 12PM, 5PM EST

**Twitter/X**:
- Concise, punchy messaging
- Threads for complex topics
- Engage with trends/hashtags
- Post 2-3x daily
- Best times: 8AM, 12PM, 6PM, 9PM EST

### IMPORTANT
- Generate fresh angles, not rehashes of existing topics
- Each calendar item should have a specific, actionable hook
- Recommendations should be concrete and implementable
- Consider the content gaps when planning the calendar`;
}

/**
 * Helper: Get content type breakdown from posts
 */
function getContentTypeBreakdown(posts: any[]): string {
  const counts: Record<string, number> = {};
  posts.forEach(post => {
    const type = post.contentType || 'unknown';
    counts[type] = (counts[type] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');
}

/**
 * Helper: Get platform breakdown from posts
 */
function getPlatformBreakdown(posts: any[]): string {
  const counts: Record<string, number> = {};
  posts.forEach(post => {
    (post.targetPlatforms || []).forEach((platform: string) => {
      counts[platform] = (counts[platform] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([platform, count]) => `${platform}: ${count}`)
    .join(', ');
}

/**
 * Helper: Get post content preview
 */
function getPostPreview(post: any): string {
  const content = post.content?.linkedin || post.content?.twitter || post.content?.both || '';
  return content.substring(0, 100) + (content.length > 100 ? '...' : '');
}

/**
 * Helper: Calculate content gaps
 */
function calculateContentGaps(posts: any[], targetMix: Record<string, number>): Record<string, number> {
  const total = posts.length || 1;
  const actual: Record<string, number> = {};

  posts.forEach(post => {
    const type = post.contentType || 'educational';
    actual[type] = (actual[type] || 0) + 1;
  });

  const gaps: Record<string, number> = {};
  Object.entries(targetMix).forEach(([type, target]) => {
    const actualPct = ((actual[type] || 0) / total) * 100;
    gaps[type] = Math.round(target - actualPct);
  });

  return gaps;
}

/**
 * Save generated topics to database
 */
export async function saveTopics(orgId: string, topics: TrendingTopic[]): Promise<string[]> {
  const supabase = await createClient();
  const ids: string[] = [];

  for (const topic of topics) {
    const { data, error } = await supabase
      .from('trending_topics')
      .insert({
        org_id: orgId,
        topic: topic.topic,
        category: topic.category,
        relevance_score: topic.relevanceScore,
        momentum_score: topic.momentumScore,
        competition_score: topic.competitionScore,
        content_angles: topic.contentAngles,
        sources: topic.sources,
        source_urls: topic.sourceUrls,
        status: 'identified',
        expires_at: topic.expiresAt,
      })
      .select('id')
      .single();

    if (data) {
      ids.push(data.id);
    } else if (error) {
      console.error('Error saving topic:', error);
    }
  }

  return ids;
}

/**
 * Save calendar items as draft posts
 */
export async function saveCalendarItems(
  orgId: string,
  calendarId: string | null,
  items: CalendarItem[],
  userId: string
): Promise<string[]> {
  const supabase = await createClient();
  const ids: string[] = [];

  for (const item of items) {
    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        org_id: orgId,
        calendar_id: calendarId,
        content: {
          [item.platform]: item.hook || `[Draft] ${item.topic}: ${item.angle}`,
        },
        target_platforms: [item.platform],
        content_type: item.contentType,
        scheduled_for: item.scheduledFor,
        status: 'draft',
        generated_by: 'strategy_agent',
        generation_prompt: `Topic: ${item.topic}\nAngle: ${item.angle}\nHook: ${item.hook || 'N/A'}`,
        created_by: userId,
      })
      .select('id')
      .single();

    if (data) {
      ids.push(data.id);
    } else if (error) {
      console.error('Error saving calendar item:', error);
    }
  }

  return ids;
}
