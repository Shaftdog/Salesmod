/**
 * Agent Observability Service
 *
 * Provides metrics collection, structured logging, and alerting capabilities
 * for the autonomous agent system.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface AgentMetrics {
  // Cycle metrics
  cyclesCompleted: number;
  cyclesFailed: number;
  cyclesSkipped: number;
  averageCycleDurationMs: number;

  // Action metrics
  actionsPlanned: number;
  actionsExecuted: number;
  actionsFailed: number;
  actionsBlocked: number;

  // Rate limit metrics
  rateLimitHits: number;

  // Policy metrics
  policyViolations: number;

  // Engagement metrics
  engagementTouchesCompleted: number;
  engagementViolationsCount: number;
  engagementComplianceRate: number;

  // Email metrics
  emailsSent: number;
  emailsSimulated: number;
  emailsBounced: number;
  emailsRateLimited: number;

  // Gmail metrics
  gmailMessagesProcessed: number;
  gmailCardsCreated: number;
  gmailDuplicatesSkipped: number;

  // System health
  activeLocksCount: number;
  killSwitchActive: boolean;
  tenantsEnabled: number;
  tenantsDisabled: number;
}

export interface AlertConfig {
  name: string;
  condition: (metrics: AgentMetrics) => boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: (metrics: AgentMetrics) => string;
}

export interface Alert {
  id: string;
  name: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  triggeredAt: Date;
  metrics: Partial<AgentMetrics>;
}

// ============================================================================
// Metrics Collection
// ============================================================================

/**
 * Collect all agent metrics for monitoring
 */
export async function collectAgentMetrics(
  tenantId?: string,
  timeWindowHours: number = 24
): Promise<AgentMetrics> {
  const supabase = createServiceRoleClient();
  const windowStart = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString();

  // Build tenant filter
  const tenantFilter = tenantId ? { tenant_id: tenantId } : {};

  // Collect cycle metrics
  const { data: runs } = await supabase
    .from('agent_autonomous_runs')
    .select('status, metrics, started_at, ended_at')
    .gte('started_at', windowStart)
    .match(tenantFilter);

  const cyclesCompleted = runs?.filter(r => r.status === 'completed').length || 0;
  const cyclesFailed = runs?.filter(r => r.status === 'failed').length || 0;
  const cyclesSkipped = runs?.filter(r => r.status === 'cancelled').length || 0;

  const cycleDurations = runs
    ?.filter(r => r.ended_at && r.started_at)
    .map(r => new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) || [];
  const averageCycleDurationMs = cycleDurations.length > 0
    ? cycleDurations.reduce((a, b) => a + b, 0) / cycleDurations.length
    : 0;

  // Aggregate action metrics from run metrics
  const actionMetrics = runs?.reduce((acc, r) => {
    const m = r.metrics as Record<string, number> | null;
    if (m) {
      acc.actionsPlanned += m.actionsPlanned || 0;
      acc.actionsExecuted += m.actionsExecuted || 0;
      acc.actionsFailed += m.actionsFailed || 0;
      acc.actionsBlocked += m.actionsBlocked || 0;
      acc.engagementTouchesCompleted += m.engagementTouchesCompleted || 0;
    }
    return acc;
  }, {
    actionsPlanned: 0,
    actionsExecuted: 0,
    actionsFailed: 0,
    actionsBlocked: 0,
    engagementTouchesCompleted: 0,
  }) || { actionsPlanned: 0, actionsExecuted: 0, actionsFailed: 0, actionsBlocked: 0, engagementTouchesCompleted: 0 };

  // Collect rate limit metrics
  const { data: rateLimits } = await supabase
    .from('agent_rate_limits')
    .select('action_count, max_allowed')
    .gte('window_start', windowStart)
    .match(tenantFilter);

  const rateLimitHits = rateLimits?.filter(r => r.action_count >= r.max_allowed).length || 0;

  // Collect policy violations
  const { count: policyViolations } = await supabase
    .from('agent_policy_violations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', windowStart)
    .match(tenantFilter);

  // Collect engagement metrics
  const { data: engagementClocks } = await supabase
    .from('engagement_clocks')
    .select('is_compliant, days_overdue')
    .match(tenantFilter);

  const totalEngagementClocks = engagementClocks?.length || 0;
  const compliantClocks = engagementClocks?.filter(c => c.is_compliant).length || 0;
  const engagementViolationsCount = engagementClocks?.filter(c => !c.is_compliant).length || 0;
  const engagementComplianceRate = totalEngagementClocks > 0
    ? (compliantClocks / totalEngagementClocks) * 100
    : 100;

  // Collect email metrics from activities
  const { count: emailsSent } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'email')
    .eq('status', 'completed')
    .gte('created_at', windowStart)
    .match(tenantFilter);

  // Collect Gmail metrics
  const { data: gmailSyncState } = await supabase
    .from('gmail_sync_state')
    .select('total_messages_synced, duplicate_messages_skipped')
    .match(tenantFilter);

  const gmailMessagesProcessed = gmailSyncState?.reduce((sum, s) => sum + (s.total_messages_synced || 0), 0) || 0;
  const gmailDuplicatesSkipped = gmailSyncState?.reduce((sum, s) => sum + (s.duplicate_messages_skipped || 0), 0) || 0;

  // Gmail cards created
  const { count: gmailCardsCreated } = await supabase
    .from('kanban_cards')
    .select('*', { count: 'exact', head: true })
    .not('gmail_message_id', 'is', null)
    .gte('created_at', windowStart)
    .match(tenantFilter);

  // Collect system health metrics
  const { count: activeLocksCount } = await supabase
    .from('agent_tenant_locks')
    .select('*', { count: 'exact', head: true })
    .gt('expires_at', new Date().toISOString());

  // Check kill switch status
  const { data: systemConfig } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'agent_config')
    .single();

  const killSwitchActive = systemConfig?.value?.global_enabled === false;

  // Count enabled/disabled tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('agent_enabled')
    .eq('is_active', true);

  const tenantsEnabled = tenants?.filter(t => t.agent_enabled !== false).length || 0;
  const tenantsDisabled = tenants?.filter(t => t.agent_enabled === false).length || 0;

  return {
    cyclesCompleted,
    cyclesFailed,
    cyclesSkipped,
    averageCycleDurationMs,
    actionsPlanned: actionMetrics.actionsPlanned,
    actionsExecuted: actionMetrics.actionsExecuted,
    actionsFailed: actionMetrics.actionsFailed,
    actionsBlocked: actionMetrics.actionsBlocked,
    rateLimitHits,
    policyViolations: policyViolations || 0,
    engagementTouchesCompleted: actionMetrics.engagementTouchesCompleted,
    engagementViolationsCount,
    engagementComplianceRate,
    emailsSent: emailsSent || 0,
    emailsSimulated: 0, // Would need to track separately
    emailsBounced: 0, // Would need to track from suppression table
    emailsRateLimited: rateLimitHits,
    gmailMessagesProcessed,
    gmailCardsCreated: gmailCardsCreated || 0,
    gmailDuplicatesSkipped,
    activeLocksCount: activeLocksCount || 0,
    killSwitchActive,
    tenantsEnabled,
    tenantsDisabled,
  };
}

