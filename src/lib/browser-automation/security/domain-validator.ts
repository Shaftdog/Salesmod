/**
 * P2.3: Domain Validator
 * Enforces domain allowlist for browser automation
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { DomainAllowlistEntry } from '../types';

// ============================================================================
// Domain Validation
// ============================================================================

/**
 * Check if a URL's domain is allowed
 */
export async function isDomainAllowed(
  url: string,
  tenantId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();

    // Check global allowlist
    const globalAllowed = await isGloballyAllowed(domain);
    if (globalAllowed) {
      return { allowed: true };
    }

    // Check tenant-specific allowlist
    const tenantAllowed = await isTenantAllowed(domain, tenantId);
    if (tenantAllowed) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Domain '${domain}' is not in the allowlist`,
    };
  } catch (error) {
    return {
      allowed: false,
      reason: `Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if domain is globally allowed
 */
async function isGloballyAllowed(domain: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('domain_allowlist')
    .select('id, expires_at')
    .eq('domain', domain)
    .eq('is_global', true)
    .single();

  if (error || !data) {
    // Also check for wildcard matches (e.g., *.valuetrac.com)
    return checkWildcardMatch(domain, null);
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Check if domain is allowed for tenant
 */
async function isTenantAllowed(domain: string, tenantId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('domain_allowlist')
    .select('id, expires_at')
    .eq('domain', domain)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    // Check for wildcard matches
    return checkWildcardMatch(domain, tenantId);
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Check wildcard domain matches
 */
async function checkWildcardMatch(
  domain: string,
  tenantId: string | null
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // Get all wildcard entries
  let query = supabase
    .from('domain_allowlist')
    .select('domain, expires_at')
    .like('domain', '*.%');

  if (tenantId) {
    query = query.or(`is_global.eq.true,tenant_id.eq.${tenantId}`);
  } else {
    query = query.eq('is_global', true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return false;
  }

  const now = new Date();

  for (const entry of data) {
    // Check expiration
    if (entry.expires_at && new Date(entry.expires_at) < now) {
      continue;
    }

    // Check wildcard match
    const wildcardDomain = entry.domain.substring(2); // Remove "*."
    if (domain.endsWith(wildcardDomain) || domain === wildcardDomain.substring(1)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Allowlist Management
// ============================================================================

/**
 * Add domain to allowlist
 */
export async function addToAllowlist(
  domain: string,
  options: {
    isGlobal?: boolean;
    tenantId?: string;
    addedBy: string;
    reason?: string;
    expiresAt?: Date;
  }
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  // Normalize domain
  const normalizedDomain = domain.toLowerCase().trim();

  // Validate domain format
  if (!isValidDomainFormat(normalizedDomain)) {
    console.error('[domain-validator] Invalid domain format:', normalizedDomain);
    return null;
  }

  const { data, error } = await supabase
    .from('domain_allowlist')
    .insert({
      domain: normalizedDomain,
      is_global: options.isGlobal || false,
      tenant_id: options.tenantId,
      added_by: options.addedBy,
      reason: options.reason,
      expires_at: options.expiresAt?.toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[domain-validator] Failed to add domain:', error);
    return null;
  }

  console.log(`[domain-validator] Added domain ${normalizedDomain} to allowlist`);
  return data.id;
}

/**
 * Remove domain from allowlist
 */
export async function removeFromAllowlist(
  domain: string,
  tenantId?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  let query = supabase.from('domain_allowlist').delete().eq('domain', domain.toLowerCase());

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { error } = await query;

  if (error) {
    console.error('[domain-validator] Failed to remove domain:', error);
    return false;
  }

  return true;
}

/**
 * Get allowlist for tenant
 */
export async function getAllowlist(tenantId?: string): Promise<DomainAllowlistEntry[]> {
  const supabase = createServiceRoleClient();

  let query = supabase.from('domain_allowlist').select('*');

  if (tenantId) {
    query = query.or(`is_global.eq.true,tenant_id.eq.${tenantId}`);
  } else {
    query = query.eq('is_global', true);
  }

  const { data, error } = await query.order('domain');

  if (error) {
    console.error('[domain-validator] Failed to get allowlist:', error);
    return [];
  }

  return (data || []).map(mapToEntry);
}

/**
 * Check if domain is in global allowlist
 */
export async function isInGlobalAllowlist(domain: string): Promise<boolean> {
  return isGloballyAllowed(domain.toLowerCase());
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate domain format
 */
function isValidDomainFormat(domain: string): boolean {
  // Allow wildcard domains like *.example.com
  if (domain.startsWith('*.')) {
    domain = domain.substring(2);
  }

  // Basic domain validation
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
  return domainRegex.test(domain);
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Check if URL uses HTTPS
 */
export function isSecureUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToEntry(row: Record<string, unknown>): DomainAllowlistEntry {
  return {
    id: row.id as string,
    domain: row.domain as string,
    isGlobal: row.is_global as boolean,
    tenantId: row.tenant_id as string | undefined,
    addedBy: row.added_by as string,
    addedAt: new Date(row.added_at as string),
    reason: row.reason as string | undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at as string) : undefined,
  };
}
