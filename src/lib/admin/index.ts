/**
 * Admin Panel - Main Export
 *
 * Exports all admin utilities for easy importing
 */

// Permission utilities
export {
  type UserRole,
  type PermissionResource,
  type PermissionAction,
  PERMISSIONS,
  getCurrentUserId,
  getUserRole,
  getCurrentUserRole,
  hasRole,
  currentUserHasRole,
  isAdmin,
  currentUserIsAdmin,
  getUserPermissions,
  hasPermission,
  currentUserHasPermission,
  requireRole,
  requireAdmin,
  requirePermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserProfile,
  getCurrentUserProfile,
} from './permissions'

// Audit logging
export {
  AUDIT_ACTIONS,
  type AuditStatus,
  type AuditLogEntry,
  type AuditLogOptions,
  logAction,
  logSuccess,
  logFailure,
  getResourceAuditTrail,
  getUserActivity,
  getRecentAuditLogs,
  getAuditLogs,
  type AuditLogFilters,
  buildChangesObject,
  formatAuditEntry,
  cleanupOldAuditLogs,
} from './audit'
