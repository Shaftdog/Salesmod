/**
 * Admin Panel - usePermission Hook
 *
 * React hook to check if current user has specific permissions
 *
 * Usage:
 * ```tsx
 * const { hasPermission, isLoading } = usePermission('manage_users')
 *
 * if (hasPermission) {
 *   return <UserManagementButton />
 * }
 * ```
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from './use-admin'

interface UsePermissionResult {
  hasPermission: boolean
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(permissionName: string): UsePermissionResult {
  const { role, isLoading: roleLoading } = useAdmin()
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function checkPermission() {
      if (roleLoading) {
        return
      }

      if (!role) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        // Call the role_has_permission database function
        const { data, error: permError } = await supabase
          .rpc('role_has_permission', {
            role_name: role,
            permission_name: permissionName,
          })

        if (permError) {
          throw permError
        }

        setHasPermission(data === true)
      } catch (err) {
        console.error('Error checking permission:', err)
        setError(err instanceof Error ? err : new Error('Failed to check permission'))
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [role, roleLoading, permissionName])

  return { hasPermission, isLoading: isLoading || roleLoading, error }
}

/**
 * Hook to check if current user has any of the specified permissions
 */
export function useAnyPermission(permissionNames: string[]): UsePermissionResult {
  const { role, isLoading: roleLoading } = useAdmin()
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function checkPermissions() {
      if (roleLoading) {
        return
      }

      if (!role || permissionNames.length === 0) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        // Check each permission until we find one the user has
        for (const permissionName of permissionNames) {
          const { data, error: permError } = await supabase
            .rpc('role_has_permission', {
              role_name: role,
              permission_name: permissionName,
            })

          if (permError) {
            throw permError
          }

          if (data === true) {
            setHasPermission(true)
            setIsLoading(false)
            return
          }
        }

        setHasPermission(false)
      } catch (err) {
        console.error('Error checking permissions:', err)
        setError(err instanceof Error ? err : new Error('Failed to check permissions'))
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissions()
  }, [role, roleLoading, permissionNames])

  return { hasPermission, isLoading: isLoading || roleLoading, error }
}

/**
 * Hook to check if current user has all of the specified permissions
 */
export function useAllPermissions(permissionNames: string[]): UsePermissionResult {
  const { role, isLoading: roleLoading } = useAdmin()
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function checkPermissions() {
      if (roleLoading) {
        return
      }

      if (!role || permissionNames.length === 0) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        // Check all permissions - all must be true
        for (const permissionName of permissionNames) {
          const { data, error: permError } = await supabase
            .rpc('role_has_permission', {
              role_name: role,
              permission_name: permissionName,
            })

          if (permError) {
            throw permError
          }

          if (data !== true) {
            setHasPermission(false)
            setIsLoading(false)
            return
          }
        }

        setHasPermission(true)
      } catch (err) {
        console.error('Error checking permissions:', err)
        setError(err instanceof Error ? err : new Error('Failed to check permissions'))
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissions()
  }, [role, roleLoading, permissionNames])

  return { hasPermission, isLoading: isLoading || roleLoading, error }
}

/**
 * Hook to get all permissions for current user
 */
export function useUserPermissions(): {
  permissions: string[]
  isLoading: boolean
  error: Error | null
} {
  const { role, isLoading: roleLoading } = useAdmin()
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPermissions() {
      if (roleLoading) {
        return
      }

      if (!role) {
        setPermissions([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        const { data, error: permError } = await supabase
          .rpc('get_role_permissions', { role_name: role })

        if (permError) {
          throw permError
        }

        const permissionNames = data?.map((p: any) => p.permission_name) || []
        setPermissions(permissionNames)
      } catch (err) {
        console.error('Error fetching permissions:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch permissions'))
        setPermissions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPermissions()
  }, [role, roleLoading])

  return { permissions, isLoading: isLoading || roleLoading, error }
}
