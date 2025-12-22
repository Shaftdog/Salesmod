/**
 * Admin Agent API - Kill switch and configuration management
 *
 * Endpoints:
 * - GET: Get current agent status
 * - POST: Enable/disable agent globally or per-tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

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

  const serviceClient = createServiceRoleClient();

  // Get global config
  const { data: sysConfig } = await serviceClient
    .from('system_config')
    .select('value')
    .eq('key', 'agent_config')
    .single();

  // Get tenant config
  const { data: tenant } = await serviceClient
    .from('tenants')
    .select('agent_enabled, agent_settings')
    .eq('id', profile.tenant_id)
    .single();

  return NextResponse.json({
    global: {
      enabled: (sysConfig?.value as any)?.global_enabled || false,
      killSwitchReason: (sysConfig?.value as any)?.kill_switch_reason || null,
    },
    tenant: {
      id: profile.tenant_id,
      enabled: tenant?.agent_enabled || false,
      settings: tenant?.agent_settings || {},
    },
  });
}

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

  const body = await request.json();
  const { action, value, reason } = body;

  // Validate action parameter
  const allowedActions = [
    'enable_global',
    'disable_global',
    'enable_tenant',
    'disable_tenant',
    'update_settings',
  ];

  if (!action || !allowedActions.includes(action)) {
    return NextResponse.json(
      { error: 'Invalid or missing action parameter' },
      { status: 400 }
    );
  }

  const serviceClient = createServiceRoleClient();

  switch (action) {
    case 'enable_global': {
      // Only super-admins should be able to do this
      await serviceClient
        .from('system_config')
        .upsert({
          key: 'agent_config',
          value: { global_enabled: true, kill_switch_reason: null },
          updated_at: new Date().toISOString(),
        });

      return NextResponse.json({
        success: true,
        message: 'Agent globally enabled',
      });
    }

    case 'disable_global': {
      await serviceClient
        .from('system_config')
        .upsert({
          key: 'agent_config',
          value: {
            global_enabled: false,
            kill_switch_reason: reason || 'Manually disabled',
          },
          updated_at: new Date().toISOString(),
        });

      return NextResponse.json({
        success: true,
        message: 'Agent globally disabled',
      });
    }

    case 'enable_tenant': {
      await serviceClient
        .from('tenants')
        .update({ agent_enabled: true })
        .eq('id', profile.tenant_id);

      return NextResponse.json({
        success: true,
        message: 'Agent enabled for tenant',
      });
    }

    case 'disable_tenant': {
      await serviceClient
        .from('tenants')
        .update({ agent_enabled: false })
        .eq('id', profile.tenant_id);

      return NextResponse.json({
        success: true,
        message: 'Agent disabled for tenant',
      });
    }

    case 'update_settings': {
      await serviceClient
        .from('tenants')
        .update({ agent_settings: value })
        .eq('id', profile.tenant_id);

      return NextResponse.json({
        success: true,
        message: 'Agent settings updated',
      });
    }

    default:
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
  }
}
