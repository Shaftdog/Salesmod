"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Play, Pause, Archive, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Campaign, CampaignAnalytics } from "@/lib/types/marketing";
import { useToast } from "@/hooks/use-toast";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const [campaignRes, analyticsRes] = await Promise.all([
          fetch(`/api/marketing/campaigns/${resolvedParams.id}`),
          fetch(`/api/marketing/campaigns/${resolvedParams.id}/analytics`),
        ]);

        if (campaignRes.ok) {
          const data = await campaignRes.json();
          setCampaign(data.campaign);
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [resolvedParams.id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/marketing/campaigns/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const { campaign: updated } = await response.json();
      setCampaign(updated);

      toast({
        title: "Status updated",
        description: `Campaign is now ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`/api/marketing/campaigns/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({
        title: "Campaign deleted",
        description: "Campaign has been deleted successfully",
      });

      router.push('/marketing/campaigns');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button asChild className="mt-4">
          <Link href="/marketing/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/marketing/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge
                variant={
                  campaign.status === 'active' ? 'default' :
                  campaign.status === 'draft' ? 'secondary' :
                  'outline'
                }
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground capitalize">
              {campaign.goal.replace('_', ' ')} Campaign
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {campaign.status === 'draft' && (
            <Button onClick={() => handleStatusChange('active')}>
              <Play className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
          {campaign.status === 'active' && (
            <Button variant="outline" onClick={() => handleStatusChange('paused')}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          {campaign.status !== 'archived' && (
            <Button variant="outline" onClick={() => handleStatusChange('archived')}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.contentCount}</div>
              <p className="text-xs text-muted-foreground">pieces published</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.impressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">total impressions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgEngagement.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">avg engagement rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.leadsGenerated}</div>
              <p className="text-xs text-muted-foreground">leads generated</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm mt-1">{campaign.description || 'No description'}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="text-sm mt-1">{new Date(campaign.startDate).toLocaleDateString()}</p>
              </div>
              {campaign.endDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="text-sm mt-1">{new Date(campaign.endDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Channels</p>
              <div className="flex flex-wrap gap-2">
                {campaign.channels?.map((channel) => (
                  <Badge key={channel} variant="secondary">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaign.targetRoleCategories?.length ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Role Categories</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.targetRoleCategories.map((cat) => (
                    <Badge key={cat} variant="outline">
                      {cat.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {campaign.includeTags?.length ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Include Tags</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.includeTags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {campaign.excludeTags?.length ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Exclude Tags</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.excludeTags.map((tag) => (
                    <Badge key={tag} variant="destructive">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {campaign.minLeadScore && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Min Lead Score</p>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {campaign.minLeadScore}+
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
