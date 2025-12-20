'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"
import type { DistributionData } from "@/hooks/use-sales-metrics"

interface DistributionDonutChartProps {
  title: string
  data: DistributionData[]
  filterCount?: number
  showSeeAll?: boolean
  onSeeAll?: () => void
  onSegmentClick?: (segment: DistributionData) => void
  maxLegendItems?: number
  isLoading?: boolean
}

// Default color palette matching the dark theme screenshots
const DEFAULT_COLORS = [
  '#22d3ee', // cyan-400
  '#f59e0b', // amber-500
  '#a78bfa', // violet-400
  '#34d399', // emerald-400
  '#f472b6', // pink-400
  '#60a5fa', // blue-400
  '#fbbf24', // yellow-400
  '#c084fc', // purple-400
  '#4ade80', // green-400
  '#fb923c', // orange-400
]

// Render active shape for hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'brightness(1.2)', cursor: 'pointer' }}
      />
    </g>
  )
}

export function DistributionDonutChart({
  title,
  data,
  filterCount = 1,
  showSeeAll = true,
  onSeeAll,
  onSegmentClick,
  maxLegendItems = 8,
  isLoading,
}: DistributionDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Limit legend items and group the rest as "Other"
  const displayData = data.length > maxLegendItems
    ? [
        ...data.slice(0, maxLegendItems - 1),
        {
          name: 'Other',
          value: data.slice(maxLegendItems - 1).reduce((sum, item) => sum + item.value, 0),
          color: DEFAULT_COLORS[maxLegendItems - 1],
        },
      ]
    : data

  // Add colors if not present
  const chartData = displayData.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }))

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index)
  }, [])

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined)
  }, [])

  const handleSegmentClick = useCallback((data: any, index: number) => {
    if (onSegmentClick && chartData[index]) {
      onSegmentClick(chartData[index])
    }
  }, [onSegmentClick, chartData])

  const handleLegendClick = useCallback((item: DistributionData) => {
    if (onSegmentClick) {
      onSegmentClick(item)
    }
  }, [onSegmentClick])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
      return (
        <div className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 shadow-lg">
          <p className="text-white font-medium">{item.name}</p>
          <p className="text-zinc-400">
            {item.value} ({percentage}%)
          </p>
          {onSegmentClick && (
            <p className="text-cyan-400 text-xs mt-1">Click to view details</p>
          )}
        </div>
      )
    }
    return null
  }

  const renderLegend = () => {
    const hasMore = data.length > maxLegendItems
    return (
      <div className="flex flex-col gap-1 text-sm">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            className={cn(
              "flex items-center gap-2",
              onSegmentClick && "cursor-pointer hover:bg-zinc-800 rounded px-1 -mx-1 transition-colors"
            )}
            onClick={() => handleLegendClick(item)}
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-zinc-300 truncate">{item.name}</span>
          </div>
        ))}
        {hasMore && (
          <span className="text-zinc-500 text-xs ml-5">+ more</span>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center text-zinc-500">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-zinc-500">
            No data available
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex-1 h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="transparent"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    onClick={handleSegmentClick}
                    style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center total */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-3xl font-light text-white">{total}</span>
              </div>
            </div>
            <div className="w-48">
              {renderLegend()}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
          <span className="text-xs text-zinc-500">
            {filterCount} Filter{filterCount !== 1 ? 's' : ''} · Tasks in 1 project
          </span>
          {showSeeAll && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              onClick={onSeeAll}
            >
              See all
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
