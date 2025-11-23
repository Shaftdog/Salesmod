// Social Media Agent System - Main exports

// Context
export { buildSocialMediaContext, getContextSummary } from './context-builder';

// Agents
export { runStrategyAgent, saveTopics, saveCalendarItems } from './strategy-agent';
export { runProductionAgent, saveGeneratedPosts, updateDraftPosts, generateSinglePost } from './production-agent';
export { runAnalysisAgent, saveInsights } from './analysis-agent';

// Orchestrator
export {
  runSocialMediaOrchestrator,
  getAgentRuns,
  runWeeklyPerformanceLoop,
} from './orchestrator';

// Publishers
export {
  publishPost,
  publishTwitterThread,
  schedulePost,
  cancelScheduledPost,
  getPostsDueForPublishing,
  processScheduledPosts,
} from './publishers';

// Types re-export
export type {
  SocialMediaContext,
  SocialMediaAccount,
  BrandVoiceProfile,
  ContentCalendar,
  TrendingTopic,
  SocialPost,
  PostAnalytics,
  PerformanceInsight,
  SocialMediaAgentRun,
  StrategyPlan,
  ProductionPlan,
  AnalysisResult,
  CalendarItem,
  GeneratedPost,
  Pattern,
  Recommendation,
  WeeklyPerformance,
  SocialPlatform,
  SocialContentType,
  PostStatus,
  InsightType,
  SocialAgentType,
} from '@/lib/types/social-media';
