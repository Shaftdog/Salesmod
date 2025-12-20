'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Order, Deal } from '@/lib/types'
import type { DrillDownConfig } from './drill-down-utils'

interface DrillDownChartProps {
  orders: Order[]
  deals?: Deal[]
  config: DrillDownConfig
  isOpportunities?: boolean
}

const COLORS = [
  '#22d3ee', // cyan
  '#f59e0b', // amber
  '#a78bfa', // violet
  '#34d399', // emerald
  '#f472b6', // pink
  '#60a5fa', // blue
  '#fbbf24', // yellow
  '#c084fc', // purple
  '#4ade80', // green
  '#fb923c', // orange
]

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

const stageColors: Record<string, string> = {
  LEAD: '#3b82f6',
  QUALIFIED: '#eab308',
  PROPOSAL: '#f97316',
  NEGOTIATION: '#a855f7',
  CLOSED_WON: '#22c55e',
  CLOSED_LOST: '#ef4444',
}

export function DrillDownChart({ orders, deals = [], config, isOpportunities = false }: DrillDownChartProps) {
  // Determine chart type based on drill-down type
  const chartType = useMemo(() => {
    if (
      config.type.includes('distribution') ||
      config.type.includes('campaign') ||
      config.type.includes('client') ||
      config.type.includes('product') ||
      config.type.includes('agent')
    ) {
      return 'pie'
    }
    return 'bar'
  }, [config.type])

  // Prepare data for pie chart (distribution types)
  const pieData = useMemo(() => {
    if (chartType !== 'pie') return []

    let groupedData: Record<string, number> = {}

    if (config.type.includes('campaign')) {
      orders.forEach((order) => {
        const campaign = order.salesCampaign || 'None'
        groupedData[campaign] = (groupedData[campaign] || 0) + 1
      })
    } else if (config.type.includes('agent')) {
      orders.forEach((order) => {
        const agent = order.assignee?.name || 'Unassigned'
        groupedData[agent] = (groupedData[agent] || 0) + 1
      })
    } else if (config.type.includes('client')) {
      orders.forEach((order) => {
        const client = order.client?.companyName || 'Unknown'
        groupedData[client] = (groupedData[client] || 0) + 1
      })
    } else if (config.type.includes('product')) {
      orders.forEach((order) => {
        const product = order.reportFormType || 'Unknown'
        groupedData[product] = (groupedData[product] || 0) + 1
      })
    } else {
      // Default: group by status
      orders.forEach((order) => {
        const status = order.status || 'UNKNOWN'
        groupedData[status] = (groupedData[status] || 0) + 1
      })
    }

    return Object.entries(groupedData)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10
  }, [orders, config.type, chartType])

  // Prepare data for bar chart (status breakdown for orders, stage breakdown for deals)
  const barData = useMemo(() => {
    if (chartType !== 'bar') return []

    if (isOpportunities) {
      // Stage breakdown for deals
      const stageCounts: Record<string, number> = {}
      deals.forEach((deal) => {
        const stage = deal.stage || 'UNKNOWN'
        stageCounts[stage] = (stageCounts[stage] || 0) + 1
      })

      return Object.entries(stageCounts)
        .map(([name, value]) => ({
          name: name.replace(/_/g, ' '),
          value,
          fill: stageColors[name] || '#6b7280',
        }))
        .sort((a, b) => b.value - a.value)
    }

    // Status breakdown for orders
    const statusCounts: Record<string, number> = {}
    orders.forEach((order) => {
      const status = order.status || 'UNKNOWN'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    return Object.entries(statusCounts)
      .map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value,
        fill: statusColors[name] || '#6b7280',
      }))
      .sort((a, b) => b.value - a.value)
  }, [orders, deals, chartType, isOpportunities])

  const total = isOpportunities ? deals.length : orders.length

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
      return (
        <div className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 shadow-lg">
          <p className="text-white font-medium">{item.name || item.payload?.name}</p>
          <p className="text-zinc-400">
            {item.value} ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const hasData = isOpportunities ? deals.length > 0 : orders.length > 0

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-500">
        No {isOpportunities ? 'opportunities' : 'orders'} available for chart
      </div>
    )
  }

  if (chartType === 'pie') {
    return (
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              stroke="transparent"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => (
                <span className="text-zinc-300 text-sm">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Bar chart for status breakdown
  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis type="number" stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {barData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
