/**
 * Admin Panel - Area Configuration
 *
 * This file maps areas to their routes and provides utilities for
 * determining which area a route belongs to.
 */

import type { AreaCode } from './types'

/**
 * Route patterns for each area
 * Used to determine which area a route belongs to
 */
export const AREA_ROUTE_MAP: Record<AreaCode, string[]> = {
  sales: [
    '/sales',
    '/orders',
    '/clients',
    '/contacts',
    '/deals',
    '/cases',
    '/properties',
  ],
  marketing: [
    '/marketing',
  ],
  production: [
    '/production',
  ],
  operations: [
    '/operations',
    '/tasks',
  ],
  logistics: [
    '/logistics',
  ],
  finance: [
    '/finance',
  ],
  ai_automation: [
    '/agent',
    '/ai-analytics',
  ],
  admin: [
    '/admin',
  ],
}

/**
 * Routes that don't require area access (always accessible)
 */
export const PUBLIC_ROUTES: string[] = [
  '/dashboard',
  '/settings',
  '/migrations',
  '/login',
  '/auth',
  '/reset-password',
  '/unauthorized',
]

/**
 * Routes that require authentication but no specific area access
 */
export const AUTHENTICATED_ROUTES: string[] = [
  '/dashboard',
  '/settings',
]

/**
 * Get the area code for a given route
 * Returns null if route is public or not mapped to any area
 */
export function getAreaForRoute(pathname: string): AreaCode | null {
  // Check if it's a public route
  for (const publicRoute of PUBLIC_ROUTES) {
    if (pathname === publicRoute || pathname.startsWith(publicRoute + '/')) {
      return null
    }
  }

  // Find matching area
  for (const [areaCode, routes] of Object.entries(AREA_ROUTE_MAP)) {
    for (const route of routes) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        return areaCode as AreaCode
      }
    }
  }

  return null
}

/**
 * Check if a route is public (no authentication required)
 */
export function isPublicRoute(pathname: string): boolean {
  // Auth routes are public
  if (pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/reset-password')) {
    return true
  }

  // Client portal has its own auth
  if (pathname.startsWith('/client-portal') || pathname.startsWith('/borrower')) {
    return false // These have their own auth handling
  }

  return false
}

/**
 * Check if a route requires area access control
 */
export function requiresAreaAccess(pathname: string): boolean {
  // Public routes don't need area access
  if (isPublicRoute(pathname)) {
    return false
  }

  // Authenticated routes (dashboard, settings) don't need area access
  for (const route of AUTHENTICATED_ROUTES) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return false
    }
  }

  // All other routes require area access
  return getAreaForRoute(pathname) !== null
}

/**
 * Get all routes that belong to an area
 */
export function getRoutesForArea(areaCode: AreaCode): string[] {
  return AREA_ROUTE_MAP[areaCode] || []
}

/**
 * Icon mapping for areas (matching Lucide icons)
 */
export const AREA_ICONS: Record<AreaCode, string> = {
  sales: 'TrendingUp',
  marketing: 'Megaphone',
  production: 'Factory',
  operations: 'Cog',
  logistics: 'Truck',
  finance: 'DollarSign',
  ai_automation: 'Brain',
  admin: 'Shield',
}

/**
 * Default areas for each role (fallback if database not available)
 * This should match the database seed data
 */
export const DEFAULT_ROLE_AREAS: Record<string, AreaCode[]> = {
  super_admin: ['sales', 'marketing', 'production', 'operations', 'logistics', 'finance', 'ai_automation', 'admin'],
  admin: ['sales', 'marketing', 'production', 'operations', 'logistics', 'ai_automation', 'admin'],
  manager: ['sales', 'marketing', 'production', 'operations'],
  user: ['sales', 'production'],
  researcher: ['production'],
  reviewer: ['production'],
  appraiser: ['production', 'sales'],
  software_developer: ['admin', 'ai_automation'],
  accounting_clerk: ['finance'],
}
