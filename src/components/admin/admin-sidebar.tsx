'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Settings,
  ScrollText,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const adminNavItems = [
  {
    href: '/admin',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Overview and metrics',
  },
  {
    href: '/admin/users',
    icon: Users,
    label: 'Users',
    description: 'Manage user accounts',
  },
  {
    href: '/admin/audit-logs',
    icon: ScrollText,
    label: 'Audit Logs',
    description: 'System activity logs',
  },
  {
    href: '/admin/analytics',
    icon: BarChart3,
    label: 'Analytics',
    description: 'Reports and insights',
  },
  {
    href: '/admin/settings',
    icon: Settings,
    label: 'Settings',
    description: 'System configuration',
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Admin Panel</span>
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-full">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            if (collapsed) {
              return (
                <TooltipProvider key={item.href}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex flex-col gap-1">
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs opacity-80">{item.description}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
