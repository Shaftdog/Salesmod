import { createClient } from '@/lib/supabase/server';
import {
  Campaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignAnalytics,
  CampaignMetrics
} from '@/lib/types/marketing';

/**
 * Create a new campaign
 */
export async function createCampaign(
  orgId: string,
  userId: string,
  data: CreateCampaignInput
): Promise<Campaign | null> {
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      org_id: orgId,
      name: data.name,
      goal: data.goal,
      description: data.description,
      start_date: data.startDate,
      end_date: data.endDate,
      target_role_codes: data.targetRoleCodes,
      target_role_categories: data.targetRoleCategories,
      exclude_role_codes: data.excludeRoleCodes,
      include_tags: data.includeTags,
      exclude_tags: data.excludeTags,
      min_lead_score: data.minLeadScore,
      additional_filters: data.additionalFilters,
      channels: data.channels,
      status: 'draft',
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    return null;
  }

  return campaign as Campaign;
}

/**
 * Get campaign by ID
 */
export async function getCampaign(id: string): Promise<Campaign | null> {
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }

  return campaign as Campaign;
}

/**
 * Update campaign
 */
export async function updateCampaign(
  id: string,
  data: UpdateCampaignInput
): Promise<Campaign | null> {
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.goal !== undefined) updateData.goal = data.goal;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.startDate !== undefined) updateData.start_date = data.startDate;
  if (data.endDate !== undefined) updateData.end_date = data.endDate;
  if (data.targetRoleCodes !== undefined) updateData.target_role_codes = data.targetRoleCodes;
  if (data.targetRoleCategories !== undefined) updateData.target_role_categories = data.targetRoleCategories;
  if (data.excludeRoleCodes !== undefined) updateData.exclude_role_codes = data.excludeRoleCodes;
  if (data.includeTags !== undefined) updateData.include_tags = data.includeTags;
  if (data.excludeTags !== undefined) updateData.exclude_tags = data.excludeTags;
  if (data.minLeadScore !== undefined) updateData.min_lead_score = data.minLeadScore;
  if (data.additionalFilters !== undefined) updateData.additional_filters = data.additionalFilters;
  if (data.channels !== undefined) updateData.channels = data.channels;

  const { data: campaign, error } = await supabase
    .from('marketing_campaigns')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating campaign:', error);
    return null;
  }

  return campaign as Campaign;
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('marketing_campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting campaign:', error);
    return false;
  }

  return true;
}

/**
 * List campaigns for an org
 */
export async function listCampaigns(
  orgId: string,
  filters?: {
    status?: string;
    goal?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Campaign[]> {
  const supabase = await createClient();

  let query = supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.goal) {
    query = query.eq('goal', filters.goal);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data: campaigns, error } = await query;

  if (error) {
    console.error('Error listing campaigns:', error);
    return [];
  }

  return (campaigns || []) as Campaign[];
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(id: string): Promise<CampaignAnalytics | null> {
  const supabase = await createClient();

  // Get campaign
  const campaign = await getCampaign(id);
  if (!campaign) return null;

  // Get content count
  const { count: contentCount } = await supabase
    .from('marketing_content')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', id);

  // Get scheduled content count
  const { count: scheduleCount } = await supabase
    .from('content_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', id);

  // Get email campaign stats
  const { data: emailCampaigns } = await supabase
    .from('email_campaigns')
    .select('metrics')
    .eq('campaign_id', id);

  // Aggregate email metrics
  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;

  emailCampaigns?.forEach(ec => {
    const metrics = ec.metrics as any;
    totalSent += metrics?.sent || 0;
    totalOpened += metrics?.opened || 0;
    totalClicked += metrics?.clicked || 0;
  });

  // TODO: Get leads generated, deals created, revenue attributed
  // This would require tracking conversion attribution

  const analytics: CampaignAnalytics = {
    campaignId: id,
    channel: campaign.channels[0] || 'email',
    impressions: totalSent,
    clicks: totalClicked,
    ctr: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    leadsGenerated: 0, // TODO
    contactsEngaged: totalOpened,
    dealsCreated: 0, // TODO
    revenueAttributed: 0, // TODO
    contentCount: contentCount || 0,
    avgEngagement: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
    lastUpdatedAt: new Date().toISOString(),
  };

  return analytics;
}

/**
 * Update campaign metrics
 */
export async function updateCampaignMetrics(
  id: string,
  metrics: Partial<CampaignMetrics>
): Promise<boolean> {
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from('marketing_campaigns')
    .select('metrics')
    .eq('id', id)
    .single();

  if (!campaign) return false;

  const currentMetrics = (campaign.metrics as CampaignMetrics) || {};
  const updatedMetrics = { ...currentMetrics, ...metrics };

  const { error } = await supabase
    .from('marketing_campaigns')
    .update({ metrics: updatedMetrics })
    .eq('id', id);

  if (error) {
    console.error('Error updating campaign metrics:', error);
    return false;
  }

  return true;
}

/**
 * Get active campaigns
 */
export async function getActiveCampaigns(orgId: string): Promise<Campaign[]> {
  return listCampaigns(orgId, { status: 'active' });
}

/**
 * Archive campaign
 */
export async function archiveCampaign(id: string): Promise<boolean> {
  const campaign = await updateCampaign(id, { status: 'archived' });
  return campaign !== null;
}

/**
 * Activate campaign
 */
export async function activateCampaign(id: string): Promise<boolean> {
  const campaign = await updateCampaign(id, { status: 'active' });
  return campaign !== null;
}
