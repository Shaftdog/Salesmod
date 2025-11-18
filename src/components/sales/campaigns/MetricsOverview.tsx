"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  MessageSquare,
  Clock,
  AlertTriangle,
  UserX,
  TrendingUp,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';

interface MetricsOverviewProps {
  metrics: {
    sent: number;
    replied: number;
    pending: number;
    bounced: number;
    unsubscribed: number;
    response_rate: number;
    tasks: {
      total: number;
      completed: number;
      pending: number;
    };
  };
  campaign: {
    status: string;
  };
}

export function MetricsOverview({ metrics, campaign }: MetricsOverviewProps) {
  const taskCompletionRate =
    metrics.tasks.total > 0
      ? Math.round((metrics.tasks.completed / metrics.tasks.total) * 100)
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Sent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Emails Sent
          </CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.sent}</div>
          {metrics.pending > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.pending} pending
            </p>
          )}
        </CardContent>
      </Card>

      {/* Replied */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Responses
          </CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{metrics.replied}</div>
          {metrics.sent > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.response_rate.toFixed(1)}% response rate
            </p>
          )}
        </CardContent>
      </Card>

      {/* Issues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Issues
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bounced:</span>
              <span className="text-sm font-medium">{metrics.bounced}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unsubscribed:</span>
              <span className="text-sm font-medium">{metrics.unsubscribed}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tasks Generated
          </CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.tasks.total}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600"
                  style={{ width: `${taskCompletionRate}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {taskCompletionRate}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.tasks.completed} completed, {metrics.tasks.pending} pending
          </p>
        </CardContent>
      </Card>

      {/* Status Info */}
      {campaign.status === 'active' && metrics.pending > 0 && (
        <Card className="md:col-span-2 lg:col-span-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Campaign Active
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {metrics.pending} emails pending. Next batch will be sent according to
                  the rate limit schedule.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.status === 'completed' && (
        <Card className="md:col-span-2 lg:col-span-4 border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Campaign Completed
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  All {metrics.sent} emails have been sent. {metrics.replied} responses
                  received ({metrics.response_rate.toFixed(1)}% response rate).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
