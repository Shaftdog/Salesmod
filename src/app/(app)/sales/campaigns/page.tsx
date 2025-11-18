"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, Play, Pause, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  channel: string;
  created_at: string;
  launched_at: string | null;
  completed_at: string | null;
  send_rate_per_hour: number;
  _count?: {
    sent: number;
    replied: number;
    pending: number;
  };
}

export default function CampaignsListPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/campaigns?${params.toString()}`, {
        credentials: 'include', // Send authentication cookies
      });
      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const result = await response.json();
      // API returns { success: true, data: { data: [...], pagination: {...} } }
      setCampaigns(result.data.data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Not launched';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage re-engagement email campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/sales/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'No campaigns match your search'
                : 'No campaigns yet. Create your first campaign to get started!'}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/sales/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => router.push(`/sales/campaigns/${campaign.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{campaign.name}</CardTitle>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <CardDescription>
                      {campaign.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Pause campaign
                        }}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Resume campaign
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Created</p>
                    <p className="font-medium">{formatDate(campaign.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Launched</p>
                    <p className="font-medium">{formatDate(campaign.launched_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Send Rate</p>
                    <p className="font-medium">{campaign.send_rate_per_hour}/hour</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Channel</p>
                    <p className="font-medium capitalize">{campaign.channel}</p>
                  </div>
                </div>
                {campaign._count && (
                  <div className="mt-4 pt-4 border-t flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sent: </span>
                      <span className="font-medium">{campaign._count.sent}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Replied: </span>
                      <span className="font-medium">{campaign._count.replied}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pending: </span>
                      <span className="font-medium">{campaign._count.pending}</span>
                    </div>
                    {campaign._count.replied > 0 && campaign._count.sent > 0 && (
                      <div>
                        <span className="text-muted-foreground">Response Rate: </span>
                        <span className="font-medium text-green-600">
                          {Math.round((campaign._count.replied / campaign._count.sent) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
