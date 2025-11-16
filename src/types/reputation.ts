import { z } from "zod";

// Review Platform Types
export const ReviewPlatformSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  platform_name: z.enum(['google', 'yelp', 'facebook', 'zillow', 'trustpilot', 'other']),
  platform_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
  last_sync_at: z.string().datetime().optional().nullable(),
  api_credentials: z.record(z.any()).optional(),
  settings: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ReviewPlatform = z.infer<typeof ReviewPlatformSchema>;

// Review Types
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  platform_id: z.string().uuid(),
  external_id: z.string(),
  author_name: z.string().optional().nullable(),
  author_avatar_url: z.string().url().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().optional().nullable(),
  review_date: z.string().datetime(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional().nullable(),
  sentiment_score: z.number().min(-1).max(1).optional().nullable(),
  is_flagged: z.boolean().default(false),
  flag_reason: z.string().optional().nullable(),
  escalated_to: z.enum(['account_manager', 'legal']).optional().nullable(),
  escalated_at: z.string().datetime().optional().nullable(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Review = z.infer<typeof ReviewSchema>;

export interface ReviewWithPlatform extends Review {
  platform: ReviewPlatform;
}

// Response Template Types
export const ResponseTemplateSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string().min(1),
  scenario: z.enum(['positive_review', 'neutral_review', 'negative_review_service', 'negative_review_quality', 'other']),
  template_text: z.string().min(1),
  variables: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  usage_count: z.number().int().default(0),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ResponseTemplate = z.infer<typeof ResponseTemplateSchema>;

// Review Response Types
export const ReviewResponseSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  review_id: z.string().uuid(),
  template_id: z.string().uuid().optional().nullable(),
  response_text: z.string().min(1),
  sent_at: z.string().datetime().optional().nullable(),
  sent_by: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'sent', 'failed']).default('draft'),
  error_message: z.string().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;

// Sentiment Trend Types
export const SentimentTrendSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  platform_id: z.string().uuid().optional().nullable(),
  total_reviews: z.number().int().default(0),
  positive_count: z.number().int().default(0),
  neutral_count: z.number().int().default(0),
  negative_count: z.number().int().default(0),
  average_rating: z.number().min(1).max(5).optional().nullable(),
  average_sentiment_score: z.number().min(-1).max(1).optional().nullable(),
  flagged_count: z.number().int().default(0),
  responded_count: z.number().int().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type SentimentTrend = z.infer<typeof SentimentTrendSchema>;

// API Request/Response Types
export const CreateReviewPlatformSchema = ReviewPlatformSchema.pick({
  platform_name: true,
  platform_url: true,
  is_active: true,
  api_credentials: true,
  settings: true,
});

export const UpdateReviewPlatformSchema = CreateReviewPlatformSchema.partial();

export const CreateReviewSchema = ReviewSchema.pick({
  platform_id: true,
  external_id: true,
  author_name: true,
  author_avatar_url: true,
  rating: true,
  review_text: true,
  review_date: true,
  metadata: true,
});

export const UpdateReviewSchema = ReviewSchema.pick({
  is_flagged: true,
  flag_reason: true,
  escalated_to: true,
  escalated_at: true,
}).partial();

export const CreateResponseTemplateSchema = ResponseTemplateSchema.pick({
  name: true,
  scenario: true,
  template_text: true,
  variables: true,
  is_active: true,
});

export const UpdateResponseTemplateSchema = CreateResponseTemplateSchema.partial();

export const CreateReviewResponseSchema = ReviewResponseSchema.pick({
  review_id: true,
  template_id: true,
  response_text: true,
});

export const SendReviewResponseSchema = z.object({
  review_id: z.string().uuid(),
  response_id: z.string().uuid(),
});

// Filter/Query Types
export const ReviewFiltersSchema = z.object({
  platform_id: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  is_flagged: z.boolean().optional(),
  escalated_to: z.enum(['account_manager', 'legal']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type ReviewFilters = z.infer<typeof ReviewFiltersSchema>;

// Statistics Types
export interface ReputationStats {
  total_reviews: number;
  average_rating: number;
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
  flagged_count: number;
  response_rate: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface PlatformStats {
  platform_id: string;
  platform_name: string;
  total_reviews: number;
  average_rating: number;
  last_review_date: string | null;
  review_count_this_month: number;
}
