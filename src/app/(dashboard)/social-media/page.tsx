'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Calendar,
  BarChart3,
  TrendingUp,
  Sparkles,
  Twitter,
  Linkedin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Analytics {
  totalPosts: number;
  totalImpressions: number;
  totalEngagements: number;
  totalClicks: number;
  avgEngagementRate: number;
  platformBreakdown: Record<string, any>;
  contentTypeBreakdown: Record<string, any>;
}

interface AgentRun {
  id: string;
  agentType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  topicsIdentified: number;
  postsDrafted: number;
  insightsGenerated: number;
}

export default function SocialMediaPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch analytics
      const analyticsRes = await fetch('/api/social-media/analytics?days=30');
      const analyticsData = await analyticsRes.json();
      if (analyticsData.analytics) {
        setAnalytics(analyticsData.analytics);
        setInsights(analyticsData.insights || []);
        setScheduledPosts(analyticsData.scheduledPosts || []);
      }

      // Fetch recent runs
      const runsRes = await fetch('/api/social-media/run?limit=5');
      const runsData = await runsRes.json();
      if (runsData.runs) {
        setRuns(runsData.runs);
      }

      // Fetch recent posts
      const postsRes = await fetch('/api/social-media/posts?limit=20');
      const postsData = await postsRes.json();
      if (postsData.posts) {
        setPosts(postsData.posts);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAgent = async (agentType: string) => {
    setRunning(true);
    try {
      const res = await fetch('/api/social-media/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType }),
      });

      const result = await res.json();

      if (result.success) {
        // Refresh data after successful run
        await fetchData();
      } else {
        console.error('Agent run failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to run agent:', error);
    } finally {
      setRunning(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Social Media Agent</h1>
          <p className="text-muted-foreground">
            AI-powered content strategy, creation, and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => runAgent('full_cycle')} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Full Cycle
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.totalImpressions || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total reach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.totalEngagements || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(analytics?.avgEngagementRate || 0).toFixed(2)}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledPosts.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming posts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="runs">Agent Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Platform Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Platform Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.platformBreakdown && Object.keys(analytics.platformBreakdown).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(analytics.platformBreakdown).map(([platform, data]) => (
                      <div key={platform} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(platform)}
                            <span className="font-medium capitalize">{platform}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {data.posts} posts
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Impressions</p>
                            <p className="font-medium">{data.impressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Engagements</p>
                            <p className="font-medium">{data.engagements.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Eng. Rate</p>
                            <p className="font-medium">{data.avgEngagementRate.toFixed(2)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No platform data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Content Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Content Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.contentTypeBreakdown && Object.keys(analytics.contentTypeBreakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(analytics.contentTypeBreakdown).map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <div className="text-right">
                          <span className="font-medium">{data.posts} posts</span>
                          <span className="text-muted-foreground text-sm ml-2">
                            {data.impressions > 0
                              ? ((data.engagements / data.impressions) * 100).toFixed(1)
                              : 0}% eng
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No content data yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Run individual agents or the full content cycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => runAgent('strategy')}
                  disabled={running}
                  className="h-auto py-4 flex-col"
                >
                  <TrendingUp className="h-5 w-5 mb-2" />
                  <span className="font-medium">Strategy Agent</span>
                  <span className="text-xs text-muted-foreground">
                    Find trends & plan content
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runAgent('production')}
                  disabled={running}
                  className="h-auto py-4 flex-col"
                >
                  <Calendar className="h-5 w-5 mb-2" />
                  <span className="font-medium">Production Agent</span>
                  <span className="text-xs text-muted-foreground">
                    Generate post content
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runAgent('analysis')}
                  disabled={running}
                  className="h-auto py-4 flex-col"
                >
                  <BarChart3 className="h-5 w-5 mb-2" />
                  <span className="font-medium">Analysis Agent</span>
                  <span className="text-xs text-muted-foreground">
                    Analyze performance
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>
                View and manage your social media posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-2">
                          {(post.target_platforms || []).map((p: string) => (
                            <span key={p} className="flex items-center gap-1 text-sm">
                              {getPlatformIcon(p)}
                            </span>
                          ))}
                        </div>
                        <Badge variant={
                          post.status === 'published' ? 'default' :
                          post.status === 'scheduled' ? 'secondary' :
                          'outline'
                        }>
                          {post.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2 line-clamp-2">
                        {post.content?.linkedin || post.content?.twitter || post.content?.both || 'No content'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="capitalize">{post.content_type}</span>
                        {post.scheduled_for && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(post.scheduled_for).toLocaleDateString()}
                          </span>
                        )}
                        {post.published_at && (
                          <span>
                            Published {formatDistanceToNow(new Date(post.published_at))} ago
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No posts yet. Run the agents to generate content!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                AI-generated insights to improve your content strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div key={insight.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {insight.insight_type?.replace(/_/g, ' ')}
                        </Badge>
                        {insight.platform && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            {getPlatformIcon(insight.platform)}
                            {insight.platform}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1">{insight.insight}</p>
                      {insight.recommendation && (
                        <p className="text-sm text-muted-foreground">
                          {insight.recommendation}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Confidence: {((insight.confidence_score || 0) * 100).toFixed(0)}%
                        </span>
                        {insight.potential_improvement && (
                          <span>
                            Potential: +{((insight.potential_improvement - 1) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No insights yet. Run the analysis agent to generate insights!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Run History</CardTitle>
              <CardDescription>
                View recent agent executions and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {runs.length > 0 ? (
                <div className="space-y-4">
                  {runs.map((run) => (
                    <div key={run.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {run.agentType.replace('_', ' ')} Agent
                        </span>
                        {getStatusBadge(run.status)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Topics</p>
                          <p className="font-medium">{run.topicsIdentified}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Posts</p>
                          <p className="font-medium">{run.postsDrafted}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Insights</p>
                          <p className="font-medium">{run.insightsGenerated}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(run.startedAt))} ago
                        {run.completedAt && ` • ${Math.round(
                          (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
                        )}s`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No agent runs yet. Click "Run Full Cycle" to get started!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
