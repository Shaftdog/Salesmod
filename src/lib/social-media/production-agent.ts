import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  SocialMediaContext,
  SocialPost,
  ProductionPlan,
  GeneratedPost,
  PostContent,
  SocialPlatform,
} from '@/lib/types/social-media';

// Schema for generated post content
const GeneratedPostSchema = z.object({
  content: z.object({
    twitter: z.string().max(280).optional().describe('Twitter post content (max 280 chars)'),
    linkedin: z.string().max(3000).optional().describe('LinkedIn post content (max 3000 chars)'),
  }),
  contentType: z.enum(['educational', 'engagement', 'promotional', 'curated', 'personal', 'news']),
  targetPlatforms: z.array(z.enum(['twitter', 'linkedin'])).min(1),
  mediaRecommendations: z.array(z.string()).optional().describe('Suggested visuals or media'),
  hashtagSuggestions: z.array(z.string()).max(10).optional(),
  rationale: z.string().describe('Why this content will perform well'),
  threadContent: z.array(z.string()).optional().describe('For Twitter threads, additional tweets'),
});

// Schema for production plan
const ProductionPlanSchema = z.object({
  posts: z.array(GeneratedPostSchema).min(1).max(20),
  summary: z.string().describe('Brief summary of the generated content'),
  brandVoiceAlignment: z.string().describe('How content aligns with brand voice'),
});

export type GeneratedProductionPlan = z.infer<typeof ProductionPlanSchema>;

/**
 * Production Agent: Generates platform-native posts maintaining brand voice
 */
export async function runProductionAgent(
  context: SocialMediaContext,
  draftPosts?: SocialPost[]
): Promise<ProductionPlan> {
  const prompt = buildProductionPrompt(context, draftPosts);

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250929'),
      schema: ProductionPlanSchema,
      prompt,
      temperature: 0.6, // Balance creativity with consistency
    });

    console.log('Production Plan generated:', {
      postsCount: object.posts.length,
      summary: object.summary,
    });

    // Transform to our types
    const plan: ProductionPlan = {
      posts: object.posts.map(p => ({
        content: p.content as PostContent,
        contentType: p.contentType,
        targetPlatforms: p.targetPlatforms as SocialPlatform[],
        mediaRecommendations: p.mediaRecommendations,
        hashtagSuggestions: p.hashtagSuggestions,
        rationale: p.rationale,
      })),
      summary: object.summary,
      brandVoiceAlignment: object.brandVoiceAlignment,
    };

    return plan;
  } catch (error: any) {
    console.error('Production Agent failed:', error);

    return {
      posts: [],
      summary: 'Production generation failed - please check configuration and try again',
      brandVoiceAlignment: 'Unable to generate content',
    };
  }
}

/**
 * Build the production prompt
 */
