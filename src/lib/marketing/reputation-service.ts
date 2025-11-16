import { createClient } from "@/lib/supabase/server";
import type {
  Review,
  ReviewWithPlatform,
  ReviewPlatform,
  ReviewResponse,
  ResponseTemplate,
  SentimentTrend,
  ReviewFilters,
  ReputationStats,
  PlatformStats,
} from "@/types/reputation";

// Internal type for platform stats aggregation
interface ReviewWithPlatformName {
  platform_id: string;
  rating: number;
  review_date: string;
  platform: { platform_name: string } | null;
}

export class ReputationService {
  /**
   * Get reputation statistics for the dashboard
   */
  static async getReputationStats(orgId: string): Promise<ReputationStats> {
    const supabase = await createClient();

    // Get total reviews and ratings
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("rating, sentiment, is_flagged, created_at")
      .eq("org_id", orgId);

    if (error) throw error;

    const total = reviews?.length || 0;
    if (total === 0) {
      return {
        total_reviews: 0,
        average_rating: 0,
        positive_percentage: 0,
        neutral_percentage: 0,
        negative_percentage: 0,
        flagged_count: 0,
        response_rate: 0,
        trend_direction: 'stable',
      };
    }

    const positive = reviews?.filter(r => r.sentiment === 'positive').length || 0;
    const neutral = reviews?.filter(r => r.sentiment === 'neutral').length || 0;
    const negative = reviews?.filter(r => r.sentiment === 'negative').length || 0;
    const flagged = reviews?.filter(r => r.is_flagged).length || 0;
    const avgRating = reviews?.reduce((sum, r) => sum + r.rating, 0) / total;

    // Get response rate
    const { count: responseCount } = await supabase
      .from("review_responses")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "sent");

    const responseRate = total > 0 ? ((responseCount || 0) / total) * 100 : 0;

    // Calculate trend (compare last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentReviews = reviews?.filter(r => new Date(r.created_at) >= sevenDaysAgo).length || 0;
    const previousReviews = reviews?.filter(r => {
      const date = new Date(r.created_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    }).length || 0;

    let trend_direction: 'up' | 'down' | 'stable' = 'stable';
    if (recentReviews > previousReviews * 1.1) trend_direction = 'up';
    else if (recentReviews < previousReviews * 0.9) trend_direction = 'down';

    return {
      total_reviews: total,
      average_rating: Number(avgRating.toFixed(1)),
      positive_percentage: (positive / total) * 100,
      neutral_percentage: (neutral / total) * 100,
      negative_percentage: (negative / total) * 100,
      flagged_count: flagged,
      response_rate: Number(responseRate.toFixed(1)),
      trend_direction,
    };
  }

