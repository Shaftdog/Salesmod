/**
 * Agent Configuration Service
 *
 * Provides centralized control over the autonomous agent system:
 * - Global kill switch (env var + database)
 * - Per-tenant enable/disable
 * - Rate limiting
 * - Configuration management
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface AgentGlobalConfig {
  globalEnabled: boolean;
  killSwitchReason: string | null;
  killSwitchActivatedAt: string | null;
  killSwitchActivatedBy: string | null;
  maxConcurrentTenants: number;
  defaultTenantEnabled: boolean;
}

export interface TenantAgentSettings {
  enabled: boolean;
  disabledReason: string | null;
  disabledAt: string | null;
  disabledBy: string | null;
  maxActionsPerCycle: number;
  maxEmailsPerHour: number;
  maxResearchPerHour: number;
  allowedActionTypes: string[];
}

export interface RateLimitStatus {
  actionType: string;
  currentCount: number;
  maxAllowed: number;
  remaining: number;
  windowResetsAt: Date;
}

export interface AgentStatus {
  globalEnabled: boolean;
  tenantEnabled: boolean;
  effectiveEnabled: boolean;
  killSwitchActive: boolean;
  killSwitchReason: string | null;
  rateLimits: RateLimitStatus[];
}

// ============================================================================
// Environment Variable Kill Switch
// ============================================================================

/**
 * Check if agent is disabled via environment variable
 * This is the fastest way to disable all agent activity
 */
export function isAgentKilledByEnv(): boolean {
  const killSwitch = process.env.AGENT_KILL_SWITCH;
  return killSwitch === 'true' || killSwitch === '1';
}

/**
 * Get the reason for env-based kill switch (if set)
 */
export function getEnvKillSwitchReason(): string | null {
  return process.env.AGENT_KILL_SWITCH_REASON || null;
}

// ============================================================================
// Global Configuration
// ============================================================================

/**
 * Get the global agent configuration from database
 */
export async function getGlobalConfig(): Promise<AgentGlobalConfig> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'agent_config')
    .single();

  if (error || !data) {
    // Return defaults if config not found
    return {
      globalEnabled: true,
      killSwitchReason: null,
      killSwitchActivatedAt: null,
      killSwitchActivatedBy: null,
      maxConcurrentTenants: 10,
      defaultTenantEnabled: true,
    };
  }

  const config = data.value as Record<string, unknown>;

  return {
    globalEnabled: config.global_enabled as boolean ?? true,
    killSwitchReason: config.kill_switch_reason as string | null,
    killSwitchActivatedAt: config.kill_switch_activated_at as string | null,
    killSwitchActivatedBy: config.kill_switch_activated_by as string | null,
    maxConcurrentTenants: config.max_concurrent_tenants as number ?? 10,
    defaultTenantEnabled: config.default_tenant_enabled as boolean ?? true,
  };
}

/**
 * Check if agent is globally enabled (both env and database)
 */
export async function isAgentGloballyEnabled(): Promise<{
  enabled: boolean;
  reason: string | null;
  source: 'env' | 'database' | null;
}> {
  // Check environment variable first (fastest)
  if (isAgentKilledByEnv()) {
    return {
      enabled: false,
      reason: getEnvKillSwitchReason() || 'Disabled via AGENT_KILL_SWITCH environment variable',
      source: 'env',
    };
  }

  // Check database kill switch
  const config = await getGlobalConfig();

  if (!config.globalEnabled) {
    return {
      enabled: false,
      reason: config.killSwitchReason || 'Global kill switch activated',
      source: 'database',
    };
  }

  return {
    enabled: true,
    reason: null,
    source: null,
  };
}

// ============================================================================
// Per-Tenant Configuration
// ============================================================================

/**
 * Get agent settings for a specific tenant
 */
export async function getTenantAgentSettings(tenantId: string): Promise<TenantAgentSettings | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('tenants')
    .select('agent_enabled, agent_settings')
    .eq('id', tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  const settings = data.agent_settings as Record<string, unknown> | null;

  return {
    enabled: data.agent_enabled ?? true,
    disabledReason: settings?.disabled_reason as string | null,
    disabledAt: settings?.disabled_at as string | null,
    disabledBy: settings?.disabled_by as string | null,
    maxActionsPerCycle: settings?.max_actions_per_cycle as number ?? 50,
    maxEmailsPerHour: settings?.max_emails_per_hour as number ?? 20,
    maxResearchPerHour: settings?.max_research_per_hour as number ?? 5,
    allowedActionTypes: settings?.allowed_action_types as string[] ?? ['research', 'send_email', 'follow_up', 'create_task'],
  };
}

/**
 * Check if agent is enabled for a specific tenant
 * Checks both global and tenant-specific settings
 */
export async function isAgentEnabledForTenant(tenantId: string): Promise<{
  enabled: boolean;
  reason: string | null;
  globalEnabled: boolean;
  tenantEnabled: boolean;
}> {
  // Check global first
  const globalStatus = await isAgentGloballyEnabled();

  if (!globalStatus.enabled) {
    return {
      enabled: false,
      reason: globalStatus.reason,
      globalEnabled: false,
      tenantEnabled: true, // Unknown, but global is off so doesn't matter
    };
  }

  // Check tenant-specific
  const tenantSettings = await getTenantAgentSettings(tenantId);

  if (!tenantSettings) {
    return {
      enabled: false,
      reason: 'Tenant not found or settings unavailable',
      globalEnabled: true,
      tenantEnabled: false,
    };
  }

  if (!tenantSettings.enabled) {
    return {
      enabled: false,
      reason: tenantSettings.disabledReason || 'Agent disabled for this tenant',
      globalEnabled: true,
      tenantEnabled: false,
    };
  }

  return {
    enabled: true,
    reason: null,
    globalEnabled: true,
    tenantEnabled: true,
  };
}

