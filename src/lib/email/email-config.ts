/**
 * Email Configuration Service
 *
 * Manages email sending modes and rollout controls:
 * - dry_run: Log only, no actual send
 * - internal_only: Send only to approved domains/emails
 * - limited_live: Send with strict per-tenant caps
 * - live: Full production sending
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/agent/agent-config';

// ============================================================================
// Types
// ============================================================================

export type EmailSendMode = 'dry_run' | 'internal_only' | 'limited_live' | 'live';

export interface EmailConfig {
  sendMode: EmailSendMode;
  internalDomains: string[];
  internalEmails: string[];
  maxEmailsPerHour: number;
  maxEmailsPerDay: number;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
}

export interface EmailSendCheck {
  allowed: boolean;
  mode: EmailSendMode;
  reason?: string;
  shouldSimulate: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  sendMode: 'dry_run', // Safe default
  internalDomains: ['roiappraise.com', 'roiappraisalgroup.com'],
  internalEmails: [],
  maxEmailsPerHour: 20,
  maxEmailsPerDay: 100,
  fromEmail: 'admin@roiappraise.com',
  fromName: 'ROI Appraisal Group',
  replyToEmail: 'admin@roiappraise.com',
};

// ============================================================================
// Environment-based Override
// ============================================================================

/**
 * Get send mode from environment variable
 * Allows emergency override without database changes
 */
export function getEnvSendMode(): EmailSendMode | null {
  const mode = process.env.EMAIL_SEND_MODE;
  if (mode && ['dry_run', 'internal_only', 'limited_live', 'live'].includes(mode)) {
    return mode as EmailSendMode;
  }
  return null;
}

/**
 * Check if email sending is globally disabled
 */
export function isEmailSendingDisabled(): boolean {
  return process.env.EMAIL_SEND_DISABLED === 'true';
}

// ============================================================================
// Configuration Retrieval
// ============================================================================

/**
 * Get email configuration for a tenant
 */
export async function getEmailConfig(tenantId: string): Promise<EmailConfig> {
  const supabase = createServiceRoleClient();

  // Check for environment override first
  const envMode = getEnvSendMode();

  // Get tenant-specific settings
  const { data: tenant } = await supabase
    .from('tenants')
    .select('agent_settings')
    .eq('id', tenantId)
    .single();

  const settings = tenant?.agent_settings as Record<string, unknown> | null;

  // Build config with defaults
  const config: EmailConfig = {
    sendMode: envMode || (settings?.email_send_mode as EmailSendMode) || DEFAULT_EMAIL_CONFIG.sendMode,
    internalDomains: (settings?.internal_email_domains as string[]) || DEFAULT_EMAIL_CONFIG.internalDomains,
    internalEmails: (settings?.internal_email_addresses as string[]) || DEFAULT_EMAIL_CONFIG.internalEmails,
    maxEmailsPerHour: (settings?.max_emails_per_hour as number) || DEFAULT_EMAIL_CONFIG.maxEmailsPerHour,
    maxEmailsPerDay: (settings?.max_emails_per_day as number) || DEFAULT_EMAIL_CONFIG.maxEmailsPerDay,
    fromEmail: (settings?.from_email as string) || DEFAULT_EMAIL_CONFIG.fromEmail,
    fromName: (settings?.from_name as string) || DEFAULT_EMAIL_CONFIG.fromName,
    replyToEmail: (settings?.reply_to_email as string) || DEFAULT_EMAIL_CONFIG.replyToEmail,
  };

  return config;
}

// ============================================================================
// Send Permission Check
// ============================================================================

/**
 * Check if an email can be sent based on current mode and limits
 */
export async function checkEmailSendPermission(
  tenantId: string,
  recipientEmail: string
): Promise<EmailSendCheck> {
  // Check global disable first
  if (isEmailSendingDisabled()) {
    return {
      allowed: false,
      mode: 'dry_run',
      reason: 'Email sending is globally disabled (EMAIL_SEND_DISABLED=true)',
      shouldSimulate: true,
    };
  }

  const config = await getEmailConfig(tenantId);

  // DRY_RUN mode - always simulate
  if (config.sendMode === 'dry_run') {
    return {
      allowed: true,
      mode: 'dry_run',
      reason: 'Dry-run mode: email will be logged but not sent',
      shouldSimulate: true,
    };
  }

  // INTERNAL_ONLY mode - check recipient domain/email
  if (config.sendMode === 'internal_only') {
    const recipientDomain = recipientEmail.split('@')[1]?.toLowerCase();
    const recipientLower = recipientEmail.toLowerCase();

    const isInternalDomain = config.internalDomains.some(
      (d) => recipientDomain === d.toLowerCase()
    );
    const isInternalEmail = config.internalEmails.some(
      (e) => recipientLower === e.toLowerCase()
    );

    if (!isInternalDomain && !isInternalEmail) {
      return {
        allowed: false,
        mode: 'internal_only',
        reason: `Internal-only mode: ${recipientEmail} is not in approved list`,
        shouldSimulate: true,
      };
    }

    // Check rate limits even for internal
    const rateCheck = await checkRateLimit(tenantId, 'email_send', config.maxEmailsPerHour);
    if (!rateCheck.allowed) {
      return {
        allowed: false,
        mode: 'internal_only',
        reason: `Rate limit exceeded: ${rateCheck.currentCount}/${rateCheck.maxAllowed} emails/hour`,
        shouldSimulate: true,
      };
    }

    return {
      allowed: true,
      mode: 'internal_only',
      shouldSimulate: false,
    };
  }

  // LIMITED_LIVE mode - strict rate limits
  if (config.sendMode === 'limited_live') {
    const rateCheck = await checkRateLimit(tenantId, 'email_send', config.maxEmailsPerHour);
    if (!rateCheck.allowed) {
      return {
        allowed: false,
        mode: 'limited_live',
        reason: `Rate limit exceeded: ${rateCheck.currentCount}/${rateCheck.maxAllowed} emails/hour`,
        shouldSimulate: true,
      };
    }

    return {
      allowed: true,
      mode: 'limited_live',
      shouldSimulate: false,
    };
  }

  // LIVE mode - check rate limits but allow
  if (config.sendMode === 'live') {
    const rateCheck = await checkRateLimit(tenantId, 'email_send', config.maxEmailsPerHour);
    if (!rateCheck.allowed) {
      // In live mode, still block if rate limited
      return {
        allowed: false,
        mode: 'live',
        reason: `Rate limit exceeded: ${rateCheck.currentCount}/${rateCheck.maxAllowed} emails/hour`,
        shouldSimulate: false,
      };
    }

    return {
      allowed: true,
      mode: 'live',
      shouldSimulate: false,
    };
  }

  // Fallback - should never reach here
  return {
    allowed: false,
    mode: 'dry_run',
    reason: 'Unknown send mode',
    shouldSimulate: true,
  };
}

