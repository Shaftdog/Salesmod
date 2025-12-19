"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useSalesMetrics } from "@/hooks/use-sales-metrics";
import { useCurrentUser } from "@/hooks/use-appraisers";
import { SalesKPICards } from "./_components/sales-kpi-cards";
import { DistributionDonutChart } from "./_components/distribution-donut-chart";
import { OrdersTrendChart } from "./_components/orders-trend-chart";

export default function SalesDashboard() {
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
    isLoading,
  } = useSalesMetrics(currentUser?.id);

  return (
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
        />
        <DistributionDonutChart
          title="Monthly Orders by Sales Campaign"
          data={monthlyOrdersByCampaign}
          filterCount={2}
          isLoading={isLoading}
        />
      </div>

      {/* Distribution Charts Row 2: Sales by Agent & AMC Client */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionDonutChart
          title="Sales by Agent Last 30 Days"
          data={salesByAgentLast30Days}
          filterCount={1}
          isLoading={isLoading}
        />
        <DistributionDonutChart
          title="AMC Client Distribution"
          data={amcClientDistribution}
          filterCount={1}
          isLoading={isLoading}
        />
      </div>

      {/* Distribution Charts Row 3: Product Distribution & Daily Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionDonutChart
          title="Product Distribution"
          data={productDistribution}
          filterCount={1}
          isLoading={isLoading}
        />
        <OrdersTrendChart
          title="Daily Orders"
          data={dailyOrdersTrend}
          filterCount={1}
          isLoading={isLoading}
        />
      </div>

      {/* Trend Charts Row: Weekly & Monthly Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OrdersTrendChart
          title="Weekly Orders"
          data={weeklyOrdersTrend}
          filterCount={1}
          isLoading={isLoading}
        />
        <OrdersTrendChart
          title="Monthly Orders"
          data={monthlyOrdersTrend}
          filterCount={1}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
