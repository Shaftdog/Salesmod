/**
 * P2.3: Portal Configurations Index
 * Registry of supported vendor portals
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { VendorPortalConfig, PortalSelectors, WorkflowDefinition, RateLimits } from '../types';
import { genericPortalConfig, buildPortalConfig, type PortalConfigTemplate } from './generic';
import { valuetracPortalConfig } from './valuetrac';
import { mercuryNetworkPortalConfig } from './mercury-network';

// ============================================================================
// Portal Registry
// ============================================================================

const PORTAL_TEMPLATES: Record<string, PortalConfigTemplate> = {
  generic: genericPortalConfig,
  valuetrac: valuetracPortalConfig,
  mercury: mercuryNetworkPortalConfig,
};

/**
 * Get portal template by type
 */
export function getPortalTemplate(
  portalType: VendorPortalConfig['portalType']
): PortalConfigTemplate | null {
  return PORTAL_TEMPLATES[portalType] || null;
}

/**
 * Get all available portal types
 */
export function getAvailablePortalTypes(): VendorPortalConfig['portalType'][] {
  return Object.keys(PORTAL_TEMPLATES) as VendorPortalConfig['portalType'][];
}

// ============================================================================
// Portal Config Management
// ============================================================================

/**
 * Create a new portal configuration
 */
export async function createPortalConfig(
  tenantId: string,
  portalType: VendorPortalConfig['portalType'],
  baseUrl: string,
  credentialName: string,
  options?: {
    customSelectors?: Partial<PortalSelectors>;
    customRateLimits?: Partial<RateLimits>;
    customName?: string;
  }
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const template = getPortalTemplate(portalType);
  if (!template) {
    console.error('[portal-configs] Unknown portal type:', portalType);
    return null;
  }

  const config = buildPortalConfig(template, {
    baseUrl,
    credentialName,
    selectors: options?.customSelectors,
    rateLimits: options?.customRateLimits,
  });

  const { data, error } = await supabase
    .from('vendor_portal_configs')
    .insert({
      tenant_id: tenantId,
      portal_name: options?.customName || config.portalName,
      portal_type: config.portalType,
      base_url: config.baseUrl,
      login_url: config.loginUrl,
      order_list_url: config.orderListUrl,
      credential_name: config.credentialName,
      is_active: config.isActive,
      selectors: config.selectors,
      workflows: config.workflows,
      rate_limits: config.rateLimits,
      success_count: 0,
      failure_count: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[portal-configs] Failed to create config:', error);
    return null;
  }

  console.log(`[portal-configs] Created portal config ${data.id} for ${portalType}`);
  return data.id;
}

/**
 * Get portal configuration by ID
 */
export async function getPortalConfig(
  tenantId: string,
  configId: string
): Promise<VendorPortalConfig | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('vendor_portal_configs')
    .select('*')
    .eq('id', configId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToPortalConfig(data);
}

/**
 * List portal configurations for tenant
 */
export async function listPortalConfigs(
  tenantId: string,
  options?: { activeOnly?: boolean }
): Promise<VendorPortalConfig[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('vendor_portal_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('portal_name');

  if (options?.activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[portal-configs] Failed to list configs:', error);
    return [];
  }

  return (data || []).map(mapToPortalConfig);
}

/**
 * Update portal configuration
 */
export async function updatePortalConfig(
  tenantId: string,
  configId: string,
  updates: {
    baseUrl?: string;
    loginUrl?: string;
    orderListUrl?: string;
    credentialName?: string;
    isActive?: boolean;
    selectors?: Partial<PortalSelectors>;
    workflows?: WorkflowDefinition[];
    rateLimits?: Partial<RateLimits>;
  }
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // Get current config for merging
  const { data: current, error: getError } = await supabase
    .from('vendor_portal_configs')
    .select('selectors, rate_limits')
    .eq('id', configId)
    .eq('tenant_id', tenantId)
    .single();

  if (getError || !current) {
    return false;
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.baseUrl !== undefined) updateData.base_url = updates.baseUrl;
  if (updates.loginUrl !== undefined) updateData.login_url = updates.loginUrl;
  if (updates.orderListUrl !== undefined) updateData.order_list_url = updates.orderListUrl;
  if (updates.credentialName !== undefined) updateData.credential_name = updates.credentialName;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (updates.workflows !== undefined) updateData.workflows = updates.workflows;

  if (updates.selectors) {
    updateData.selectors = {
      ...(current.selectors as PortalSelectors),
      ...updates.selectors,
    };
  }

  if (updates.rateLimits) {
    updateData.rate_limits = {
      ...(current.rate_limits as RateLimits),
      ...updates.rateLimits,
    };
  }

  const { error } = await supabase
    .from('vendor_portal_configs')
    .update(updateData)
    .eq('id', configId)
    .eq('tenant_id', tenantId);

  return !error;
}

/**
 * Delete portal configuration
 */
export async function deletePortalConfig(
  tenantId: string,
  configId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('vendor_portal_configs')
    .delete()
    .eq('id', configId)
    .eq('tenant_id', tenantId);

  return !error;
}

/**
 * Toggle portal active status
 */
export async function togglePortalActive(
  tenantId: string,
  configId: string,
  isActive: boolean
): Promise<boolean> {
  return updatePortalConfig(tenantId, configId, { isActive });
}

// ============================================================================
// Portal Stats
// ============================================================================

/**
 * Get portal statistics
 */
export async function getPortalStats(
  tenantId: string,
  configId: string
): Promise<{
  successCount: number;
  failureCount: number;
  successRate: number;
  lastUsedAt?: Date;
  totalJobs: number;
}> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('vendor_portal_configs')
    .select('success_count, failure_count, last_used_at')
    .eq('id', configId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return {
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      totalJobs: 0,
    };
  }

  const successCount = data.success_count || 0;
  const failureCount = data.failure_count || 0;
  const totalJobs = successCount + failureCount;

  return {
    successCount,
    failureCount,
    successRate: totalJobs > 0 ? successCount / totalJobs : 0,
    lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
    totalJobs,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToPortalConfig(row: Record<string, unknown>): VendorPortalConfig {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    portalName: row.portal_name as string,
    portalType: row.portal_type as VendorPortalConfig['portalType'],
    baseUrl: row.base_url as string,
    loginUrl: row.login_url as string | undefined,
    orderListUrl: row.order_list_url as string | undefined,
    credentialName: row.credential_name as string,
    isActive: row.is_active as boolean,
    selectors: row.selectors as PortalSelectors,
    workflows: row.workflows as WorkflowDefinition[],
    rateLimits: row.rate_limits as RateLimits,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string) : undefined,
    successCount: row.success_count as number,
    failureCount: row.failure_count as number,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// Re-export portal-specific utilities
export { valuetracPortalConfig, getValuetracUrls, parseValuetracStatus } from './valuetrac';
export {
  mercuryNetworkPortalConfig,
  getMercuryNetworkUrls,
  parseMercuryNetworkStatus,
} from './mercury-network';
export { genericPortalConfig, buildPortalConfig } from './generic';
