'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { TrendDataPoint } from "@/hooks/use-sales-metrics"

interface OrdersTrendChartProps {
  title: string
  data: TrendDataPoint[]
  filterCount?: number
  showSeeAll?: boolean
  onSeeAll?: () => void
  isLoading?: boolean
  showDataLabels?: boolean
}

export function OrdersTrendChart({
  title,
  data,
  filterCount = 1,
  showSeeAll = true,
  onSeeAll,
  isLoading,
  showDataLabels = true,
}: OrdersTrendChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 shadow-lg">
          <p className="text-zinc-400 text-sm">{label}</p>
          <p className="text-white font-medium">{payload[0].value} orders</p>
        </div>
      )
    }
    return null
  }

  // Custom dot with data label
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (!showDataLabels) return null
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="#22d3ee" stroke="#22d3ee" strokeWidth={2} />
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fill="#22d3ee"
          fontSize={11}
          fontWeight={500}
        >
          {payload.value}
        </text>
      </g>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const yAxisMax = Math.ceil(maxValue * 1.3) // Add 30% headroom for labels

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-100">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center text-zinc-500">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-zinc-500">
            No data available
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 25, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#374151' }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, yAxisMax]}
                  label={{
                    value: 'Task (count, in numbers)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#6b7280',
                    fontSize: 10,
                    dx: -10,
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={{ r: 6, fill: '#22d3ee', stroke: '#22d3ee' }}
                />
              </LineChart>
            </ResponsiveContainer>
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
