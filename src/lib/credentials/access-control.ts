/**
 * P2.4: Credential Access Control
 * Purpose-based access control for credentials
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { CredentialPurpose, StoredCredential } from './types';
import { logAccessDenied } from './audit-logger';

// ============================================================================
// Types
// ============================================================================

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface AccessPolicy {
  purpose: CredentialPurpose;
  allowedAccessors: string[];
  requiresApproval: boolean;
  maxAccessesPerHour: number;
  validTimeWindow?: { start: number; end: number }; // Hours in UTC
}

// ============================================================================
// Access Check Functions
// ============================================================================

/**
 * Check if access to a credential is allowed
 */
export async function canAccessCredential(
  tenantId: string,
  credentialId: string,
  purpose: CredentialPurpose,
  requestedBy: string
): Promise<AccessCheckResult> {
  const supabase = createServiceRoleClient();

  // Get credential details
  const { data: credential, error } = await supabase
    .from('credential_vault')
    .select('allowed_purposes, is_valid, validation_error')
    .eq('id', credentialId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !credential) {
    return { allowed: false, reason: 'Credential not found' };
  }

  // Check if credential is valid
  if (!credential.is_valid) {
    return { allowed: false, reason: credential.validation_error || 'Credential is invalid' };
  }

  // Check if purpose is allowed
  const allowedPurposes = credential.allowed_purposes as CredentialPurpose[];
  if (!allowedPurposes.includes(purpose)) {
    return {
      allowed: false,
      reason: `Purpose '${purpose}' not allowed. Allowed: ${allowedPurposes.join(', ')}`,
    };
  }

  // Check rate limit
  const rateLimitCheck = await checkRateLimit(tenantId, credentialId, requestedBy);
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck;
  }

  return { allowed: true };
}

/**
 * Check rate limit for credential access
 */
async function checkRateLimit(
  tenantId: string,
  credentialId: string,
  requestedBy: string
): Promise<AccessCheckResult> {
  const supabase = createServiceRoleClient();

  // Get accesses in the last hour
  const hourAgo = new Date();
  hourAgo.setHours(hourAgo.getHours() - 1);

  const { count, error } = await supabase
    .from('credential_access_log')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('credential_id', credentialId)
    .eq('access_granted', true)
    .gte('created_at', hourAgo.toISOString());

  if (error) {
    console.error('[access-control] Rate limit check failed:', error);
    // SECURITY: Fail closed - deny access if rate limit check fails
    // This prevents credential access during database outages
    return { allowed: false, reason: 'Unable to verify rate limits - access denied for security' };
  }

  // Default max 100 accesses per hour per credential
  const maxAccessesPerHour = 100;
  if ((count || 0) >= maxAccessesPerHour) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${count}/${maxAccessesPerHour} accesses per hour`,
    };
  }

  return { allowed: true };
}

/**
 * Validate accessor identity
 */
export function validateAccessor(requestedBy: string): AccessCheckResult {
  // Validate accessor format
  const validPrefixes = [
    'autonomous_cycle',
    'browser_automation',
    'sandbox',
    'user:',
    'api:',
    'cron:',
  ];

  const isValid = validPrefixes.some((prefix) => requestedBy.startsWith(prefix));

  if (!isValid) {
    return { allowed: false, reason: `Invalid accessor format: ${requestedBy}` };
  }

  return { allowed: true };
}

/**
 * Check if credential needs refresh before access
 */
export async function checkCredentialHealth(
  tenantId: string,
  credentialId: string
): Promise<{
  isHealthy: boolean;
  needsRefresh: boolean;
  isExpired: boolean;
  message?: string;
}> {
  const supabase = createServiceRoleClient();

  const { data: credential, error } = await supabase
    .from('credential_vault')
    .select('is_valid, needs_refresh, token_expires_at, validation_error')
    .eq('id', credentialId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !credential) {
    return {
      isHealthy: false,
      needsRefresh: false,
      isExpired: false,
      message: 'Credential not found',
    };
  }

  const isExpired = credential.token_expires_at
    ? new Date(credential.token_expires_at) < new Date()
    : false;

  return {
    isHealthy: credential.is_valid && !isExpired,
    needsRefresh: credential.needs_refresh || isExpired,
    isExpired,
    message: credential.validation_error || undefined,
  };
}

// ============================================================================
// Policy Management
// ============================================================================

/**
 * Get default access policy for a purpose
 */
export function getDefaultPolicy(purpose: CredentialPurpose): AccessPolicy {
  switch (purpose) {
    case 'browser_automation':
      return {
        purpose,
        allowedAccessors: ['browser_automation', 'autonomous_cycle'],
        requiresApproval: false,
        maxAccessesPerHour: 50,
        validTimeWindow: { start: 6, end: 22 }, // 6 AM to 10 PM
      };

    case 'api_call':
      return {
        purpose,
        allowedAccessors: ['autonomous_cycle', 'api:', 'cron:'],
        requiresApproval: false,
        maxAccessesPerHour: 200,
      };

    case 'email_send':
      return {
        purpose,
        allowedAccessors: ['autonomous_cycle', 'user:'],
        requiresApproval: false,
        maxAccessesPerHour: 100,
      };

    case 'data_sync':
      return {
        purpose,
        allowedAccessors: ['cron:', 'autonomous_cycle'],
        requiresApproval: false,
        maxAccessesPerHour: 20,
      };

    default:
      return {
        purpose,
        allowedAccessors: [],
        requiresApproval: true,
        maxAccessesPerHour: 10,
      };
  }
}

/**
 * Check if accessor matches policy
 */
export function matchesPolicy(
  accessor: string,
  policy: AccessPolicy
): boolean {
  return policy.allowedAccessors.some((allowed) => {
    if (allowed.endsWith(':')) {
      // Prefix match
      return accessor.startsWith(allowed);
    }
    return accessor === allowed || accessor.startsWith(`${allowed}:`);
  });
}

/**
 * Check if current time is within valid window
 */
export function isWithinTimeWindow(
  window?: { start: number; end: number }
): boolean {
  if (!window) return true;

  const now = new Date();
  const currentHour = now.getUTCHours();

  if (window.start <= window.end) {
    return currentHour >= window.start && currentHour < window.end;
  } else {
    // Wraps around midnight
    return currentHour >= window.start || currentHour < window.end;
  }
}

// ============================================================================
// Permission Updates
// ============================================================================

/**
 * Update allowed purposes for a credential
 */
export async function updateAllowedPurposes(
  tenantId: string,
  credentialId: string,
  purposes: CredentialPurpose[]
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('credential_vault')
    .update({
      allowed_purposes: purposes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[access-control] Failed to update purposes:', error);
    return false;
  }

  return true;
}

/**
 * Revoke all access to a credential
 */
export async function revokeCredentialAccess(
  tenantId: string,
  credentialId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('credential_vault')
    .update({
      allowed_purposes: [],
      is_valid: false,
      validation_error: 'Access revoked',
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[access-control] Failed to revoke access:', error);
    return false;
  }

  return true;
}

/**
 * Temporarily suspend credential access
 */
export async function suspendCredential(
  tenantId: string,
  credentialId: string,
  reason: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('credential_vault')
    .update({
      is_valid: false,
      validation_error: `Suspended: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[access-control] Failed to suspend credential:', error);
    return false;
  }

  return true;
}

/**
 * Reactivate a suspended credential
 */
export async function reactivateCredential(
  tenantId: string,
  credentialId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('credential_vault')
    .update({
      is_valid: true,
      validation_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[access-control] Failed to reactivate credential:', error);
    return false;
  }

  return true;
}
