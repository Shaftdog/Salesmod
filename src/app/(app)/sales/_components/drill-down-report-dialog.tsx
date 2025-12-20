'use client'

import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, X, LayoutList, BarChart3, FileText } from 'lucide-react'
import type { Order, Deal } from '@/lib/types'
import { useDrillDown } from './drill-down-context'
import { DrillDownSummary } from './drill-down-summary'
import { DrillDownChart } from './drill-down-chart'
import { DrillDownOrdersTable } from './drill-down-orders-table'
import { DrillDownDealsTable } from './drill-down-deals-table'
import {
  filterOrdersForDrillDown,
  filterDealsForDrillDown,
  exportOrdersToCsv,
  formatCurrency,
  type DrillDownType,
} from './drill-down-utils'

// Types that should show deals instead of orders
const OPPORTUNITY_TYPES: DrillDownType[] = ['opportunities_today', 'opportunities_weekly']

function isOpportunityType(type: DrillDownType): boolean {
  return OPPORTUNITY_TYPES.includes(type)
}

interface DrillDownReportDialogProps {
  orders: Order[]
  deals?: Deal[]
  isLoading?: boolean
}

export function DrillDownReportDialog({
  orders,
  deals = [],
  isLoading,
}: DrillDownReportDialogProps) {
  const { state, closeDrillDown } = useDrillDown()
  const { isOpen, config } = state

  // Determine if this is an opportunities drill-down
  const isOpportunities = config ? isOpportunityType(config.type) : false

  // Filter orders based on current config
  const filteredOrders = useMemo(() => {
    if (!config || isOpportunities) return []
    return filterOrdersForDrillDown(orders, config)
  }, [orders, config, isOpportunities])

  // Filter deals based on current config (for opportunities)
  const filteredDeals = useMemo(() => {
    if (!config || !isOpportunities) return []
    return filterDealsForDrillDown(deals, config)
  }, [deals, config, isOpportunities])

  // Calculate summary stats for header
  const totalFees = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.feeAmount || 0), 0)
  }, [filteredOrders])

  // Calculate total deal value for opportunities
  const totalDealValue = useMemo(() => {
    return filteredDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  }, [filteredDeals])

  const handleExport = () => {
    if (!config) return
    const filename = `${config.type}_${new Date().toISOString().split('T')[0]}`
    // TODO: Add exportDealsToCsv for opportunities
    if (!isOpportunities) {
      exportOrdersToCsv(filteredOrders, filename)
    }
  }

  if (!config) return null

  const itemCount = isOpportunities ? filteredDeals.length : filteredOrders.length
  const itemLabel = isOpportunities ? 'opportunities' : 'orders'
  const totalValue = isOpportunities ? totalDealValue : totalFees

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDrillDown()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col bg-zinc-900 border-zinc-800 text-white p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-white">
                {config.title}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {config.subtitle || config.dateRange.label}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-base px-3 py-1"
              >
                {itemCount} {itemLabel}
              </Badge>
              {totalValue > 0 && (
                <Badge
                  variant="outline"
                  className="bg-green-500/20 text-green-400 border-green-500/30 text-base px-3 py-1"
                >
                  {formatCurrency(totalValue)}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs Content */}
        <Tabs defaultValue="summary" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4">
            <TabsList className="bg-zinc-800 border-zinc-700">
              <TabsTrigger
                value="summary"
                className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger
                value="chart"
                className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Chart
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
              >
                <LayoutList className="h-4 w-4 mr-2" />
                {isOpportunities ? 'Opportunities' : 'Orders'}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value="summary" className="mt-0 h-full">
              {isOpportunities ? (
                <DrillDownSummary orders={[]} deals={filteredDeals} isOpportunities />
              ) : (
                <DrillDownSummary orders={filteredOrders} />
              )}
            </TabsContent>

            <TabsContent value="chart" className="mt-0 h-full">
              {isOpportunities ? (
                <DrillDownChart orders={[]} deals={filteredDeals} config={config} isOpportunities />
              ) : (
                <DrillDownChart orders={filteredOrders} config={config} />
              )}
            </TabsContent>

            <TabsContent value="list" className="mt-0 h-full">
              {isOpportunities ? (
                <DrillDownDealsTable deals={filteredDeals} />
              ) : (
                <DrillDownOrdersTable orders={filteredOrders} />
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            Showing data for {config.dateRange.label}
          </span>
          <div className="flex items-center gap-3">
            {!isOpportunities && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={closeDrillDown}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