// ============================================================================
// Gmail Connection Status
// ============================================================================

export type GmailConnectionStatus =
  | 'connected'
  | 'needs_auth'
  | 'token_expired'
  | 'revoked'
  | 'not_configured';

export interface GmailStatus {
  status: GmailConnectionStatus;
  accountEmail: string | null;
  lastSyncAt: string | null;
  syncEnabled: boolean;
  tokenExpiresAt: string | null;
}

/**
 * Get Gmail connection status for a tenant/user
 */
export async function getGmailConnectionStatus(
  tenantId: string,
  userId: string
): Promise<GmailStatus> {
  const supabase = createServiceRoleClient();

  // Get OAuth token
  const { data: tokens } = await supabase
    .from('oauth_tokens')
    .select('account_email, expires_at, refresh_token, updated_at')
    .eq('org_id', userId)
    .eq('provider', 'google')
    .order('updated_at', { ascending: false })
    .limit(1);

  const token = tokens?.[0];

  // Get sync state
  const { data: syncState } = await supabase
    .from('gmail_sync_state')
    .select('is_enabled, last_sync_at')
    .eq('tenant_id', tenantId)
    .single();

  // Determine status
  if (!token) {
    return {
      status: 'not_configured',
      accountEmail: null,
      lastSyncAt: null,
      syncEnabled: false,
      tokenExpiresAt: null,
    };
  }

  const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
  const hasRefreshToken = !!token.refresh_token;

  let status: GmailConnectionStatus;
  if (isExpired && !hasRefreshToken) {
    status = 'revoked'; // Token expired and can't refresh
  } else if (isExpired) {
    status = 'token_expired'; // Will auto-refresh on next use
  } else {
    status = 'connected';
  }

  return {
    status,
    accountEmail: token.account_email,
    lastSyncAt: syncState?.last_sync_at || null,
    syncEnabled: syncState?.is_enabled || false,
    tokenExpiresAt: token.expires_at,
  };
}

// ============================================================================
// Configuration Update
// ============================================================================

/**
 * Update email send mode for a tenant
 */
export async function updateEmailSendMode(
  tenantId: string,
  mode: EmailSendMode,
  updatedBy: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('tenants')
    .update({
      agent_settings: supabase.rpc('jsonb_set_nested', {
        target: 'agent_settings',
        path: ['email_send_mode'],
        value: JSON.stringify(mode),
      }),
    })
    .eq('id', tenantId);

  if (error) {
    // Fallback: direct JSONB update
    const { data: tenant } = await supabase
      .from('tenants')
      .select('agent_settings')
      .eq('id', tenantId)
      .single();

    const currentSettings = (tenant?.agent_settings as Record<string, unknown>) || {};
    const newSettings = { ...currentSettings, email_send_mode: mode };

    const { error: updateError } = await supabase
      .from('tenants')
      .update({ agent_settings: newSettings })
      .eq('id', tenantId);

    if (updateError) {
      console.error('[EmailConfig] Failed to update send mode:', updateError);
      return false;
    }
  }

  console.log(`[EmailConfig] Send mode updated to '${mode}' for tenant ${tenantId} by ${updatedBy}`);
  return true;
}

/**
 * Update internal email allowlist for a tenant
 */
export async function updateInternalAllowlist(
  tenantId: string,
  domains: string[],
  emails: string[]
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('agent_settings')
    .eq('id', tenantId)
    .single();

  const currentSettings = (tenant?.agent_settings as Record<string, unknown>) || {};
  const newSettings = {
    ...currentSettings,
    internal_email_domains: domains,
    internal_email_addresses: emails,
  };

  const { error } = await supabase
    .from('tenants')
    .update({ agent_settings: newSettings })
    .eq('id', tenantId);

  if (error) {
    console.error('[EmailConfig] Failed to update allowlist:', error);
    return false;
  }

  return true;
}
