/**
 * Admin Panel - Shared Types
 *
 * Type definitions shared between client and server code.
 * This file should NOT import any server-side modules.
 */

/**
 * User role type definition
 * Hierarchy: super_admin > admin > manager > user
 * Business roles: researcher, reviewer, appraiser, software_developer, accounting_clerk
 */
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'user'
  | 'researcher'
  | 'reviewer'
  | 'appraiser'
  | 'software_developer'
  | 'accounting_clerk'

/**
 * All available user roles
 */
export const USER_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'manager',
  'user',
  'researcher',
  'reviewer',
  'appraiser',
  'software_developer',
  'accounting_clerk',
]

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  user: 'User',
  researcher: 'Researcher',
  reviewer: 'Reviewer',
  appraiser: 'Appraiser',
  software_developer: 'Software Developer',
  accounting_clerk: 'Accounting Clerk',
}

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Full system access - can manage all roles, areas, and configurations',
  admin: 'System administration - can manage users and system settings',
  manager: 'Business operations - can manage orders, properties, and clients',
  user: 'Standard access - can view and manage assigned work',
  researcher: 'Research focus - access to production workflows',
  reviewer: 'Quality control - access to review and QC workflows',
  appraiser: 'Core appraisal work - access to production and property data',
  software_developer: 'System development - admin and AI access',
  accounting_clerk: 'Financial operations - access to finance module',
}

/**
 * Role hierarchy levels (higher = more access)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  manager: 60,
  user: 40,
  researcher: 40,
  reviewer: 40,
  appraiser: 40,
  software_developer: 50,
  accounting_clerk: 40,
}

/**
 * Area code type definition
 */
export type AreaCode =
  | 'sales'
  | 'marketing'
  | 'production'
  | 'operations'
  | 'logistics'
  | 'finance'
  | 'ai_automation'
  | 'admin'

/**
 * All available area codes
 */
export const AREA_CODES: AreaCode[] = [
  'sales',
  'marketing',
  'production',
  'operations',
  'logistics',
  'finance',
  'ai_automation',
  'admin',
]

/**
 * Area display names for UI
 */
export const AREA_DISPLAY_NAMES: Record<AreaCode, string> = {
  sales: 'Sales',
  marketing: 'Marketing',
  production: 'Production',
  operations: 'Operations',
  logistics: 'Logistics',
  finance: 'Finance',
  ai_automation: 'AI & Automation',
  admin: 'Admin',
}

/**
 * Area interface
 */
export interface Area {
  id: string
  code: AreaCode
  name: string
  description?: string
  icon: string
  displayOrder: number
  isActive: boolean
}

/**
 * Sub-module interface
 */
export interface SubModule {
  id: string
  areaId: string
  code: string
  name: string
  routePattern: string
  displayOrder: number
  isActive: boolean
}

/**
 * Area with sub-modules
 */
export interface AreaWithSubModules extends Area {
  subModules: SubModule[]
}

/**
 * User area access source
 */
export type AreaAccessSource = 'super_admin' | 'role_default' | 'granted' | 'custom'

/**
 * User area access entry
 */
export interface UserAreaAccess {
  areaCode: AreaCode
  areaName: string
  areaIcon: string
  accessSource: AreaAccessSource
}

/**
 * User area override mode
 */
export type OverrideMode = 'tweak' | 'custom'

/**
 * User area override configuration
 */
export interface UserAreaOverride {
  userId: string
  overrideMode: OverrideMode
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

/**
 * User area access entry (for tweaks or custom)
 */
export interface UserAreaAccessEntry {
  userId: string
  areaId: string
  accessType: 'grant' | 'revoke'
  includeAllSubmodules: boolean
}

/**
 * Role area template
 */
export interface RoleAreaTemplate {
  roleName: UserRole
  areaId: string
  areaCode: AreaCode
  areaName: string
  includeAllSubmodules: boolean
}

/**
 * Complete user area access info
 */
export interface UserAreaAccessInfo {
  userId: string
  role: UserRole
  overrideMode: OverrideMode | null
  areas: UserAreaAccess[]
}

/**
 * Permission resource types
 */
export type PermissionResource =
  | 'users'
  | 'orders'
  | 'properties'
  | 'clients'
  | 'analytics'
  | 'audit_logs'
  | 'settings'
  | 'integrations'
  | 'agents'
  | 'reports'

/**
 * Permission action types
 */
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'assign'
  | 'export'
  | 'impersonate'

/**
 * Common permission names (client-safe)
 */
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  ASSIGN_ROLES: 'assign_roles',
  IMPERSONATE_USERS: 'impersonate_users',

  // Orders
  MANAGE_ORDERS: 'manage_orders',
  CREATE_ORDERS: 'create_orders',
  EDIT_ORDERS: 'edit_orders',
  DELETE_ORDERS: 'delete_orders',
  VIEW_ORDERS: 'view_orders',
  ASSIGN_ORDERS: 'assign_orders',

  // Properties
  MANAGE_PROPERTIES: 'manage_properties',
  CREATE_PROPERTIES: 'create_properties',
  EDIT_PROPERTIES: 'edit_properties',
  DELETE_PROPERTIES: 'delete_properties',
  VIEW_PROPERTIES: 'view_properties',

  // Clients
  MANAGE_CLIENTS: 'manage_clients',
  CREATE_CLIENTS: 'create_clients',
  EDIT_CLIENTS: 'edit_clients',
  DELETE_CLIENTS: 'delete_clients',
  VIEW_CLIENTS: 'view_clients',

  // Analytics & Reports
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  VIEW_REPORTS: 'view_reports',

  // Audit Logs
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_AUDIT_LOGS: 'export_audit_logs',

  // Settings
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_SETTINGS: 'view_settings',
  MANAGE_INTEGRATIONS: 'manage_integrations',

  // AI Agents
  MANAGE_AGENTS: 'manage_agents',
  VIEW_AGENTS: 'view_agents',
} as const

