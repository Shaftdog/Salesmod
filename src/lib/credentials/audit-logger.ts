/**
 * P2.4: Credential Access Audit Logger
 * Logs all credential access for security and compliance
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { CredentialAccessLog, CredentialPurpose } from './types';
import { hashCredentialId } from './encryption';

// ============================================================================
// Types
// ============================================================================

export interface AuditLogEntry {
  tenantId: string;
  credentialId: string;
  accessedBy: string;
  accessPurpose: CredentialPurpose;
  accessGranted: boolean;
  denialReason?: string;
  runId?: string;
  browserJobId?: string;
  ipAddress?: string;
}

export interface AuditQueryOptions {
  credentialId?: string;
  accessedBy?: string;
  accessGranted?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalAccesses: number;
  grantedCount: number;
  deniedCount: number;
  uniqueCredentials: number;
  accessesByPurpose: Record<string, number>;
  accessesByAccessor: Record<string, number>;
  denialReasons: Record<string, number>;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Log a credential access attempt
 */
export async function logCredentialAccess(entry: AuditLogEntry): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('credential_access_log')
    .insert({
      tenant_id: entry.tenantId,
      credential_id: entry.credentialId,
      accessed_by: entry.accessedBy,
      access_purpose: entry.accessPurpose,
      access_granted: entry.accessGranted,
      denial_reason: entry.denialReason,
      run_id: entry.runId,
      browser_job_id: entry.browserJobId,
      ip_address: entry.ipAddress,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[audit-logger] Failed to log access:', error);
    // Log to console as fallback
    console.warn('[audit-logger] FALLBACK LOG:', {
      ...entry,
      credentialId: hashCredentialId(entry.credentialId),
      timestamp: new Date().toISOString(),
    });
    return null;
  }

  return data.id;
}

/**
 * Log a successful credential access
 */
export async function logAccessGranted(
  tenantId: string,
  credentialId: string,
  accessedBy: string,
  purpose: CredentialPurpose,
  context?: { runId?: string; browserJobId?: string; ipAddress?: string }
): Promise<string | null> {
  return logCredentialAccess({
    tenantId,
    credentialId,
    accessedBy,
    accessPurpose: purpose,
    accessGranted: true,
    runId: context?.runId,
    browserJobId: context?.browserJobId,
    ipAddress: context?.ipAddress,
  });
}

/**
 * Log a denied credential access
 */
export async function logAccessDenied(
  tenantId: string,
  credentialId: string,
  accessedBy: string,
  purpose: CredentialPurpose,
  denialReason: string,
  context?: { runId?: string; browserJobId?: string; ipAddress?: string }
): Promise<string | null> {
  return logCredentialAccess({
    tenantId,
    credentialId,
    accessedBy,
    accessPurpose: purpose,
    accessGranted: false,
    denialReason,
    runId: context?.runId,
    browserJobId: context?.browserJobId,
    ipAddress: context?.ipAddress,
  });
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Query credential access logs
 */
export async function queryAccessLogs(
  tenantId: string,
  options: AuditQueryOptions = {}
): Promise<CredentialAccessLog[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('credential_access_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options.credentialId) {
    query = query.eq('credential_id', options.credentialId);
  }

  if (options.accessedBy) {
    query = query.eq('accessed_by', options.accessedBy);
  }

  if (options.accessGranted !== undefined) {
    query = query.eq('access_granted', options.accessGranted);
  }

  if (options.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }

  if (options.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  const limit = Math.max(1, Math.min(options.limit || 100, 1000));
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('[audit-logger] Failed to query logs:', error);
    return [];
  }

  return (data || []).map(mapToAccessLog);
}

/**
 * Get access logs for a specific credential
 */
export async function getCredentialAccessHistory(
  tenantId: string,
  credentialId: string,
  limit: number = 50
): Promise<CredentialAccessLog[]> {
  return queryAccessLogs(tenantId, { credentialId, limit });
}

/**
 * Get recent denied accesses (for security monitoring)
 */
export async function getRecentDeniedAccesses(
  tenantId: string,
  hours: number = 24
): Promise<CredentialAccessLog[]> {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  return queryAccessLogs(tenantId, {
    accessGranted: false,
    startDate,
    limit: 100,
  });
}

/**
 * Get access statistics for a tenant
 */
export async function getAccessStats(
  tenantId: string,
  days: number = 7
): Promise<AuditStats> {
  const supabase = createServiceRoleClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('credential_access_log')
    .select('credential_id, accessed_by, access_purpose, access_granted, denial_reason')
    .eq('tenant_id', tenantId)
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('[audit-logger] Failed to get stats:', error);
    return {
      totalAccesses: 0,
      grantedCount: 0,
      deniedCount: 0,
      uniqueCredentials: 0,
      accessesByPurpose: {},
      accessesByAccessor: {},
      denialReasons: {},
    };
  }

  const logs = data || [];
  const uniqueCredentials = new Set(logs.map((l) => l.credential_id));

  const accessesByPurpose: Record<string, number> = {};
  const accessesByAccessor: Record<string, number> = {};
  const denialReasons: Record<string, number> = {};

  let grantedCount = 0;
  let deniedCount = 0;

  for (const log of logs) {
    if (log.access_granted) {
      grantedCount++;
    } else {
      deniedCount++;
      if (log.denial_reason) {
        denialReasons[log.denial_reason] = (denialReasons[log.denial_reason] || 0) + 1;
      }
    }

    accessesByPurpose[log.access_purpose] = (accessesByPurpose[log.access_purpose] || 0) + 1;
    accessesByAccessor[log.accessed_by] = (accessesByAccessor[log.accessed_by] || 0) + 1;
  }

  return {
    totalAccesses: logs.length,
    grantedCount,
    deniedCount,
    uniqueCredentials: uniqueCredentials.size,
    accessesByPurpose,
    accessesByAccessor,
    denialReasons,
  };
}

