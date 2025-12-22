/**
 * Agent Configuration and Rate Limiting Service
 *
 * Provides:
 * - Global kill switch
 * - Per-tenant agent enable/disable
 * - Rate limiting for agent actions
 * - Alerting for anomalies
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface AgentConfig {
  globalEnabled: boolean;
  tenantEnabled: boolean;
  maxActionsPerHour: number;
  maxEmailsPerHour: number;
  maxEmailsPerDay: number;
}

export interface RateLimitCheck {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  windowStart: string;
  windowEnd: string;
}

export interface AlertPayload {
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  tenantId: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export type AlertType =
  | 'email_volume_spike'
  | 'email_provider_failure'
  | 'gmail_quota_exceeded'
  | 'policy_block_spike'
  | 'rate_limit_exceeded'
  | 'agent_error'
  | 'kill_switch_activated';

// ============================================================================
// Configuration Defaults
// ============================================================================

const DEFAULT_CONFIG: Omit<AgentConfig, 'globalEnabled' | 'tenantEnabled'> = {
  maxActionsPerHour: 100,
  maxEmailsPerHour: 20,
  maxEmailsPerDay: 100,
};

// Alert thresholds
const ALERT_THRESHOLDS = {
  emailVolumeSpikePercent: 200, // 200% of normal = spike
  policyBlockSpikeCount: 10, // 10+ blocks in an hour = spike
  providerFailureCount: 5, // 5+ failures in 15 min = alert
};

// ============================================================================
// Kill Switch Check
// ============================================================================

/**
 * Check if agent is globally enabled
 */
export async function isAgentGloballyEnabled(): Promise<boolean> {
  // Check environment override first
  if (process.env.AGENT_KILL_SWITCH === 'true') {
    return false;
  }

  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'agent_config')
    .single();

  if (!data?.value) {
    return false; // Safe default: disabled if not configured
  }

  const config = data.value as Record<string, unknown>;
  return config.global_enabled === true;
}

/**
 * Check if agent is enabled for a specific tenant
 */
export async function isAgentEnabledForTenant(tenantId: string): Promise<boolean> {
  // Check global first
  const globalEnabled = await isAgentGloballyEnabled();
  if (!globalEnabled) {
    return false;
  }

  const supabase = createServiceRoleClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('agent_enabled, is_active')
    .eq('id', tenantId)
    .single();

  if (!tenant) {
    return false;
  }

  // Must be active and have agent enabled
  return tenant.is_active === true && tenant.agent_enabled === true;
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Check and increment rate limit for an action
 */
export async function checkRateLimit(
  tenantId: string,
  actionType: string,
  maxAllowed: number
): Promise<RateLimitCheck> {
  const supabase = createServiceRoleClient();

  // Try to use database function if available
  const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
    p_tenant_id: tenantId,
    p_action_type: actionType,
    p_max_allowed: maxAllowed,
  });

  if (!error && typeof data === 'boolean') {
    // Function exists and worked - get current count
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setMinutes(0, 0, 0);
    const windowEnd = new Date(windowStart);
    windowEnd.setHours(windowEnd.getHours() + 1);

    const { data: record } = await supabase
      .from('agent_rate_limits')
      .select('action_count')
      .eq('tenant_id', tenantId)
      .eq('action_type', actionType)
      .gte('window_start', windowStart.toISOString())
      .single();

    return {
      allowed: data,
      currentCount: record?.action_count || 1,
      maxAllowed,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
    };
  }

  // Fallback: Fail closed if database function unavailable
  // This prevents race conditions in the read-then-write pattern
  console.warn('[AgentConfig] Rate limit function unavailable, failing closed for safety');

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setMinutes(0, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setHours(windowEnd.getHours() + 1);

  return {
    allowed: false,
    currentCount: 0,
    maxAllowed,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
  };
}

// ============================================================================
// Alerting
// ============================================================================

/**
 * Record an alert for monitoring and potential notification
 */
export async function recordAlert(payload: AlertPayload): Promise<void> {
  const supabase = createServiceRoleClient();

  // Log to console with structured format
  const logLevel = payload.severity === 'critical' ? 'error' : payload.severity === 'warning' ? 'warn' : 'info';
  console[logLevel](`[Alert:${payload.type}] ${payload.message}`, {
    tenantId: payload.tenantId,
    severity: payload.severity,
    ...payload.metadata,
  });

  // Store in database for dashboards and analysis
  try {
    await supabase.from('agent_alerts').insert({
      tenant_id: payload.tenantId,
      alert_type: payload.type,
      severity: payload.severity,
      message: payload.message,
      metadata: payload.metadata || {},
      created_at: new Date().toISOString(),
    });
  } catch {
    // Table may not exist yet - just log
    console.warn('[Alert] Could not store alert in database, table may not exist');
  }

  // Send notification for critical alerts
  if (payload.severity === 'critical') {
    await sendCriticalAlertNotification(payload);
  }
}

/**
 * Send notification for critical alerts (email/webhook)
 */
