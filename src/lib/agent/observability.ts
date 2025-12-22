/**
 * Observability - Metrics collection, health checks, and monitoring
 *
 * Provides:
 * - Metrics collection for agent runs
 * - Health check endpoint data
 * - Alert evaluation
 * - Structured logging
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface AgentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  lastRunAt: Date | null;
  lastRunStatus: string | null;
  activeAlerts: number;
  metrics: AgentMetrics;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  value?: number | string;
}

export interface AgentMetrics {
  cyclesCompleted24h: number;
  cyclesFailed24h: number;
  failureRate: number;
  actionsExecuted24h: number;
  actionsBlocked24h: number;
  emailsSent24h: number;
  engagementComplianceRate: number;
  averageCycleDurationMs: number;
}

export interface AlertDefinition {
  id: string;
  name: string;
  condition: (metrics: AgentMetrics) => boolean;
  severity: 'info' | 'warning' | 'critical';
  message: (metrics: AgentMetrics) => string;
}

// ============================================================================
// Default Alert Definitions
// ============================================================================

const DEFAULT_ALERTS: AlertDefinition[] = [
  {
    id: 'high_failure_rate',
    name: 'High Cycle Failure Rate',
    condition: (m) => m.failureRate > 20,
    severity: 'critical',
    message: (m) => `Cycle failure rate is ${m.failureRate.toFixed(1)}% (threshold: 20%)`,
  },
  {
    id: 'kill_switch_active',
    name: 'Kill Switch Active',
    condition: () => false, // Checked separately
    severity: 'critical',
    message: () => 'Agent kill switch is active',
  },
  {
    id: 'low_engagement_compliance',
    name: 'Low Engagement Compliance',
    condition: (m) => m.engagementComplianceRate < 80,
    severity: 'warning',
    message: (m) =>
      `Engagement compliance is ${m.engagementComplianceRate.toFixed(1)}% (threshold: 80%)`,
  },
  {
    id: 'high_block_rate',
    name: 'High Action Block Rate',
    condition: (m) =>
      m.actionsExecuted24h + m.actionsBlocked24h > 0 &&
      m.actionsBlocked24h / (m.actionsExecuted24h + m.actionsBlocked24h) > 0.3,
    severity: 'warning',
    message: (m) => {
      const blockRate =
        m.actionsBlocked24h / (m.actionsExecuted24h + m.actionsBlocked24h);
      return `Action block rate is ${(blockRate * 100).toFixed(1)}% (threshold: 30%)`;
    },
  },
  {
    id: 'slow_cycles',
    name: 'Slow Cycle Execution',
    condition: (m) => m.averageCycleDurationMs > 300000, // 5 minutes
    severity: 'warning',
    message: (m) =>
      `Average cycle duration is ${(m.averageCycleDurationMs / 1000).toFixed(1)}s (threshold: 300s)`,
  },
];

// ============================================================================
// Health Check
// ============================================================================

/**
 * Get comprehensive agent health status
 */
