/**
 * Admin Panel - useAdmin Hook
 *
 * React hook to get current user's role and admin status
 *
 * Usage:
 * ```tsx
 * const { isAdmin, role, isLoading } = useAdmin()
 *
 * if (isAdmin) {
 *   return <AdminPanel />
 * }
 * ```
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/admin/permissions'

interface UseAdminResult {
  isAdmin: boolean
  role: UserRole | null
  isLoading: boolean
  error: Error | null
  userId: string | null
}

/**
 * Hook to get current user's admin status and role
 */
export function useAdmin(): UseAdminResult {
  const [isAdmin, setIsAdmin] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserRole() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          throw authError
        }

        if (!user) {
          setIsAdmin(false)
          setRole(null)
          setUserId(null)
          setIsLoading(false)
          return
        }

        setUserId(user.id)

        // Get user's profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        const userRole = (profile?.role as UserRole) || 'user'
        setRole(userRole)
        setIsAdmin(userRole === 'admin')
      } catch (err) {
        console.error('Error fetching user role:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch user role'))
        setIsAdmin(false)
        setRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  return { isAdmin, role, isLoading, error, userId }
}

/**
 * Hook to check if current user has a specific role
 */
export function useHasRole(requiredRole: UserRole): {
  hasRole: boolean
  isLoading: boolean
  error: Error | null
} {
  const { role, isLoading, error } = useAdmin()

  return {
    hasRole: role === requiredRole,
    isLoading,
    error,
  }
}

/**
 * Hook to check if current user is an admin
 */
export function useIsAdmin(): {
  isAdmin: boolean
  isLoading: boolean
  error: Error | null
} {
  const { isAdmin, isLoading, error } = useAdmin()

  return {
    isAdmin,
    isLoading,
    error,
  }
}
