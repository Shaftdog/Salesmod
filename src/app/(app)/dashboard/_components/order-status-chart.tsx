'use client'

import { useState, useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { orderStatuses, orderStatusLabels, OrderStatus } from "@/lib/types"
import { useOrders } from "@/hooks/use-orders"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { subDays, subMonths, startOfYear, parseISO, isAfter } from "date-fns"

type DateFilter = "7days" | "30days" | "90days" | "year" | "all"

export function OrderStatusChart() {
    const { orders } = useOrders();
    const [dateFilter, setDateFilter] = useState<DateFilter>("all");

    const filteredOrders = useMemo(() => {
        if (dateFilter === "all") return orders;

        const now = new Date();
        let cutoffDate: Date;

        switch (dateFilter) {
            case "7days":
                cutoffDate = subDays(now, 7);
                break;
            case "30days":
                cutoffDate = subDays(now, 30);
                break;
            case "90days":
                cutoffDate = subDays(now, 90);
                break;
            case "year":
                cutoffDate = startOfYear(now);
                break;
            default:
                return orders;
        }

        return orders.filter(order => {
            const orderDate = parseISO(order.orderedDate);
            return isAfter(orderDate, cutoffDate);
        });
    }, [orders, dateFilter]);

    const data = orderStatuses.map(status => ({
        name: orderStatusLabels[status] || status,
        total: filteredOrders.filter(order => order.status === status).length
    }));

  return (
    <div className="space-y-4">
      <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">Last 7 days</SelectItem>
          <SelectItem value="30days">Last 30 days</SelectItem>
          <SelectItem value="90days">Last 90 days</SelectItem>
          <SelectItem value="year">This year</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
              contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
              }}
          />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
