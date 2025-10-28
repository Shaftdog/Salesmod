/**
 * Admin Panel - API Middleware Helpers
 *
 * Utilities for protecting API routes with role and permission checks
 *
 * Usage in API routes:
 *
 * @example
 * ```typescript
 * import { withAdminAuth, withPermission } from '@/lib/admin/api-middleware'
 *
 * export const GET = withAdminAuth(async (request, { userId }) => {
 *   // userId is guaranteed to be an admin
 *   return NextResponse.json({ data: 'admin data' })
 * })
 *
 * export const POST = withPermission('manage_users', async (request, { userId }) => {
 *   // userId is guaranteed to have manage_users permission
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  requireAdmin,
  requireRole,
  requirePermission,
} from './permissions'
import type { UserRole } from './types'
import { logFailure } from './audit'

/**
 * Context passed to API handlers after successful authorization
 */
export interface AuthContext {
  userId: string
  supabase: Awaited<ReturnType<typeof createClient>>
  params?: Promise<any>
}

/**
 * API handler with authentication context
 */
export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<Response>

/**
 * Wrap an API route handler with admin authentication
 * Returns 401 if not authenticated, 403 if not admin
 */
export function withAdminAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, routeContext: { params?: Promise<any> } = {}) => {
    try {
      const supabase = await createClient()

      // This will throw if user is not admin
      const userId = await requireAdmin(supabase)

      // Call the actual handler with authenticated context
      return await handler(request, {
        userId,
        supabase,
        params: routeContext.params
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized'

      // Log failed access attempt
      await logFailure(
        'admin.access_denied',
        message,
        'api',
        undefined,
        {
          path: request.nextUrl.pathname,
          method: request.method,
        }
      )

      return NextResponse.json(
        { error: message },
        { status: message.includes('Not authenticated') ? 401 : 403 }
      )
    }
  }
}

/**
 * Wrap an API route handler with role-based authentication
 * Returns 401 if not authenticated, 403 if doesn't have required role
 */
export function withRole(role: UserRole, handler: AuthenticatedHandler) {
  return async (request: NextRequest, routeContext: { params?: Promise<any> } = {}) => {
    try {
      const supabase = await createClient()

      // This will throw if user doesn't have the required role
      const userId = await requireRole(role, supabase)

      // Call the actual handler with authenticated context
      return await handler(request, {
        userId,
        supabase,
        params: routeContext.params
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized'

      // Log failed access attempt
      await logFailure(
        'api.access_denied',
        message,
        'api',
        undefined,
        {
          path: request.nextUrl.pathname,
          method: request.method,
          required_role: role,
        }
      )

      return NextResponse.json(
        { error: message },
        { status: message.includes('Not authenticated') ? 401 : 403 }
      )
    }
  }
}

/**
 * Wrap an API route handler with permission-based authentication
 * Returns 401 if not authenticated, 403 if doesn't have required permission
 */
export function withPermission(
  permission: string,
  handler: AuthenticatedHandler
) {
  return async (request: NextRequest, routeContext: { params?: Promise<any> } = {}) => {
    try {
      const supabase = await createClient()

      // This will throw if user doesn't have the required permission
      const userId = await requirePermission(permission, supabase)

      // Call the actual handler with authenticated context
      return await handler(request, {
        userId,
        supabase,
        params: routeContext.params
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized'

      // Log failed access attempt
      await logFailure(
        'api.access_denied',
        message,
        'api',
        undefined,
        {
          path: request.nextUrl.pathname,
          method: request.method,
          required_permission: permission,
        }
      )

      return NextResponse.json(
        { error: message },
        { status: message.includes('Not authenticated') ? 401 : 403 }
      )
    }
  }
}

/**
 * Helper to extract request body safely
 */
export async function getRequestBody<T = any>(request: NextRequest): Promise<T | null> {
  try {
    const body = await request.json()
    return body as T
  } catch (error) {
    return null
  }
}

/**
 * Helper to get IP address from request
 */
export function getIpAddress(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  )
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined
}

/**
 * Helper to build audit metadata from request
 */
export function buildAuditMetadata(request: NextRequest): Record<string, any> {
  return {
    path: request.nextUrl.pathname,
    method: request.method,
    ip_address: getIpAddress(request),
    user_agent: getUserAgent(request),
  }
}