// ============================================================================
// Security Alerting
// ============================================================================

/**
 * Check for suspicious access patterns
 */
export async function checkSuspiciousPatterns(
  tenantId: string
): Promise<{ hasSuspiciousActivity: boolean; alerts: string[] }> {
  const alerts: string[] = [];

  // Check for high denial rate in last hour
  const hourAgo = new Date();
  hourAgo.setHours(hourAgo.getHours() - 1);

  const recentLogs = await queryAccessLogs(tenantId, {
    startDate: hourAgo,
    limit: 1000,
  });

  if (recentLogs.length >= 10) {
    const deniedCount = recentLogs.filter((l) => !l.accessGranted).length;
    const denialRate = deniedCount / recentLogs.length;

    if (denialRate > 0.5) {
      alerts.push(`High denial rate (${Math.round(denialRate * 100)}%) in the last hour`);
    }
  }

  // Check for repeated denials from same source
  const deniedBySource = new Map<string, number>();
  for (const log of recentLogs.filter((l) => !l.accessGranted)) {
    const count = (deniedBySource.get(log.accessedBy) || 0) + 1;
    deniedBySource.set(log.accessedBy, count);
  }

  for (const [source, count] of deniedBySource) {
    if (count >= 5) {
      alerts.push(`${count} denied attempts from ${source}`);
    }
  }

  // Check for unusual access patterns (many credentials accessed quickly)
  const uniqueCredentials = new Set(recentLogs.map((l) => l.credentialId));
  if (uniqueCredentials.size > 10 && recentLogs.length > 20) {
    alerts.push(`Unusual pattern: ${uniqueCredentials.size} different credentials accessed`);
  }

  return {
    hasSuspiciousActivity: alerts.length > 0,
    alerts,
  };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up old audit logs (for data retention compliance)
 */
export async function cleanupOldLogs(
  tenantId: string,
  retentionDays: number = 90
): Promise<number> {
  const supabase = createServiceRoleClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data, error } = await supabase
    .from('credential_access_log')
    .delete()
    .eq('tenant_id', tenantId)
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('[audit-logger] Failed to cleanup logs:', error);
    return 0;
  }

  return data?.length || 0;
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToAccessLog(row: Record<string, unknown>): CredentialAccessLog {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    credentialId: row.credential_id as string,
    accessedBy: row.accessed_by as string,
    accessPurpose: row.access_purpose as string,
    runId: row.run_id as string | undefined,
    browserJobId: row.browser_job_id as string | undefined,
    ipAddress: row.ip_address as string | undefined,
    accessGranted: row.access_granted as boolean,
    denialReason: row.denial_reason as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}
