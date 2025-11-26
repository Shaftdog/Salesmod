/**
 * Admin Panel - Authorization & Permission System (Server-Side)
 *
 * This module provides SERVER-SIDE utilities for role-based access control (RBAC)
 * and permission checking for the admin panel.
 *
 * ⚠️ IMPORTANT: Do not import this file in client components!
 * For client-side code, use '@/lib/admin/types' instead.
 *
 * Usage:
 * - Use hasRole() to check if a user has a specific role
 * - Use hasPermission() to check if a user has a specific permission
 * - Use requireRole() and requirePermission() in API routes to enforce authorization
 */

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

// Re-export types and constants from the shared types file
export type {
  UserRole,
  PermissionResource,
  PermissionAction,
  AreaCode,
  UserAreaAccess,
  UserAreaAccessInfo,
  OverrideMode,
} from './types'

export {
  PERMISSIONS,
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  ROLE_HIERARCHY,
  AREA_CODES,
  AREA_DISPLAY_NAMES,
} from './types'

import type { UserRole, AreaCode, UserAreaAccess } from './types'

/**
 * Get the current authenticated user's ID
 */
export async function getCurrentUserId(supabase?: SupabaseClient): Promise<string | null> {
  const client = supabase || await createClient()

  const { data: { user }, error } = await client.auth.getUser()

  if (error || !user) {
    return null
  }

  return user.id
}

/**
 * Get a user's role by user ID
 * Returns 'user' as default if not found
 */
export async function getUserRole(
  userId: string,
  supabase?: SupabaseClient
): Promise<UserRole> {
  const client = supabase || await createClient()

  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return 'user' // Default role
  }

  return (data.role as UserRole) || 'user'
}

/**
 * Get the current authenticated user's role
 */
export async function getCurrentUserRole(supabase?: SupabaseClient): Promise<UserRole | null> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    return null
  }

  return getUserRole(userId, supabase)
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(
  userId: string,
  roleName: UserRole,
  supabase?: SupabaseClient
): Promise<boolean> {
  const userRole = await getUserRole(userId, supabase)
  return userRole === roleName
}

/**
 * Check if the current user has a specific role
 */
export async function currentUserHasRole(
  roleName: UserRole,
  supabase?: SupabaseClient
): Promise<boolean> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    return false
  }

  return hasRole(userId, roleName, supabase)
}

/**
 * Check if a user is an admin (includes super_admin)
 */
export async function isAdmin(
  userId: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  const userRole = await getUserRole(userId, supabase)
  return userRole === 'admin' || userRole === 'super_admin'
}

/**
 * Check if a user is a super admin
 */
export async function isSuperAdmin(
  userId: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  return hasRole(userId, 'super_admin', supabase)
}

/**
 * Check if the current user is a super admin
 */
export async function currentUserIsSuperAdmin(supabase?: SupabaseClient): Promise<boolean> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    return false
  }

  return isSuperAdmin(userId, supabase)
}

/**
 * Check if the current user is an admin
 */
export async function currentUserIsAdmin(supabase?: SupabaseClient): Promise<boolean> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    return false
  }

  return isAdmin(userId, supabase)
}

/**
 * Get all permissions for a user based on their role
 */
export async function getUserPermissions(
  userId: string,
  supabase?: SupabaseClient
): Promise<string[]> {
  const client = supabase || await createClient()
  const userRole = await getUserRole(userId, client)

  const { data, error } = await client
    .rpc('get_role_permissions', { role_name: userRole })

  if (error || !data) {
    return []
  }

  return data.map((p: any) => p.permission_name)
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permissionName: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  const client = supabase || await createClient()
  const userRole = await getUserRole(userId, client)

  const { data, error } = await client
    .rpc('role_has_permission', {
      role_name: userRole,
      permission_name: permissionName
    })

  if (error) {
    console.error('Error checking permission:', error)
    return false
  }

  return data === true
}

/**
 * Check if the current user has a specific permission
 */
export async function currentUserHasPermission(
  permissionName: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    return false
  }

  return hasPermission(userId, permissionName, supabase)
}

