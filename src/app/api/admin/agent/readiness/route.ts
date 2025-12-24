/**
 * Agent Readiness Check Endpoint
 *
 * Returns a comprehensive status report of all go-live prerequisites:
 * - Global kill switch state
 * - Tenant agent_enabled
 * - Gmail OAuth connected
 * - Email provider configured
 * - Email send mode and allowlist
 * - Rate limits active
 * - Last cycle success/failure
 *
 * GET /api/admin/agent/readiness?tenant=<id>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getEmailConfig, getGmailConnectionStatus, isEmailSendingDisabled, getEnvSendMode } from '@/lib/email/email-config';
import { getAgentConfig, isAgentGloballyEnabled } from '@/lib/agent/agent-config';

// ============================================================================
// Types
// ============================================================================

type CheckStatus = 'PASS' | 'FAIL' | 'WARN';

interface ReadinessCheck {
  name: string;
  status: CheckStatus;
  value: string | number | boolean | null;
  details?: string;
  fixSteps?: string;
}

interface ReadinessReport {
  tenantId: string;
  timestamp: string;
  overallStatus: CheckStatus;
  checks: ReadinessCheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

// ============================================================================
// Main Handler
// ============================================================================

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  // Verify admin role
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  // Get tenant ID from query or use user's tenant
  const searchParams = request.nextUrl.searchParams;
  const tenantId = searchParams.get('tenant') || profile.tenant_id;

  // Super_admin can query any tenant; regular admin only their own
  if (profile.role !== 'super_admin' && tenantId !== profile.tenant_id) {
    return NextResponse.json(
      { error: 'Cannot query other tenants without super_admin role' },
      { status: 403 }
    );
  }

  const serviceClient = createServiceRoleClient();

  // Gather all checks
  const checks: ReadinessCheck[] = [];

  // ============================================================================
  // 1. Global Kill Switch
  // ============================================================================
  const globalEnabled = await isAgentGloballyEnabled();
  const { data: sysConfig } = await serviceClient
    .from('system_config')
    .select('value')
    .eq('key', 'agent_config')
    .single();

  const killSwitchReason = (sysConfig?.value as any)?.kill_switch_reason || null;

  checks.push({
    name: 'Global Kill Switch',
    status: globalEnabled ? 'PASS' : 'FAIL',
    value: globalEnabled,
    details: globalEnabled ? 'Agent is globally enabled' : `Disabled: ${killSwitchReason || 'No reason specified'}`,
    fixSteps: globalEnabled ? undefined : 'POST /api/admin/agent with action: "enable_global" (requires super_admin)',
  });

  // ============================================================================
  // 2. Tenant Agent Enabled
  // ============================================================================
  const { data: tenant } = await serviceClient
    .from('tenants')
    .select('agent_enabled, is_active, agent_settings, name')
    .eq('id', tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const tenantEnabled = tenant.is_active && tenant.agent_enabled;
  checks.push({
    name: 'Tenant Agent Enabled',
    status: tenantEnabled ? 'PASS' : 'FAIL',
    value: tenantEnabled,
    details: tenantEnabled
      ? `Agent enabled for tenant: ${tenant.name || tenantId}`
      : `Agent disabled for tenant (is_active: ${tenant.is_active}, agent_enabled: ${tenant.agent_enabled})`,
    fixSteps: tenantEnabled ? undefined : 'POST /api/admin/agent with action: "enable_tenant"',
  });

  // ============================================================================
  // 3. Gmail OAuth Connected
  // ============================================================================
  const gmailStatus = await getGmailConnectionStatus(tenantId, user.id);
  const gmailOk = gmailStatus.status === 'connected';

  checks.push({
    name: 'Gmail OAuth Connected',
    status: gmailOk ? 'PASS' : 'FAIL',
    value: gmailStatus.status,
    details: gmailOk
      ? `Connected as: ${gmailStatus.accountEmail}`
      : `Gmail status: ${gmailStatus.status}`,
    fixSteps: gmailOk ? undefined :
      gmailStatus.status === 'not_configured'
        ? 'Navigate to Settings → Integrations → Connect Gmail, then authenticate with Google OAuth'
        : gmailStatus.status === 'token_expired'
          ? 'Gmail token expired. Re-authenticate at Settings → Integrations → Gmail'
          : 'Revoked access. Remove and re-add Gmail integration at Settings → Integrations',
  });

  // ============================================================================
  // 4. Gmail Poller Last Success
  // ============================================================================
  const { data: gmailSyncState } = await serviceClient
    .from('gmail_sync_state')
    .select('last_sync_at, is_enabled')
    .eq('tenant_id', tenantId)
    .single();

  const lastSyncAt = gmailSyncState?.last_sync_at;
  const syncEnabled = gmailSyncState?.is_enabled;
  const lastSyncRecent = lastSyncAt && (Date.now() - new Date(lastSyncAt).getTime()) < 15 * 60 * 1000; // Within 15 min

  checks.push({
    name: 'Gmail Poller Last Success',
    status: lastSyncRecent ? 'PASS' : syncEnabled ? 'WARN' : 'FAIL',
    value: lastSyncAt,
    details: lastSyncRecent
      ? `Last sync: ${new Date(lastSyncAt).toISOString()}`
      : syncEnabled
        ? `Sync enabled but last success was ${lastSyncAt || 'never'}. May be stale.`
        : 'Gmail sync is disabled',
    fixSteps: lastSyncRecent ? undefined :
      'Verify Gmail cron is running (/api/cron/gmail). Check Vercel logs for errors.',
  });

  // ============================================================================
  // 5. Email Provider Configured
  // ============================================================================
  const resendApiKey = process.env.RESEND_API_KEY;
  const providerConfigured = !!resendApiKey && resendApiKey.startsWith('re_');

  checks.push({
    name: 'Email Provider Configured',
    status: providerConfigured ? 'PASS' : 'FAIL',
    value: providerConfigured,
    details: providerConfigured
      ? 'RESEND_API_KEY is configured'
      : 'RESEND_API_KEY is missing or invalid',
    fixSteps: providerConfigured ? undefined :
      'Set RESEND_API_KEY environment variable in Vercel dashboard. Get key from https://resend.com/api-keys',
  });

  // ============================================================================
  // 6. Email Send Mode
  // ============================================================================
  const emailConfig = await getEmailConfig(tenantId);
  const envMode = getEnvSendMode();
  const sendDisabled = isEmailSendingDisabled();

  let modeStatus: CheckStatus = 'PASS';
  let modeDetails = '';

  if (sendDisabled) {
    modeStatus = 'FAIL';
    modeDetails = 'Email sending is globally disabled (EMAIL_SEND_DISABLED=true)';
  } else if (emailConfig.sendMode === 'dry_run') {
    modeStatus = 'WARN';
    modeDetails = 'dry_run mode: emails will be logged but not sent';
  } else if (emailConfig.sendMode === 'internal_only') {
    modeStatus = 'WARN';
    modeDetails = `internal_only mode: emails only sent to ${emailConfig.internalDomains.join(', ')}`;
  } else if (emailConfig.sendMode === 'limited_live') {
    modeStatus = 'PASS';
    modeDetails = 'limited_live mode: strict per-tenant caps enforced';
  } else if (emailConfig.sendMode === 'live') {
    modeStatus = 'PASS';
    modeDetails = 'live mode: full production sending';
  }

  checks.push({
    name: 'Email Send Mode',
    status: modeStatus,
    value: emailConfig.sendMode,
    details: envMode ? `${modeDetails} (from ENV override)` : modeDetails,
    fixSteps: modeStatus === 'FAIL'
      ? 'Set EMAIL_SEND_DISABLED=false in environment'
      : modeStatus === 'WARN' && emailConfig.sendMode === 'dry_run'
        ? 'Set EMAIL_SEND_MODE=internal_only to begin testing with allowlisted domains, then progress to limited_live'
        : undefined,
  });

  // ============================================================================
  // 7. Internal Allowlist (when internal_only)
  // ============================================================================
  if (emailConfig.sendMode === 'internal_only') {
    const hasAllowlist = emailConfig.internalDomains.length > 0 || emailConfig.internalEmails.length > 0;

    checks.push({
      name: 'Internal Allowlist Configured',
      status: hasAllowlist ? 'PASS' : 'FAIL',
      value: hasAllowlist,
      details: hasAllowlist
        ? `Domains: ${emailConfig.internalDomains.join(', ')} | Emails: ${emailConfig.internalEmails.join(', ') || 'none'}`
        : 'No internal domains or emails configured',
      fixSteps: hasAllowlist ? undefined :
        'Set EMAIL_INTERNAL_DOMAINS=yourdomain.com or update tenant.agent_settings.internal_email_domains',
    });
  }

  // ============================================================================
  // 8. Domain Verification (DKIM/SPF/DMARC)
  // ============================================================================
  // We can't automatically check this - mark as manual step
  checks.push({
    name: 'Domain Verification (DKIM/SPF/DMARC)',
    status: 'WARN',
    value: 'manual_check_required',
    details: 'Cannot automatically verify. Check Resend dashboard for domain verification status.',
    fixSteps: 'Go to https://resend.com/domains, add your sending domain, and configure DNS records (SPF, DKIM, DMARC)',
  });

  // ============================================================================
  // 9. Rate Limits Active
  // ============================================================================
  const agentConfig = await getAgentConfig(tenantId);
  const rateLimitsConfigured = agentConfig.maxEmailsPerHour > 0 &&
                                agentConfig.maxActionsPerHour > 0 &&
                                agentConfig.maxSandboxJobsPerHour > 0;

  checks.push({
    name: 'Rate Limits Active',
    status: rateLimitsConfigured ? 'PASS' : 'WARN',
    value: rateLimitsConfigured,
    details: `emails/hr: ${agentConfig.maxEmailsPerHour}, actions/hr: ${agentConfig.maxActionsPerHour}, sandbox/hr: ${agentConfig.maxSandboxJobsPerHour}, browser/hr: ${agentConfig.maxBrowserJobsPerHour}`,
    fixSteps: rateLimitsConfigured ? undefined :
      'Configure rate limits in tenant.agent_settings: max_emails_per_hour, max_actions_per_hour, etc.',
  });

  // ============================================================================
  // 10. Last Cycle Success
  // ============================================================================
  const { data: lastRuns } = await serviceClient
    .from('agent_runs')
    .select('status, error, created_at, cycle_number')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1);

  const lastRun = lastRuns?.[0];
  let cycleStatus: CheckStatus = 'WARN';
  let cycleDetails = 'No autonomous cycles have run yet';

  if (lastRun) {
    if (lastRun.status === 'completed') {
      cycleStatus = 'PASS';
      cycleDetails = `Last cycle #${lastRun.cycle_number} completed at ${lastRun.created_at}`;
    } else if (lastRun.status === 'failed') {
      cycleStatus = 'FAIL';
      cycleDetails = `Last cycle #${lastRun.cycle_number} failed: ${lastRun.error || 'Unknown error'}`;
    } else {
      cycleStatus = 'WARN';
      cycleDetails = `Last cycle #${lastRun.cycle_number} status: ${lastRun.status}`;
    }
  }

  checks.push({
    name: 'Last Cycle Success',
    status: cycleStatus,
    value: lastRun?.status || null,
    details: cycleDetails,
    fixSteps: cycleStatus === 'FAIL'
      ? 'Check Vercel logs for agent cron errors. Verify all prerequisites above are passing.'
      : cycleStatus === 'WARN' && !lastRun
        ? 'Agent cycle will run on next hourly cron. Ensure /api/cron/agent is configured in vercel.json.'
        : undefined,
  });

  // ============================================================================
  // Build Summary
  // ============================================================================
  const passed = checks.filter(c => c.status === 'PASS').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;
  const warnings = checks.filter(c => c.status === 'WARN').length;

  let overallStatus: CheckStatus = 'PASS';
  if (failed > 0) {
    overallStatus = 'FAIL';
  } else if (warnings > 0) {
    overallStatus = 'WARN';
  }

  const report: ReadinessReport = {
    tenantId,
    timestamp: new Date().toISOString(),
    overallStatus,
    checks,
    summary: { passed, failed, warnings },
  };

  return NextResponse.json(report);
}
