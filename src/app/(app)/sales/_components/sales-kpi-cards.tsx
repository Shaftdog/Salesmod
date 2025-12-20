'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SalesKPIs } from "@/hooks/use-sales-metrics"
import { useDrillDown } from "./drill-down-context"
import { createDrillDownConfig, type DrillDownType } from "./drill-down-utils"

interface SalesKPICardsProps {
  kpis: SalesKPIs
  isLoading?: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  filterCount?: number
  isLoading?: boolean
  onClick?: () => void
}

function MetricCard({ title, value, subtitle, filterCount, isLoading, onClick }: MetricCardProps) {
  return (
    <Card
      className={cn(
        "bg-zinc-900 border-zinc-800 transition-all duration-200",
        onClick && "cursor-pointer hover:border-zinc-600 hover:bg-zinc-800/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider text-center">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-4xl font-light text-center text-white">
          {isLoading ? '...' : value}
        </div>
        {filterCount !== undefined && (
          <p className="text-xs text-zinc-500 text-center mt-2">
            {filterCount} Filters
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function SalesKPICards({ kpis, isLoading }: SalesKPICardsProps) {
  const { openDrillDown } = useDrillDown()

  const handleKPIClick = (type: DrillDownType, metricValue?: number | string, metricLabel?: string) => {
    openDrillDown(createDrillDownConfig(type, { metricValue, metricLabel }))
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Today's Orders, Today's Fee, Weekly Orders, Weekly Fees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Orders"
          value={kpis.todayOrders}
          filterCount={3}
          isLoading={isLoading}
          onClick={() => handleKPIClick('today_orders', kpis.todayOrders, 'orders')}
        />
        <MetricCard
          title="Today's Total Fee"
          value={formatCurrency(kpis.todayTotalFee)}
          filterCount={2}
          isLoading={isLoading}
          onClick={() => handleKPIClick('today_fees', kpis.todayTotalFee, 'fees')}
        />
        <MetricCard
          title="Weekly Orders"
          value={kpis.weeklyOrders}
          filterCount={3}
          isLoading={isLoading}
          onClick={() => handleKPIClick('weekly_orders', kpis.weeklyOrders, 'orders')}
        />
        <MetricCard
          title="Weekly Total Fees"
          value={formatCurrency(kpis.weeklyTotalFees)}
          filterCount={2}
          isLoading={isLoading}
          onClick={() => handleKPIClick('weekly_fees', kpis.weeklyTotalFees, 'fees')}
        />
      </div>

      {/* Row 2: Today's Opportunities, Weekly Opportunities, Monthly Orders, Monthly Fees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Opportunities"
          value={kpis.todayOpportunities}
          filterCount={2}
          isLoading={isLoading}
          onClick={() => handleKPIClick('opportunities_today', kpis.todayOpportunities, 'opportunities')}
        />
        <MetricCard
          title="Weekly Opportunities"
          value={kpis.weeklyOpportunities}
          filterCount={2}
          isLoading={isLoading}
          onClick={() => handleKPIClick('opportunities_weekly', kpis.weeklyOpportunities, 'opportunities')}
        />
        <MetricCard
          title="Monthly Orders"
          value={kpis.monthlyOrders}
          filterCount={3}
          isLoading={isLoading}
          onClick={() => handleKPIClick('monthly_orders', kpis.monthlyOrders, 'orders')}
        />
        <MetricCard
          title="Monthly Total Fees"
          value={formatCurrency(kpis.monthlyTotalFees)}
          filterCount={2}
          isLoading={isLoading}
          onClick={() => handleKPIClick('monthly_fees', kpis.monthlyTotalFees, 'fees')}
        />
      </div>

      {/* Row 3: Average Fee, Yesterday's Orders, Yesterday's Fees, Agent Monthly Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Average of Appraisal Fee"
          value={formatCurrency(kpis.averageAppraisalFee)}
          filterCount={2}
          isLoading={isLoading}
          onClick={() => handleKPIClick('average_fee', kpis.averageAppraisalFee, 'average')}
        />
        <MetricCard
          title="Yesterday's Orders"
          value={kpis.yesterdayOrders}
          filterCount={3}
          isLoading={isLoading}
          onClick={() => handleKPIClick('yesterday_orders', kpis.yesterdayOrders, 'orders')}
        />
        <MetricCard
          title="Yesterday's Total Fees"
          value={formatCurrency(kpis.yesterdayTotalFees)}
          filterCount={2}
          isLoading={isLoading}
          onClick={() => handleKPIClick('yesterday_fees', kpis.yesterdayTotalFees, 'fees')}
        />
        <MetricCard
          title="Agent Monthly Orders"
          value={kpis.agentMonthlyOrders}
          filterCount={4}
          isLoading={isLoading}
          onClick={() => handleKPIClick('agent_monthly_orders', kpis.agentMonthlyOrders, 'orders')}
        />
      </div>
    </div>
  )
}