export async function getAgentHealth(tenantId: string): Promise<AgentHealth> {
  const supabase = createServiceRoleClient();

  // Get metrics
  const metrics = await getAgentMetrics(tenantId);

  // Run health checks
  const checks: HealthCheck[] = [];

  // Check: Global agent enabled
  const { data: sysConfig } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'agent_config')
    .single();

  const globalEnabled = (sysConfig?.value as any)?.global_enabled === true;
  checks.push({
    name: 'Global Agent Enabled',
    status: globalEnabled ? 'pass' : 'fail',
    message: globalEnabled ? 'Agent is globally enabled' : 'Agent is globally disabled',
  });

  // Check: Tenant agent enabled
  const { data: tenant } = await supabase
    .from('tenants')
    .select('agent_enabled')
    .eq('id', tenantId)
    .single();

  checks.push({
    name: 'Tenant Agent Enabled',
    status: tenant?.agent_enabled ? 'pass' : 'warn',
    message: tenant?.agent_enabled
      ? 'Agent is enabled for this tenant'
      : 'Agent is disabled for this tenant',
  });

  // Check: Recent successful run
  const lastRun = await getLastRun(tenantId);
  const hoursSinceLastRun = lastRun
    ? (Date.now() - lastRun.startedAt.getTime()) / (1000 * 60 * 60)
    : 999;

  checks.push({
    name: 'Recent Successful Run',
    status: hoursSinceLastRun < 2 ? 'pass' : hoursSinceLastRun < 6 ? 'warn' : 'fail',
    message:
      hoursSinceLastRun < 999
        ? `Last run ${hoursSinceLastRun.toFixed(1)} hours ago`
        : 'No runs found',
    value: lastRun?.status || 'none',
  });

  // Check: Failure rate
  checks.push({
    name: 'Cycle Failure Rate',
    status:
      metrics.failureRate < 10 ? 'pass' : metrics.failureRate < 20 ? 'warn' : 'fail',
    message: `${metrics.failureRate.toFixed(1)}% failure rate (24h)`,
    value: metrics.failureRate,
  });

  // Check: Engagement compliance
  checks.push({
    name: 'Engagement Compliance',
    status:
      metrics.engagementComplianceRate > 90
        ? 'pass'
        : metrics.engagementComplianceRate > 80
          ? 'warn'
          : 'fail',
    message: `${metrics.engagementComplianceRate.toFixed(1)}% compliance rate`,
    value: metrics.engagementComplianceRate,
  });

  // Get active alerts count
  const { count: alertCount } = await supabase
    .from('agent_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('acknowledged', false);

  // Determine overall status
  const hasFailure = checks.some((c) => c.status === 'fail');
  const hasWarning = checks.some((c) => c.status === 'warn');
  const status: 'healthy' | 'degraded' | 'unhealthy' = hasFailure
    ? 'unhealthy'
    : hasWarning
      ? 'degraded'
      : 'healthy';

  return {
    status,
    checks,
    lastRunAt: lastRun?.startedAt || null,
    lastRunStatus: lastRun?.status || null,
    activeAlerts: alertCount || 0,
    metrics,
  };
}

// ============================================================================
// Metrics Collection
// ============================================================================

/**
 * Get agent metrics for the last 24 hours
 */
export async function getAgentMetrics(tenantId: string): Promise<AgentMetrics> {
  const supabase = createServiceRoleClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get run stats
  const { data: runs } = await supabase
    .from('agent_autonomous_runs')
    .select('status, duration_ms, actions_executed, actions_blocked, emails_sent')
    .eq('tenant_id', tenantId)
    .gte('started_at', twentyFourHoursAgo);

  const completedRuns = runs?.filter((r) => r.status === 'completed') || [];
  const failedRuns = runs?.filter((r) => r.status === 'failed') || [];
  const allRuns = runs || [];

  const totalRuns = allRuns.length;
  const failureRate = totalRuns > 0 ? (failedRuns.length / totalRuns) * 100 : 0;

  const actionsExecuted = allRuns.reduce((sum, r) => sum + (r.actions_executed || 0), 0);
  const actionsBlocked = allRuns.reduce((sum, r) => sum + (r.actions_blocked || 0), 0);
  const emailsSent = allRuns.reduce((sum, r) => sum + (r.emails_sent || 0), 0);

  const avgDuration =
    completedRuns.length > 0
      ? completedRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0) /
        completedRuns.length
      : 0;

  // Get engagement compliance
  const { count: totalClocks } = await supabase
    .from('engagement_clocks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: compliantClocks } = await supabase
    .from('engagement_clocks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_compliant', true);

  const complianceRate =
    (totalClocks || 0) > 0 ? ((compliantClocks || 0) / (totalClocks || 1)) * 100 : 100;

  return {
    cyclesCompleted24h: completedRuns.length,
    cyclesFailed24h: failedRuns.length,
    failureRate,
    actionsExecuted24h: actionsExecuted,
    actionsBlocked24h: actionsBlocked,
    emailsSent24h: emailsSent,
    engagementComplianceRate: complianceRate,
    averageCycleDurationMs: avgDuration,
  };
}

