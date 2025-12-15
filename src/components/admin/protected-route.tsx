/**
 * Admin Panel - Protected Route Components
 *
 * Components to protect routes and UI elements based on roles and permissions
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * <RequirePermission permission="manage_users">
 *   <UserManagementButton />
 * </RequirePermission>
 * ```
 */

'use client'

import * as React from 'react'
import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/use-admin'
import { usePermission } from '@/hooks/use-permission'
import type { UserRole } from '@/lib/admin/permissions'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole | UserRole[]
  fallback?: ReactNode
  redirectTo?: string
}

/**
 * Protect a route or component based on user role
 * Redirects to dashboard or shows fallback if user doesn't have required role
 */
export function ProtectedRoute({
  children,
  requiredRole = 'admin',
  fallback = null,
  redirectTo = '/dashboard?error=unauthorized',
}: ProtectedRouteProps) {
  const { role, isLoading } = useAdmin()
  const router = useRouter()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  // Check if user has required role (supports single role or array of roles)
  const hasRequiredRole = () => {
    if (!role) return false
    // Super admin always has access
    if (role === 'super_admin') return true
    // Check against required roles
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role as UserRole)
    }
    return role === requiredRole
  }

  // Handle redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && !hasRequiredRole() && redirectTo) {
      setShouldRedirect(true)
      router.push(redirectTo)
    }
  }, [isLoading, role, redirectTo, router])

  // Show loading state while checking role
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  // User doesn't have required role
  if (!hasRequiredRole()) {
    if (shouldRedirect) {
      return null // Redirecting...
    }
    return <>{fallback}</>
  }

  // User has required role
  return <>{children}</>
}

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

/**
 * Shorthand for ProtectedRoute with admin role requirement
 * Allows both admin and super_admin roles
 */
export function AdminOnly({
  children,
  fallback = null,
  redirectTo = '/unauthorized',
}: AdminOnlyProps) {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  )
}

interface RequirePermissionProps {
  children: ReactNode
  permission: string
  fallback?: ReactNode
  hideIfNoPermission?: boolean
}

/**
 * Conditionally render children based on user permission
 * Shows fallback or hides if user doesn't have required permission
 */
export function RequirePermission({
  children,
  permission,
  fallback = null,
  hideIfNoPermission = false,
}: RequirePermissionProps) {
  const { hasPermission, isLoading } = usePermission(permission)

  // Show loading state
  if (isLoading) {
    return null // Don't show anything while loading
  }

  // User doesn't have permission
  if (!hasPermission) {
    if (hideIfNoPermission) {
      return null
    }
    return <>{fallback}</>
  }

  // User has permission
  return <>{children}</>
}

interface RequireAnyPermissionProps {
  children: ReactNode
  permissions: string[]
  fallback?: ReactNode
  hideIfNoPermission?: boolean
}

/**
 * Conditionally render children if user has ANY of the specified permissions
 */
export function RequireAnyPermission({
  children,
  permissions,
  fallback = null,
  hideIfNoPermission = false,
}: RequireAnyPermissionProps) {
  const { role, isLoading: roleLoading } = useAdmin()
  const [hasAnyPermission, setHasAnyPermission] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function checkPermissions() {
      if (roleLoading || !role) {
        setIsLoading(false)
        setHasAnyPermission(false)
        return
      }

      setIsLoading(true)

      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        for (const permission of permissions) {
          const { data } = await supabase
            .rpc('role_has_permission', {
              role_name: role,
              permission_name: permission,
            })

          if (data === true) {
            setHasAnyPermission(true)
            setIsLoading(false)
            return
          }
        }

        setHasAnyPermission(false)
      } catch (error) {
        console.error('Error checking permissions:', error)
        setHasAnyPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissions()
  }, [role, roleLoading, permissions])

  if (isLoading || roleLoading) {
    return null
  }

  if (!hasAnyPermission) {
    if (hideIfNoPermission) {
      return null
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface UnauthorizedMessageProps {
  message?: string
}

/**
 * Default unauthorized message component
 */
export function UnauthorizedMessage({
  message = 'You do not have permission to access this resource.',
}: UnauthorizedMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}