  /**
   * Get platform statistics
   */
  static async getPlatformStats(orgId: string): Promise<PlatformStats[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("reviews")
      .select(`
        platform_id,
        rating,
        review_date,
        platform:review_platforms(platform_name)
      `)
      .eq("org_id", orgId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Group by platform
    const platformMap = new Map<string, {
      platform_name: string;
      ratings: number[];
      dates: string[];
    }>();

    data.forEach((review: ReviewWithPlatformName) => {
      const platformId = review.platform_id;
      if (!platformMap.has(platformId)) {
        platformMap.set(platformId, {
          platform_name: review.platform?.platform_name || 'Unknown',
          ratings: [],
          dates: [],
        });
      }
      const platform = platformMap.get(platformId)!;
      platform.ratings.push(review.rating);
      platform.dates.push(review.review_date);
    });

    // Calculate stats for each platform
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return Array.from(platformMap.entries()).map(([platform_id, data]) => {
      const avgRating = data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length;
      const sortedDates = data.dates.sort();
      const lastReviewDate = sortedDates[sortedDates.length - 1] || null;
      const reviewsThisMonth = data.dates.filter(d => new Date(d) >= firstDayOfMonth).length;

      return {
        platform_id,
        platform_name: data.platform_name,
        total_reviews: data.ratings.length,
        average_rating: Number(avgRating.toFixed(1)),
        last_review_date: lastReviewDate,
        review_count_this_month: reviewsThisMonth,
      };
    });
  }

  /**
   * List reviews with filters
   */
  static async listReviews(
    orgId: string,
    filters: ReviewFilters
  ): Promise<{ data: ReviewWithPlatform[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
      .from("reviews")
      .select(`
        *,
        platform:review_platforms(*)
      `, { count: "exact" })
      .eq("org_id", orgId)
      .order("review_date", { ascending: false });

    // Apply filters
    if (filters.platform_id) {
      query = query.eq("platform_id", filters.platform_id);
    }
    if (filters.rating) {
      query = query.eq("rating", filters.rating);
    }
    if (filters.sentiment) {
      query = query.eq("sentiment", filters.sentiment);
    }
    if (filters.is_flagged !== undefined) {
      query = query.eq("is_flagged", filters.is_flagged);
    }
    if (filters.escalated_to) {
      query = query.eq("escalated_to", filters.escalated_to);
    }
    if (filters.start_date) {
      query = query.gte("review_date", filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte("review_date", filters.end_date);
    }
    if (filters.search) {
      // Escape special characters to prevent SQL injection
      const escapedSearch = filters.search.replace(/[%_]/g, '\\$&');
      query = query.or(`review_text.ilike.%${escapedSearch}%,author_name.ilike.%${escapedSearch}%`);
    }

    // Pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data || []) as ReviewWithPlatform[],
      total: count || 0,
    };
  }

  /**
   * Get a single review with responses
   */
  static async getReview(reviewId: string, orgId: string): Promise<ReviewWithPlatform & { responses: ReviewResponse[] }> {
    const supabase = await createClient();

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select(`
        *,
        platform:review_platforms(*),
        responses:review_responses(*)
      `)
      .eq("id", reviewId)
      .eq("org_id", orgId)
      .single();

    if (reviewError) throw reviewError;

    return review as any;
  }

  /**
   * Update review (flag, escalate, etc.)
   */
  static async updateReview(
    reviewId: string,
    orgId: string,
    updates: Partial<Review>
  ): Promise<Review> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("reviews")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get response templates
   */
  static async getResponseTemplates(orgId: string): Promise<ResponseTemplate[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("review_response_templates")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("usage_count", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a response to a review
   */
  static async createResponse(
    reviewId: string,
    orgId: string,
    templateId: string | null,
    responseText: string
  ): Promise<ReviewResponse> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("review_responses")
      .insert({
        org_id: orgId,
        review_id: reviewId,
        template_id: templateId,
        response_text: responseText,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;

    // Increment template usage count with org_id verification
    if (templateId) {
      await supabase
        .from("review_response_templates")
        .update({ usage_count: supabase.raw("usage_count + 1") })
        .eq("id", templateId)
        .eq("org_id", orgId); // Verify template belongs to this org
    }

    return data;
  }

  /**
   * Send a response
   */
  static async sendResponse(
    responseId: string,
    orgId: string,
    userId: string
  ): Promise<ReviewResponse> {
    const supabase = await createClient();

    // In production, this would call the platform's API to post the response
    // For now, we just mark it as sent

    const { data, error } = await supabase
      .from("review_responses")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get sentiment trends
   */
  static async getSentimentTrends(
    orgId: string,
    days: number = 30
  ): Promise<SentimentTrend[]> {
    const supabase = await createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("sentiment_trends")
      .select("*")
      .eq("org_id", orgId)
      .gte("date", startDate.toISOString().split('T')[0])
      .order("date", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get review platforms
   */
  static async getPlatforms(orgId: string): Promise<ReviewPlatform[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("review_platforms")
      .select("*")
      .eq("org_id", orgId)
      .order("platform_name");

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a review platform
   */
  static async createPlatform(
    orgId: string,
    platform: Partial<ReviewPlatform>
  ): Promise<ReviewPlatform> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("review_platforms")
      .insert({
        org_id: orgId,
        ...platform,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Sync reviews from a platform (placeholder for API integration)
   */
  static async syncPlatform(platformId: string, orgId: string): Promise<{ synced: number }> {
    // In production, this would call the platform's API
    // For demo, we'll create mock reviews

    const supabase = await createClient();

    // Update last sync time
    await supabase
      .from("review_platforms")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", platformId)
      .eq("org_id", orgId);

    return { synced: 0 };
  }
}
