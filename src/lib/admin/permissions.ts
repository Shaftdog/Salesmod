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
} from './types'

export { PERMISSIONS } from './types'

import type { UserRole } from './types'

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
 * Check if a user is an admin
 */
export async function isAdmin(
  userId: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  return hasRole(userId, 'admin', supabase)
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
