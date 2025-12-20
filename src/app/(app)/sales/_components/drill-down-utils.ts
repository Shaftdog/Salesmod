import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  parseISO,
  isWithinInterval,
  format,
} from 'date-fns'
import type { Order, Deal } from '@/lib/types'

// Drill-down type definitions
export type DrillDownType =
  | 'today_orders'
  | 'today_fees'
  | 'weekly_orders'
  | 'weekly_fees'
  | 'monthly_orders'
  | 'monthly_fees'
  | 'yesterday_orders'
  | 'yesterday_fees'
  | 'agent_monthly_orders'
  | 'average_fee'
  | 'opportunities_today'
  | 'opportunities_weekly'
  | 'campaign_distribution'
  | 'agent_distribution'
  | 'client_distribution'
  | 'product_distribution'
  | 'daily_trend'
  | 'weekly_trend'
  | 'monthly_trend'

export interface DrillDownFilters {
  salesCampaign?: string
  assignedTo?: string
  clientId?: string
  reportFormType?: string
  datePoint?: string
}

export interface DateRange {
  start: Date
  end: Date
  label: string
}

export interface DrillDownConfig {
  type: DrillDownType
  title: string
  subtitle?: string
  dateRange: DateRange
  filters?: DrillDownFilters
  metricValue?: number | string
  metricLabel?: string
}

// Get date range for a drill-down type
function getDateRangeForType(type: DrillDownType, datePoint?: string): DateRange {
  const now = new Date()

  switch (type) {
    case 'today_orders':
    case 'today_fees':
    case 'opportunities_today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: 'Today',
      }

    case 'yesterday_orders':
    case 'yesterday_fees':
      return {
        start: startOfDay(subDays(now, 1)),
        end: endOfDay(subDays(now, 1)),
        label: 'Yesterday',
      }

    case 'weekly_orders':
    case 'weekly_fees':
    case 'opportunities_weekly':
    case 'campaign_distribution':
      return {
        start: startOfWeek(now, { weekStartsOn: 0 }),
        end: endOfWeek(now, { weekStartsOn: 0 }),
        label: 'This Week',
      }

    case 'monthly_orders':
    case 'monthly_fees':
    case 'agent_monthly_orders':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'This Month',
      }

    case 'agent_distribution':
      return {
        start: subDays(now, 30),
        end: now,
        label: 'Last 30 Days',
      }

    case 'client_distribution':
    case 'product_distribution':
    case 'average_fee':
      return {
        start: subMonths(now, 12),
        end: now,
        label: 'All Time',
      }

    case 'daily_trend':
      if (datePoint) {
        const date = parseISO(datePoint)
        return {
          start: startOfDay(date),
          end: endOfDay(date),
          label: format(date, 'MMM d, yyyy'),
        }
      }
      return {
        start: subDays(now, 16),
        end: now,
        label: 'Last 17 Days',
      }

    case 'weekly_trend':
      if (datePoint) {
        const date = parseISO(datePoint)
        return {
          start: startOfWeek(date, { weekStartsOn: 0 }),
          end: endOfWeek(date, { weekStartsOn: 0 }),
          label: `Week of ${format(date, 'MMM d')}`,
        }
      }
      return {
        start: startOfWeek(subDays(now, 112), { weekStartsOn: 0 }),
        end: now,
        label: 'Last 16 Weeks',
      }

    case 'monthly_trend':
      if (datePoint) {
        const date = parseISO(datePoint)
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, 'MMMM yyyy'),
        }
      }
      return {
        start: subMonths(now, 16),
        end: now,
        label: 'Last 17 Months',
      }

    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: 'Today',
      }
  }
}

// Get title for a drill-down type
function getTitleForType(type: DrillDownType): string {
  const titles: Record<DrillDownType, string> = {
    today_orders: "Today's Orders",
    today_fees: "Today's Total Fees",
    weekly_orders: 'Weekly Orders',
    weekly_fees: 'Weekly Total Fees',
    monthly_orders: 'Monthly Orders',
    monthly_fees: 'Monthly Total Fees',
    yesterday_orders: "Yesterday's Orders",
    yesterday_fees: "Yesterday's Total Fees",
    agent_monthly_orders: 'Your Monthly Orders',
    average_fee: 'Average Appraisal Fee',
    opportunities_today: "Today's Opportunities",
    opportunities_weekly: 'Weekly Opportunities',
    campaign_distribution: 'Orders by Campaign',
    agent_distribution: 'Sales by Agent',
    client_distribution: 'Orders by Client',
    product_distribution: 'Orders by Product',
    daily_trend: 'Daily Orders',
    weekly_trend: 'Weekly Orders',
    monthly_trend: 'Monthly Orders',
  }
  return titles[type]
}

