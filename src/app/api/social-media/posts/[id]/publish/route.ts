import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishPost } from '@/lib/social-media/publishers';

/**
 * POST /api/social-media/posts/[id]/publish
 * Publish a specific post immediately
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check post status
    if (!['approved', 'scheduled', 'pending_review'].includes(post.status)) {
      return NextResponse.json(
        { error: `Cannot publish post with status: ${post.status}` },
        { status: 400 }
      );
    }

    // Update status to publishing
    await supabase
      .from('social_posts')
      .update({ status: 'publishing' })
      .eq('id', id);

    // Publish the post
    const transformedPost = {
      id: post.id,
      orgId: post.org_id,
      calendarId: post.calendar_id,
      campaignId: post.campaign_id,
      content: post.content || {},
      twitterConfig: post.twitter_config || { isThread: false, threadCount: 1 },
      linkedinConfig: post.linkedin_config || { isArticle: false },
      mediaUrls: post.media_urls || [],
      mediaTypes: post.media_types || [],
      targetPlatforms: post.target_platforms || [],
      contentType: post.content_type || 'educational',
      contentPillar: post.content_pillar,
      scheduledFor: post.scheduled_for,
      optimalTimeCalculated: post.optimal_time_calculated || false,
      status: post.status,
      twitterPostId: post.twitter_post_id,
      twitterUrl: post.twitter_url,
      linkedinPostId: post.linkedin_post_id,
      linkedinUrl: post.linkedin_url,
      publishedAt: post.published_at,
      generatedBy: post.generated_by || 'manual',
      generationPrompt: post.generation_prompt,
      trendingTopicId: post.trending_topic_id,
      approvedBy: post.approved_by,
      approvedAt: post.approved_at,
      rejectionReason: post.rejection_reason,
      createdBy: post.created_by,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };

    const results = await publishPost(profile.org_id, transformedPost);

    return NextResponse.json({
      success: results.some(r => r.success),
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to publish post' },
      { status: 500 }
    );
  }
}