/**
 * Get the last run for a tenant
 */
async function getLastRun(tenantId: string): Promise<{
  id: string;
  status: string;
  startedAt: Date;
} | null> {
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .from('agent_autonomous_runs')
    .select('id, status, started_at')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    status: data.status,
    startedAt: new Date(data.started_at),
  };
}

// ============================================================================
// Alert Evaluation
// ============================================================================

/**
 * Evaluate alerts and create any that should fire
 */
export async function evaluateAlerts(tenantId: string): Promise<string[]> {
  const metrics = await getAgentMetrics(tenantId);
  const firedAlerts: string[] = [];

  for (const alert of DEFAULT_ALERTS) {
    if (alert.condition(metrics)) {
      await createAlert(tenantId, alert, metrics);
      firedAlerts.push(alert.id);
    }
  }

  return firedAlerts;
}

/**
 * Create an alert if not already active
 */
async function createAlert(
  tenantId: string,
  alert: AlertDefinition,
  metrics: AgentMetrics
): Promise<void> {
  const supabase = createServiceRoleClient();

  // Check if same alert fired in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('agent_alerts')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('alert_type', alert.id)
    .gte('created_at', oneHourAgo)
    .limit(1)
    .single();

  if (existing) {
    return; // Don't create duplicate
  }

  await supabase.from('agent_alerts').insert({
    tenant_id: tenantId,
    alert_type: alert.id,
    severity: alert.severity,
    message: alert.message(metrics),
    metadata: { metrics },
  });

  console.log(`[Observability] Alert fired: ${alert.id} for tenant ${tenantId}`);
}

// ============================================================================
// Structured Logging
// ============================================================================

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  tenantId?: string;
  runId?: string;
  data?: Record<string, unknown>;
}

/**
 * Structured log helper
 */
export function log(entry: LogEntry): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${entry.component}]`;
  const context = {
    timestamp,
    tenantId: entry.tenantId,
    runId: entry.runId,
    ...entry.data,
  };

  switch (entry.level) {
    case 'debug':
      console.debug(`${prefix} ${entry.message}`, context);
      break;
    case 'info':
      console.log(`${prefix} ${entry.message}`, context);
      break;
    case 'warn':
      console.warn(`${prefix} ${entry.message}`, context);
      break;
    case 'error':
      console.error(`${prefix} ${entry.message}`, context);
      break;
  }
}

/**
 * Log agent cycle start
 */
export function logCycleStart(tenantId: string, runId: string, cycleNumber: number): void {
  log({
    level: 'info',
    component: 'AutonomousCycle',
    message: `Starting cycle #${cycleNumber}`,
    tenantId,
    runId,
  });
}

/**
 * Log agent cycle end
 */
export function logCycleEnd(
  tenantId: string,
  runId: string,
  status: string,
  durationMs: number,
  metrics: { actionsPlanned: number; actionsExecuted: number; actionsBlocked: number }
): void {
  log({
    level: status === 'completed' ? 'info' : 'error',
    component: 'AutonomousCycle',
    message: `Cycle completed with status: ${status}`,
    tenantId,
    runId,
    data: { durationMs, ...metrics },
  });
}

/**
 * Log action execution
 */
export function logAction(
  tenantId: string,
  runId: string,
  actionType: string,
  success: boolean,
  details?: Record<string, unknown>
): void {
  log({
    level: success ? 'info' : 'warn',
    component: 'ActionExecution',
    message: `Action ${actionType}: ${success ? 'success' : 'failed'}`,
    tenantId,
    runId,
    data: details,
  });
}
