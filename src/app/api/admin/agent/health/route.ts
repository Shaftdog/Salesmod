/**
 * Agent Health Check & Metrics API
 *
 * GET /api/admin/agent/health - Get agent health status and metrics
 * GET /api/admin/agent/health?tenant=<id> - Get metrics for specific tenant
 * GET /api/admin/agent/health?alerts=true - Include active alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  performHealthCheck,
  collectAgentMetrics,
  evaluateAlerts,
} from '@/lib/agent/observability';

// Allow cron secret for external monitoring
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant');
  const includeAlerts = searchParams.get('alerts') === 'true';
  const metricsOnly = searchParams.get('metrics') === 'true';
  const timeWindow = parseInt(searchParams.get('window') || '24', 10);

  // Check authorization
  const authHeader = request.headers.get('authorization');
  let adminTenantId: string | null = null;
  let isSuperAdmin = false;

  // Allow cron secret for external monitoring tools (can query all tenants)
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    // Authorized via cron secret - treat as super admin access
    isSuperAdmin = true;
  } else {
    // Check user authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    adminTenantId = profile.tenant_id;
    isSuperAdmin = profile.role === 'super_admin';
  }

  // Validate tenant access - regular admins can only query their own tenant
  if (tenantId && !isSuperAdmin && tenantId !== adminTenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: Cannot access other tenant data' },
      { status: 403 }
    );
  }

  // For regular admins querying without tenant filter, scope to their tenant
  const effectiveTenantId = isSuperAdmin ? (tenantId || undefined) : (tenantId || adminTenantId || undefined);

  try {
    // Metrics-only mode for lightweight monitoring
    if (metricsOnly) {
      const metrics = await collectAgentMetrics(effectiveTenantId, timeWindow);
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        timeWindowHours: timeWindow,
        tenantId: effectiveTenantId || 'all',
        metrics,
      });
    }

    // Full health check
    const health = await performHealthCheck();

    // Optionally collect tenant-specific metrics
    let tenantMetrics = null;
    if (effectiveTenantId) {
      tenantMetrics = await collectAgentMetrics(effectiveTenantId, timeWindow);
    }

    // Optionally include alerts evaluation
    let alerts = null;
    if (includeAlerts) {
      alerts = await evaluateAlerts(tenantMetrics || health.metrics);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      health: {
        status: health.status,
        components: health.components,
        checkedAt: health.checkedAt.toISOString(),
      },
      metrics: tenantMetrics || health.metrics,
      alerts: alerts || health.alerts,
      tenantId: effectiveTenantId || 'all',
      timeWindowHours: timeWindow,
    });
  } catch (error: any) {
    console.error('[Agent Health] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
