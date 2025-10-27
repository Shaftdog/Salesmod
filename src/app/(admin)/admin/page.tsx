'use client'

import { useEffect, useState } from 'react'
import { StatsCard } from '@/components/admin/stats-card'
import { RecentActivity } from '@/components/admin/recent-activity'
import { QuickActions } from '@/components/admin/quick-actions'
import { Users, Package, MapPin, Activity } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface DashboardData {
  metrics: {
    totalUsers: number
    activeUsers: number
    totalOrders: number
    activeOrders: number
    totalProperties: number
    roleDistribution: Record<string, number>
  }
  activity: Array<{
    id: string
    user_email: string
    action: string
    resource_type?: string
    created_at: string
    status: string
  }>
  systemHealth: {
    database: string
    lastBackup: string
    uptime: string
  }
  timestamp: string
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/dashboard')

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const json = await response.json()
        setData(json)
      } catch (err) {
        console.error('Dashboard error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and key metrics
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and key metrics
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const { metrics, activity } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={metrics.totalUsers}
          description={`${metrics.activeUsers} active in last 30 days`}
          icon={Users}
          trend={{
            value: 12.5,
            label: 'from last month',
            positive: true,
          }}
        />

        <StatsCard
          title="Active Orders"
          value={metrics.activeOrders}
          description={`${metrics.totalOrders} total orders`}
          icon={Package}
        />

        <StatsCard
          title="Properties"
          value={metrics.totalProperties}
          description="Total properties in system"
          icon={MapPin}
        />

        <StatsCard
          title="System Activity"
          value={activity.length}
          description="Recent admin actions"
          icon={Activity}
        />
      </div>

      {/* Role Distribution */}
      {metrics.roleDistribution && (
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(metrics.roleDistribution).map(([role, count]) => (
            <StatsCard
              key={role}
              title={`${role.charAt(0).toUpperCase()}${role.slice(1)}s`}
              value={count}
              description={`${role} role users`}
              icon={Users}
              className="bg-muted/50"
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <RecentActivity activities={activity} isLoading={false} />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  )
}
