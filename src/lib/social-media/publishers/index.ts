import { createClient } from '@/lib/supabase/server';
import { SocialPost, SocialPlatform, SocialMediaAccount } from '@/lib/types/social-media';

export interface PublishResult {
  success: boolean;
  platform: SocialPlatform;
  postId?: string;
  url?: string;
  error?: string;
}

/**
 * Publish a post to all target platforms
 */
export async function publishPost(
  orgId: string,
  post: SocialPost
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  // Get connected accounts
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from('social_media_accounts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true);

  for (const platform of post.targetPlatforms) {
    const account = (accounts || []).find(a => a.platform === platform);

    if (!account) {
      results.push({
        success: false,
        platform,
        error: `No ${platform} account connected`,
      });
      continue;
    }

    // Check token expiration and refresh if needed
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      const refreshed = await refreshToken(account);
      if (!refreshed) {
        results.push({
          success: false,
          platform,
          error: 'Token expired and refresh failed',
        });
        continue;
      }
    }

    // Get content for platform
    const content = post.content[platform] || post.content.both || '';

    if (!content) {
      results.push({
        success: false,
        platform,
        error: 'No content for platform',
      });
      continue;
    }

    // Publish based on platform
    let result: PublishResult;
    switch (platform) {
      case 'twitter':
        result = await publishToTwitter(account, content, post);
        break;
      case 'linkedin':
        result = await publishToLinkedIn(account, content, post);
        break;
      default:
        result = {
          success: false,
          platform,
          error: `Platform ${platform} not yet supported`,
        };
    }

    results.push(result);
  }

  // Update post with publishing results
  const twitterResult = results.find(r => r.platform === 'twitter');
  const linkedinResult = results.find(r => r.platform === 'linkedin');

  const anySuccess = results.some(r => r.success);

  await supabase
    .from('social_posts')
    .update({
      status: anySuccess ? 'published' : 'failed',
      twitter_post_id: twitterResult?.postId,
      twitter_url: twitterResult?.url,
      linkedin_post_id: linkedinResult?.postId,
      linkedin_url: linkedinResult?.url,
      published_at: anySuccess ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', post.id);

  return results;
}

/**
 * Publish to Twitter/X
 */
async function publishToTwitter(
  account: any,
  content: string,
  post: SocialPost
): Promise<PublishResult> {
  try {
    // Twitter API v2 endpoint
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.title || 'Twitter API error');
    }

    const data = await response.json();
    const tweetId = data.data?.id;

    return {
      success: true,
      platform: 'twitter',
      postId: tweetId,
      url: tweetId ? `https://twitter.com/${account.account_handle}/status/${tweetId}` : undefined,
    };
  } catch (error: any) {
    console.error('Twitter publish failed:', error);
    return {
      success: false,
      platform: 'twitter',
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Publish Twitter thread
 */
export async function publishTwitterThread(
  account: any,
  tweets: string[]
): Promise<PublishResult> {
  try {
    let previousTweetId: string | undefined;
    let firstTweetId: string | undefined;

    for (const tweet of tweets) {
      const body: any = { text: tweet };
      if (previousTweetId) {
        body.reply = { in_reply_to_tweet_id: previousTweetId };
      }

      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Thread creation failed');
      }

      const data = await response.json();
      previousTweetId = data.data?.id;

      if (!firstTweetId) {
        firstTweetId = previousTweetId;
      }
    }

    return {
      success: true,
      platform: 'twitter',
      postId: firstTweetId,
      url: firstTweetId
        ? `https://twitter.com/${account.account_handle}/status/${firstTweetId}`
        : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      platform: 'twitter',
      error: error.message,
    };
  }
}

/**
 * Publish to LinkedIn
 */
async function publishToLinkedIn(
  account: any,
  content: string,
  post: SocialPost
): Promise<PublishResult> {
  try {
    // LinkedIn Share API
    const authorUrn = `urn:li:person:${account.account_id}`;

    const postData = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: post.mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
          media: post.mediaUrls.length > 0 ? post.mediaUrls.map(url => ({
            status: 'READY',
            originalUrl: url,
          })) : undefined,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'LinkedIn API error');
    }

    const data = await response.json();
    const postId = data.id;
    // Extract the share ID from the URN
    const shareId = postId?.split(':').pop();

    return {
      success: true,
      platform: 'linkedin',
      postId: shareId,
      url: shareId ? `https://www.linkedin.com/feed/update/${postId}` : undefined,
    };
  } catch (error: any) {
    console.error('LinkedIn publish failed:', error);
    return {
      success: false,
      platform: 'linkedin',
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Refresh OAuth token
 */
async function refreshToken(account: any): Promise<boolean> {
  const supabase = await createClient();

  try {
    let tokenUrl: string;
    let body: URLSearchParams;

    switch (account.platform) {
      case 'twitter':
        tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        body = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
          client_id: process.env.TWITTER_CLIENT_ID || '',
        });
        break;

      case 'linkedin':
        tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
        body = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
          client_id: process.env.LINKEDIN_CLIENT_ID || '',
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
        });
        break;

      default:
        return false;
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Update token in database
    await supabase
      .from('social_media_accounts')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || account.refresh_token,
        token_expires_at: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id);

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Schedule a post for publishing
 */
export async function schedulePost(
  orgId: string,
  postId: string,
  scheduledFor: Date
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('social_posts')
    .update({
      scheduled_for: scheduledFor.toISOString(),
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('org_id', orgId);

  return !error;
}

/**
 * Cancel a scheduled post
 */
export async function cancelScheduledPost(
  orgId: string,
  postId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('social_posts')
    .update({
      status: 'draft',
      scheduled_for: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('org_id', orgId)
    .eq('status', 'scheduled');

  return !error;
}

/**
 * Get posts due for publishing
 */
export async function getPostsDueForPublishing(orgId: string): Promise<SocialPost[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('social_posts')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true });

  return (data || []).map(post => ({
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
    status: post.status || 'scheduled',
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
  }));
}

/**
 * Process scheduled posts (should be called by a cron job)
 */
export async function processScheduledPosts(orgId: string): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const posts = await getPostsDueForPublishing(orgId);
  let succeeded = 0;
  let failed = 0;

  for (const post of posts) {
    const results = await publishPost(orgId, post);
    if (results.some(r => r.success)) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return {
    processed: posts.length,
    succeeded,
    failed,
  };
}