function buildProductionPrompt(context: SocialMediaContext, draftPosts?: SocialPost[]): string {
  const {
    brandVoice,
    topPerformingPosts,
    insights,
    templates,
    currentTime,
  } = context;

  // Brand voice instructions
  const voiceInstructions = brandVoice ? `
## Brand Voice Profile: ${brandVoice.name}

### Tone & Personality
- Tone: ${brandVoice.tone.join(', ')}
- Personality Traits: ${brandVoice.personalityTraits.join(', ')}

### Content Guidelines
- Topics to Cover: ${brandVoice.topicsToCover.join(', ') || 'Real estate, appraisals, property valuation, market trends'}
- Topics to AVOID: ${brandVoice.topicsToAvoid.join(', ') || 'Politics, controversial topics'}
- Prohibited Phrases: ${brandVoice.prohibitedPhrases.join(', ') || 'None'}

### Style Preferences
- Emoji Usage: ${brandVoice.emojiUsage} (none/minimal/moderate/frequent)
- Hashtag Strategy: ${brandVoice.hashtagStrategy}
- Preferred Formats: ${brandVoice.preferredFormats.join(', ')}

### Platform-Specific Style
**LinkedIn**:
- Formal: ${brandVoice.linkedinStyle.formal ? 'Yes' : 'No'}
- CTA Style: ${brandVoice.linkedinStyle.ctaStyle || 'Professional'}

**Twitter**:
- Use Threads: ${brandVoice.twitterStyle.threads ? 'Yes' : 'No'}
- Quote Tweets: ${brandVoice.twitterStyle.quoteTweets ? 'Yes' : 'No'}

### Example High-Performing Posts
${brandVoice.examplePosts.length > 0 ? brandVoice.examplePosts.slice(0, 5).map(ex => `
Platform: ${ex.platform}
Performance: ${ex.performance}
Content: "${ex.content}"
`).join('\n') : 'No examples provided - match professional industry standards'}
` : `
## Brand Voice (Default)
- Tone: Professional, approachable, knowledgeable
- Style: Clear, value-focused, actionable
- Emoji Usage: Minimal
- Hashtag Strategy: Moderate (3-5 relevant hashtags)
`;

  // Top performing content patterns
  const performancePatterns = topPerformingPosts.length > 0 ? `
## Top Performing Content Patterns

These posts performed exceptionally well - learn from their patterns:
${topPerformingPosts.slice(0, 5).map((post, i) => {
  const content = post.content.linkedin || post.content.twitter || '';
  return `
${i + 1}. Type: ${post.contentType} | Platforms: ${post.targetPlatforms.join(', ')}
Content: "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"
`;
}).join('')}

Key patterns to replicate:
- Hook structures that grabbed attention
- Value delivery style
- CTA approaches
- Length and formatting
` : '';

  // Performance insights to apply
  const insightsToApply = insights.filter(i =>
    ['optimal_post_length', 'format_performance', 'hashtag_performance'].includes(i.insightType)
  );
  const insightsSummary = insightsToApply.length > 0 ? `
## Performance Insights to Apply
${insightsToApply.map(insight => `
- ${insight.insight}
  Recommendation: ${insight.recommendation || 'Apply this learning'}
  Confidence: ${(insight.confidenceScore * 100).toFixed(0)}%
`).join('')}
` : '';

  // Templates to consider
  const templatesSummary = templates.length > 0 ? `
## Available Templates
${templates.slice(0, 5).map(t => `
- ${t.name} (${t.platform}/${t.contentType})
  Template: "${t.template.substring(0, 100)}..."
  Performance: ${t.avgEngagementRate ? `${(t.avgEngagementRate * 100).toFixed(2)}% engagement` : 'No data'}
`).join('')}
` : '';

  // Draft posts to refine
  const draftsSummary = draftPosts && draftPosts.length > 0 ? `
## Draft Posts to Refine

These drafts from the Strategy Agent need full content generation:
${draftPosts.map((post, i) => `
${i + 1}. Type: ${post.contentType} | Platform: ${post.targetPlatforms.join(', ')}
   Scheduled: ${post.scheduledFor || 'Not scheduled'}
   Prompt: ${post.generationPrompt || 'No prompt'}
   Current Draft: ${getPostPreview(post)}
`).join('')}

Generate complete, publish-ready content for each of these drafts.
` : `
## Task: Generate Fresh Content

Generate 5-10 high-quality posts covering different content types and platforms.
Focus on providing immediate value to the audience.
`;

  return `You are a Social Media Production Agent for a property appraisal management company. Your job is to generate high-quality, platform-native content that maintains brand voice consistency and maximizes engagement.

## Current Date & Time
${currentTime.toISOString()}

${voiceInstructions}

${performancePatterns}

${insightsSummary}

${templatesSummary}

${draftsSummary}

## Your Task: Generate Publish-Ready Content

### Content Requirements

For each post, you MUST:
1. **Match the brand voice exactly** - tone, style, emoji usage
2. **Optimize for platform** - Twitter (280 chars), LinkedIn (longer form)
3. **Include a strong hook** - First line must stop the scroll
4. **Deliver clear value** - Educational, entertaining, or actionable
5. **End with a CTA** - Question, invitation to engage, or clear next step

### Platform-Specific Guidelines

**Twitter (280 characters max)**:
- Punchy, concise messaging
- One clear idea per tweet
- Use line breaks for readability
- Hashtags: 1-3 relevant tags
- If topic needs depth, create a thread (2-5 tweets)

**LinkedIn (up to 3000 characters)**:
- Professional but personable
- Start with a hook (first 2 lines visible before "see more")
- Use short paragraphs (2-3 sentences)
- Add line breaks for scannability
- End with engagement question
- Hashtags: 3-5 at the end

### Content Type Expectations

**Educational (40% of content)**:
- Industry insights, trends, data
- How-to guides, tips, best practices
- Common misconceptions debunked
- Expert perspectives

**Engagement (25% of content)**:
- Thought-provoking questions
- Polls and opinions
- Hot takes (professional)
- Discussion starters

**Promotional (15% of content)**:
- Company achievements
- Case studies
- Service highlights
- Team spotlights

**Curated (10% of content)**:
- Industry news commentary
- Sharing valuable resources
- Expert quotes with insights

**Personal (10% of content)**:
- Behind-the-scenes
- Team culture
- Professional milestones
- Industry event recaps

### Quality Checklist
- [ ] Hook grabs attention in first line
- [ ] Content provides clear value
- [ ] Matches brand voice exactly
- [ ] Platform-appropriate length
- [ ] Includes relevant hashtags
- [ ] Has clear CTA
- [ ] No prohibited phrases
- [ ] Appropriate emoji usage

### Media Recommendations
For each post, suggest appropriate media:
- Stock photo descriptions
- Custom graphic ideas
- Infographic concepts
- Screenshot suggestions

Generate content that will perform well while staying authentic to the brand.`;
}

/**
 * Helper: Get post content preview
 */
