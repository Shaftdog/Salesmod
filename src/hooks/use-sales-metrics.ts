import { useMemo } from 'react'
import { useOrders } from './use-orders'
import { useDeals } from './use-deals'
import { useClients } from './use-clients'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  parseISO,
  isWithinInterval,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval
} from 'date-fns'
import type { Order, Deal } from '@/lib/types'

export interface SalesKPIs {
  todayOrders: number
  todayTotalFee: number
  weeklyOrders: number
  weeklyTotalFees: number
  todayOpportunities: number
  weeklyOpportunities: number
  monthlyOrders: number
  monthlyTotalFees: number
  averageAppraisalFee: number
  yesterdayOrders: number
  yesterdayTotalFees: number
  agentMonthlyOrders: number
}

export interface DistributionData {
  name: string
  value: number
  color?: string
}

export interface TrendDataPoint {
  date: string
  label: string
  value: number
}

export interface SalesMetrics {
  kpis: SalesKPIs
  weeklyOrdersByCampaign: DistributionData[]
  monthlyOrdersByCampaign: DistributionData[]
  salesByAgentLast30Days: DistributionData[]
  amcClientDistribution: DistributionData[]
  productDistribution: DistributionData[]
  dailyOrdersTrend: TrendDataPoint[]
  weeklyOrdersTrend: TrendDataPoint[]
  monthlyOrdersTrend: TrendDataPoint[]
  isLoading: boolean
  error: Error | null
}

// Color palette for charts
const CHART_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#84cc16', // lime
  '#6366f1', // indigo
]

function getOrderDate(order: Order): Date {
  // Try to parse the ordered date, fall back to created date
  try {
    if (order.orderedDate) {
      return parseISO(order.orderedDate)
    }
    return parseISO(order.createdAt)
  } catch {
    return new Date()
  }
}

function filterOrdersByDateRange(orders: Order[], start: Date, end: Date): Order[] {
  return orders.filter(order => {
    const orderDate = getOrderDate(order)
    return isWithinInterval(orderDate, { start, end })
  })
}

function filterDealsByDateRange(deals: Deal[], start: Date, end: Date): Deal[] {
  return deals.filter(deal => {
    try {
      const dealDate = parseISO(deal.createdAt)
      return isWithinInterval(dealDate, { start, end })
    } catch {
      return false
    }
  })
}

function calculateTotalFees(orders: Order[]): number {
  return orders.reduce((sum, order) => sum + (order.feeAmount || 0), 0)
}

function groupByField(orders: Order[], field: keyof Order): Record<string, Order[]> {
  return orders.reduce((acc, order) => {
    const value = String(order[field] || 'None')
    if (!acc[value]) acc[value] = []
    acc[value].push(order)
    return acc
  }, {} as Record<string, Order[]>)
}

function groupByClient(orders: Order[]): Record<string, Order[]> {
  return orders.reduce((acc, order) => {
    const clientName = order.client?.companyName || 'None'
    if (!acc[clientName]) acc[clientName] = []
    acc[clientName].push(order)
    return acc
  }, {} as Record<string, Order[]>)
}

function groupByAssignee(orders: Order[]): Record<string, Order[]> {
  return orders.reduce((acc, order) => {
    const assigneeName = order.assignee?.name || 'None'
    if (!acc[assigneeName]) acc[assigneeName] = []
    acc[assigneeName].push(order)
    return acc
  }, {} as Record<string, Order[]>)
}

