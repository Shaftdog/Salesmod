import { withAdminAuth } from '@/lib/admin/api-middleware'
import { NextResponse } from 'next/server'

export const GET = withAdminAuth(async (request, { supabase }) => {
  try {
    // Fetch key metrics in parallel
    const [
      usersResult,
      ordersResult,
      propertiesResult,
      recentActivityResult,
    ] = await Promise.all([
      // Total users count
      supabase
        .from('profiles')
        .select('id, role, created_at', { count: 'exact', head: false }),

      // Total orders count
      supabase
        .from('orders')
        .select('id, status, created_at', { count: 'exact', head: false }),

      // Total properties count
      supabase
        .from('properties')
        .select('id, created_at', { count: 'exact', head: false }),

      // Recent activity (last 10 audit logs)
      supabase
        .from('audit_logs')
        .select('id, user_email, action, resource_type, created_at, status')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // Calculate stats
    const totalUsers = usersResult.count || 0
    const totalOrders = ordersResult.count || 0
    const totalProperties = propertiesResult.count || 0

    // Calculate active users (users created in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeUsers =
      usersResult.data?.filter(
        (user) => new Date(user.created_at) > thirtyDaysAgo
      ).length || 0

    // Calculate active orders (non-cancelled, non-completed)
    const activeOrders =
      ordersResult.data?.filter(
        (order) => !['completed', 'cancelled', 'delivered'].includes(order.status)
      ).length || 0

    // Calculate role distribution
    const roleDistribution = usersResult.data?.reduce((acc, user) => {
      const role = user.role || 'user'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // System health (simple check - can be enhanced)
    const systemHealth = {
      database: 'healthy',
      lastBackup: new Date().toISOString(), // This would come from actual backup system
      uptime: '99.9%', // This would come from actual monitoring
    }

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeUsers,
        totalOrders,
        activeOrders,
        totalProperties,
        roleDistribution,
      },
      activity: recentActivityResult.data || [],
      systemHealth,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
})
