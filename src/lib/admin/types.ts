/**
 * Admin Panel - Shared Types
 *
 * Type definitions shared between client and server code.
 * This file should NOT import any server-side modules.
 */

/**
 * User role type definition
 */
export type UserRole = 'admin' | 'manager' | 'user'

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