export function useSalesMetrics(currentUserId?: string): SalesMetrics {
  const { orders, isLoading: ordersLoading, error: ordersError } = useOrders()
  const { deals, isLoading: dealsLoading, error: dealsError } = useDeals()
  const { clients, isLoading: clientsLoading, error: clientsError } = useClients()

  const metrics = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const yesterdayStart = startOfDay(subDays(now, 1))
    const yesterdayEnd = endOfDay(subDays(now, 1))
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const thirtyDaysAgo = subDays(now, 30)

    // Filter orders by date ranges
    const todayOrders = filterOrdersByDateRange(orders, todayStart, todayEnd)
    const yesterdayOrders = filterOrdersByDateRange(orders, yesterdayStart, yesterdayEnd)
    const weeklyOrders = filterOrdersByDateRange(orders, weekStart, weekEnd)
    const monthlyOrders = filterOrdersByDateRange(orders, monthStart, monthEnd)
    const last30DaysOrders = filterOrdersByDateRange(orders, thirtyDaysAgo, now)

    // Filter deals by date ranges (opportunities)
    const todayDeals = filterDealsByDateRange(deals, todayStart, todayEnd)
    const weeklyDeals = filterDealsByDateRange(deals, weekStart, weekEnd)

    // KPIs
    const kpis: SalesKPIs = {
      todayOrders: todayOrders.length,
      todayTotalFee: calculateTotalFees(todayOrders),
      weeklyOrders: weeklyOrders.length,
      weeklyTotalFees: calculateTotalFees(weeklyOrders),
      todayOpportunities: todayDeals.length,
      weeklyOpportunities: weeklyDeals.length,
      monthlyOrders: monthlyOrders.length,
      monthlyTotalFees: calculateTotalFees(monthlyOrders),
      averageAppraisalFee: orders.length > 0
        ? calculateTotalFees(orders) / orders.length
        : 0,
      yesterdayOrders: yesterdayOrders.length,
      yesterdayTotalFees: calculateTotalFees(yesterdayOrders),
      agentMonthlyOrders: currentUserId
        ? monthlyOrders.filter(o => o.assignedTo === currentUserId).length
        : 0,
    }

    // Weekly Orders by Sales Campaign
    const weeklyByCampaign = groupByField(weeklyOrders, 'salesCampaign')
    const weeklyOrdersByCampaign: DistributionData[] = Object.entries(weeklyByCampaign)
      .map(([name, orders], index) => ({
        name: formatCampaignName(name),
        value: orders.length,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)

    // Monthly Orders by Sales Campaign
    const monthlyByCampaign = groupByField(monthlyOrders, 'salesCampaign')
    const monthlyOrdersByCampaign: DistributionData[] = Object.entries(monthlyByCampaign)
      .map(([name, orders], index) => ({
        name: formatCampaignName(name),
        value: orders.length,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)

    // Sales by Agent Last 30 Days
    const ordersByAssignee = groupByAssignee(last30DaysOrders)
    const salesByAgentLast30Days: DistributionData[] = Object.entries(ordersByAssignee)
      .map(([name, orders], index) => ({
        name,
        value: orders.length,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)

    // AMC Client Distribution (all orders)
    const ordersByClient = groupByClient(orders)
    const amcClientDistribution: DistributionData[] = Object.entries(ordersByClient)
      .map(([name, orders], index) => ({
        name,
        value: orders.length,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)

    // Product Distribution by Report Form Type
    const ordersByProduct = groupByField(orders, 'reportFormType')
    const productDistribution: DistributionData[] = Object.entries(ordersByProduct)
      .map(([name, orders], index) => ({
        name: formatProductName(name),
        value: orders.length,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)

    // Daily Orders Trend (last 17 days like in screenshot)
    const dailyTrendStart = subDays(now, 16)
    const dailyDates = eachDayOfInterval({ start: dailyTrendStart, end: now })
    const dailyOrdersTrend: TrendDataPoint[] = dailyDates.map(date => {
      const dayOrders = filterOrdersByDateRange(orders, startOfDay(date), endOfDay(date))
      return {
        date: format(date, 'yyyy-MM-dd'),
        label: format(date, 'MM/dd'),
        value: dayOrders.length,
      }
    })

    // Weekly Orders Trend (last 16 weeks)
    const weeklyTrendStart = subWeeks(now, 15)
    const weeklyDates = eachWeekOfInterval({ start: weeklyTrendStart, end: now }, { weekStartsOn: 0 })
    const weeklyOrdersTrend: TrendDataPoint[] = weeklyDates.map(weekStartDate => {
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 0 })
      const weekOrders = filterOrdersByDateRange(orders, weekStartDate, weekEndDate)
      return {
        date: format(weekStartDate, 'yyyy-MM-dd'),
        label: format(weekStartDate, 'MM/dd'),
        value: weekOrders.length,
      }
    })

    // Monthly Orders Trend (last 17 months)
    const monthlyTrendStart = subMonths(now, 16)
    const monthlyDates = eachMonthOfInterval({ start: monthlyTrendStart, end: now })
    const monthlyOrdersTrend: TrendDataPoint[] = monthlyDates.map(monthStartDate => {
      const monthEndDate = endOfMonth(monthStartDate)
      const monthOrders = filterOrdersByDateRange(orders, monthStartDate, monthEndDate)
      return {
        date: format(monthStartDate, 'yyyy-MM-dd'),
        label: format(monthStartDate, 'MMM'),
        value: monthOrders.length,
      }
    })

    return {
      kpis,
      weeklyOrdersByCampaign,
      monthlyOrdersByCampaign,
      salesByAgentLast30Days,
      amcClientDistribution,
      productDistribution,
      dailyOrdersTrend,
      weeklyOrdersTrend,
      monthlyOrdersTrend,
    }
  }, [orders, deals, clients, currentUserId])

  return {
    ...metrics,
    isLoading: ordersLoading || dealsLoading || clientsLoading,
    error: ordersError || dealsError || clientsError,
  }
}

// Helper to format campaign names for display
function formatCampaignName(name: string): string {
  if (!name || name === 'None' || name === 'null' || name === 'undefined') {
    return 'None'
  }
  // Convert snake_case to Title Case
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Helper to format product names for display
function formatProductName(name: string): string {
  if (!name || name === 'None' || name === 'null' || name === 'undefined') {
    return 'None'
  }
  // Keep original if it looks like a form number
  return name
}
