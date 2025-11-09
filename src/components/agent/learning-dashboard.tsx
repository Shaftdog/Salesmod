'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface LearningMetrics {
  overview: {
    totalFeedback: number;
    totalRules: number;
    totalCardsCreated: number;
    totalApproved: number;
    totalRejected: number;
    overallSuccessRate: number;
    learningVelocity: number;
    ruleEffectiveness: number;
  };
  feedbackBreakdown: {
    rejections: number;
    deletions: number;
    batchOperations: number;
    batchOperationsSaved: number;
  };
  topReasons: Array<{ reason: string; count: number }>;
  cardTypeDistribution: Array<{ cardType: string; count: number }>;
  successRateByDay: Array<{
    date: string;
    successRate: number;
    total: number;
    approved: number;
  }>;
  recentRules: Array<{
    rule: string;
    reason: string;
    createdAt: string;
    importance: number;
    cardType: string;
    isBatch: boolean;
  }>;
  trends: {
    last7Days: number;
    improvementRate: number;
  };
}

export function AgentLearningDashboard() {
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/agent/learning/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch learning metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      console.error('[Learning Dashboard] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
          <Button onClick={fetchMetrics} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const improvementTrend = metrics.trends.improvementRate > 0 ? 'up' : 'down';
  const successRateColor =
    metrics.overview.overallSuccessRate >= 70 ? 'text-green-600' :
    metrics.overview.overallSuccessRate >= 50 ? 'text-yellow-600' :
    'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Agent Learning Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Track the AI agent's continuous learning and improvement
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${successRateColor}`}>
              {metrics.overview.overallSuccessRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.overview.totalApproved} approved of {metrics.overview.totalCardsCreated} cards
            </p>
            <div className="flex items-center gap-1 mt-2">
              {improvementTrend === 'up' ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +{metrics.trends.improvementRate}% from last week
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-600">
                    {metrics.trends.improvementRate}% from last week
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Feedback */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.totalFeedback}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.overview.totalRules} rules created
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Zap className="h-3 w-3 text-yellow-600" />
              <span className="text-xs text-yellow-600">
                {metrics.trends.last7Days} in last 7 days
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Learning Velocity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Velocity</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.learningVelocity}</div>
            <p className="text-xs text-muted-foreground mt-1">feedback items per day</p>
            <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${Math.min(metrics.overview.learningVelocity * 10, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rule Effectiveness */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule Effectiveness</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.ruleEffectiveness}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              feedback converted to rules
            </p>
            <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${metrics.overview.ruleEffectiveness}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Breakdown & Top Reasons */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Feedback Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback Breakdown</CardTitle>
            <CardDescription>Distribution of feedback types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Rejections</span>
              </div>
              <span className="text-sm font-semibold">{metrics.feedbackBreakdown.rejections}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Deletions</span>
              </div>
              <span className="text-sm font-semibold">{metrics.feedbackBreakdown.deletions}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Batch Operations</span>
              </div>
              <span className="text-sm font-semibold">{metrics.feedbackBreakdown.batchOperations}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Cards saved via batch</span>
              </div>
              <span className="text-sm font-semibold text-green-600">
                ~{metrics.feedbackBreakdown.batchOperationsSaved}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Rejection Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Rejection Reasons</CardTitle>
            <CardDescription>Most common issues identified</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {metrics.topReasons.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge variant="outline" className="shrink-0">
                      #{index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.reason}</p>
                      <div className="mt-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${Math.min((item.count / metrics.topReasons[0].count) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground shrink-0">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recent Learning Rules
          </CardTitle>
          <CardDescription>
            Rules created from feedback (last 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {metrics.recentRules.map((rule, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={rule.isBatch ? 'default' : 'secondary'}>
                          {rule.cardType}
                        </Badge>
                        {rule.isBatch && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Batch
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(rule.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{rule.rule}</p>
                      <p className="text-xs text-muted-foreground">
                        Reason: {rule.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Importance</div>
                      <div className="text-sm font-bold">
                        {Math.round(rule.importance * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Success Rate Trend - Simple visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Success Rate Trend (Last 30 Days)
          </CardTitle>
          <CardDescription>
            Daily card approval rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Simple bar chart visualization */}
            <div className="flex items-end gap-1 h-32">
              {metrics.successRateByDay.map((day, index) => {
                const height = day.total > 0 ? (day.successRate / 100) * 100 : 0;
                const color =
                  day.successRate >= 70 ? 'bg-green-500' :
                  day.successRate >= 50 ? 'bg-yellow-500' :
                  day.successRate > 0 ? 'bg-red-500' :
                  'bg-gray-300';

                return (
                  <div
                    key={index}
                    className="flex-1 group relative"
                    title={`${day.date}: ${day.successRate}% (${day.approved}/${day.total})`}
                  >
                    <div
                      className={`w-full rounded-t ${color} transition-all hover:opacity-80`}
                      style={{ height: `${height}%`, minHeight: day.total > 0 ? '4px' : '0px' }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                      {day.date}: {day.successRate}%
                      <br />
                      {day.approved}/{day.total} approved
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>≥70%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>50-69%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>&lt;50%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
