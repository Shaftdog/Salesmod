"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  Archive,
  Trash2,
  Mail,
  TrendingUp,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MetricsOverview } from '@/components/sales/campaigns/MetricsOverview';
import { SentimentChart } from '@/components/sales/campaigns/SentimentChart';
import { DispositionChart } from '@/components/sales/campaigns/DispositionChart';
import { NeedsFollowUp } from '@/components/sales/campaigns/NeedsFollowUp';
import { ResponsesList } from '@/components/sales/campaigns/ResponsesList';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  channel: string;
  email_subject: string;
  email_body: string;
  send_rate_per_hour: number;
  send_batch_size: number;
  created_at: string;
  launched_at: string | null;
  completed_at: string | null;
  start_at: string | null;
}

interface CampaignMetrics {
  sent: number;
  replied: number;
  pending: number;
  bounced: number;
  unsubscribed: number;
  response_rate: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  dispositions: Record<string, number>;
  tasks: {
    total: number;
    completed: number;
    pending: number;
  };
  needs_follow_up: Array<{
    email_address: string;
    last_disposition: string;
    last_reply_at: string;
    open_tasks_count: number;
  }>;
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchCampaign();
    fetchMetrics();
  }, [resolvedParams.id]);

  async function fetchCampaign() {
    try {
      const response = await fetch(`/api/campaigns/${resolvedParams.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch campaign');

      const { campaign } = await response.json();
      setCampaign(campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetrics() {
    try {
      const response = await fetch(`/api/campaigns/${resolvedParams.id}/metrics`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const response = await fetch(`/api/campaigns/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const { campaign: updated } = await response.json();
      setCampaign(updated);

      toast({
        title: 'Status updated',
        description: `Campaign is now ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campaign status',
        variant: 'destructive',
      });
    }
  }

  async function handleExecute() {
    setExecuting(true);
    try {
      const response = await fetch(`/api/campaigns/${resolvedParams.id}/execute`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to execute campaign');

      const result = await response.json();

      toast({
        title: 'Campaign executed',
        description: `Sent ${result.emailsSent} emails`,
      });

      // Refresh metrics
      await fetchMetrics();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute campaign',
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`/api/campaigns/${resolvedParams.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({
        title: 'Campaign deleted',
        description: 'Campaign has been deleted successfully',
      });

      router.push('/sales/campaigns');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      draft: 'secondary',
      scheduled: 'outline',
      active: 'default',
      paused: 'outline',
      completed: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Campaign not found</p>
        <Button asChild>
          <Link href="/sales/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" asChild aria-label="Back to campaigns">
                <Link href="/sales/campaigns">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to campaigns</p>
            </TooltipContent>
          </Tooltip>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
              {getStatusBadge(campaign.status)}
            </div>
            <p className="text-muted-foreground">
              {campaign.description || 'No description'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {campaign.status === 'active' && (
            <>
              <Button
                variant="outline"
                onClick={handleExecute}
                disabled={executing}
              >
                <Play className="mr-2 h-4 w-4" />
                {executing ? 'Executing...' : 'Execute Now'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange('paused')}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            </>
          )}
          {campaign.status === 'paused' && (
            <Button onClick={() => handleStatusChange('active')}>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          )}
          {campaign.status !== 'archived' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('archived')}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleDelete} aria-label="Delete campaign">
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete campaign</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && <MetricsOverview metrics={metrics} campaign={campaign} />}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="responses">
            <MessageSquare className="mr-2 h-4 w-4" />
            Responses
          </TabsTrigger>
          <TabsTrigger value="follow-up">
            <AlertCircle className="mr-2 h-4 w-4" />
            Needs Follow-Up
            {metrics && metrics.needs_follow_up.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {metrics.needs_follow_up.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="details">
            <Mail className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {metrics && <SentimentChart sentiment={metrics.sentiment} />}
            {metrics && <DispositionChart dispositions={metrics.dispositions} />}
          </div>
        </TabsContent>

        <TabsContent value="responses">
          <ResponsesList campaignId={campaign.id} />
        </TabsContent>

        <TabsContent value="follow-up">
          {metrics && <NeedsFollowUp contacts={metrics.needs_follow_up} />}
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Email Subject
                  </p>
                  <p className="text-sm font-mono bg-muted p-3 rounded-md">
                    {campaign.email_subject}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Send Rate
                  </p>
                  <p className="text-sm">
                    {campaign.send_rate_per_hour} emails/hour (batch size:{' '}
                    {campaign.send_batch_size})
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Created
                  </p>
                  <p className="text-sm">
                    {new Date(campaign.created_at).toLocaleString()}
                  </p>
                </div>

                {campaign.launched_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Launched
                    </p>
                    <p className="text-sm">
                      {new Date(campaign.launched_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {campaign.start_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Scheduled Start
                    </p>
                    <p className="text-sm">
                      {new Date(campaign.start_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Email Body
                </p>
                <div className="text-sm font-mono bg-muted p-4 rounded-md whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {campaign.email_body}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
