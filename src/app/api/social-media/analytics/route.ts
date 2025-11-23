import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/social-media/analytics
 * Get social media analytics overview
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get published posts with analytics
    const { data: posts } = await supabase
      .from('social_posts')
      .select(`
        id,
        content_type,
        target_platforms,
        published_at,
        analytics:post_analytics(*)
      `)
      .eq('org_id', profile.org_id)
      .eq('status', 'published')
      .gte('published_at', startDate);

    // Calculate aggregate metrics
    const analytics = {
      totalPosts: posts?.length || 0,
      totalImpressions: 0,
      totalEngagements: 0,
      totalClicks: 0,
      totalFollows: 0,
      avgEngagementRate: 0,
      platformBreakdown: {} as Record<string, any>,
      contentTypeBreakdown: {} as Record<string, any>,
      topPosts: [] as any[],
    };

    if (posts && posts.length > 0) {
      // Aggregate all analytics
      posts.forEach(post => {
        const postAnalytics = post.analytics || [];
        postAnalytics.forEach((pa: any) => {
          analytics.totalImpressions += pa.impressions || 0;
          analytics.totalEngagements += pa.engagements || 0;
          analytics.totalClicks += pa.clicks || 0;
          analytics.totalFollows += pa.follows || 0;

          // Platform breakdown
          if (!analytics.platformBreakdown[pa.platform]) {
            analytics.platformBreakdown[pa.platform] = {
              posts: 0,
              impressions: 0,
              engagements: 0,
              clicks: 0,
              avgEngagementRate: 0,
            };
          }
          analytics.platformBreakdown[pa.platform].posts++;
          analytics.platformBreakdown[pa.platform].impressions += pa.impressions || 0;
          analytics.platformBreakdown[pa.platform].engagements += pa.engagements || 0;
          analytics.platformBreakdown[pa.platform].clicks += pa.clicks || 0;
        });

        // Content type breakdown
        const contentType = post.content_type || 'unknown';
        if (!analytics.contentTypeBreakdown[contentType]) {
          analytics.contentTypeBreakdown[contentType] = {
            posts: 0,
            impressions: 0,
            engagements: 0,
          };
        }
        analytics.contentTypeBreakdown[contentType].posts++;

        const postTotalImpressions = postAnalytics.reduce(
          (acc: number, pa: any) => acc + (pa.impressions || 0), 0
        );
        const postTotalEngagements = postAnalytics.reduce(
          (acc: number, pa: any) => acc + (pa.engagements || 0), 0
        );

        analytics.contentTypeBreakdown[contentType].impressions += postTotalImpressions;
        analytics.contentTypeBreakdown[contentType].engagements += postTotalEngagements;
      });

      // Calculate averages
      analytics.avgEngagementRate = analytics.totalImpressions > 0
        ? (analytics.totalEngagements / analytics.totalImpressions) * 100
        : 0;

      // Calculate platform average engagement rates
      Object.keys(analytics.platformBreakdown).forEach(platform => {
        const pb = analytics.platformBreakdown[platform];
        pb.avgEngagementRate = pb.impressions > 0
          ? (pb.engagements / pb.impressions) * 100
          : 0;
      });

      // Get top posts by engagement
      const postsWithEngagement = posts.map(post => {
        const totalEngagement = (post.analytics || []).reduce(
          (acc: number, pa: any) => acc + (pa.engagement_rate || 0), 0
        );
        return { ...post, totalEngagement };
      }).sort((a, b) => b.totalEngagement - a.totalEngagement);

      analytics.topPosts = postsWithEngagement.slice(0, 5);
    }

    // Get active insights
    const { data: insights } = await supabase
      .from('performance_insights')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('status', 'active')
      .order('confidence_score', { ascending: false })
      .limit(10);

    // Get upcoming scheduled posts
    const { data: scheduledPosts } = await supabase
      .from('social_posts')
      .select('id, content, target_platforms, scheduled_for, content_type')
      .eq('org_id', profile.org_id)
      .eq('status', 'scheduled')
      .gte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(10);

    return NextResponse.json({
      analytics,
      insights: insights || [],
      scheduledPosts: scheduledPosts || [],
      period: {
        days,
        startDate,
        endDate: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