function getPostPreview(post: SocialPost): string {
  const content = post.content.linkedin || post.content.twitter || post.content.both || '';
  return content.substring(0, 150) + (content.length > 150 ? '...' : '');
}

/**
 * Save generated posts to marketing_content
 */
export async function saveGeneratedPosts(
  orgId: string,
  calendarId: string | null,
  posts: GeneratedPost[],
  userId: string
): Promise<string[]> {
  const supabase = await createClient();
  const ids: string[] = [];

  for (const post of posts) {
    // Map content type to funnel stage
    const funnelStage = mapToFunnelStage(post.contentType);

    // Create marketing_content entry
    const { data: content, error: contentError } = await supabase
      .from('marketing_content')
      .insert({
        org_id: orgId,
        title: generateTitle(post),
        content_type: 'social_post',
        body: {
          short: post.content.twitter || '',
          medium: post.content.twitter || post.content.linkedin?.substring(0, 500) || '',
          long: post.content.linkedin || '',
        },
        audience_tags: [],
        theme_tags: post.hashtagSuggestions?.slice(0, 5) || [],
        funnel_stage: funnelStage,
        status: 'needs_review',
        preview_text: post.rationale,
        created_by: userId,
      })
      .select('id')
      .single();

    if (contentError) {
      console.error('Error saving generated post to marketing_content:', contentError);
      continue;
    }

    if (content) {
      ids.push(content.id);

      // Create content_schedule entries for each platform
      for (const platform of post.targetPlatforms) {
        await supabase
          .from('content_schedule')
          .insert({
            org_id: orgId,
            content_id: content.id,
            channel: platform,
            scheduled_for: post.scheduledFor || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'scheduled',
            created_by: userId,
          });
      }
    }
  }

  return ids;
}

/**
 * Generate a title from post content
 */
function generateTitle(post: GeneratedPost): string {
  const content = post.content.twitter || post.content.linkedin || '';
  // Get first sentence or first 50 chars
  const firstSentence = content.split(/[.!?]/)[0] || content.substring(0, 50);
  return firstSentence.trim().substring(0, 100);
}

/**
 * Map content type to funnel stage
 */
function mapToFunnelStage(contentType: string): string {
  switch (contentType) {
    case 'educational':
    case 'curated':
      return 'awareness';
    case 'engagement':
      return 'consideration';
    case 'promotional':
      return 'conversion';
    case 'personal':
      return 'retention';
    default:
      return 'awareness';
  }
}

/**
 * Update existing draft posts (marketing_content) with generated content
 */
export async function updateDraftPosts(
  posts: GeneratedPost[],
  draftPostIds: string[]
): Promise<number> {
  const supabase = await createClient();
  let updated = 0;

  for (let i = 0; i < Math.min(posts.length, draftPostIds.length); i++) {
    const post = posts[i];
    const draftId = draftPostIds[i];

    const { error } = await supabase
      .from('marketing_content')
      .update({
        body: {
          short: post.content.twitter || '',
          medium: post.content.twitter || post.content.linkedin?.substring(0, 500) || '',
          long: post.content.linkedin || '',
        },
        theme_tags: post.hashtagSuggestions?.slice(0, 5) || [],
        status: 'needs_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId);

    if (!error) {
      updated++;
    } else {
      console.error('Error updating draft post in marketing_content:', error);
    }
  }

  return updated;
}

/**
 * Generate content for a single post
 */
export async function generateSinglePost(
  context: SocialMediaContext,
  prompt: string,
  platforms: SocialPlatform[],
  contentType: string
): Promise<GeneratedPost | null> {
  const singlePostSchema = z.object({
    content: z.object({
      twitter: z.string().max(280).optional(),
      linkedin: z.string().max(3000).optional(),
    }),
    mediaRecommendations: z.array(z.string()).optional(),
    hashtagSuggestions: z.array(z.string()).max(10).optional(),
    rationale: z.string(),
  });

  try {
    const brandVoice = context.brandVoice;
    const systemPrompt = `You are a social media content writer for a property appraisal company.
Brand voice: ${brandVoice?.tone.join(', ') || 'Professional, approachable'}
Emoji usage: ${brandVoice?.emojiUsage || 'minimal'}
Hashtag strategy: ${brandVoice?.hashtagStrategy || 'moderate'}

Generate a ${contentType} post for ${platforms.join(' and ')} based on this prompt:
${prompt}

Make it engaging, valuable, and on-brand.`;

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250929'),
      schema: singlePostSchema,
      prompt: systemPrompt,
      temperature: 0.6,
    });

    return {
      content: object.content as PostContent,
      contentType: contentType as any,
      targetPlatforms: platforms,
      mediaRecommendations: object.mediaRecommendations,
      hashtagSuggestions: object.hashtagSuggestions,
      rationale: object.rationale,
    };
  } catch (error) {
    console.error('Single post generation failed:', error);
    return null;
  }
}
