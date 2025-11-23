import { createClient } from '@/lib/supabase/server';
import { buildSocialMediaContext, getContextSummary } from './context-builder';
import { runStrategyAgent, saveTopics, saveCalendarItems } from './strategy-agent';
import { runProductionAgent, saveGeneratedPosts, updateDraftPosts } from './production-agent';
import { runAnalysisAgent, saveInsights } from './analysis-agent';
import {
  SocialMediaAgentRun,
  SocialAgentType,
  StrategyPlan,
  ProductionPlan,
  AnalysisResult,
  SocialPost,
} from '@/lib/types/social-media';

/**
 * Transform marketing_content to SocialPost format
 */
function transformMarketingContent(data: any): SocialPost {
  const body = data.body || {};
  const schedules = data.schedules || [];

  const platforms = schedules
    .map((s: any) => s.channel)
    .filter((c: string) => ['linkedin', 'twitter'].includes(c));

  const firstSchedule = schedules[0];

  return {
    id: data.id,
    orgId: data.org_id,
    calendarId: undefined,
    campaignId: data.campaign_id,
    content: {
      twitter: body.short || body.medium || '',
      linkedin: body.long || body.medium || '',
      both: body.medium || '',
    },
    twitterConfig: { isThread: false, threadCount: 1 },
    linkedinConfig: { isArticle: false },
    mediaUrls: data.featured_image_url ? [data.featured_image_url] : [],
    mediaTypes: data.featured_image_url ? ['image'] : [],
    targetPlatforms: platforms.length > 0 ? platforms : ['linkedin', 'twitter'],
    contentType: 'educational',
    contentPillar: data.theme_tags?.[0],
    scheduledFor: firstSchedule?.scheduled_for,
    optimalTimeCalculated: false,
    status: data.status || 'draft',
    twitterPostId: schedules.find((s: any) => s.channel === 'twitter')?.platform_post_id,
    twitterUrl: schedules.find((s: any) => s.channel === 'twitter')?.platform_url,
    linkedinPostId: schedules.find((s: any) => s.channel === 'linkedin')?.platform_post_id,
    linkedinUrl: schedules.find((s: any) => s.channel === 'linkedin')?.platform_url,
    publishedAt: data.published_at,
    generatedBy: 'production_agent',
    generationPrompt: undefined,
    trendingTopicId: undefined,
    approvedBy: data.approved_by,
    approvedAt: undefined,
    rejectionReason: undefined,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

interface OrchestratorResult {
  runId: string;
  agentType: SocialAgentType;
  success: boolean;
  results: {
    strategy?: StrategyPlan;
    production?: ProductionPlan;
    analysis?: AnalysisResult;
  };
  metrics: {
    topicsIdentified: number;
    anglesGenerated: number;
    calendarItemsCreated: number;
    postsDrafted: number;
    postsAnalyzed: number;
    insightsGenerated: number;
  };
  error?: string;
}

/**
 * Run the social media agent orchestrator
 */
export async function runSocialMediaOrchestrator(
  orgId: string,
  userId: string,
  agentType: SocialAgentType = 'full_cycle'
): Promise<OrchestratorResult> {
  const supabase = await createClient();

  // Create run record
  const { data: runData, error: runError } = await supabase
    .from('social_media_agent_runs')
    .insert({
      org_id: orgId,
      agent_type: agentType,
      status: 'running',
    })
    .select('id')
    .single();

  if (runError || !runData) {
    console.error('Failed to create agent run:', runError);
    return {
      runId: '',
      agentType,
      success: false,
      results: {},
      metrics: {
        topicsIdentified: 0,
        anglesGenerated: 0,
        calendarItemsCreated: 0,
        postsDrafted: 0,
        postsAnalyzed: 0,
        insightsGenerated: 0,
      },
      error: 'Failed to create agent run record',
    };
  }

  const runId = runData.id;

  try {
    // Build context
    console.log('Building social media context...');
    const context = await buildSocialMediaContext(orgId);
    console.log(getContextSummary(context));

    const results: OrchestratorResult['results'] = {};
    const metrics = {
      topicsIdentified: 0,
      anglesGenerated: 0,
      calendarItemsCreated: 0,
      postsDrafted: 0,
      postsAnalyzed: 0,
      insightsGenerated: 0,
    };

    // Run appropriate agents based on type
    if (agentType === 'strategy' || agentType === 'full_cycle') {
      console.log('Running Strategy Agent...');
      const strategyPlan = await runStrategyAgent(context);
      results.strategy = strategyPlan;

      // Save topics
      if (strategyPlan.topics.length > 0) {
        const topicIds = await saveTopics(orgId, strategyPlan.topics);
        metrics.topicsIdentified = topicIds.length;
        metrics.anglesGenerated = strategyPlan.topics.reduce(
          (acc, t) => acc + t.contentAngles.length, 0
        );
      }

      // Save calendar items as draft posts
      if (strategyPlan.calendarItems.length > 0) {
        const postIds = await saveCalendarItems(
          orgId,
          context.calendar?.id || null,
          strategyPlan.calendarItems,
          userId
        );
        metrics.calendarItemsCreated = postIds.length;
      }
    }

    if (agentType === 'production' || agentType === 'full_cycle') {
      console.log('Running Production Agent...');

      // Get draft content from marketing_content that needs generation
      const { data: draftContent } = await supabase
        .from('marketing_content')
        .select(`
          *,
          schedules:content_schedule(*)
        `)
        .eq('org_id', orgId)
        .eq('content_type', 'social_post')
        .eq('status', 'draft')
        .order('created_at', { ascending: true })
        .limit(20);

      // Refresh context to include new drafts
      const refreshedContext = await buildSocialMediaContext(orgId);

      // Transform marketing_content to SocialPost format for the agent
      const transformedDrafts: SocialPost[] = (draftContent || []).map(transformMarketingContent);
      const productionPlan = await runProductionAgent(refreshedContext, transformedDrafts);
      results.production = productionPlan;

      // Update draft content with generated content
      if (productionPlan.posts.length > 0 && draftContent && draftContent.length > 0) {
        const updated = await updateDraftPosts(
          productionPlan.posts,
          draftContent.map(p => p.id)
        );
        metrics.postsDrafted = updated;
      } else if (productionPlan.posts.length > 0) {
        // Save as new posts if no drafts
        const postIds = await saveGeneratedPosts(
          orgId,
          context.calendar?.id || null,
          productionPlan.posts,
          userId
        );
        metrics.postsDrafted = postIds.length;
      }
    }

    if (agentType === 'analysis' || agentType === 'full_cycle') {
      console.log('Running Analysis Agent...');

      // Refresh context for analysis
      const analysisContext = await buildSocialMediaContext(orgId);
      const analysisResult = await runAnalysisAgent(analysisContext);
      results.analysis = analysisResult;

      metrics.postsAnalyzed = analysisResult.postsAnalyzed;

      // Save insights
      if (analysisResult.insights.length > 0) {
        const insightIds = await saveInsights(orgId, analysisResult.insights);
        metrics.insightsGenerated = insightIds.length;
      }
    }

    // Update run record with success
    await supabase
      .from('social_media_agent_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results,
        topics_identified: metrics.topicsIdentified,
        angles_generated: metrics.anglesGenerated,
        calendar_items_created: metrics.calendarItemsCreated,
        posts_drafted: metrics.postsDrafted,
        posts_analyzed: metrics.postsAnalyzed,
        insights_generated: metrics.insightsGenerated,
      })
      .eq('id', runId);

    console.log('Social Media Agent run completed successfully:', metrics);

    return {
      runId,
      agentType,
      success: true,
      results,
      metrics,
    };
  } catch (error: any) {
    console.error('Social Media Agent run failed:', error);

    // Update run record with failure
    await supabase
      .from('social_media_agent_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message || 'Unknown error',
      })
      .eq('id', runId);

    return {
      runId,
      agentType,
      success: false,
      results: {},
      metrics: {
        topicsIdentified: 0,
        anglesGenerated: 0,
        calendarItemsCreated: 0,
        postsDrafted: 0,
        postsAnalyzed: 0,
        insightsGenerated: 0,
      },
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Get recent agent runs
 */
export async function getAgentRuns(
  orgId: string,
  limit: number = 10
): Promise<SocialMediaAgentRun[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('social_media_agent_runs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching agent runs:', error);
    return [];
  }

  return (data || []).map(run => ({
    id: run.id,
    orgId: run.org_id,
    agentType: run.agent_type,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    status: run.status,
    errorMessage: run.error_message,
    results: run.results,
    topicsIdentified: run.topics_identified || 0,
    anglesGenerated: run.angles_generated || 0,
    calendarItemsCreated: run.calendar_items_created || 0,
    postsDrafted: run.posts_drafted || 0,
    postsApproved: run.posts_approved || 0,
    postsAnalyzed: run.posts_analyzed || 0,
    insightsGenerated: run.insights_generated || 0,
    patternsIdentified: run.patterns_identified || 0,
    recommendationsMade: run.recommendations_made || 0,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  }));
}

/**
 * Run the weekly performance loop
 * This should be scheduled to run weekly (e.g., every Monday)
 */
export async function runWeeklyPerformanceLoop(
  orgId: string,
  userId: string
): Promise<OrchestratorResult> {
  // Run full cycle with emphasis on analysis
  const result = await runSocialMediaOrchestrator(orgId, userId, 'full_cycle');

  // Additional performance loop logic
  if (result.success && result.results.analysis) {
    const supabase = await createClient();

    // Mark old insights as outdated if replaced by new ones
    const newInsightTypes = result.results.analysis.insights.map(i => i.insightType);
    await supabase
      .from('performance_insights')
      .update({ status: 'outdated' })
      .eq('org_id', orgId)
      .in('insight_type', newInsightTypes)
      .eq('status', 'active')
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    console.log('Weekly performance loop completed - insights refreshed');
  }

  return result;
}

// Helper function to transform database post to TypeScript type
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