// ============================================================================
// Kill Switch Management
// ============================================================================

/**
 * Activate the global kill switch
 */
export async function activateKillSwitch(reason: string, activatedBy: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.rpc('activate_agent_kill_switch', {
    p_reason: reason,
    p_activated_by: activatedBy,
  });

  if (error) {
    console.error('[AgentConfig] Failed to activate kill switch:', error);
    return false;
  }

  console.log(`[AgentConfig] Kill switch ACTIVATED by ${activatedBy}: ${reason}`);
  return true;
}

/**
 * Deactivate the global kill switch
 */
export async function deactivateKillSwitch(deactivatedBy: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.rpc('deactivate_agent_kill_switch', {
    p_deactivated_by: deactivatedBy,
  });

  if (error) {
    console.error('[AgentConfig] Failed to deactivate kill switch:', error);
    return false;
  }

  console.log(`[AgentConfig] Kill switch DEACTIVATED by ${deactivatedBy}`);
  return true;
}

/**
 * Disable agent for a specific tenant
 */
export async function disableAgentForTenant(
  tenantId: string,
  reason: string,
  disabledBy: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.rpc('disable_agent_for_tenant', {
    p_tenant_id: tenantId,
    p_reason: reason,
    p_disabled_by: disabledBy,
  });

  if (error) {
    console.error(`[AgentConfig] Failed to disable agent for tenant ${tenantId}:`, error);
    return false;
  }

  console.log(`[AgentConfig] Agent DISABLED for tenant ${tenantId} by ${disabledBy}: ${reason}`);
  return true;
}

/**
 * Enable agent for a specific tenant
 */
export async function enableAgentForTenant(
  tenantId: string,
  enabledBy: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.rpc('enable_agent_for_tenant', {
    p_tenant_id: tenantId,
    p_enabled_by: enabledBy,
  });

  if (error) {
    console.error(`[AgentConfig] Failed to enable agent for tenant ${tenantId}:`, error);
    return false;
  }

  console.log(`[AgentConfig] Agent ENABLED for tenant ${tenantId} by ${enabledBy}`);
  return true;
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Default rate limits by action type
 */
export const DEFAULT_RATE_LIMITS: Record<string, number> = {
  email_send: 20,
  research: 5,
  sandbox_run: 10,
  follow_up: 30,
  create_task: 20,
  create_deal: 10,
};

/**
 * Check if an action is within rate limits
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  tenantId: string,
  actionType: string,
  maxAllowed?: number
): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number }> {
  const supabase = createServiceRoleClient();
  const limit = maxAllowed ?? DEFAULT_RATE_LIMITS[actionType] ?? 50;

  const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
    p_tenant_id: tenantId,
    p_action_type: actionType,
    p_max_allowed: limit,
  });

  if (error) {
    console.error('[AgentConfig] Rate limit check failed:', error);
    // FAIL CLOSED - deny action on database errors for security
    // This prevents bypassing rate limits by triggering database errors
    return { allowed: false, currentCount: limit, maxAllowed: limit };
  }

  // Get current count for response
  const status = await getRateLimitStatus(tenantId);
  const actionStatus = status.find(s => s.actionType === actionType);

  return {
    allowed: data === true,
    currentCount: actionStatus?.currentCount ?? 1,
    maxAllowed: limit,
  };
}

/**
 * Get current rate limit status for a tenant
 */
export async function getRateLimitStatus(tenantId: string): Promise<RateLimitStatus[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc('get_rate_limit_status', {
    p_tenant_id: tenantId,
  });

  if (error || !data) {
    return [];
  }

  return data.map((row: Record<string, unknown>) => ({
    actionType: row.action_type as string,
    currentCount: row.current_count as number,
    maxAllowed: row.max_allowed as number,
    remaining: row.remaining as number,
    windowResetsAt: new Date(row.window_resets_at as string),
  }));
}

// ============================================================================
// Full Status Check
// ============================================================================

/**
 * Get full agent status for a tenant
 * Combines global, tenant, and rate limit information
 */
export async function getAgentStatus(tenantId: string): Promise<AgentStatus> {
  const [globalStatus, tenantStatus, rateLimits] = await Promise.all([
    isAgentGloballyEnabled(),
    getTenantAgentSettings(tenantId),
    getRateLimitStatus(tenantId),
  ]);

  const tenantEnabled = tenantStatus?.enabled ?? true;

  return {
    globalEnabled: globalStatus.enabled,
    tenantEnabled,
    effectiveEnabled: globalStatus.enabled && tenantEnabled,
    killSwitchActive: !globalStatus.enabled,
    killSwitchReason: globalStatus.reason,
    rateLimits,
  };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up old rate limit records
 */
export async function cleanupOldRateLimits(): Promise<number> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc('cleanup_old_rate_limits');

  if (error) {
    console.error('[AgentConfig] Failed to cleanup rate limits:', error);
    return 0;
  }

  return data ?? 0;
}
