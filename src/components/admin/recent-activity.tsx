'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ActivityIcon, UserPlus, UserMinus, Settings, FileEdit } from 'lucide-react'

interface Activity {
  id: string
  user_email: string
  action: string
  resource_type?: string
  created_at: string
  status: string
}

interface RecentActivityProps {
  activities: Activity[]
  isLoading?: boolean
}

const getActivityIcon = (action: string) => {
  if (action.includes('create') || action.includes('user.create')) return UserPlus
  if (action.includes('delete')) return UserMinus
  if (action.includes('update')) return FileEdit
  if (action.includes('settings')) return Settings
  return ActivityIcon
}

const getActivityColor = (action: string) => {
  if (action.includes('create')) return 'text-green-600'
  if (action.includes('delete')) return 'text-red-600'
  if (action.includes('update')) return 'text-blue-600'
  return 'text-gray-600'
}

const formatAction = (action: string) => {
  return action.replace(/_/g, ' ').replace('.', ': ')
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <ActivityIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest admin actions across the system</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.action)
              const colorClass = getActivityColor(activity.action)

              return (
                <div key={activity.id} className="flex items-start gap-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className={colorClass}>
                      <Icon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {activity.user_email || 'System'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatAction(activity.action)}
                      {activity.resource_type && ` - ${activity.resource_type}`}
                    </p>
                    {activity.status !== 'success' && (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                        {activity.status}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