async function sendCriticalAlertNotification(payload: AlertPayload): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[${payload.severity.toUpperCase()}] ${payload.type}: ${payload.message}`,
          tenantId: payload.tenantId,
          timestamp: new Date().toISOString(),
          ...payload.metadata,
        }),
      });
    } catch (err) {
      console.error('[Alert] Failed to send webhook notification:', err);
    }
  }

  // Could also send email notification here
  // await sendAlertEmail(payload);
}

/**
 * Check for email volume spike
 */
export async function checkEmailVolumeSpike(
  tenantId: string,
  currentHourCount: number
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // Get average emails per hour for this tenant (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await supabase
    .from('agent_rate_limits')
    .select('action_count')
    .eq('tenant_id', tenantId)
    .eq('action_type', 'email_send')
    .gte('window_start', sevenDaysAgo.toISOString());

  if (!data || data.length < 24) {
    // Not enough data for comparison
    return false;
  }

  const avgCount = data.reduce((sum, r) => sum + r.action_count, 0) / data.length;
  const spikeThreshold = avgCount * (ALERT_THRESHOLDS.emailVolumeSpikePercent / 100);

  if (currentHourCount > spikeThreshold && avgCount > 5) {
    await recordAlert({
      type: 'email_volume_spike',
      severity: 'warning',
      tenantId,
      message: `Email volume spike detected: ${currentHourCount} emails this hour vs ${avgCount.toFixed(1)} avg`,
      metadata: {
        currentCount: currentHourCount,
        averageCount: avgCount,
        spikePercent: ((currentHourCount / avgCount) * 100).toFixed(0),
      },
    });
    return true;
  }

  return false;
}

/**
 * Record email provider failure for alerting
 */
export async function recordEmailProviderFailure(
  tenantId: string,
  errorType: string,
  errorMessage: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  // Record the failure
  try {
    await supabase.from('email_provider_failures').insert({
      tenant_id: tenantId,
      error_type: errorType,
      error_message: errorMessage,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Table may not exist - log the error
    console.error('[AgentConfig] Failed to record email provider failure:', error);
  }

  // Check for failure spike (last 15 minutes)
  const fifteenMinAgo = new Date();
  fifteenMinAgo.setMinutes(fifteenMinAgo.getMinutes() - 15);

  const { count } = await supabase
    .from('email_provider_failures')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', fifteenMinAgo.toISOString());

  if ((count || 0) >= ALERT_THRESHOLDS.providerFailureCount) {
    await recordAlert({
      type: 'email_provider_failure',
      severity: 'critical',
      tenantId,
      message: `Repeated email provider failures: ${count} failures in last 15 minutes`,
      metadata: {
        failureCount: count,
        latestError: errorMessage,
        errorType,
      },
    });
  }
}

/**
 * Record policy block for alerting
 */
export async function recordPolicyBlock(
  tenantId: string,
  policyType: string,
  reason: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  // Record the block
  try {
    await supabase.from('agent_policy_violations').insert({
      tenant_id: tenantId,
      violation_type: policyType,
      details: { reason },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Table may not exist
  }

  // Check for block spike (last hour)
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const { count } = await supabase
    .from('agent_policy_violations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', oneHourAgo.toISOString());

  if ((count || 0) >= ALERT_THRESHOLDS.policyBlockSpikeCount) {
    await recordAlert({
      type: 'policy_block_spike',
      severity: 'warning',
      tenantId,
      message: `Policy block spike: ${count} blocks in last hour`,
      metadata: {
        blockCount: count,
        latestReason: reason,
        policyType,
      },
    });
  }
}

/**
 * Record Gmail quota/rate limit error
 */
export async function recordGmailQuotaError(
  tenantId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  await recordAlert({
    type: 'gmail_quota_exceeded',
    severity: 'warning',
    tenantId,
    message: `Gmail quota/rate limit error: ${errorCode}`,
    metadata: {
      errorCode,
      errorMessage,
    },
  });
}

// ============================================================================
// Get Agent Config
// ============================================================================

/**
 * Get full agent configuration for a tenant
 */
export async function getAgentConfig(tenantId: string): Promise<AgentConfig> {
  const supabase = createServiceRoleClient();

  // Check global enabled
  const globalEnabled = await isAgentGloballyEnabled();

  // Get tenant settings
  const { data: tenant } = await supabase
    .from('tenants')
    .select('agent_enabled, agent_settings')
    .eq('id', tenantId)
    .single();

  const tenantEnabled = globalEnabled && tenant?.agent_enabled === true;
  const settings = tenant?.agent_settings as Record<string, unknown> | null;

  return {
    globalEnabled,
    tenantEnabled,
    maxActionsPerHour: (settings?.max_actions_per_hour as number) || DEFAULT_CONFIG.maxActionsPerHour,
    maxEmailsPerHour: (settings?.max_emails_per_hour as number) || DEFAULT_CONFIG.maxEmailsPerHour,
    maxEmailsPerDay: (settings?.max_emails_per_day as number) || DEFAULT_CONFIG.maxEmailsPerDay,
  };
}
