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
  Database,
  UserCog,
} from 'lucide-react'
import { useState, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useUserAreas } from '@/hooks/use-user-areas'

interface AdminNavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  superAdminOnly?: boolean
}

/** Memoized nav item for collapsed sidebar */
const CollapsedNavItem = memo(function CollapsedNavItem({
  item,
  isActive,
}: {
  item: AdminNavItem
  isActive: boolean
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            aria-label={`${item.label}: ${item.description}`}
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
})

/** Memoized nav item for expanded sidebar */
const ExpandedNavItem = memo(function ExpandedNavItem({
  item,
  isActive,
}: {
  item: AdminNavItem
  isActive: boolean
}) {
  return (
    <Link
      href={item.href}
      aria-label={`${item.label}: ${item.description}`}
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
})

const adminNavItems: AdminNavItem[] = [
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
    href: '/admin/roles',
    icon: UserCog,
    label: 'Role Management',
    description: 'Manage roles and permissions',
    superAdminOnly: true,
  },
  {
    href: '/admin/migrations',
    icon: Database,
    label: 'Migrations',
    description: 'Data migration tools',
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
  const { isSuperAdmin } = useUserAreas()

  // Filter nav items based on user permissions (simplified)
  // Note: superAdminOnly routes must also be protected in middleware
  const visibleNavItems = useMemo(
    () => adminNavItems.filter(item => !item.superAdminOnly || isSuperAdmin),
    [isSuperAdmin]
  )

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
      <nav className="flex-1 overflow-y-auto p-4" aria-label="Admin navigation">
        <div className="space-y-2">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href + '/'))

            return collapsed ? (
              <CollapsedNavItem key={item.href} item={item} isActive={isActive} />
            ) : (
              <ExpandedNavItem key={item.href} item={item} isActive={isActive} />
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
