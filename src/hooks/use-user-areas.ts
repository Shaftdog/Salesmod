/**
 * Admin Panel - useUserAreas Hook
 *
 * React hook to get current user's accessible areas
 *
 * Usage:
 * ```tsx
 * const { areas, hasAccess, isLoading } = useUserAreas()
 *
 * if (hasAccess('production')) {
 *   return <ProductionModule />
 * }
 * ```
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from './use-admin'
import type { AreaCode, UserAreaAccess } from '@/lib/admin/types'

interface UseUserAreasResult {
  areas: UserAreaAccess[]
  areaCodes: AreaCode[]
  isLoading: boolean
  error: Error | null
  hasAccess: (areaCode: AreaCode) => boolean
  isSuperAdmin: boolean
  isAdmin: boolean
}

/**
 * Hook to get current user's accessible areas
 */
export function useUserAreas(): UseUserAreasResult {
  const { userId, role, isLoading: roleLoading } = useAdmin()
  const [areas, setAreas] = useState<UserAreaAccess[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role === 'admin' || role === 'super_admin'

  useEffect(() => {
    async function fetchUserAreas() {
      if (roleLoading) {
        return
      }

      if (!userId) {
        setAreas([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        // Call the get_user_areas database function
        const { data, error: areasError } = await supabase
          .rpc('get_user_areas', { p_user_id: userId })

        if (areasError) {
          throw areasError
        }

        const userAreas: UserAreaAccess[] = (data || []).map((row: any) => ({
          areaCode: row.area_code as AreaCode,
          areaName: row.area_name,
          areaIcon: row.area_icon,
          accessSource: row.access_source,
        }))

        setAreas(userAreas)
      } catch (err) {
        console.error('Error fetching user areas:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch user areas'))
        setAreas([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAreas()
  }, [userId, roleLoading])

  // Memoized function to check if user has access to a specific area
  const hasAccess = useCallback((areaCode: AreaCode): boolean => {
    // Super admin has access to everything
    if (isSuperAdmin) {
      return true
    }
    return areas.some(area => area.areaCode === areaCode)
  }, [areas, isSuperAdmin])

  // Get just the area codes
  const areaCodes = areas.map(a => a.areaCode)

  return {
    areas,
    areaCodes,
    isLoading: isLoading || roleLoading,
    error,
    hasAccess,
    isSuperAdmin,
    isAdmin,
  }
}

/**
 * Hook to check if current user has access to a specific area
 */
export function useAreaAccess(areaCode: AreaCode): {
  hasAccess: boolean
  isLoading: boolean
  error: Error | null
} {
  const { hasAccess, isLoading, error } = useUserAreas()

  return {
    hasAccess: hasAccess(areaCode),
    isLoading,
    error,
  }
}

/**
 * Hook to check if current user has access to any of the specified areas
 */
export function useAnyAreaAccess(areaCodes: AreaCode[]): {
  hasAccess: boolean
  isLoading: boolean
  error: Error | null
} {
  const { hasAccess, isLoading, error } = useUserAreas()

  const hasAnyAccess = areaCodes.some(code => hasAccess(code))

  return {
    hasAccess: hasAnyAccess,
    isLoading,
    error,
  }
}

/**
 * Hook to check if current user has access to all of the specified areas
 */
export function useAllAreaAccess(areaCodes: AreaCode[]): {
  hasAccess: boolean
  isLoading: boolean
  error: Error | null
} {
  const { hasAccess, isLoading, error } = useUserAreas()

  const hasAllAccess = areaCodes.every(code => hasAccess(code))

  return {
    hasAccess: hasAllAccess,
    isLoading,
    error,
  }
}

/**
 * Hook to check if current user is a Super Admin
 */
export function useIsSuperAdmin(): {
  isSuperAdmin: boolean
  isLoading: boolean
  error: Error | null
} {
  const { isSuperAdmin, isLoading, error } = useUserAreas()

  return {
    isSuperAdmin,
    isLoading,
    error,
  }
}
