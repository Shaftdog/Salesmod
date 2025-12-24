/**
 * Agent Smoke Test Endpoint
 *
 * Runs safe validation checks without side effects:
 * - If Gmail not connected: returns FAIL + instructions
 * - If dry_run mode: generates email payload and logs it (no send)
 * - If internal_only: sends ONLY to configured internal test address
 *
 * POST /api/admin/agent/smoke-test?tenant=<id>
 * GET /api/admin/agent/smoke-test?tenant=<id> - Get latest smoke test results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getEmailConfig, getGmailConnectionStatus, checkEmailSendPermission } from '@/lib/email/email-config';
import { isAgentGloballyEnabled, getAgentConfig } from '@/lib/agent/agent-config';

// ============================================================================
// Types
// ============================================================================

type TestStatus = 'PASS' | 'FAIL' | 'SKIPPED';

interface SmokeTestResult {
  name: string;
  status: TestStatus;
  details: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

interface SmokeTestReport {
  tenantId: string;
  ranAt: string;
  status: 'PASS' | 'PARTIAL' | 'FAIL';
  tests: SmokeTestResult[];
  nextSteps?: string[];
}

// ============================================================================
// GET - Retrieve Latest Smoke Test Results
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

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const tenantId = searchParams.get('tenant') || profile.tenant_id;

  // Super_admin can query any tenant
  if (profile.role !== 'super_admin' && tenantId !== profile.tenant_id) {
    return NextResponse.json({ error: 'Cannot query other tenants' }, { status: 403 });
  }

  const serviceClient = createServiceRoleClient();

  // Get latest smoke test
  const { data: latestTests } = await serviceClient
    .from('agent_smoke_tests')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('ran_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    tenantId,
    tests: latestTests || [],
  });
}

// ============================================================================
// POST - Run Smoke Test
// ============================================================================

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role, email')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const tenantId = searchParams.get('tenant') || profile.tenant_id;

  // Super_admin can test any tenant
  if (profile.role !== 'super_admin' && tenantId !== profile.tenant_id) {
    return NextResponse.json({ error: 'Cannot test other tenants' }, { status: 403 });
  }

  const serviceClient = createServiceRoleClient();
  const tests: SmokeTestResult[] = [];
  const now = new Date().toISOString();

  // ============================================================================
  // Test 1: Global Agent Enabled
  // ============================================================================
  const globalEnabled = await isAgentGloballyEnabled();
  tests.push({
    name: 'Global Agent Enabled',
    status: globalEnabled ? 'PASS' : 'FAIL',
    details: globalEnabled ? 'Agent is globally enabled' : 'Agent is globally disabled (kill switch active)',
    timestamp: now,
  });

  // ============================================================================
  // Test 2: Tenant Agent Enabled
  // ============================================================================
  const { data: tenant } = await serviceClient
    .from('tenants')
    .select('agent_enabled, is_active, name')
    .eq('id', tenantId)
    .single();

  const tenantEnabled = tenant?.is_active && tenant?.agent_enabled;
  tests.push({
    name: 'Tenant Agent Enabled',
    status: tenantEnabled ? 'PASS' : 'FAIL',
    details: tenantEnabled
      ? `Agent enabled for: ${tenant?.name || tenantId}`
      : `Agent disabled (is_active: ${tenant?.is_active}, agent_enabled: ${tenant?.agent_enabled})`,
    timestamp: now,
  });

  // ============================================================================
  // Test 3: Gmail OAuth Status
  // ============================================================================
  const gmailStatus = await getGmailConnectionStatus(tenantId, user.id);
  tests.push({
    name: 'Gmail OAuth Status',
    status: gmailStatus.status === 'connected' ? 'PASS' : 'FAIL',
    details: gmailStatus.status === 'connected'
      ? `Connected as: ${gmailStatus.accountEmail}`
      : `Gmail status: ${gmailStatus.status}. Re-authenticate required.`,
    timestamp: now,
  });

  // ============================================================================
  // Test 4: Email Configuration
  // ============================================================================
  const emailConfig = await getEmailConfig(tenantId);
  tests.push({
    name: 'Email Configuration',
    status: 'PASS',
    details: `Mode: ${emailConfig.sendMode}, From: ${emailConfig.fromEmail}`,
    timestamp: now,
    payload: {
      sendMode: emailConfig.sendMode,
      fromEmail: emailConfig.fromEmail,
      maxEmailsPerHour: emailConfig.maxEmailsPerHour,
      internalDomains: emailConfig.internalDomains,
    },
  });

  // ============================================================================
  // Test 5: Email Send Permission Check (simulated)
  // ============================================================================
  // Use the admin's email as the test recipient (safe - it's the current user)
  const testRecipient = profile.email || 'test@internal.com';
  const sendPermission = await checkEmailSendPermission(tenantId, testRecipient);

  let emailTestStatus: TestStatus = 'PASS';
  let emailTestDetails = '';

  if (sendPermission.shouldSimulate) {
    if (emailConfig.sendMode === 'dry_run') {
      emailTestStatus = 'PASS';
      emailTestDetails = 'dry_run mode: Email would be logged (simulated successfully)';
    } else if (!sendPermission.allowed) {
      emailTestStatus = 'FAIL';
      emailTestDetails = `Email blocked: ${sendPermission.reason}`;
    } else {
      emailTestStatus = 'PASS';
      emailTestDetails = `Email would be simulated: ${sendPermission.reason || 'Simulation mode active'}`;
    }
  } else {
    if (sendPermission.allowed) {
      emailTestStatus = 'PASS';
      emailTestDetails = `Email would be sent to ${testRecipient} (mode: ${sendPermission.mode})`;
    } else {
      emailTestStatus = 'FAIL';
      emailTestDetails = `Email blocked: ${sendPermission.reason}`;
    }
  }

  // Generate sample email payload for dry_run modes
  const sampleEmailPayload = {
    to: testRecipient,
    from: emailConfig.fromEmail,
    subject: '[SMOKE TEST] Agent Email Validation',
    body: `This is a smoke test email from the agent system at ${now}. If you receive this, email sending is working correctly.`,
    mode: emailConfig.sendMode,
    wouldSend: sendPermission.allowed && !sendPermission.shouldSimulate,
  };

  tests.push({
    name: 'Email Send Permission',
    status: emailTestStatus,
    details: emailTestDetails,
    timestamp: now,
    payload: sampleEmailPayload,
  });

  // ============================================================================
  // Test 6: Rate Limit Check
  // ============================================================================
  const agentConfig = await getAgentConfig(tenantId);
  tests.push({
    name: 'Rate Limits Configured',
    status: agentConfig.maxEmailsPerHour > 0 ? 'PASS' : 'FAIL',
    details: `Limits: ${agentConfig.maxEmailsPerHour} emails/hr, ${agentConfig.maxActionsPerHour} actions/hr`,
    timestamp: now,
    payload: {
      maxEmailsPerHour: agentConfig.maxEmailsPerHour,
      maxActionsPerHour: agentConfig.maxActionsPerHour,
      maxSandboxJobsPerHour: agentConfig.maxSandboxJobsPerHour,
      maxBrowserJobsPerHour: agentConfig.maxBrowserJobsPerHour,
    },
  });

  // ============================================================================
  // Determine Overall Status
  // ============================================================================
  const failedCount = tests.filter(t => t.status === 'FAIL').length;
  const passedCount = tests.filter(t => t.status === 'PASS').length;

  let overallStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  if (failedCount === 0) {
    overallStatus = 'PASS';
  } else if (passedCount > 0) {
    overallStatus = 'PARTIAL';
  } else {
    overallStatus = 'FAIL';
  }

  // Generate next steps
  const nextSteps: string[] = [];
  for (const test of tests) {
    if (test.status === 'FAIL') {
      if (test.name === 'Global Agent Enabled') {
        nextSteps.push('Enable global agent: POST /api/admin/agent { action: "enable_global" }');
      } else if (test.name === 'Tenant Agent Enabled') {
        nextSteps.push('Enable tenant agent: POST /api/admin/agent { action: "enable_tenant" }');
      } else if (test.name === 'Gmail OAuth Status') {
        nextSteps.push('Connect Gmail: Settings → Integrations → Gmail → Connect');
      } else if (test.name === 'Email Send Permission') {
        if (emailConfig.sendMode === 'internal_only') {
          nextSteps.push(`Add ${testRecipient} to internal allowlist or use a @${emailConfig.internalDomains[0]} email`);
        } else {
          nextSteps.push('Check email configuration and rate limits');
        }
      }
    }
  }

  // Build report
  const report: SmokeTestReport = {
    tenantId,
    ranAt: now,
    status: overallStatus,
    tests,
    nextSteps: nextSteps.length > 0 ? nextSteps : undefined,
  };

  // Store result in database
  try {
    await serviceClient.from('agent_smoke_tests').insert({
      tenant_id: tenantId,
      ran_at: now,
      ran_by: user.id,
      status: overallStatus,
      details: report,
    });
  } catch (error) {
    // Table may not exist yet - include warning in response
    console.warn('[SmokeTest] Could not store result - table may not exist:', error);
    report.nextSteps = report.nextSteps || [];
    report.nextSteps.push('Warning: Could not persist smoke test result. Run migration for agent_smoke_tests table.');
  }

  return NextResponse.json(report);
}
