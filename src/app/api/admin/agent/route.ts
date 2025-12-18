/**
 * Admin API for Agent Management
 *
 * Provides endpoints for:
 * - Viewing agent status (global + per-tenant)
 * - Activating/deactivating global kill switch
 * - Enabling/disabling agent for specific tenants
 * - Viewing rate limit status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import {
  getAgentStatus,
  isAgentGloballyEnabled,
  activateKillSwitch,
  deactivateKillSwitch,
  disableAgentForTenant,
  enableAgentForTenant,
  getGlobalConfig,
  getRateLimitStatus,
} from '@/lib/agent/agent-config';

/**
 * GET /api/admin/agent
 * Get agent status (global or for specific tenant)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  try {
    // Get admin's tenant_id for scoping
    const adminTenantId = profile.tenant_id;
    const isSuperAdmin = profile.role === 'super_admin';

    if (tenantId) {
      // Validate admin can only access their own tenant (super_admin can access all)
      if (!isSuperAdmin && tenantId !== adminTenantId) {
        return NextResponse.json(
          { error: 'Unauthorized: Cannot access other tenant data' },
          { status: 403 }
        );
      }

      // Get status for requested tenant
      const status = await getAgentStatus(tenantId);
      const rateLimits = await getRateLimitStatus(tenantId);

      return NextResponse.json({
        success: true,
        tenantId,
        status,
        rateLimits,
      });
    } else {
      // Get global status
      const globalConfig = await getGlobalConfig();
      const globalStatus = await isAgentGloballyEnabled();

      // Build tenant query - super_admin sees all, regular admin sees own tenant only
      const serviceSupabase = createServiceRoleClient();
      let tenantQuery = serviceSupabase
        .from('tenants')
        .select('id, name, is_active, agent_enabled, agent_settings')
        .eq('is_active', true);

      if (!isSuperAdmin) {
        tenantQuery = tenantQuery.eq('id', adminTenantId);
      }

      const { data: tenants } = await tenantQuery.order('name');

      return NextResponse.json({
        success: true,
        global: {
          enabled: globalStatus.enabled,
          reason: globalStatus.reason,
          source: globalStatus.source,
          config: globalConfig,
        },
        tenants: tenants?.map(t => ({
          id: t.id,
          name: t.name,
          agentEnabled: t.agent_enabled,
          settings: t.agent_settings,
        })) || [],
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get agent status', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/agent
 * Manage agent settings
 *
 * Actions:
 * - activate_kill_switch: Activate global kill switch
 * - deactivate_kill_switch: Deactivate global kill switch
 * - disable_tenant: Disable agent for specific tenant
 * - enable_tenant: Enable agent for specific tenant
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const adminTenantId = profile.tenant_id;
  const isSuperAdmin = profile.role === 'super_admin';

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, tenantId, reason } = body;

  if (!action) {
    return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
  }

  const actorId = user.id;
  const actorEmail = user.email || 'unknown';

  try {
    switch (action) {
      case 'activate_kill_switch': {
        const killReason = reason || 'Manually activated by admin';
        const success = await activateKillSwitch(killReason, actorEmail);

        if (!success) {
          return NextResponse.json({ error: 'Failed to activate kill switch' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Global kill switch ACTIVATED',
          reason: killReason,
          activatedBy: actorEmail,
        });
      }

      case 'deactivate_kill_switch': {
        const success = await deactivateKillSwitch(actorEmail);

        if (!success) {
          return NextResponse.json({ error: 'Failed to deactivate kill switch' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Global kill switch DEACTIVATED',
          deactivatedBy: actorEmail,
        });
      }

      case 'disable_tenant': {
        if (!tenantId) {
          return NextResponse.json({ error: 'Missing tenantId parameter' }, { status: 400 });
        }

        // Validate admin can only manage their own tenant (super_admin can manage all)
        if (!isSuperAdmin && tenantId !== adminTenantId) {
          return NextResponse.json(
            { error: 'Unauthorized: Cannot manage other tenant' },
            { status: 403 }
          );
        }

        const disableReason = reason || 'Manually disabled by admin';
        const success = await disableAgentForTenant(tenantId, disableReason, actorEmail);

        if (!success) {
          return NextResponse.json({ error: 'Failed to disable agent for tenant' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `Agent DISABLED for tenant ${tenantId}`,
          reason: disableReason,
          disabledBy: actorEmail,
        });
      }

      case 'enable_tenant': {
        if (!tenantId) {
          return NextResponse.json({ error: 'Missing tenantId parameter' }, { status: 400 });
        }

        // Validate admin can only manage their own tenant (super_admin can manage all)
        if (!isSuperAdmin && tenantId !== adminTenantId) {
          return NextResponse.json(
            { error: 'Unauthorized: Cannot manage other tenant' },
            { status: 403 }
          );
        }

        const success = await enableAgentForTenant(tenantId, actorEmail);

        if (!success) {
          return NextResponse.json({ error: 'Failed to enable agent for tenant' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `Agent ENABLED for tenant ${tenantId}`,
          enabledBy: actorEmail,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: activate_kill_switch, deactivate_kill_switch, disable_tenant, enable_tenant` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[Admin Agent] Error:', error);
    return NextResponse.json(
      { error: 'Operation failed', details: error.message },
      { status: 500 }
    );
  }
}
