// =============================================
// SOCIAL MEDIA AGENT SYSTEM TYPES
// =============================================

// =============================================
// PLATFORM TYPES
// =============================================

export const socialPlatforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok'] as const;
export type SocialPlatform = typeof socialPlatforms[number];

// =============================================
// SOCIAL MEDIA ACCOUNT
// =============================================

export interface SocialMediaAccount {
  id: string;
  orgId: string;
  platform: SocialPlatform;
  accountName: string;
  accountHandle?: string;
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scopes?: string[];
  profileImageUrl?: string;
  followerCount: number;
  followingCount: number;
  isActive: boolean;
  lastSyncedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// BRAND VOICE
// =============================================

export const toneOptions = [
  'professional', 'casual', 'authoritative', 'friendly',
  'inspirational', 'educational', 'conversational', 'bold'
] as const;
export type ToneOption = typeof toneOptions[number];

export const emojiUsageOptions = ['none', 'minimal', 'moderate', 'frequent'] as const;
export type EmojiUsage = typeof emojiUsageOptions[number];

export const hashtagStrategyOptions = ['none', 'minimal', 'moderate', 'aggressive'] as const;
export type HashtagStrategy = typeof hashtagStrategyOptions[number];

export interface ExamplePost {
  content: string;
  platform: SocialPlatform;
  performance: 'high' | 'medium' | 'low';
  metrics?: {
    likes?: number;
    shares?: number;
    comments?: number;
  };
}

export interface PlatformStyle {
  formal?: boolean;
  ctaStyle?: string;
  threads?: boolean;
  quoteTweets?: boolean;
  documentPosts?: boolean;
  carousels?: boolean;
}

export interface BrandVoiceProfile {
  id: string;
  orgId: string;
  name: string;
  isDefault: boolean;
  tone: ToneOption[];
  personalityTraits: string[];
  topicsToCover: string[];
  topicsToAvoid: string[];
  preferredFormats: string[];
  emojiUsage: EmojiUsage;
  hashtagStrategy: HashtagStrategy;
  linkedinStyle: PlatformStyle;
  twitterStyle: PlatformStyle;
  examplePosts: ExamplePost[];
  prohibitedPhrases: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// CONTENT CALENDAR
// =============================================

export interface PostingSchedule {
  postsPerWeek: number;
  bestTimes: string[]; // HH:MM format
  preferredDays?: number[]; // 0-6, Sunday-Saturday
}

export interface ContentMix {
  educational: number;
  engagement: number;
  promotional: number;
  curated: number;
  personal: number;
}

export interface ContentCalendar {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  timezone: string;
  postingFrequency: {
    linkedin?: PostingSchedule;
    twitter?: PostingSchedule;
    [key: string]: PostingSchedule | undefined;
  };
  contentMix: ContentMix;
  contentPillars: string[];
  brandVoiceId?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// TRENDING TOPICS
// =============================================

export interface ContentAngle {
  angle: string;
  platform: SocialPlatform;
  format: string;
  hook?: string;
  estimatedEngagement?: 'high' | 'medium' | 'low';
}

export const topicStatuses = ['identified', 'approved', 'used', 'expired', 'rejected'] as const;
export type TopicStatus = typeof topicStatuses[number];

export interface TrendingTopic {
  id: string;
  orgId: string;
  topic: string;
  category?: string;
  relevanceScore: number;
  momentumScore: number;
  competitionScore: number;
  contentAngles: ContentAngle[];
  sources: string[];
  sourceUrls: string[];
  status: TopicStatus;
  expiresAt?: string;
  usedInPosts: string[];
  identifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// SOCIAL POSTS
// =============================================

export const postStatuses = [
  'draft', 'pending_review', 'approved', 'scheduled',
  'publishing', 'published', 'failed', 'archived'
] as const;
export type PostStatus = typeof postStatuses[number];

export const contentTypes = [
  'educational', 'engagement', 'promotional',
  'curated', 'personal', 'news'
] as const;
export type SocialContentType = typeof contentTypes[number];

export const generatedByOptions = [
  'manual', 'strategy_agent', 'production_agent', 'imported'
] as const;
export type GeneratedBy = typeof generatedByOptions[number];

export interface PostContent {
  twitter?: string;
  linkedin?: string;
  both?: string;
}

export interface TwitterConfig {
  isThread: boolean;
  threadCount: number;
  threadContent?: string[];
}

export interface LinkedInConfig {
  isArticle: boolean;
  documentUrl?: string;
  headline?: string;
}

export interface SocialPost {
  id: string;
  orgId: string;
  calendarId?: string;
  campaignId?: string;
  content: PostContent;
  twitterConfig: TwitterConfig;
  linkedinConfig: LinkedInConfig;
  mediaUrls: string[];
  mediaTypes: string[];
  targetPlatforms: SocialPlatform[];
  contentType: SocialContentType;
  contentPillar?: string;
  scheduledFor?: string;
  optimalTimeCalculated: boolean;
  status: PostStatus;
  twitterPostId?: string;
  twitterUrl?: string;
  linkedinPostId?: string;
  linkedinUrl?: string;
  publishedAt?: string;
  generatedBy: GeneratedBy;
  generationPrompt?: string;
  trendingTopicId?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// POST ANALYTICS
// =============================================

export interface HourlySnapshot {
  hour: number;
  impressions: number;
  engagements: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface AudienceDemographics {
  ageRanges?: { [key: string]: number };
  locations?: { [key: string]: number };
  industries?: { [key: string]: number };
}

export interface PostAnalytics {
  id: string;
  postId: string;
  platform: SocialPlatform;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  profileVisits: number;
  follows: number;
  engagementRate: number;
  viralityRate: number;
  hourlySnapshots: HourlySnapshot[];
  audienceDemographics?: AudienceDemographics;
  performanceVsAvg: number;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// PERFORMANCE INSIGHTS
// =============================================

export const insightTypes = [
  'best_posting_time', 'top_content_type', 'optimal_post_length',
  'hashtag_performance', 'topic_performance', 'format_performance',
  'audience_insight', 'trend_correlation', 'weekly_pattern'
] as const;
export type InsightType = typeof insightTypes[number];

export const insightStatuses = ['active', 'applied', 'outdated', 'rejected'] as const;
export type InsightStatus = typeof insightStatuses[number];

export interface PerformanceInsight {
  id: string;
  orgId: string;
  insightType: InsightType;
  platform?: SocialPlatform;
  insight: string;
  recommendation?: string;
  dataPoints: number;
  confidenceScore: number;
  potentialImprovement: number;
  details?: Record<string, any>;
  status: InsightStatus;
  appliedAt?: string;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// AGENT RUN TYPES
// =============================================

export const socialAgentTypes = ['strategy', 'production', 'analysis', 'full_cycle'] as const;
export type SocialAgentType = typeof socialAgentTypes[number];

export const agentRunStatuses = ['running', 'completed', 'failed', 'cancelled'] as const;
export type AgentRunStatus = typeof agentRunStatuses[number];

export interface SocialMediaAgentRun {
  id: string;
  orgId: string;
  agentType: SocialAgentType;
  startedAt: string;
  completedAt?: string;
  status: AgentRunStatus;
  errorMessage?: string;
  results?: Record<string, any>;
  topicsIdentified: number;
  anglesGenerated: number;
  calendarItemsCreated: number;
  postsDrafted: number;
  postsApproved: number;
  postsAnalyzed: number;
  insightsGenerated: number;
  patternsIdentified: number;
  recommendationsMade: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// CONTENT TEMPLATES
// =============================================

export interface SocialContentTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  platform: SocialPlatform;
  contentType: SocialContentType;
  template: string;
  variables: string[];
  timesUsed: number;
  avgEngagementRate?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// AGENT CONTEXT TYPES
// =============================================

export interface SocialMediaContext {
  orgId: string;
  accounts: SocialMediaAccount[];
  brandVoice: BrandVoiceProfile | null;
  calendar: ContentCalendar | null;
  recentPosts: SocialPost[];
  topPerformingPosts: SocialPost[];
  insights: PerformanceInsight[];
  trendingTopics: TrendingTopic[];
  templates: SocialContentTemplate[];
  currentTime: Date;
}

// =============================================
// STRATEGY AGENT TYPES
// =============================================

export interface StrategyPlan {
  topics: TrendingTopic[];
  calendarItems: CalendarItem[];
  recommendations: string[];
  weeklyTheme?: string;
}

export interface CalendarItem {
  scheduledFor: string;
  platform: SocialPlatform;
  contentType: SocialContentType;
  topic: string;
  angle: string;
  hook?: string;
  priority: 'high' | 'medium' | 'low';
}

// =============================================
// PRODUCTION AGENT TYPES
// =============================================

export interface GeneratedPost {
  content: PostContent;
  contentType: SocialContentType;
  targetPlatforms: SocialPlatform[];
  mediaRecommendations?: string[];
  hashtagSuggestions?: string[];
  scheduledFor?: string;
  rationale: string;
}

export interface ProductionPlan {
  posts: GeneratedPost[];
  summary: string;
  brandVoiceAlignment: string;
}

// =============================================
// ANALYSIS AGENT TYPES
// =============================================

export interface AnalysisResult {
  postsAnalyzed: number;
  insights: PerformanceInsight[];
  patterns: Pattern[];
  recommendations: Recommendation[];
  weeklyPerformance: WeeklyPerformance;
}

export interface Pattern {
  type: string;
  description: string;
  confidence: number;
  dataPoints: number;
  actionable: boolean;
}

export interface Recommendation {
  type: 'content' | 'timing' | 'format' | 'topic';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  expectedImpact: string;
  implementation: string;
}

export interface WeeklyPerformance {
  totalPosts: number;
  totalImpressions: number;
  totalEngagements: number;
  avgEngagementRate: number;
  topPost?: SocialPost;
  bestDay?: number;
  bestTime?: string;
  growthVsPrevious: number;
}

// =============================================
// INPUT TYPES
// =============================================

export interface CreateSocialAccountInput {
  platform: SocialPlatform;
  accountName: string;
  accountHandle?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface CreateBrandVoiceInput {
  name: string;
  tone: ToneOption[];
  personalityTraits?: string[];
  topicsToCover?: string[];
  topicsToAvoid?: string[];
  preferredFormats?: string[];
  emojiUsage?: EmojiUsage;
  hashtagStrategy?: HashtagStrategy;
  examplePosts?: ExamplePost[];
  prohibitedPhrases?: string[];
}

export interface CreateCalendarInput {
  name: string;
  description?: string;
  timezone?: string;
  postingFrequency?: ContentCalendar['postingFrequency'];
  contentMix?: ContentMix;
  contentPillars?: string[];
  brandVoiceId?: string;
}

export interface CreateSocialPostInput {
  calendarId?: string;
  content: PostContent;
  targetPlatforms: SocialPlatform[];
  contentType?: SocialContentType;
  contentPillar?: string;
  scheduledFor?: string;
  mediaUrls?: string[];
  mediaTypes?: string[];
  twitterConfig?: Partial<TwitterConfig>;
  linkedinConfig?: Partial<LinkedInConfig>;
}

export interface UpdateSocialPostInput extends Partial<CreateSocialPostInput> {
  status?: PostStatus;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface SocialMediaOverview {
  accounts: SocialMediaAccount[];
  calendars: ContentCalendar[];
  recentPosts: SocialPost[];
  upcomingPosts: SocialPost[];
  weeklyStats: {
    postsPublished: number;
    totalImpressions: number;
    totalEngagements: number;
    avgEngagementRate: number;
  };
  platformPerformance: {
    platform: SocialPlatform;
    postCount: number;
    impressions: number;
    engagements: number;
    engagementRate: number;
  }[];
  topInsights: PerformanceInsight[];
}

export interface CalendarView {
  calendar: ContentCalendar;
  posts: SocialPost[];
  weeklySchedule: {
    [weekStart: string]: {
      [day: number]: SocialPost[];
    };
  };
  contentMixActual: ContentMix;
  coverage: {
    filledSlots: number;
    totalSlots: number;
    percentage: number;
  };
}

export interface PostPerformanceReport {
  post: SocialPost;
  analytics: PostAnalytics[];
  comparisonToBest: number;
  comparisonToAvg: number;
  topEngagementTime?: string;
  audienceResonance: string[];
}
