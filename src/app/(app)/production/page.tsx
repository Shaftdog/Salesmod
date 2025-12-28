"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Factory, FileCheck, Library, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { MetricCard, MetricGrid } from "./_components/metric-card";
import { useProductionMetrics, formatTurnTime, formatCurrency } from "@/hooks/use-production-metrics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ProductionDrillDownProvider,
  useProductionDrillDown,
  DRILL_DOWN_CONFIGS,
  type ProductionDrillDownType,
} from "./_components/production-drill-down-context";
import { ProductionDrillDownDialog } from "./_components/production-drill-down-dialog";

function MetricCardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[140px] bg-zinc-900/80 border border-zinc-700/50 rounded-lg">
      <Skeleton className="h-3 w-24 mb-3 bg-zinc-700" />
      <Skeleton className="h-10 w-16 bg-zinc-700" />
    </div>
  );
}

function ProductionDashboardContent() {
  const { data: metrics, isLoading, refetch, isRefetching } = useProductionMetrics();
  const { openDrillDown } = useProductionDrillDown();

  // Handler to open drill-down for a metric
  const handleMetricClick = (type: ProductionDrillDownType) => {
    const config = DRILL_DOWN_CONFIGS[type];
    openDrillDown({
      type,
      title: config.title,
      description: config.description,
    });
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production Dashboard</h2>
          <p className="text-muted-foreground">
            Appraisal production tracking, quality control, and efficiency metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild variant="outline">
            <Link href="/production/templates">
              <FileCheck className="mr-2 h-4 w-4" /> Templates
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/production/library">
              <Library className="mr-2 h-4 w-4" /> Task Library
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/production/my-tasks">
              <Clock className="mr-2 h-4 w-4" /> My Tasks
            </Link>
          </Button>
          <Button asChild>
            <Link href="/production/board">
              <Factory className="mr-2 h-4 w-4" /> Production Board
            </Link>
          </Button>
        </div>
      </div>

      {/* Production Metrics Dashboard */}
      <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
        {isLoading ? (
          <MetricGrid>
            {Array.from({ length: 20 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </MetricGrid>
        ) : (
          <MetricGrid>
            {/* Row 1: Files Status */}
            <MetricCard
              title="Files Due to Client"
              value={metrics?.filesDueToClient ?? 0}
              filterCount={4}
              highlight={metrics?.filesDueToClient && metrics.filesDueToClient > 0 ? "yellow" : null}
              onClick={() => handleMetricClick("filesDueToClient")}
            />
            <MetricCard
              title="All Due"
              value={metrics?.allDue ?? 0}
              filterCount={3}
              highlight={metrics?.allDue && metrics.allDue > 0 ? "yellow" : null}
              onClick={() => handleMetricClick("allDue")}
            />
            <MetricCard
              title="Files Overdue"
              value={metrics?.filesOverdue ?? 0}
              filterCount={3}
              highlight={metrics?.filesOverdue && metrics.filesOverdue > 0 ? "red" : null}
              onClick={() => handleMetricClick("filesOverdue")}
            />
            <MetricCard
              title="Production Due"
              value={metrics?.productionDue ?? 0}
              filterCount={3}
              highlight={metrics?.productionDue && metrics.productionDue > 0 ? "orange" : null}
              onClick={() => handleMetricClick("productionDue")}
            />

            {/* Row 2: Review Status */}
            <MetricCard
              title="Files in Review"
              value={metrics?.filesInReview ?? 0}
              filterCount={3}
              onClick={() => handleMetricClick("filesInReview")}
            />
            <MetricCard
              title="Files Not in Review"
              value={metrics?.filesNotInReview ?? 0}
              filterCount={4}
              onClick={() => handleMetricClick("filesNotInReview")}
            />
            <MetricCard
              title="Files w/Issues"
              value={metrics?.filesWithIssues ?? 0}
              filterCount={3}
              highlight={metrics?.filesWithIssues && metrics.filesWithIssues > 0 ? "red" : null}
              onClick={() => handleMetricClick("filesWithIssues")}
            />
            <MetricCard
              title="Files w/Correction"
              value={metrics?.filesWithCorrection ?? 0}
              filterCount={3}
              highlight={metrics?.filesWithCorrection && metrics.filesWithCorrection > 0 ? "orange" : null}
              onClick={() => handleMetricClick("filesWithCorrection")}
            />

            {/* Row 3: Corrections & Cases */}
            <MetricCard
              title="Correction Review"
              value={metrics?.correctionReview ?? 0}
              filterCount={3}
              onClick={() => handleMetricClick("correctionReview")}
            />
            <MetricCard
              title="Cases in Progress"
              value={metrics?.casesInProgress ?? 0}
              filterCount={2}
              highlight={metrics?.casesInProgress && metrics.casesInProgress > 0 ? "blue" : null}
              onClick={() => handleMetricClick("casesInProgress")}
            />
            <MetricCard
              title="Cases Impeded"
              value={metrics?.casesImpeded ?? 0}
              filterCount={2}
              highlight={metrics?.casesImpeded && metrics.casesImpeded > 0 ? "red" : null}
              onClick={() => handleMetricClick("casesImpeded")}
            />
            <MetricCard
              title="Cases in Review"
              value={metrics?.casesInReview ?? 0}
              filterCount={2}
              onClick={() => handleMetricClick("casesInReview")}
            />

            {/* Row 4: Delivery Status */}
            <MetricCard
              title="Cases Delivered"
              value={metrics?.casesDelivered ?? 0}
              filterCount={4}
              highlight={metrics?.casesDelivered && metrics.casesDelivered > 0 ? "green" : null}
              onClick={() => handleMetricClick("casesDelivered")}
            />
            <MetricCard
              title="Ready for Delivery"
              value={metrics?.readyForDelivery ?? 0}
              filterCount={3}
              highlight={metrics?.readyForDelivery && metrics.readyForDelivery > 0 ? "green" : null}
              onClick={() => handleMetricClick("readyForDelivery")}
            />
            <MetricCard
              title="Orders Delivered Today"
              value={metrics?.ordersDeliveredToday ?? 0}
              filterCount={3}
              highlight={metrics?.ordersDeliveredToday && metrics.ordersDeliveredToday > 0 ? "green" : null}
              onClick={() => handleMetricClick("ordersDeliveredToday")}
            />
            <MetricCard
              title="Value Delivered Today"
              value={formatCurrency(metrics?.valueDeliveredToday ?? 0)}
              filterCount={3}
              highlight={metrics?.valueDeliveredToday && metrics.valueDeliveredToday > 0 ? "green" : null}
              onClick={() => handleMetricClick("valueDeliveredToday")}
            />

            {/* Row 5: 7-Day Stats & Turn Times */}
            <MetricCard
              title="# Delivered Past 7 Days"
              value={metrics?.deliveredPast7Days ?? 0}
              filterCount={4}
              onClick={() => handleMetricClick("deliveredPast7Days")}
            />
            <MetricCard
              title="Value Delivered Past 7 Days"
              value={formatCurrency(metrics?.valueDeliveredPast7Days ?? 0)}
              filterCount={3}
              onClick={() => handleMetricClick("valueDeliveredPast7Days")}
            />
            <MetricCard
              title="Average Turn Time (1 Week)"
              value={formatTurnTime(metrics?.avgTurnTime1Week ?? null)}
              filterCount={2}
              onClick={() => handleMetricClick("avgTurnTime1Week")}
            />
            <MetricCard
              title="Average Turn Time (Last 30 Days)"
              value={formatTurnTime(metrics?.avgTurnTime30Days ?? null)}
              filterCount={2}
              onClick={() => handleMetricClick("avgTurnTime30Days")}
            />
          </MetricGrid>
        )}
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/board">
            <CardHeader>
              <CardTitle>Production Board</CardTitle>
              <CardDescription>
                Track appraisals through 10 production stages with Kanban board
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Factory className="h-10 w-10 mx-auto mb-3 text-blue-500" />
                <Button variant="link" className="p-0">
                  Open Board <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/quality-control">
            <CardHeader>
              <CardTitle>Quality Control Queue</CardTitle>
              <CardDescription>
                Appraisals pending quality review
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <FileCheck className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <Button variant="link" className="p-0">
                  View Queue <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/active-appraisals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Appraisals</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">View all appraisals in production</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/quality-control">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Control</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Review and approve appraisals</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/templates">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage appraisal templates</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <Link href="/production/library">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Task Library</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Manage reusable task definitions</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Drill-down dialog */}
      <ProductionDrillDownDialog />
    </div>
  );
}

export default function ProductionDashboard() {
  return (
    <ProductionDrillDownProvider>
      <ProductionDashboardContent />
    </ProductionDrillDownProvider>
  );
}
