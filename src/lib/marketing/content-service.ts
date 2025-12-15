import { createClient } from '@/lib/supabase/server';
import {
  MarketingContent,
  CreateContentInput,
  UpdateContentInput,
  ContentSchedule,
  ScheduleContentInput
} from '@/lib/types/marketing';

/**
 * Create new content
 */
export async function createContent(
  orgId: string,
  userId: string,
  data: CreateContentInput
): Promise<MarketingContent | null> {
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from('marketing_content')
    .insert({
      org_id: orgId,
      campaign_id: data.campaignId,
      title: data.title,
      content_type: data.contentType,
      body: data.body,
      audience_tags: data.audienceTags || [],
      theme_tags: data.themeTags || [],
      funnel_stage: data.funnelStage,
      featured_image_url: data.featuredImageUrl,
      preview_text: data.previewText,
      status: 'draft',
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating content:', error);
    return null;
  }

  return content as MarketingContent;
}

/**
 * Get content by ID
 */
export async function getContent(id: string): Promise<MarketingContent | null> {
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from('marketing_content')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching content:', error);
    return null;
  }

  return content as MarketingContent;
}

/**
 * Update content
 */
export async function updateContent(
  id: string,
  data: UpdateContentInput
): Promise<MarketingContent | null> {
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.contentType !== undefined) updateData.content_type = data.contentType;
  if (data.body !== undefined) updateData.body = data.body;
  if (data.campaignId !== undefined) updateData.campaign_id = data.campaignId;
  if (data.audienceTags !== undefined) updateData.audience_tags = data.audienceTags;
  if (data.themeTags !== undefined) updateData.theme_tags = data.themeTags;
  if (data.funnelStage !== undefined) updateData.funnel_stage = data.funnelStage;
  if (data.featuredImageUrl !== undefined) updateData.featured_image_url = data.featuredImageUrl;
  if (data.previewText !== undefined) updateData.preview_text = data.previewText;
  if (data.status !== undefined) updateData.status = data.status;

  const { data: content, error } = await supabase
    .from('marketing_content')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating content:', error);
    return null;
  }

  return content as MarketingContent;
}

/**
 * List content for an org
 */
export async function listContent(
  orgId: string,
  filters?: {
    status?: string;
    contentType?: string;
    campaignId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<MarketingContent[]> {
  const supabase = await createClient();

  let query = supabase
    .from('marketing_content')
    .select('*, campaign:marketing_campaigns(name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.contentType) {
    query = query.eq('content_type', filters.contentType);
  }

  if (filters?.campaignId) {
    query = query.eq('campaign_id', filters.campaignId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data: content, error } = await query;

  if (error) {
    console.error('Error listing content:', error);
    return [];
  }

  return (content || []) as MarketingContent[];
}

/**
 * Approve content
 */
export async function approveContent(
  id: string,
  approverId: string
): Promise<MarketingContent | null> {
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from('marketing_content')
    .update({
      status: 'approved',
      approved_by: approverId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error approving content:', error);
    return null;
  }

  return content as MarketingContent;
}

/**
 * Schedule content for publishing
 */
export async function scheduleContent(
  orgId: string,
  userId: string,
  data: ScheduleContentInput
): Promise<ContentSchedule | null> {
  const supabase = await createClient();

  const { data: schedule, error } = await supabase
    .from('content_schedule')
    .insert({
      org_id: orgId,
      content_id: data.contentId,
      campaign_id: data.campaignId,
      channel: data.channel,
      scheduled_for: data.scheduledFor,
      status: 'scheduled',
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error scheduling content:', error);
    return null;
  }

  return schedule as ContentSchedule;
}

/**
 * Get content schedule
 */
export async function getContentSchedule(
  orgId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    channel?: string;
    status?: string;
  }
): Promise<ContentSchedule[]> {
  const supabase = await createClient();

  let query = supabase
    .from('content_schedule')
    .select('*, content:marketing_content(*), campaign:marketing_campaigns(name)')
    .eq('org_id', orgId)
    .order('scheduled_for', { ascending: true });

  if (filters?.startDate) {
    query = query.gte('scheduled_for', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('scheduled_for', filters.endDate);
  }

  if (filters?.channel) {
    query = query.eq('channel', filters.channel);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data: schedules, error } = await query;

  if (error) {
    console.error('Error fetching content schedule:', error);
    return [];
  }

  return (schedules || []) as ContentSchedule[];
}

/**
 * Mark content as published
 */
export async function markContentPublished(
  scheduleId: string,
  platformPostId?: string,
  platformUrl?: string
): Promise<ContentSchedule | null> {
  const supabase = await createClient();

  const { data: schedule, error } = await supabase
    .from('content_schedule')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      platform_post_id: platformPostId,
      platform_url: platformUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)
    .select()
    .single();

  if (error) {
    console.error('Error marking content as published:', error);
    return null;
  }

  // Also update the content status
  if (schedule) {
    await supabase
      .from('marketing_content')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', schedule.content_id);
  }

  return schedule as ContentSchedule;
}

/**
 * Delete content
 */
export async function deleteContent(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('marketing_content')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting content:', error);
    return false;
  }

  return true;
}