/**
 * Require a specific role - throws error if user doesn't have it
 * Use this in API routes to enforce authorization
 */
export async function requireRole(
  roleName: UserRole,
  supabase?: SupabaseClient,
  customMessage?: string
): Promise<string> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    throw new Error('Unauthorized: Not authenticated')
  }

  const hasRequiredRole = await hasRole(userId, roleName, supabase)

  if (!hasRequiredRole) {
    const message = customMessage || `Unauthorized: Requires '${roleName}' role`
    throw new Error(message)
  }

  return userId
}

/**
 * Require admin role - throws error if user is not an admin
 * Use this in admin-only API routes
 */
export async function requireAdmin(
  supabase?: SupabaseClient,
  customMessage?: string
): Promise<string> {
  return requireRole('admin', supabase, customMessage || 'Unauthorized: Admin access required')
}

/**
 * Require a specific permission - throws error if user doesn't have it
 * Use this in API routes to enforce fine-grained permissions
 */
export async function requirePermission(
  permissionName: string,
  supabase?: SupabaseClient,
  customMessage?: string
): Promise<string> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    throw new Error('Unauthorized: Not authenticated')
  }

  const hasRequiredPermission = await hasPermission(userId, permissionName, supabase)

  if (!hasRequiredPermission) {
    const message = customMessage || `Unauthorized: Requires '${permissionName}' permission`
    throw new Error(message)
  }

  return userId
}

/**
 * Check multiple permissions - returns true if user has ANY of them
 */
export async function hasAnyPermission(
  userId: string,
  permissionNames: string[],
  supabase?: SupabaseClient
): Promise<boolean> {
  for (const permission of permissionNames) {
    if (await hasPermission(userId, permission, supabase)) {
      return true
    }
  }

  return false
}

/**
 * Check multiple permissions - returns true if user has ALL of them
 */
export async function hasAllPermissions(
  userId: string,
  permissionNames: string[],
  supabase?: SupabaseClient
): Promise<boolean> {
  for (const permission of permissionNames) {
    if (!(await hasPermission(userId, permission, supabase))) {
      return false
    }
  }

  return true
}

/**
 * Get user profile with role information
 */
