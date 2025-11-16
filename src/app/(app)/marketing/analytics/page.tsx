'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, FileText, Activity,
  Flame, Target, Mail, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface MarketingOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  hotLeads: number;
  totalContent: number;
  totalRevenue: number;
  avgEngagement: number;
}

interface CampaignROIData {
  campaignId: string;
  campaignName: string;
  startDate: string;
  invested: number;
  leads: number;
  deals: number;
  revenue: number;
  roi: number;
}

interface ContentPerformanceData {
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

interface ChannelPerformance {
  channel: string;
  totalContent: number;
  totalImpressions: number;
  totalClicks: number;
  avgEngagement: number;
}

interface AttributionFunnelData {
  stage: string;
  count: number;
  conversionRate: number;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

export default function MarketingAnalyticsPage() {
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [campaignROI, setCampaignROI] = useState<CampaignROIData[]>([]);
  const [contentPerformance, setContentPerformance] = useState<ContentPerformanceData[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [funnel, setFunnel] = useState<AttributionFunnelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [roiTimeframe, setRoiTimeframe] = useState<'30' | 'all'>('30');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch all analytics data in parallel
        const [overviewRes, roiRes, contentRes, channelRes, funnelRes] = await Promise.all([
          fetch('/api/marketing/analytics/overview'),
          fetch(`/api/marketing/analytics/roi?last30Days=${roiTimeframe === '30'}`),
          fetch('/api/marketing/analytics/performance?type=content'),
          fetch('/api/marketing/analytics/performance?type=channel'),
          fetch('/api/marketing/analytics/funnel'),
        ]);

        const [overviewData, roiData, contentData, channelData, funnelData] = await Promise.all([
          overviewRes.json(),
          roiRes.json(),
          contentRes.json(),
          channelRes.json(),
          funnelRes.json(),
        ]);

        setOverview(overviewData.overview);
        setCampaignROI(roiData.roi || []);
        setContentPerformance(contentData.contentPerformance || []);
        setChannelPerformance(channelData.channelPerformance || []);
        setFunnel(funnelData.funnel || []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [roiTimeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'primary'
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: keyof typeof COLORS;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && trendValue && (
          <p className={`text-xs flex items-center gap-1 mt-1 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Analytics</h1>
          <p className="text-muted-foreground">
            Campaign performance, content analytics, and revenue attribution
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Campaigns"
            value={`${overview.activeCampaigns} / ${overview.totalCampaigns}`}
            icon={Target}
            color="primary"
          />
          <StatCard
            title="Hot Leads"
            value={overview.hotLeads}
            icon={Flame}
            trend="up"
            trendValue={`${((overview.hotLeads / overview.totalLeads) * 100).toFixed(1)}% of total`}
            color="danger"
          />
          <StatCard
            title="Total Revenue"
            value={`$${overview.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="success"
          />
          <StatCard
            title="Avg Engagement"
            value={`${overview.avgEngagement.toFixed(1)}%`}
            icon={Activity}
            color="purple"
          />
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign ROI</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="channels">Channel Analysis</TabsTrigger>
          <TabsTrigger value="funnel">Attribution Funnel</TabsTrigger>
        </TabsList>

        {/* Campaign ROI Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campaign ROI</CardTitle>
                  <CardDescription>Return on investment by campaign</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={roiTimeframe === '30' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setRoiTimeframe('30')}
                  >
                    Last 30 Days
                  </Badge>
                  <Badge
                    variant={roiTimeframe === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setRoiTimeframe('all')}
                  >
                    All Time
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {campaignROI.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={campaignROI}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="campaignName"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'roi') return [`${value.toFixed(1)}%`, 'ROI'];
                          if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="roi" fill={COLORS.primary} name="ROI %" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold">Campaign Details</h4>
                    <div className="space-y-2">
                      {campaignROI.map((campaign) => (
                        <div
                          key={campaign.campaignId}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{campaign.campaignName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(campaign.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-6 text-sm">
                            <div className="text-center">
                              <p className="text-muted-foreground">Leads</p>
                              <p className="font-semibold">{campaign.leads}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Deals</p>
                              <p className="font-semibold">{campaign.deals}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Revenue</p>
                              <p className="font-semibold">${campaign.revenue.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">ROI</p>
                              <p className={`font-semibold ${
                                campaign.roi > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {campaign.roi.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No campaign data available</p>
                  <p className="text-sm">Start a campaign to see ROI analytics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Performance Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>Top performing content across all channels</CardDescription>
            </CardHeader>
            <CardContent>
              {contentPerformance.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Chart */}
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={contentPerformance.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="title"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="impressions"
                        stroke={COLORS.primary}
                        name="Impressions"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="engagement"
                        stroke={COLORS.success}
                        name="Engagement"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Content Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Content</th>
                          <th className="text-left p-3">Type</th>
                          <th className="text-left p-3">Channel</th>
                          <th className="text-right p-3">Impressions</th>
                          <th className="text-right p-3">Clicks</th>
                          <th className="text-right p-3">CTR</th>
                          <th className="text-right p-3">Engagement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contentPerformance.map((content) => (
                          <tr key={content.contentId} className="border-t">
                            <td className="p-3">
                              <p className="font-medium">{content.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(content.publishedAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{content.contentType}</Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary">{content.channel}</Badge>
                            </td>
                            <td className="text-right p-3">
                              {content.impressions.toLocaleString()}
                            </td>
                            <td className="text-right p-3">
                              {content.clicks.toLocaleString()}
                            </td>
                            <td className="text-right p-3">
                              {content.ctr.toFixed(2)}%
                            </td>
                            <td className="text-right p-3">
                              {content.engagement.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No content performance data available</p>
                  <p className="text-sm">Publish content to see performance metrics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channel Analysis Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Compare performance across marketing channels</CardDescription>
            </CardHeader>
            <CardContent>
              {channelPerformance.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={channelPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="channel" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => value.toLocaleString()}
                      />
                      <Legend />
                      <Bar dataKey="totalImpressions" fill={COLORS.primary} name="Impressions" />
                      <Bar dataKey="totalClicks" fill={COLORS.success} name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {channelPerformance.map((channel) => (
                      <Card key={channel.channel}>
                        <CardHeader>
                          <CardTitle className="text-base capitalize">{channel.channel}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Content Published</span>
                            <span className="font-semibold">{channel.totalContent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Impressions</span>
                            <span className="font-semibold">{channel.totalImpressions.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Clicks</span>
                            <span className="font-semibold">{channel.totalClicks.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Avg Engagement</span>
                            <span className="font-semibold">{channel.avgEngagement.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">CTR</span>
                            <span className="font-semibold">
                              {channel.totalImpressions > 0
                                ? ((channel.totalClicks / channel.totalImpressions) * 100).toFixed(2)
                                : 0}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No channel performance data available</p>
                  <p className="text-sm">Publish content across channels to see analytics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attribution Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attribution Funnel</CardTitle>
              <CardDescription>Marketing to sales conversion journey</CardDescription>
            </CardHeader>
            <CardContent>
              {funnel.length > 0 ? (
                <div className="space-y-6">
                  {/* Funnel Visualization */}
                  <div className="space-y-2">
                    {funnel.map((stage, index) => {
                      const widthPercent = (stage.count / funnel[0].count) * 100;
                      return (
                        <div key={stage.stage} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{stage.stage}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">
                                {stage.count.toLocaleString()} contacts
                              </span>
                              <Badge variant={
                                stage.conversionRate >= 50 ? 'default' :
                                stage.conversionRate >= 25 ? 'secondary' : 'outline'
                              }>
                                {stage.conversionRate.toFixed(1)}% conversion
                              </Badge>
                            </div>
                          </div>
                          <div className="relative h-12 bg-muted rounded">
                            <div
                              className="absolute h-full rounded flex items-center justify-between px-4"
                              style={{
                                width: `${Math.max(widthPercent, 10)}%`,
                                background: `linear-gradient(to right, ${
                                  index === 0 ? COLORS.primary :
                                  index === 1 ? COLORS.purple :
                                  index === 2 ? COLORS.success :
                                  index === 3 ? COLORS.warning :
                                  index === 4 ? COLORS.pink :
                                  COLORS.danger
                                }, ${
                                  index === 0 ? COLORS.primary :
                                  index === 1 ? COLORS.purple :
                                  index === 2 ? COLORS.success :
                                  index === 3 ? COLORS.warning :
                                  index === 4 ? COLORS.pink :
                                  COLORS.danger
                                }dd)`
                              }}
                            >
                              <span className="text-white font-semibold">
                                {stage.count.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Conversion Insights */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Top of Funnel</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{funnel[0]?.count.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Contacts</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Engagement Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{funnel[1]?.conversionRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Contacts → Engaged</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Conversion to Customer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {funnel[0]?.count > 0
                            ? ((funnel[funnel.length - 1]?.count / funnel[0]?.count) * 100).toFixed(1)
                            : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">End-to-End</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No attribution data available</p>
                  <p className="text-sm">Engage contacts to build attribution funnel</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