// Create a drill-down config from type and options
export function createDrillDownConfig(
  type: DrillDownType,
  options?: {
    filters?: DrillDownFilters
    metricValue?: number | string
    metricLabel?: string
    clickedValue?: string
  }
): DrillDownConfig {
  const dateRange = getDateRangeForType(type, options?.filters?.datePoint)

  let subtitle = dateRange.label
  if (options?.clickedValue) {
    subtitle = `${options.clickedValue} · ${dateRange.label}`
  }

  return {
    type,
    title: getTitleForType(type),
    subtitle,
    dateRange,
    filters: options?.filters,
    metricValue: options?.metricValue,
    metricLabel: options?.metricLabel,
  }
}

// Get order date helper
function getOrderDate(order: Order): Date {
  try {
    if (order.orderedDate) {
      return parseISO(order.orderedDate)
    }
    return parseISO(order.createdAt)
  } catch {
    return new Date()
  }
}

// Filter orders based on drill-down config
export function filterOrdersForDrillDown(
  orders: Order[],
  config: DrillDownConfig
): Order[] {
  const { dateRange, filters } = config

  return orders.filter((order) => {
    // Date range filter
    const orderDate = getOrderDate(order)
    const inDateRange = isWithinInterval(orderDate, {
      start: dateRange.start,
      end: dateRange.end,
    })
    if (!inDateRange) return false

    // Additional filters
    if (filters) {
      if (filters.salesCampaign && order.salesCampaign !== filters.salesCampaign) {
        return false
      }
      if (filters.assignedTo && order.assignedTo !== filters.assignedTo) {
        return false
      }
      if (filters.clientId && order.clientId !== filters.clientId) {
        return false
      }
      if (filters.reportFormType && order.reportFormType !== filters.reportFormType) {
        return false
      }
    }

    return true
  })
}

// Filter deals for opportunities drill-down
export function filterDealsForDrillDown(
  deals: Deal[],
  config: DrillDownConfig
): Deal[] {
  const { dateRange } = config

  return deals.filter((deal) => {
    try {
      const dealDate = parseISO(deal.createdAt)
      return isWithinInterval(dealDate, {
        start: dateRange.start,
        end: dateRange.end,
      })
    } catch {
      return false
    }
  })
}

// Calculate summary stats for orders
export function calculateOrderStats(orders: Order[]) {
  const totalOrders = orders.length
  const totalFees = orders.reduce((sum, o) => sum + (o.feeAmount || 0), 0)
  const averageFee = totalOrders > 0 ? totalFees / totalOrders : 0

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  orders.forEach((order) => {
    const status = order.status || 'UNKNOWN'
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })

  // Top clients
  const clientCounts: Record<string, number> = {}
  orders.forEach((order) => {
    const clientName = order.client?.companyName || 'Unknown'
    clientCounts[clientName] = (clientCounts[clientName] || 0) + 1
  })
  const topClients = Object.entries(clientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // Top products
  const productCounts: Record<string, number> = {}
  orders.forEach((order) => {
    const product = order.reportFormType || 'Unknown'
    productCounts[product] = (productCounts[product] || 0) + 1
  })
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return {
    totalOrders,
    totalFees,
    averageFee,
    statusCounts,
    topClients,
    topProducts,
  }
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Export orders to CSV
export function exportOrdersToCsv(orders: Order[], filename: string): void {
  const headers = [
    'Order #',
    'Property Address',
    'Client',
    'Status',
    'Ordered Date',
    'Due Date',
    'Fee',
    'Assigned To',
  ]

  const rows = orders.map((order) => [
    order.orderNumber || '',
    order.propertyAddress || order.property?.addressLine1 || '',
    order.client?.companyName || '',
    order.status || '',
    order.orderedDate ? format(parseISO(order.orderedDate), 'yyyy-MM-dd') : '',
    order.dueDate ? format(parseISO(order.dueDate), 'yyyy-MM-dd') : '',
    order.feeAmount?.toString() || '',
    order.assignee?.name || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