export async function getUserProfile(
  userId: string,
  supabase?: SupabaseClient
) {
  const client = supabase || await createClient()

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to get user profile: ${error.message}`)
  }

  return data
}

/**
 * Get the current user's profile with role information
 */
export async function getCurrentUserProfile(supabase?: SupabaseClient) {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    return null
  }

  return getUserProfile(userId, supabase)
}

// =============================================
// AREA ACCESS FUNCTIONS
// =============================================

/**
 * Get all areas accessible to a user
 * Combines role defaults with any user overrides
 */
export async function getUserAreas(
  userId: string,
  supabase?: SupabaseClient
): Promise<UserAreaAccess[]> {
  const client = supabase || await createClient()

  const { data, error } = await client
    .rpc('get_user_areas', { p_user_id: userId })

  if (error) {
    console.error('Error getting user areas:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    areaCode: row.area_code as AreaCode,
    areaName: row.area_name,
    areaIcon: row.area_icon,
    accessSource: row.access_source,
  }))
}

/**
 * Get the current user's accessible areas
 */
export async function getCurrentUserAreas(
  supabase?: SupabaseClient
): Promise<UserAreaAccess[]> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    return []
  }

  return getUserAreas(userId, supabase)
}

/**
 * Check if a user has access to a specific area
 */
export async function hasAreaAccess(
  userId: string,
  areaCode: AreaCode,
  supabase?: SupabaseClient
): Promise<boolean> {
  const client = supabase || await createClient()

  const { data, error } = await client
    .rpc('user_has_area_access', {
      p_user_id: userId,
      p_area_code: areaCode,
    })

  if (error) {
    console.error('Error checking area access:', error)
    return false
  }

  return data === true
}

/**
 * Check if the current user has access to a specific area
 */
export async function currentUserHasAreaAccess(
  areaCode: AreaCode,
  supabase?: SupabaseClient
): Promise<boolean> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    return false
  }

  return hasAreaAccess(userId, areaCode, supabase)
}

/**
 * Check if a user can access a specific route
 */
export async function canAccessRoute(
  userId: string,
  pathname: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  const client = supabase || await createClient()

  const { data, error } = await client
    .rpc('user_has_route_access', {
      p_user_id: userId,
      p_pathname: pathname,
    })

  if (error) {
    console.error('Error checking route access:', error)
    return false
  }

  return data === true
}

/**
 * Check if the current user can access a specific route
 */
export async function currentUserCanAccessRoute(
  pathname: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    return false
  }

  return canAccessRoute(userId, pathname, supabase)
}

/**
 * Require access to a specific area - throws error if user doesn't have it
 */
export async function requireAreaAccess(
  areaCode: AreaCode,
  supabase?: SupabaseClient,
  customMessage?: string
): Promise<string> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    throw new Error('Unauthorized: Not authenticated')
  }

  const hasAccess = await hasAreaAccess(userId, areaCode, supabase)

  if (!hasAccess) {
    const message = customMessage || `Unauthorized: Requires access to '${areaCode}' area`
    throw new Error(message)
  }

  return userId
}

/**
 * Require Super Admin role - throws error if user is not a super admin
 */
export async function requireSuperAdmin(
  supabase?: SupabaseClient,
  customMessage?: string
): Promise<string> {
  const userId = await getCurrentUserId(supabase)

  if (!userId) {
    throw new Error('Unauthorized: Not authenticated')
  }

  const isSuperAdminUser = await isSuperAdmin(userId, supabase)

  if (!isSuperAdminUser) {
    const message = customMessage || 'Unauthorized: Super Admin access required'
    throw new Error(message)
  }

  return userId
}

/**
 * Get all areas with their sub-modules (for admin UI)
 */
export async function getAllAreasWithSubModules(supabase?: SupabaseClient) {
  const client = supabase || await createClient()

  const { data, error } = await client
    .rpc('get_all_areas_with_submodules')

  if (error) {
    console.error('Error getting areas with sub-modules:', error)
    return []
  }

  // Transform flat data into nested structure
  const areasMap = new Map<string, any>()

  for (const row of data || []) {
    if (!areasMap.has(row.area_id)) {
      areasMap.set(row.area_id, {
        id: row.area_id,
        code: row.area_code,
        name: row.area_name,
        icon: row.area_icon,
        displayOrder: row.area_display_order,
        subModules: [],
      })
    }

    if (row.submodule_id) {
      areasMap.get(row.area_id).subModules.push({
        id: row.submodule_id,
        code: row.submodule_code,
        name: row.submodule_name,
        routePattern: row.submodule_route,
        displayOrder: row.submodule_display_order,
      })
    }
  }

  return Array.from(areasMap.values()).sort((a, b) => a.displayOrder - b.displayOrder)
}

/**
 * Get role area templates (for admin UI)
 */
export async function getRoleAreaTemplates(
  roleName: UserRole,
  supabase?: SupabaseClient
) {
  const client = supabase || await createClient()

  const { data, error } = await client
    .rpc('get_role_area_templates', { p_role_name: roleName })

  if (error) {
    console.error('Error getting role area templates:', error)
    return []
  }

  return data || []
}

/**
 * Check if any of the user's areas include the specified area
 */
export async function hasAnyAreaAccess(
  userId: string,
  areaCodes: AreaCode[],
  supabase?: SupabaseClient
): Promise<boolean> {
  for (const areaCode of areaCodes) {
    if (await hasAreaAccess(userId, areaCode, supabase)) {
      return true
    }
  }
  return false
}

/**
 * Check if user has access to all specified areas
 */
export async function hasAllAreaAccess(
  userId: string,
  areaCodes: AreaCode[],
  supabase?: SupabaseClient
): Promise<boolean> {
  for (const areaCode of areaCodes) {
    if (!(await hasAreaAccess(userId, areaCode, supabase))) {
      return false
    }
  }
  return true
}
