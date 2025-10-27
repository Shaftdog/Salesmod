import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, FileText, Settings, Download } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      href: '/admin/users/new',
      icon: UserPlus,
      label: 'Add User',
      description: 'Create a new user account',
    },
    {
      href: '/admin/audit-logs',
      icon: FileText,
      label: 'View Logs',
      description: 'Check system activity',
    },
    {
      href: '/admin/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Configure system',
    },
    {
      href: '/admin/analytics',
      icon: Download,
      label: 'Export Data',
      description: 'Download reports',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button
              variant="outline"
              className="h-auto w-full flex-col items-start gap-2 p-4"
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className="h-5 w-5" />
                <span className="font-semibold">{action.label}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left w-full">
                {action.description}
              </span>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
