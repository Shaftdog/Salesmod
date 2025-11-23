import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishPost, schedulePost } from '@/lib/social-media/publishers';
import { CreateSocialPostInput, UpdateSocialPostInput } from '@/lib/types/social-media';

/**
 * GET /api/social-media/posts
 * List social media posts
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
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const calendarId = searchParams.get('calendarId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('social_posts')
      .select('*, analytics:post_analytics(*)')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (platform) {
      query = query.contains('target_platforms', [platform]);
    }

    if (calendarId) {
      query = query.eq('calendar_id', calendarId);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social-media/posts
 * Create a new social media post
 */
export async function POST(request: NextRequest) {
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

    const body: CreateSocialPostInput = await request.json();

    const { data: post, error } = await supabase
      .from('social_posts')
      .insert({
        org_id: profile.org_id,
        calendar_id: body.calendarId,
        content: body.content,
        target_platforms: body.targetPlatforms,
        content_type: body.contentType || 'educational',
        content_pillar: body.contentPillar,
        scheduled_for: body.scheduledFor,
        media_urls: body.mediaUrls || [],
        media_types: body.mediaTypes || [],
        twitter_config: body.twitterConfig || { isThread: false, threadCount: 1 },
        linkedin_config: body.linkedinConfig || { isArticle: false },
        status: 'draft',
        generated_by: 'manual',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/social-media/posts
 * Update a social media post
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { id, ...updates }: { id: string } & UpdateSocialPostInput = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.content) updateData.content = updates.content;
    if (updates.targetPlatforms) updateData.target_platforms = updates.targetPlatforms;
    if (updates.contentType) updateData.content_type = updates.contentType;
    if (updates.contentPillar) updateData.content_pillar = updates.contentPillar;
    if (updates.scheduledFor) updateData.scheduled_for = updates.scheduledFor;
    if (updates.mediaUrls) updateData.media_urls = updates.mediaUrls;
    if (updates.status) updateData.status = updates.status;
    if (updates.twitterConfig) updateData.twitter_config = updates.twitterConfig;
    if (updates.linkedinConfig) updateData.linkedin_config = updates.linkedinConfig;

    // Handle approval
    if (updates.status === 'approved') {
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    }

    const { data: post, error } = await supabase
      .from('social_posts')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social-media/posts
 * Delete a social media post
 */
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', id)
      .eq('org_id', profile.org_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
