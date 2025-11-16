"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingUp, Flame, Zap, Snowflake, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadScore } from "@/lib/types/marketing";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AudiencesPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const response = await fetch('/api/marketing/lead-scoring/top-leads?limit=100');
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function recalculateScores() {
    setCalculating(true);
    try {
      // Get org_id from current user - in real app would come from auth
      const response = await fetch('/api/marketing/lead-scoring/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recalculateAll: true,
          orgId: 'current-org-id' // Would get from auth context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Scores updated",
          description: `Recalculated scores for ${data.count} contacts`,
        });
        fetchLeads();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate scores",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  }

  const hotLeads = leads.filter(l => l.label === 'hot');
  const warmLeads = leads.filter(l => l.label === 'warm');
  const coldLeads = leads.filter(l => l.label === 'cold');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Scoring</h1>
          <p className="text-muted-foreground">
            Track contact engagement and identify hot leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={recalculateScores} disabled={calculating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Calculating...' : 'Recalculate Scores'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{hotLeads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Score 75+ • Ready for BD follow-up</p>
            <Progress value={100} className="mt-3 bg-orange-100" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Warm Leads</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{warmLeads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Score 50-74 • Continue nurturing</p>
            <Progress value={66} className="mt-3 bg-yellow-100" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Cold Leads</CardTitle>
              <Snowflake className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{coldLeads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Score 0-49 • Low engagement</p>
            <Progress value={33} className="mt-3 bg-blue-100" />
          </CardContent>
        </Card>
      </div>

      {/* Lead Tabs */}
      <Card>
        <Tabs defaultValue="hot" className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lead Leaderboard</CardTitle>
                <CardDescription>Contacts scored by fit, engagement, recency, and value</CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="hot">
                  <Flame className="h-4 w-4 mr-1" />
                  Hot ({hotLeads.length})
                </TabsTrigger>
                <TabsTrigger value="warm">
                  <Zap className="h-4 w-4 mr-1" />
                  Warm ({warmLeads.length})
                </TabsTrigger>
                <TabsTrigger value="all">All ({leads.length})</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="hot" className="m-0">
              {loading ? <LeadListSkeleton /> : <LeadList leads={hotLeads} />}
            </TabsContent>
            <TabsContent value="warm" className="m-0">
              {loading ? <LeadListSkeleton /> : <LeadList leads={warmLeads} />}
            </TabsContent>
            <TabsContent value="all" className="m-0">
              {loading ? <LeadListSkeleton /> : <LeadList leads={leads} />}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

function LeadList({ leads }: { leads: any[] }) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No leads in this category yet</p>
        <p className="text-sm mt-2">Scores will appear as contacts engage with campaigns</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold truncate">
                    {lead.contact?.first_name} {lead.contact?.last_name}
                  </h4>
                  <Badge variant={
                    lead.label === 'hot' ? 'default' :
                    lead.label === 'warm' ? 'secondary' :
                    'outline'
                  }>
                    {lead.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>{lead.contact?.client?.company_name}</span>
                  {lead.contact?.title && (
                    <>
                      <span>•</span>
                      <span>{lead.contact.title}</span>
                    </>
                  )}
                  {lead.contact?.email && (
                    <>
                      <span>•</span>
                      <span className="truncate">{lead.contact.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Score Breakdown */}
            <div className="hidden md:flex items-center gap-3 text-sm">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Fit</div>
                <div className="font-medium">{lead.fit_score}/25</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Engage</div>
                <div className="font-medium">{lead.engagement_score}/50</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Recent</div>
                <div className="font-medium">{lead.recency_score}/15</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Value</div>
                <div className="font-medium">{lead.value_score}/10</div>
              </div>
            </div>

            {/* Total Score */}
            <div className="text-right">
              <div className="text-2xl font-bold">{lead.total_score}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>

            {/* Actions */}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/contacts/${lead.contact_id}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
