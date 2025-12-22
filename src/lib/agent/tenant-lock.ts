/**
 * Tenant Lock - Per-tenant locking mechanism for autonomous agent
 *
 * Prevents concurrent autonomous cycles from running for the same tenant.
 * Uses database-level locking for race-safe acquisition.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface LockAcquisitionResult {
  acquired: boolean;
  runId?: string;
  reason?: string;
}

export interface TenantLock {
  id: string;
  tenantId: string;
  runId: string | null;
  lockedAt: Date;
  expiresAt: Date;
  lockHolder: string;
}

// ============================================================================
// Lock Acquisition
// ============================================================================

/**
 * Attempt to acquire a lock for a tenant
 * Returns the run ID if successful, null if lock is already held
 */
export async function acquireTenantLock(
  tenantId: string,
  lockHolder: string = 'agent-cron',
  durationMinutes: number = 60
): Promise<LockAcquisitionResult> {
  const supabase = createServiceRoleClient();

  try {
    // Use database function for atomic lock acquisition
    const { data: runId, error } = await supabase.rpc('acquire_tenant_lock', {
      p_tenant_id: tenantId,
      p_lock_holder: lockHolder,
      p_duration_minutes: durationMinutes,
    });

    if (error) {
      console.error(`[TenantLock] Error acquiring lock for ${tenantId}:`, error);
      return {
        acquired: false,
        reason: `Database error: ${error.message}`,
      };
    }

    if (!runId) {
      // Lock not acquired - already held by another process
      const existingLock = await getExistingLock(tenantId);
      return {
        acquired: false,
        reason: existingLock
          ? `Lock held by ${existingLock.lockHolder} until ${existingLock.expiresAt.toISOString()}`
          : 'Lock acquisition failed',
      };
    }

    console.log(`[TenantLock] Acquired lock for tenant ${tenantId}, run ${runId}`);
    return {
      acquired: true,
      runId: runId,
    };
  } catch (err) {
    console.error(`[TenantLock] Exception acquiring lock:`, err);
    return {
      acquired: false,
      reason: `Exception: ${(err as Error).message}`,
    };
  }
}

/**
 * Release a tenant lock and mark run as completed
 */
export async function releaseTenantLock(
  tenantId: string,
  runId: string,
  status: 'completed' | 'failed' | 'timeout' = 'completed'
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase.rpc('release_tenant_lock', {
      p_tenant_id: tenantId,
      p_run_id: runId,
      p_status: status,
    });

    if (error) {
      console.error(`[TenantLock] Error releasing lock for ${tenantId}:`, error);
      return false;
    }

    console.log(`[TenantLock] Released lock for tenant ${tenantId}, status: ${status}`);
    return true;
  } catch (err) {
    console.error(`[TenantLock] Exception releasing lock:`, err);
    return false;
  }
}

/**
 * Extend lock duration (for long-running cycles)
 */
export async function extendTenantLock(
  tenantId: string,
  additionalMinutes: number = 30
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase.rpc('extend_tenant_lock', {
      p_tenant_id: tenantId,
      p_additional_minutes: additionalMinutes,
    });

    if (error) {
      console.error(`[TenantLock] Error extending lock for ${tenantId}:`, error);
      return false;
    }

    console.log(`[TenantLock] Extended lock for tenant ${tenantId} by ${additionalMinutes} minutes`);
    return data === true;
  } catch (err) {
    console.error(`[TenantLock] Exception extending lock:`, err);
    return false;
  }
}

// ============================================================================
// Lock Status
// ============================================================================

/**
 * Get existing lock for a tenant (if any)
 */
export async function getExistingLock(tenantId: string): Promise<TenantLock | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('agent_tenant_locks')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    runId: data.run_id,
    lockedAt: new Date(data.locked_at),
    expiresAt: new Date(data.expires_at),
    lockHolder: data.lock_holder,
  };
}

/**
 * Check if lock is expired
 */
export function isLockExpired(lock: TenantLock): boolean {
  return lock.expiresAt < new Date();
}

/**
 * Clean up expired locks (usually called by cron)
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const supabase = createServiceRoleClient();

  // Find expired locks
  const { data: expiredLocks } = await supabase
    .from('agent_tenant_locks')
    .select('tenant_id, run_id')
    .lt('expires_at', new Date().toISOString());

  if (!expiredLocks || expiredLocks.length === 0) {
    return 0;
  }

  // Mark runs as timed out
  for (const lock of expiredLocks) {
    if (lock.run_id) {
      await supabase
        .from('agent_autonomous_runs')
        .update({
          status: 'timeout',
          completed_at: new Date().toISOString(),
        })
        .eq('id', lock.run_id);
    }
  }

  // Delete expired locks
  const { error } = await supabase
    .from('agent_tenant_locks')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[TenantLock] Error cleaning up expired locks:', error);
    return 0;
  }

  console.log(`[TenantLock] Cleaned up ${expiredLocks.length} expired locks`);
  return expiredLocks.length;
}

// ============================================================================
// Run Tracking
// ============================================================================

/**
 * Update run phase
 */
export async function updateRunPhase(
  runId: string,
  phase: 'plan' | 'act' | 'react' | 'reflect' | 'completed' | 'failed'
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('agent_autonomous_runs')
    .update({ phase })
    .eq('id', runId);
}

/**
 * Update run metrics
 */
export async function updateRunMetrics(
  runId: string,
  metrics: {
    actionsPlanned?: number;
    actionsExecuted?: number;
    actionsBlocked?: number;
    emailsSent?: number;
    cardsCreated?: number;
  }
): Promise<void> {
  const supabase = createServiceRoleClient();

  const updateData: Record<string, number> = {};
  if (metrics.actionsPlanned !== undefined) updateData.actions_planned = metrics.actionsPlanned;
  if (metrics.actionsExecuted !== undefined) updateData.actions_executed = metrics.actionsExecuted;
  if (metrics.actionsBlocked !== undefined) updateData.actions_blocked = metrics.actionsBlocked;
  if (metrics.emailsSent !== undefined) updateData.emails_sent = metrics.emailsSent;
  if (metrics.cardsCreated !== undefined) updateData.cards_created = metrics.cardsCreated;

  if (Object.keys(updateData).length > 0) {
    await supabase
      .from('agent_autonomous_runs')
      .update(updateData)
      .eq('id', runId);
  }
}

/**
 * Mark run as failed with error message
 */
export async function markRunFailed(
  runId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('agent_autonomous_runs')
    .update({
      status: 'failed',
      phase: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId);
}

/**
 * Get latest run for tenant
 */
export async function getLatestRun(tenantId: string): Promise<{
  id: string;
  cycleNumber: number;
  status: string;
  phase: string | null;
  startedAt: Date;
  completedAt: Date | null;
} | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('agent_autonomous_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    cycleNumber: data.cycle_number,
    status: data.status,
    phase: data.phase,
    startedAt: new Date(data.started_at),
    completedAt: data.completed_at ? new Date(data.completed_at) : null,
  };
}

/**
 * Get next cycle number for tenant
 */
export async function getNextCycleNumber(tenantId: string): Promise<number> {
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .from('agent_autonomous_runs')
    .select('cycle_number')
    .eq('tenant_id', tenantId)
    .order('cycle_number', { ascending: false })
    .limit(1)
    .single();

  return (data?.cycle_number || 0) + 1;
}
