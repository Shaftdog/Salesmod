import { withAdminAuth } from '@/lib/admin/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/analytics
 * Get analytics data for charts and visualizations
 */
export const GET = withAdminAuth(async (request: NextRequest, { supabase }) => {
  try {
    const { searchParams } = new URL(request.url)

    // Date range parameters (default to last 30 days)
    const endDate = searchParams.get('end_date') || new Date().toISOString()
    const startDate = searchParams.get('start_date') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // User Growth Data
    let userGrowth, userGrowthError
    try {
      const result = await supabase
        .rpc('get_user_growth_by_day', {
          p_start_date: startDate,
          p_end_date: endDate,
        })
      userGrowth = result.data
      userGrowthError = result.error
    } catch (rpcError) {
      // If RPC doesn't exist, fall back to manual query
      const result = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at')
      userGrowth = result.data
      userGrowthError = result.error
    }

    // Process user growth data if it's not from RPC
    let processedUserGrowth = userGrowth
    if (!userGrowthError && userGrowth && !userGrowth[0]?.date) {
      // Manual aggregation by day
      const growthByDay: Record<string, number> = {}
      userGrowth.forEach((user: any) => {
        const date = new Date(user.created_at).toISOString().split('T')[0]
        growthByDay[date] = (growthByDay[date] || 0) + 1
      })
      processedUserGrowth = Object.entries(growthByDay).map(([date, count]) => ({
        date,
        count,
      }))
    }

    // Order Statistics
    const { data: orderStats } = await supabase
      .from('orders')
      .select('status, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Group orders by status
    const ordersByStatus = orderStats?.reduce((acc, order) => {
      const status = order.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Order trends by day
    const ordersByDay: Record<string, number> = {}
    orderStats?.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      ordersByDay[date] = (ordersByDay[date] || 0) + 1
    })

    const orderTrends = Object.entries(ordersByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // User Role Distribution
    const { data: roleDistribution } = await supabase
      .from('profiles')
      .select('role')

    const roleStats = roleDistribution?.reduce((acc, profile) => {
      const role = profile.role || 'user'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // System Activity (from audit logs)
    const { data: activityStats } = await supabase
      .from('audit_logs')
      .select('created_at, action, status')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Activity by day
    const activityByDay: Record<string, number> = {}
    activityStats?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      activityByDay[date] = (activityByDay[date] || 0) + 1
    })

    const activityTrends = Object.entries(activityByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top Actions
    const actionCounts = activityStats?.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topActions = Object.entries(actionCounts || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }))

    // Success vs Error rates
    const statusCounts = activityStats?.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Property Statistics
    const { data: propertyStats } = await supabase
      .from('properties')
      .select('created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const propertiesByDay: Record<string, number> = {}
    propertyStats?.forEach((property) => {
      const date = new Date(property.created_at).toISOString().split('T')[0]
      propertiesByDay[date] = (propertiesByDay[date] || 0) + 1
    })

    const propertyTrends = Object.entries(propertiesByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Overall Metrics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    const { count: totalProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })

    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    // Recent activity count
    const { count: recentActivityCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return NextResponse.json({
      dateRange: {
        start: startDate,
        end: endDate,
      },
      overview: {
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalProperties: totalProperties || 0,
        totalClients: totalClients || 0,
        recentActivity: recentActivityCount || 0,
      },
      userGrowth: processedUserGrowth || [],
      orderStats: {
        byStatus: ordersByStatus || {},
        trends: orderTrends,
      },
      roleDistribution: roleStats || {},
      activityStats: {
        trends: activityTrends,
        topActions: topActions,
        statusDistribution: statusCounts || {},
      },
      propertyTrends: propertyTrends,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
})
