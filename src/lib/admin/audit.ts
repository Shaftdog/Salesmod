/**
 * Admin Panel - Audit Logging System
 *
 * This module provides utilities for logging admin actions
 * for compliance, security, and troubleshooting.
 *
 * Usage:
 * - Call logAction() whenever an admin performs a significant action
 * - Use getAuditTrail() to retrieve history for a resource
 * - Use getUserActivity() to see a user's action history
 */

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentUserId, getUserProfile } from './permissions'

/**
 * Audit log action types
 */
export const AUDIT_ACTIONS = {
  // User actions
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change',
  USER_ACTIVATE: 'user.activate',
  USER_DEACTIVATE: 'user.deactivate',
  USER_IMPERSONATE_START: 'user.impersonate_start',
  USER_IMPERSONATE_END: 'user.impersonate_end',

  // Order actions
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_DELETE: 'order.delete',
  ORDER_ASSIGN: 'order.assign',
  ORDER_STATUS_CHANGE: 'order.status_change',

  // Property actions
  PROPERTY_CREATE: 'property.create',
  PROPERTY_UPDATE: 'property.update',
  PROPERTY_DELETE: 'property.delete',

  // Client actions
  CLIENT_CREATE: 'client.create',
  CLIENT_UPDATE: 'client.update',
  CLIENT_DELETE: 'client.delete',

  // Settings actions
  SETTINGS_UPDATE: 'settings.update',
  INTEGRATION_UPDATE: 'integration.update',

  // Data actions
  DATA_EXPORT: 'data.export',
  DATA_IMPORT: 'data.import',
  BULK_ACTION: 'bulk.action',

  // Agent actions
  AGENT_CREATE: 'agent.create',
  AGENT_UPDATE: 'agent.update',
  AGENT_DELETE: 'agent.delete',
} as const

/**
 * Audit log status types
 */
export type AuditStatus = 'success' | 'failure' | 'error'

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id?: string
  user_id: string
  user_email?: string
  user_role?: string
  action: string
  resource_type?: string
  resource_id?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  status?: AuditStatus
  error_message?: string
  created_at?: string
}

/**
 * Options for creating an audit log
 */
export interface AuditLogOptions {
  action: string
  resourceType?: string
  resourceId?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status?: AuditStatus
  errorMessage?: string
}

/**
 * Create an audit log entry
 */
export async function logAction(
  options: AuditLogOptions,
  supabase?: SupabaseClient
): Promise<string | null> {
  const client = supabase || await createClient()

  try {
    const userId = await getCurrentUserId(client)

    if (!userId) {
      console.error('Cannot create audit log: No authenticated user')
      return null
    }

    // Get user profile for email and role
    let userEmail: string | undefined
    let userRole: string | undefined

    try {
      const profile = await getUserProfile(userId, client)
      userEmail = profile.email
      userRole = profile.role
    } catch (error) {
      console.warn('Could not get user profile for audit log:', error)
    }

    const { data, error } = await client
      .from('audit_logs')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_role: userRole,
        action: options.action,
        resource_type: options.resourceType,
        resource_id: options.resourceId,
        changes: options.changes,
        metadata: options.metadata,
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
        status: options.status || 'success',
        error_message: options.errorMessage,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create audit log:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Error creating audit log:', error)
    return null
  }
}

/**
 * Create an audit log for a successful action
 */
export async function logSuccess(
  action: string,
  resourceType?: string,
  resourceId?: string,
  changes?: Record<string, any>,
  metadata?: Record<string, any>,
  supabase?: SupabaseClient
): Promise<string | null> {
  return logAction(
    {
      action,
      resourceType,
      resourceId,
      changes,
      metadata,
      status: 'success',
    },
    supabase
  )
}

/**
 * Create an audit log for a failed action
 */
export async function logFailure(
  action: string,
  errorMessage: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, any>,
  supabase?: SupabaseClient
): Promise<string | null> {
  return logAction(
    {
      action,
      resourceType,
      resourceId,
      metadata,
      status: 'failure',
      errorMessage,
    },
    supabase
  )
}

/**
 * Get audit trail for a specific resource
 */
export async function getResourceAuditTrail(
  resourceType: string,
  resourceId: string,
  limit: number = 50,
  supabase?: SupabaseClient
): Promise<AuditLogEntry[]> {
  const client = supabase || await createClient()

  const { data, error } = await client
    .rpc('get_resource_audit_trail', {
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_limit: limit,
    })

  if (error) {
    console.error('Failed to get resource audit trail:', error)
    return []
  }

  return data || []
}

/**
 * Get a user's activity log
 */
export async function getUserActivity(
  userId: string,
  limit: number = 50,
  supabase?: SupabaseClient
): Promise<AuditLogEntry[]> {
  const client = supabase || await createClient()

  const { data, error } = await client
    .rpc('get_user_activity', {
      p_user_id: userId,
      p_limit: limit,
    })

  if (error) {
    console.error('Failed to get user activity:', error)
    return []
  }

  return data || []
}

/**
 * Get recent audit logs (admin only)
 */
export async function getRecentAuditLogs(
  limit: number = 100,
  supabase?: SupabaseClient
): Promise<AuditLogEntry[]> {
  const client = supabase || await createClient()

  const { data, error } = await client
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get recent audit logs:', error)
    return []
  }

  return data || []
}

/**
 * Get audit logs with filters
 */
export interface AuditLogFilters {
  userId?: string
  action?: string
  resourceType?: string
  status?: AuditStatus
  startDate?: string
  endDate?: string
  limit?: number
}

export async function getAuditLogs(
  filters: AuditLogFilters,
  supabase?: SupabaseClient
): Promise<AuditLogEntry[]> {
  const client = supabase || await createClient()

  let query = client
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters.action) {
    query = query.eq('action', filters.action)
  }

  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  } else {
    query = query.limit(100) // Default limit
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to get audit logs:', error)
    return []
  }

  return data || []
}

/**
 * Helper to extract changes between old and new values
 */
export function buildChangesObject(
  oldValue: Record<string, any>,
  newValue: Record<string, any>
): Record<string, any> {
  const changes: Record<string, any> = {}

  // Find changed fields
  for (const key in newValue) {
    if (oldValue[key] !== newValue[key]) {
      changes[key] = {
        old: oldValue[key],
        new: newValue[key],
      }
    }
  }

  // Find removed fields
  for (const key in oldValue) {
    if (!(key in newValue)) {
      changes[key] = {
        old: oldValue[key],
        new: null,
      }
    }
  }

  return changes
}

/**
 * Helper to format audit log entry for display
 */
export function formatAuditEntry(entry: AuditLogEntry): string {
  const { action, user_email, resource_type, created_at } = entry

  const timestamp = created_at ? new Date(created_at).toLocaleString() : 'Unknown time'
  const user = user_email || 'Unknown user'
  const resource = resource_type ? ` on ${resource_type}` : ''

  return `[${timestamp}] ${user} performed ${action}${resource}`
}

/**
 * Clean up old audit logs (maintenance function)
 * Should be called periodically to prevent unbounded growth
 */
export async function cleanupOldAuditLogs(
  daysToKeep: number = 365,
  supabase?: SupabaseClient
): Promise<number> {
  const client = supabase || await createClient()

  const { data, error } = await client
    .rpc('cleanup_old_audit_logs', {
      p_days_to_keep: daysToKeep,
    })

  if (error) {
    console.error('Failed to clean up old audit logs:', error)
    return 0
  }

  return data || 0
}