// ============================================================================
// Alert Definitions
// ============================================================================

export const DEFAULT_ALERTS: AlertConfig[] = [
  {
    name: 'high_failure_rate',
    condition: (m) => m.cyclesFailed > 0 && (m.cyclesFailed / (m.cyclesCompleted + m.cyclesFailed)) > 0.2,
    severity: 'error',
    message: (m) => `Cycle failure rate is ${((m.cyclesFailed / (m.cyclesCompleted + m.cyclesFailed)) * 100).toFixed(1)}% (${m.cyclesFailed} failures)`,
  },
  {
    name: 'kill_switch_active',
    condition: (m) => m.killSwitchActive,
    severity: 'critical',
    message: () => 'Global kill switch is ACTIVE - all agent activity is disabled',
  },
  {
    name: 'lock_contention',
    condition: (m) => m.activeLocksCount > 3,
    severity: 'warning',
    message: (m) => `${m.activeLocksCount} active locks detected - possible contention or stuck processes`,
  },
  {
    name: 'policy_violations_spike',
    condition: (m) => m.policyViolations > 50,
    severity: 'warning',
    message: (m) => `${m.policyViolations} policy violations in last 24 hours`,
  },
  {
    name: 'engagement_compliance_low',
    condition: (m) => m.engagementComplianceRate < 80,
    severity: 'warning',
    message: (m) => `Engagement compliance rate is ${m.engagementComplianceRate.toFixed(1)}% (below 80% threshold)`,
  },
  {
    name: 'rate_limit_exhaustion',
    condition: (m) => m.rateLimitHits > 10,
    severity: 'warning',
    message: (m) => `${m.rateLimitHits} rate limit hits - actions being deferred`,
  },
  {
    name: 'no_cycles_running',
    condition: (m) => m.cyclesCompleted === 0 && m.cyclesFailed === 0,
    severity: 'info',
    message: () => 'No agent cycles have run in the monitoring window',
  },
];

// ============================================================================
// Alert Evaluation
// ============================================================================

/**
 * Evaluate all alerts against current metrics
 */
