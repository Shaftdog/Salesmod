"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useSalesMetrics } from "@/hooks/use-sales-metrics";
import { useCurrentUser } from "@/hooks/use-appraisers";
import { SalesKPICards } from "./_components/sales-kpi-cards";
import { DistributionDonutChart } from "./_components/distribution-donut-chart";
import { OrdersTrendChart } from "./_components/orders-trend-chart";
import { DrillDownProvider } from "./_components/drill-down-context";
import { DrillDownReportDialog } from "./_components/drill-down-report-dialog";
import { useDrillDown } from "./_components/drill-down-context";
import { createDrillDownConfig, type DrillDownType } from "./_components/drill-down-utils";

function SalesDashboardContent() {
  const { data: currentUser } = useCurrentUser();
  const {
    kpis,
    weeklyOrdersByCampaign,
    monthlyOrdersByCampaign,
    salesByAgentLast30Days,
    amcClientDistribution,
    productDistribution,
    dailyOrdersTrend,
    weeklyOrdersTrend,
    monthlyOrdersTrend,
    orders,
    deals,
    isLoading,
  } = useSalesMetrics(currentUser?.id);

  const { openDrillDown } = useDrillDown();

  const handleChartSeeAll = (type: DrillDownType) => {
    openDrillDown(createDrillDownConfig(type));
  };

  const handleSegmentClick = (type: DrillDownType, segmentName: string, filterKey: string) => {
    openDrillDown(
      createDrillDownConfig(type, {
        filters: { [filterKey]: segmentName },
        clickedValue: segmentName,
      })
    );
  };

  const handleTrendPointClick = (type: DrillDownType, datePoint: string) => {
    openDrillDown(
      createDrillDownConfig(type, {
        filters: { datePoint },
      })
    );
  };

  return (
    <>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sales Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of sales performance, pipeline, and key metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/orders/new">
                <PlusCircle className="mr-2 h-4 w-4" /> New Order
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards - 12 metrics in 3 rows */}
        <SalesKPICards kpis={kpis} isLoading={isLoading} />

        {/* Distribution Charts Row 1: Weekly & Monthly by Campaign */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DistributionDonutChart
            title="Weekly Orders by Sales Campaign"
            data={weeklyOrdersByCampaign}
            filterCount={2}
            isLoading={isLoading}
            onSeeAll={() => handleChartSeeAll('campaign_distribution')}
            onSegmentClick={(segment) => handleSegmentClick('campaign_distribution', segment.name, 'salesCampaign')}
          />
          <DistributionDonutChart
            title="Monthly Orders by Sales Campaign"
            data={monthlyOrdersByCampaign}
            filterCount={2}
            isLoading={isLoading}
            onSeeAll={() => handleChartSeeAll('campaign_distribution')}
            onSegmentClick={(segment) => handleSegmentClick('campaign_distribution', segment.name, 'salesCampaign')}
          />
        </div>

        {/* Distribution Charts Row 2: Sales by Agent & AMC Client */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DistributionDonutChart
            title="Sales by Agent Last 30 Days"
            data={salesByAgentLast30Days}
            filterCount={1}
            isLoading={isLoading}
            onSeeAll={() => handleChartSeeAll('agent_distribution')}
            onSegmentClick={(segment) => handleSegmentClick('agent_distribution', segment.name, 'assignedTo')}
          />
          <DistributionDonutChart
            title="AMC Client Distribution"
            data={amcClientDistribution}
            filterCount={1}
            isLoading={isLoading}
            onSeeAll={() => handleChartSeeAll('client_distribution')}
            onSegmentClick={(segment) => handleSegmentClick('client_distribution', segment.name, 'clientId')}
          />
        </div>

        {/* Distribution Charts Row 3: Product Distribution & Daily Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DistributionDonutChart
            title="Product Distribution"
            data={productDistribution}
            filterCount={1}
            isLoading={isLoading}
            onSeeAll={() => handleChartSeeAll('product_distribution')}
            onSegmentClick={(segment) => handleSegmentClick('product_distribution', segment.name, 'reportFormType')}
          />
          <OrdersTrendChart
            title="Daily Orders"
            data={dailyOrdersTrend}
            filterCount={1}
            isLoading={isLoading}
            onSeeAll={() => handleChartSeeAll('daily_trend')}
            onPointClick={(point) => handleTrendPointClick('daily_trend', point.date)}
          />
        </div>

        {/* Trend Charts Row: Weekly & Monthly Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OrdersTrendChart
            title="Weekly Orders"
            data={weeklyOrdersTrend}
            filterCount={1}
            isLoading={isLoading}
            onSeeAll={() => handleChartSeeAll('weekly_trend')}
            onPointClick={(point) => handleTrendPointClick('weekly_trend', point.date)}
          />
          <OrdersTrendChart
            title="Monthly Orders"
            data={monthlyOrdersTrend}
            filterCount={1}
            isLoading={isLoading}
            onSeeAll={() => handleChartSeeAll('monthly_trend')}
            onPointClick={(point) => handleTrendPointClick('monthly_trend', point.date)}
          />
        </div>
      </div>

      {/* Drill-down dialog */}
      <DrillDownReportDialog orders={orders} deals={deals} isLoading={isLoading} />
    </>
  );
}

export default function SalesDashboard() {
  return (
    <DrillDownProvider>
      <SalesDashboardContent />
    </DrillDownProvider>
  );
}
