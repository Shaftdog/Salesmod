/**
 * Tenant Lock Management
 * Prevents concurrent autonomous cycles for the same tenant
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

const LOCK_DURATION_MINUTES = 30;
const INSTANCE_ID = `agent-${process.env.VERCEL_REGION || 'local'}-${randomUUID().substring(0, 8)}`;

export interface TenantLock {
  tenantId: string;
  lockedAt: Date;
  lockedBy: string;
  lockType: string;
  expiresAt: Date;
}

/**
 * Acquire an exclusive lock for a tenant
 * Returns true if lock was acquired, false if already locked
 */
export async function acquireTenantLock(
  tenantId: string,
  lockType: string = 'autonomous_cycle',
  durationMinutes: number = LOCK_DURATION_MINUTES
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  try {
    // Use the database function for atomic lock acquisition
    const { data, error } = await supabase.rpc('acquire_tenant_lock', {
      p_tenant_id: tenantId,
      p_locked_by: INSTANCE_ID,
      p_lock_type: lockType,
      p_lock_duration_minutes: durationMinutes,
    });

    if (error) {
      console.error(`[TenantLock] Error acquiring lock for tenant ${tenantId}:`, error);
      return false;
    }

    const acquired = data === true;

    if (acquired) {
      console.log(`[TenantLock] Lock acquired for tenant ${tenantId} by ${INSTANCE_ID}`);
    } else {
      console.log(`[TenantLock] Lock already held for tenant ${tenantId}`);
    }

    return acquired;
  } catch (error) {
    console.error(`[TenantLock] Exception acquiring lock:`, error);
    return false;
  }
}

/**
 * Release a tenant lock
 */
export async function releaseTenantLock(tenantId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase.rpc('release_tenant_lock', {
      p_tenant_id: tenantId,
      p_locked_by: INSTANCE_ID,
    });

    if (error) {
      console.error(`[TenantLock] Error releasing lock for tenant ${tenantId}:`, error);
      return false;
    }

    console.log(`[TenantLock] Lock released for tenant ${tenantId}`);
    return true;
  } catch (error) {
    console.error(`[TenantLock] Exception releasing lock:`, error);
    return false;
  }
}

/**
 * Extend a lock's expiration time
 */
export async function extendTenantLock(
  tenantId: string,
  additionalMinutes: number = LOCK_DURATION_MINUTES
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  try {
    const { error } = await supabase
      .from('agent_tenant_locks')
      .update({
        expires_at: new Date(Date.now() + additionalMinutes * 60 * 1000).toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('locked_by', INSTANCE_ID);

    if (error) {
      console.error(`[TenantLock] Error extending lock for tenant ${tenantId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[TenantLock] Exception extending lock:`, error);
    return false;
  }
}

/**
 * Check if a tenant is currently locked
 */
export async function isTenantLocked(tenantId: string): Promise<TenantLock | null> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from('agent_tenant_locks')
      .select('*')
      .eq('tenant_id', tenantId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return {
      tenantId: data.tenant_id,
      lockedAt: new Date(data.locked_at),
      lockedBy: data.locked_by,
      lockType: data.lock_type,
      expiresAt: new Date(data.expires_at),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Clean up expired locks (called periodically)
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from('agent_tenant_locks')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('tenant_id');

    if (error) {
      console.error(`[TenantLock] Error cleaning up expired locks:`, error);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      console.log(`[TenantLock] Cleaned up ${count} expired locks`);
    }

    return count;
  } catch (error) {
    console.error(`[TenantLock] Exception cleaning up locks:`, error);
    return 0;
  }
}

/**
 * Get all active locks (for monitoring)
 */
export async function getActiveLocks(): Promise<TenantLock[]> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from('agent_tenant_locks')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('locked_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((lock) => ({
      tenantId: lock.tenant_id,
      lockedAt: new Date(lock.locked_at),
      lockedBy: lock.locked_by,
      lockType: lock.lock_type,
      expiresAt: new Date(lock.expires_at),
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Execute a function with a tenant lock
 * Automatically acquires and releases the lock
 */
export async function withTenantLock<T>(
  tenantId: string,
  fn: () => Promise<T>,
  options: {
    lockType?: string;
    durationMinutes?: number;
    extendInterval?: number; // Extend lock every N milliseconds
  } = {}
): Promise<{ success: boolean; result?: T; error?: string }> {
  const {
    lockType = 'autonomous_cycle',
    durationMinutes = LOCK_DURATION_MINUTES,
    extendInterval = 60000, // Extend every minute by default
  } = options;

  // Try to acquire lock
  const acquired = await acquireTenantLock(tenantId, lockType, durationMinutes);

  if (!acquired) {
    return {
      success: false,
      error: `Could not acquire lock for tenant ${tenantId}`,
    };
  }

  // Set up lock extension interval
  let extendIntervalId: NodeJS.Timeout | null = null;
  if (extendInterval > 0) {
    extendIntervalId = setInterval(async () => {
      await extendTenantLock(tenantId, durationMinutes);
    }, extendInterval);
  }

  try {
    const result = await fn();
    return { success: true, result };
  } catch (error: any) {
    console.error(`[TenantLock] Error during locked execution:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error during locked execution',
    };
  } finally {
    // Clear extension interval
    if (extendIntervalId) {
      clearInterval(extendIntervalId);
    }

    // Always release the lock
    await releaseTenantLock(tenantId);
  }
}
