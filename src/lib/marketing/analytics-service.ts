import { createClient } from '@/lib/supabase/server';

export interface CampaignROIData {
  campaignId: string;
  campaignName: string;
  startDate: string;
  invested: number; // Time/resources invested
  leads: number;
  deals: number;
  revenue: number;
  roi: number; // Return on investment percentage
}

export interface ContentPerformanceData {
  contentId: string;
  title: string;
  contentType: string;
  channel: string;
  publishedAt: string;
  impressions: number;
  clicks: number;
  engagement: number;
  ctr: number;
}

export interface ChannelPerformance {
  channel: string;
  totalContent: number;
  totalImpressions: number;
  totalClicks: number;
  avgEngagement: number;
}

export interface AttributionFunnelData {
  stage: string;
  count: number;
  conversionRate: number;
}

export interface MarketingOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  hotLeads: number;
  totalContent: number;
  totalRevenue: number;
  avgEngagement: number;
}

/**
 * Get marketing overview stats
 */
export async function getMarketingOverview(orgId: string): Promise<MarketingOverview> {
  const supabase = await createClient();

  // Get campaign counts
  const { count: totalCampaigns } = await supabase
    .from('marketing_campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  const { count: activeCampaigns } = await supabase
    .from('marketing_campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active');

  // Get lead scoring stats
  const { data: leadScores } = await supabase
    .from('lead_scores')
    .select('total_score, label')
    .gte('total_score', 0);

  const totalLeads = leadScores?.length || 0;
  const hotLeads = leadScores?.filter(l => l.label === 'hot').length || 0;

  // Get content count
  const { count: totalContent } = await supabase
    .from('marketing_content')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'published');

  // Get campaigns with metrics
  const { data: campaigns } = await supabase
    .from('marketing_campaigns')
    .select('metrics')
    .eq('org_id', orgId);

  let totalRevenue = 0;
  let totalEngagement = 0;
  let engagementCount = 0;

  campaigns?.forEach(campaign => {
    const metrics = campaign.metrics as any;
    if (metrics?.revenue) totalRevenue += metrics.revenue;
    if (metrics?.avgEngagement) {
      totalEngagement += metrics.avgEngagement;
      engagementCount++;
    }
  });

  return {
    totalCampaigns: totalCampaigns || 0,
    activeCampaigns: activeCampaigns || 0,
    totalLeads,
    hotLeads,
    totalContent: totalContent || 0,
    totalRevenue,
    avgEngagement: engagementCount > 0 ? totalEngagement / engagementCount : 0,
  };
}

/**
 * Get campaign ROI data over time
 */
export async function getCampaignROI(orgId: string, last30Days: boolean = true): Promise<CampaignROIData[]> {
  const supabase = await createClient();

  let query = supabase
    .from('marketing_campaigns')
    .select('id, name, start_date, metrics, created_at')
    .eq('org_id', orgId)
    .order('start_date', { ascending: false });

  if (last30Days) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query.gte('start_date', thirtyDaysAgo.toISOString());
  }

  const { data: campaigns } = await query;

  if (!campaigns) return [];

  return campaigns.map(campaign => {
    const metrics = campaign.metrics as any || {};
    const revenue = metrics.revenue || 0;
    const invested = 1000; // Placeholder - would calculate from actual resources
    const roi = invested > 0 ? ((revenue - invested) / invested) * 100 : 0;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      startDate: campaign.start_date,
      invested,
      leads: metrics.leads || 0,
      deals: metrics.deals || 0,
      revenue,
      roi,
    };
  });
}

/**
 * Get content performance data
 */
