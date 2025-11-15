import { Suspense } from "react";
import { Metadata } from "next";
import {
  TrendingUp,
  Megaphone,
  Users,
  Mail,
  MousePointerClick,
  Target,
  DollarSign,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Marketing Dashboard | Salesmod",
  description: "Marketing campaigns, content, and analytics overview",
};

export default function MarketingDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
          <p className="text-muted-foreground">
            Campaign performance, content analytics, and audience insights
          </p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <MarketingDashboard />
      </Suspense>
    </div>
  );
}

async function MarketingDashboard() {
  // TODO: Fetch real data from APIs
  const stats = {
    activeCampaigns: 3,
    totalLeads: 127,
    emailsSent: 1840,
    avgEngagement: 32.5,
    hotLeads: 24,
    contentPieces: 45,
    revenue: 45000,
    conversionRate: 4.2
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Campaigns"
          value={stats.activeCampaigns.toString()}
          description="Running campaigns"
          icon={Megaphone}
          trend="+2 this month"
        />
        <MetricCard
          title="Total Leads"
          value={stats.totalLeads.toString()}
          description="Generated this quarter"
          icon={Users}
          trend="+18% from last quarter"
        />
        <MetricCard
          title="Email Performance"
          value={`${stats.avgEngagement}%`}
          description={`${stats.emailsSent} emails sent`}
          icon={Mail}
          trend="Avg engagement rate"
        />
        <MetricCard
          title="Hot Leads"
          value={stats.hotLeads.toString()}
          description="Score 75+"
          icon={TrendingUp}
          trend="Ready for BD follow-up"
        />
      </div>

      {/* Performance Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Content Library"
          value={stats.contentPieces.toString()}
          description="Published pieces"
          icon={BarChart3}
          trend="+12 this month"
        />
        <MetricCard
          title="Attribution Revenue"
          value={`$${(stats.revenue / 1000).toFixed(0)}K`}
          description="From marketing campaigns"
          icon={DollarSign}
          trend="+15% vs last quarter"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          description="Lead to deal"
          icon={Target}
          trend="+0.8% improvement"
        />
        <MetricCard
          title="Engagement"
          value="2,340"
          description="Total interactions"
          icon={MousePointerClick}
          trend="Clicks, opens, shares"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Latest marketing campaign performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <CampaignItem
                name="Lender Reactivation Q1"
                status="active"
                leads={45}
                engagement={42}
              />
              <CampaignItem
                name="203k Realtor Education"
                status="active"
                leads={32}
                engagement={38}
              />
              <CampaignItem
                name="Investor Fund Outreach"
                status="completed"
                leads={18}
                engagement={28}
              />
            </div>
          </CardContent>
        </Card>

        {/* Top Content */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Content</CardTitle>
            <CardDescription>Highest engagement this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ContentItem
                title="Understanding DSCR Loans"
                type="blog"
                views={843}
                engagement={67}
              />
              <ContentItem
                title="203k Renovation Guide"
                type="social_post"
                views={612}
                engagement={54}
              />
              <ContentItem
                title="Market Update: Florida Q1"
                type="newsletter"
                views={498}
                engagement={41}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audience Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Audience Insights</CardTitle>
          <CardDescription>Lead scoring and engagement by role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <AudienceSegment
              role="Lenders"
              count={156}
              hotLeads={12}
              avgScore={68}
            />
            <AudienceSegment
              role="Investors"
              count={89}
              hotLeads={8}
              avgScore={72}
            />
            <AudienceSegment
              role="Realtors"
              count={203}
              hotLeads={4}
              avgScore={58}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-green-600 mt-1">{trend}</p>
      </CardContent>
    </Card>
  );
}

function CampaignItem({
  name,
  status,
  leads,
  engagement
}: {
  name: string;
  status: string;
  leads: number;
  engagement: number;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none">{name}</p>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
          }`}>
            {status}
          </span>
          <p className="text-xs text-muted-foreground">{leads} leads</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{engagement}%</p>
        <p className="text-xs text-muted-foreground">engagement</p>
      </div>
    </div>
  );
}

function ContentItem({
  title,
  type,
  views,
  engagement
}: {
  title: string;
  type: string;
  views: number;
  engagement: number;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            {type}
          </span>
          <p className="text-xs text-muted-foreground">{views} views</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{engagement}%</p>
        <p className="text-xs text-muted-foreground">engagement</p>
      </div>
    </div>
  );
}

function AudienceSegment({
  role,
  count,
  hotLeads,
  avgScore
}: {
  role: string;
  count: number;
  hotLeads: number;
  avgScore: number;
}) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{role}</h4>
        <span className="text-sm text-muted-foreground">{count} contacts</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Hot Leads</span>
          <span className="font-medium text-orange-600">{hotLeads}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Avg Score</span>
          <span className="font-medium">{avgScore}/100</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-blue-500"
          style={{ width: `${avgScore}%` }}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