export async function evaluateAlerts(
  metrics?: AgentMetrics,
  customAlerts?: AlertConfig[]
): Promise<Alert[]> {
  const currentMetrics = metrics || await collectAgentMetrics();
  const alertConfigs = customAlerts || DEFAULT_ALERTS;
  const triggeredAlerts: Alert[] = [];

  for (const config of alertConfigs) {
    if (config.condition(currentMetrics)) {
      triggeredAlerts.push({
        id: `${config.name}-${Date.now()}`,
        name: config.name,
        severity: config.severity,
        message: config.message(currentMetrics),
        triggeredAt: new Date(),
        metrics: {
          cyclesCompleted: currentMetrics.cyclesCompleted,
          cyclesFailed: currentMetrics.cyclesFailed,
          killSwitchActive: currentMetrics.killSwitchActive,
          engagementComplianceRate: currentMetrics.engagementComplianceRate,
          policyViolations: currentMetrics.policyViolations,
        },
      });
    }
  }

  return triggeredAlerts;
}

// ============================================================================
// Structured Logging
// ============================================================================

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  tenantId?: string;
  cycleNumber?: number;
  data?: Record<string, unknown>;
}

/**
 * Create a structured log entry
 */
export function log(
  level: LogEntry['level'],
  component: string,
  message: string,
  context?: {
    tenantId?: string;
    cycleNumber?: number;
    data?: Record<string, unknown>;
  }
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    ...context,
  };

  // Output to console in structured format
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}]`;
  const contextStr = entry.tenantId ? ` [tenant:${entry.tenantId}]` : '';
  const cycleStr = entry.cycleNumber ? ` [cycle:${entry.cycleNumber}]` : '';
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';

  const fullMessage = `${prefix}${contextStr}${cycleStr} ${entry.message}${dataStr}`;

  switch (level) {
    case 'debug':
      console.debug(fullMessage);
      break;
    case 'info':
      console.log(fullMessage);
      break;
    case 'warn':
      console.warn(fullMessage);
      break;
    case 'error':
      console.error(fullMessage);
      break;
  }

  return entry;
}

// Convenience functions
export const logDebug = (component: string, message: string, context?: Parameters<typeof log>[3]) =>
  log('debug', component, message, context);
export const logInfo = (component: string, message: string, context?: Parameters<typeof log>[3]) =>
  log('info', component, message, context);
export const logWarn = (component: string, message: string, context?: Parameters<typeof log>[3]) =>
  log('warn', component, message, context);
export const logError = (component: string, message: string, context?: Parameters<typeof log>[3]) =>
  log('error', component, message, context);

// ============================================================================
// Health Check
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    name: string;
    status: 'ok' | 'warning' | 'error';
    message?: string;
  }[];
  metrics: AgentMetrics;
  alerts: Alert[];
  checkedAt: Date;
}

/**
 * Perform a comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const metrics = await collectAgentMetrics();
  const alerts = await evaluateAlerts(metrics);

  const components: HealthStatus['components'] = [];

  // Check database connectivity
  try {
    const supabase = createServiceRoleClient();
    await supabase.from('tenants').select('count').single();
    components.push({ name: 'database', status: 'ok' });
  } catch {
    components.push({ name: 'database', status: 'error', message: 'Database connection failed' });
  }

  // Check kill switch
  if (metrics.killSwitchActive) {
    components.push({ name: 'kill_switch', status: 'error', message: 'Kill switch is active' });
  } else {
    components.push({ name: 'kill_switch', status: 'ok' });
  }

  // Check lock health
  if (metrics.activeLocksCount > 5) {
    components.push({ name: 'locks', status: 'warning', message: `${metrics.activeLocksCount} active locks` });
  } else {
    components.push({ name: 'locks', status: 'ok' });
  }

  // Check cycle health
  const totalCycles = metrics.cyclesCompleted + metrics.cyclesFailed;
  if (totalCycles === 0) {
    components.push({ name: 'cycles', status: 'warning', message: 'No recent cycles' });
  } else if (metrics.cyclesFailed / totalCycles > 0.2) {
    components.push({ name: 'cycles', status: 'error', message: 'High failure rate' });
  } else {
    components.push({ name: 'cycles', status: 'ok' });
  }

  // Check engagement compliance
  if (metrics.engagementComplianceRate < 80) {
    components.push({ name: 'engagement', status: 'warning', message: `${metrics.engagementComplianceRate.toFixed(1)}% compliance` });
  } else {
    components.push({ name: 'engagement', status: 'ok' });
  }

  // Determine overall status
  const hasErrors = components.some(c => c.status === 'error');
  const hasWarnings = components.some(c => c.status === 'warning');
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length > 0;

  let status: HealthStatus['status'] = 'healthy';
  if (hasErrors || criticalAlerts) {
    status = 'unhealthy';
  } else if (hasWarnings) {
    status = 'degraded';
  }

  return {
    status,
    components,
    metrics,
    alerts,
    checkedAt: new Date(),
  };
}
