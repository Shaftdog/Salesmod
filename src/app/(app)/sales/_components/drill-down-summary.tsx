'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Package, DollarSign, TrendingUp, Users, FileText, Building2 } from 'lucide-react'
import type { Order } from '@/lib/types'
import { calculateOrderStats, formatCurrency } from './drill-down-utils'

interface DrillDownSummaryProps {
  orders: Order[]
}

const statusColors: Record<string, string> = {
  INTAKE: '#3b82f6',
  SCHEDULING: '#eab308',
  SCHEDULED: '#f97316',
  INSPECTED: '#a855f7',
  FINALIZATION: '#6366f1',
  READY_FOR_DELIVERY: '#06b6d4',
  DELIVERED: '#22c55e',
  WORKFILE: '#6b7280',
  CORRECTION: '#ef4444',
  REVISION: '#f59e0b',
}

export function DrillDownSummary({ orders }: DrillDownSummaryProps) {
  const stats = useMemo(() => calculateOrderStats(orders), [orders])

  const statusEntries = useMemo(() => {
    return Object.entries(stats.statusCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [stats.statusCounts])

  const maxStatusCount = useMemo(() => {
    return Math.max(...Object.values(stats.statusCounts), 1)
  }, [stats.statusCounts])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Package className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-light text-white">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Fees</p>
                <p className="text-2xl font-light text-white">{formatCurrency(stats.totalFees)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Average Fee</p>
                <p className="text-2xl font-light text-white">{formatCurrency(stats.averageFee)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Unique Clients</p>
                <p className="text-2xl font-light text-white">{stats.topClients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown + Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-500" />
              Status Breakdown
            </h3>
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{status.replace(/_/g, ' ')}</span>
                    <span className="text-zinc-300 font-medium">{count}</span>
                  </div>
                  <Progress
                    value={(count / maxStatusCount) * 100}
                    className="h-2 bg-zinc-700"
                    style={{
                      // @ts-ignore - CSS custom property
                      '--progress-color': statusColors[status] || '#6b7280',
                    }}
                  />
                </div>
              ))}
              {statusEntries.length === 0 && (
                <p className="text-zinc-500 text-sm">No orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-500" />
              Top Clients
            </h3>
            <div className="space-y-3">
              {stats.topClients.map((client, index) => (
                <div key={client.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 w-4">{index + 1}.</span>
                    <span className="text-zinc-300 truncate max-w-[150px]">{client.name}</span>
                  </div>
                  <span className="text-zinc-400 text-sm">
                    {client.count} order{client.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
              {stats.topClients.length === 0 && (
                <p className="text-zinc-500 text-sm">No clients</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-zinc-500" />
              Top Products
            </h3>
            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 w-4">{index + 1}.</span>
                    <span className="text-zinc-300 truncate max-w-[150px]">{product.name}</span>
                  </div>
                  <span className="text-zinc-400 text-sm">
                    {product.count} order{product.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
              {stats.topProducts.length === 0 && (
                <p className="text-zinc-500 text-sm">No products</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