export async function getContentPerformance(orgId: string): Promise<ContentPerformanceData[]> {
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from('content_schedule')
    .select(`
      id,
      channel,
      published_at,
      engagement_metrics,
      content:marketing_content(
        id,
        title,
        content_type
      )
    `)
    .eq('org_id', orgId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (!schedules) return [];

  return schedules.map(schedule => {
    const metrics = schedule.engagement_metrics as any || {};
    const impressions = metrics.impressions || metrics.views || 0;
    const clicks = metrics.clicks || 0;
    const engagement = metrics.likes + metrics.shares + metrics.comments || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return {
      contentId: (Array.isArray(schedule.content) ? schedule.content[0]?.id : (schedule.content as any)?.id) || schedule.id,
      title: (Array.isArray(schedule.content) ? schedule.content[0]?.title : (schedule.content as any)?.title) || 'Untitled',
      contentType: (Array.isArray(schedule.content) ? schedule.content[0]?.content_type : (schedule.content as any)?.content_type) || 'unknown',
      channel: schedule.channel,
      publishedAt: schedule.published_at,
      impressions,
      clicks,
      engagement,
      ctr,
    };
  });
}

/**
 * Get channel performance summary
 */
export async function getChannelPerformance(orgId: string): Promise<ChannelPerformance[]> {
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from('content_schedule')
    .select('channel, engagement_metrics')
    .eq('org_id', orgId)
    .eq('status', 'published');

  if (!schedules) return [];

  // Group by channel
  const channelMap = new Map<string, {
    count: number;
    totalImpressions: number;
    totalClicks: number;
    totalEngagement: number;
  }>();

  schedules.forEach(schedule => {
    const channel = schedule.channel;
    const metrics = schedule.engagement_metrics as any || {};

    const impressions = metrics.impressions || metrics.views || 0;
    const clicks = metrics.clicks || 0;
    const engagement = (metrics.likes || 0) + (metrics.shares || 0) + (metrics.comments || 0);

    if (!channelMap.has(channel)) {
      channelMap.set(channel, {
        count: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalEngagement: 0,
      });
    }

    const channelData = channelMap.get(channel)!;
    channelData.count++;
    channelData.totalImpressions += impressions;
    channelData.totalClicks += clicks;
    channelData.totalEngagement += engagement;
  });

  return Array.from(channelMap.entries()).map(([channel, data]) => ({
    channel,
    totalContent: data.count,
    totalImpressions: data.totalImpressions,
    totalClicks: data.totalClicks,
    avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0,
  }));
}

/**
 * Get attribution funnel data
 */
export async function getAttributionFunnel(orgId: string): Promise<AttributionFunnelData[]> {
  const supabase = await createClient();

  // Get all contacts with their lead scores
  const { data: contacts } = await supabase
    .from('contacts')
    .select(`
      id,
      client:clients!inner(org_id),
      lead_score:lead_scores(total_score, label)
    `)
    .eq('client.org_id', orgId);

  if (!contacts) return [];

  // Get contacts who have engaged (opened emails, clicked, etc.)
  const { data: emailSends } = await supabase
    .from('email_sends')
    .select('contact_id, opened_at, first_click_at')
    .in('contact_id', contacts.map(c => c.id));

  const engagedContacts = new Set(
    emailSends?.filter(e => e.opened_at || e.first_click_at).map(e => e.contact_id) || []
  );

  // Get qualified leads (warm + hot)
  const qualifiedLeads = contacts.filter(c => {
    if (!c.lead_score) return false;
    const label = Array.isArray(c.lead_score) ? c.lead_score[0]?.label : (c.lead_score as any)?.label;
    return label && ['warm', 'hot'].includes(label);
  });

  // Get hot leads ready for sales
  const hotLeads = contacts.filter(c => {
    if (!c.lead_score) return false;
    const label = Array.isArray(c.lead_score) ? c.lead_score[0]?.label : (c.lead_score as any)?.label;
    return label === 'hot';
  });

  // Get contacts with deals
  const { data: deals } = await supabase
    .from('deals')
    .select('contact_id')
    .in('contact_id', contacts.map(c => c.id));

  const contactsWithDeals = new Set(deals?.map(d => d.contact_id) || []);

  // Get won deals
  const { data: wonDeals } = await supabase
    .from('deals')
    .select('contact_id')
    .in('contact_id', contacts.map(c => c.id))
    .eq('stage', 'won');

  const totalContacts = contacts.length;

  return [
    {
      stage: 'Total Contacts',
      count: totalContacts,
      conversionRate: 100,
    },
    {
      stage: 'Engaged',
      count: engagedContacts.size,
      conversionRate: totalContacts > 0 ? (engagedContacts.size / totalContacts) * 100 : 0,
    },
    {
      stage: 'Qualified Leads',
      count: qualifiedLeads.length,
      conversionRate: engagedContacts.size > 0 ? (qualifiedLeads.length / engagedContacts.size) * 100 : 0,
    },
    {
      stage: 'Hot Leads',
      count: hotLeads.length,
      conversionRate: qualifiedLeads.length > 0 ? (hotLeads.length / qualifiedLeads.length) * 100 : 0,
    },
    {
      stage: 'Opportunities',
      count: contactsWithDeals.size,
      conversionRate: hotLeads.length > 0 ? (contactsWithDeals.size / hotLeads.length) * 100 : 0,
    },
    {
      stage: 'Customers',
      count: wonDeals?.length || 0,
      conversionRate: contactsWithDeals.size > 0 ? ((wonDeals?.length || 0) / contactsWithDeals.size) * 100 : 0,
    },
  ];
}

/**
 * Get campaign performance over time (for charts)
 */
export async function getCampaignPerformanceTimeSeries(
  campaignId: string,
  days: number = 30
): Promise<{ date: string; impressions: number; clicks: number; leads: number }[]> {
  const supabase = await createClient();

  // Get content schedule for this campaign
  const { data: schedules } = await supabase
    .from('content_schedule')
    .select('published_at, engagement_metrics')
    .eq('campaign_id', campaignId)
    .eq('status', 'published')
    .order('published_at', { ascending: true });

  if (!schedules) return [];

  // Group by date
  const dateMap = new Map<string, { impressions: number; clicks: number; leads: number }>();

  schedules.forEach(schedule => {
    const date = new Date(schedule.published_at).toISOString().split('T')[0];
    const metrics = schedule.engagement_metrics as any || {};

    if (!dateMap.has(date)) {
      dateMap.set(date, { impressions: 0, clicks: 0, leads: 0 });
    }

    const data = dateMap.get(date)!;
    data.impressions += metrics.impressions || 0;
    data.clicks += metrics.clicks || 0;
    // leads would come from tracking conversions
  });

  return Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
