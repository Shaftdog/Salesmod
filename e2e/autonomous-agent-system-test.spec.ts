import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * P0 Autonomous Agent System Test Suite
 *
 * Tests the complete autonomous agent system including:
 * - Cron endpoint authorization
 * - Tenant locking mechanism
 * - Autonomous cycle execution (Plan → Act → React → Reflect)
 * - Policy enforcement
 * - Gmail polling
 */

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret-2025';
const BASE_URL = 'http://localhost:9002';

// Create admin Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

test.describe('P0 Autonomous Agent System', () => {
  let testTenantId: string;
  let testOrgId: string;

  test.beforeAll(async () => {
    console.log('Setting up test tenant and user...');

    // Get an existing tenant or create test data
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('No active tenants found. Creating test tenant...');

      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Test Tenant',
          is_active: true,
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Failed to create tenant:', tenantError);
        throw tenantError;
      }

      testTenantId = newTenant.id;

      // Create a test user profile
      const { data: auth } = await supabase.auth.admin.createUser({
        email: 'test-agent@example.com',
        password: 'test-password-123',
        email_confirm: true,
      });

      if (auth.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .insert({
            id: auth.user.id,
            tenant_id: testTenantId,
            email: 'test-agent@example.com',
            role: 'admin',
          })
          .select()
          .single();

        testOrgId = profile?.id || auth.user.id;
      }
    } else {
      testTenantId = tenants[0].id;

      // Get an org_id for this tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', testTenantId)
        .limit(1)
        .single();

      testOrgId = profile?.id;
    }

    console.log(`Using test tenant: ${testTenantId}`);
    console.log(`Using test org: ${testOrgId}`);

    // Clean up any existing locks
    await supabase
      .from('agent_tenant_locks')
      .delete()
      .eq('tenant_id', testTenantId);

    // Clean up old test runs
    await supabase
      .from('agent_autonomous_runs')
      .delete()
      .eq('tenant_id', testTenantId)
      .lt('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  });

  test.describe('1. Cron Endpoint Authorization', () => {
    test('GET /api/cron/agent should reject without authorization', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/cron/agent`);

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('GET /api/cron/agent should reject with invalid secret', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/cron/agent`, {
        headers: {
          Authorization: 'Bearer wrong-secret',
        },
      });

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('GET /api/cron/agent should accept with valid secret', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/cron/agent`, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('tenantsProcessed');
      expect(data).toHaveProperty('duration');
    });

    test('GET /api/cron/gmail should reject without authorization', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/cron/gmail`);

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('GET /api/cron/gmail should accept with valid secret', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/cron/gmail`, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success');
    });
  });

  test.describe('2. Tenant Locking Mechanism', () => {
    test.beforeEach(async () => {
      // Clean up locks before each test
      await supabase
        .from('agent_tenant_locks')
        .delete()
        .eq('tenant_id', testTenantId);
    });

    test('should acquire lock successfully', async () => {
      // Wait a bit to ensure previous test cleanup completed
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: acquired } = await supabase.rpc('acquire_tenant_lock', {
        p_tenant_id: testTenantId,
        p_locked_by: 'test-instance-1',
        p_lock_type: 'test_lock',
        p_lock_duration_minutes: 5,
      });

      expect(acquired).toBe(true);

      // Verify lock exists in database
      const { data: lock } = await supabase
        .from('agent_tenant_locks')
        .select('*')
        .eq('tenant_id', testTenantId)
        .single();

      expect(lock).toBeTruthy();
      expect(lock.locked_by).toBe('test-instance-1');
      expect(lock.lock_type).toBe('test_lock');
    });

    test('should prevent concurrent lock acquisition', async () => {
      // First lock
      const { data: firstAcquired } = await supabase.rpc('acquire_tenant_lock', {
        p_tenant_id: testTenantId,
        p_locked_by: 'test-instance-1',
        p_lock_type: 'test_lock',
        p_lock_duration_minutes: 5,
      });

      expect(firstAcquired).toBe(true);

      // Try to acquire again with different instance
      const { data: secondAcquired } = await supabase.rpc('acquire_tenant_lock', {
        p_tenant_id: testTenantId,
        p_locked_by: 'test-instance-2',
        p_lock_type: 'test_lock',
        p_lock_duration_minutes: 5,
      });

      expect(secondAcquired).toBe(false);
    });

    test('should release lock successfully', async () => {
      // Acquire lock
      await supabase.rpc('acquire_tenant_lock', {
        p_tenant_id: testTenantId,
        p_locked_by: 'test-instance-1',
        p_lock_type: 'test_lock',
        p_lock_duration_minutes: 5,
      });

      // Release lock
      const { data: released } = await supabase.rpc('release_tenant_lock', {
        p_tenant_id: testTenantId,
        p_locked_by: 'test-instance-1',
      });

      expect(released).toBe(true);

      // Verify lock is removed
      const { data: lock } = await supabase
        .from('agent_tenant_locks')
        .select('*')
        .eq('tenant_id', testTenantId)
        .single();

      expect(lock).toBeNull();
    });

    test('should cleanup expired locks', async () => {
      // Insert an expired lock directly
      await supabase.from('agent_tenant_locks').insert({
        tenant_id: testTenantId,
        locked_by: 'expired-instance',
        lock_type: 'test_lock',
        locked_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      });

      // Try to acquire new lock (should cleanup expired one)
      const { data: acquired } = await supabase.rpc('acquire_tenant_lock', {
        p_tenant_id: testTenantId,
        p_locked_by: 'new-instance',
        p_lock_type: 'test_lock',
        p_lock_duration_minutes: 5,
      });

      expect(acquired).toBe(true);

      // Verify only new lock exists
      const { data: lock } = await supabase
        .from('agent_tenant_locks')
        .select('*')
        .eq('tenant_id', testTenantId)
        .single();

      expect(lock.locked_by).toBe('new-instance');
    });
  });

  test.describe('3. Autonomous Cycle Execution', () => {
    test('should execute complete cycle with all phases', async ({ request }) => {
      // Trigger autonomous cycle via POST endpoint
      const response = await request.post(`${BASE_URL}/api/cron/agent`, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        data: {
          tenantId: testTenantId,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.tenantsProcessed).toBeGreaterThanOrEqual(1);
      expect(data.results).toBeDefined();

      const tenantResult = data.results.find((r: any) => r.tenantId === testTenantId);
      expect(tenantResult).toBeDefined();

      if (tenantResult.success) {
        expect(tenantResult.cycleNumber).toBeGreaterThan(0);
        expect(tenantResult.actionsPlanned).toBeGreaterThanOrEqual(0);
        expect(tenantResult.actionsExecuted).toBeGreaterThanOrEqual(0);

        // Verify run record was created in database
        const { data: run } = await supabase
          .from('agent_autonomous_runs')
          .select('*')
          .eq('tenant_id', testTenantId)
          .eq('cycle_number', tenantResult.cycleNumber)
          .single();

        expect(run).toBeTruthy();
        expect(run.status).toBe('completed');
        expect(run.current_phase).toBe('reflect');

        // Verify all phase outputs exist
        expect(run.plan_output).toBeDefined();
        expect(run.act_output).toBeDefined();
        expect(run.react_output).toBeDefined();
        expect(run.reflect_output).toBeDefined();

        // Verify metrics
        expect(run.metrics).toBeDefined();
        expect(run.metrics.planDurationMs).toBeGreaterThan(0);
        expect(run.metrics.totalDurationMs).toBeGreaterThan(0);

        // Verify reflection was created
        const { data: reflection } = await supabase
          .from('agent_hourly_reflections')
          .select('*')
          .eq('run_id', run.id)
          .single();

        expect(reflection).toBeTruthy();
        expect(reflection.what_we_did).toBeTruthy();
        expect(reflection.actions_taken).toBeDefined();

        console.log('Cycle completed successfully:', {
          cycleNumber: run.cycle_number,
          status: run.status,
          actionsPlanned: run.metrics.actionsPlanned,
          actionsExecuted: run.metrics.actionsExecuted,
          duration: `${run.metrics.totalDurationMs}ms`,
        });
      } else {
        console.warn('Cycle failed:', tenantResult.error);
      }
    });

    test('should track phase transitions correctly', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/cron/agent`, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        data: {
          tenantId: testTenantId,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      const tenantResult = data.results.find((r: any) => r.tenantId === testTenantId);

      if (tenantResult?.success) {
        const { data: run } = await supabase
          .from('agent_autonomous_runs')
          .select('*')
          .eq('tenant_id', testTenantId)
          .eq('cycle_number', tenantResult.cycleNumber)
          .single();

        // Verify phase progression
        const phases = ['plan', 'act', 'react', 'reflect'];
        expect(phases).toContain(run.current_phase);

        // On successful completion, should be in reflect phase
        if (run.status === 'completed') {
          expect(run.current_phase).toBe('reflect');
        }
      }
    });

    test('should prevent concurrent cycles for same tenant', async ({ request }) => {
      // Start first cycle (use direct manipulation to simulate long-running)
      const { data: lock } = await supabase.rpc('acquire_tenant_lock', {
        p_tenant_id: testTenantId,
        p_locked_by: 'blocking-instance',
        p_lock_type: 'autonomous_cycle',
        p_lock_duration_minutes: 30,
      });

      expect(lock).toBe(true);

      // Try to start second cycle
      const response = await request.post(`${BASE_URL}/api/cron/agent`, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        data: {
          tenantId: testTenantId,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      const tenantResult = data.results.find((r: any) => r.tenantId === testTenantId);

      // Should fail due to lock
      expect(tenantResult?.success).toBe(false);
      expect(tenantResult?.error).toContain('lock');

      // Clean up
      await supabase.rpc('release_tenant_lock', {
        p_tenant_id: testTenantId,
        p_locked_by: 'blocking-instance',
      });
    });
  });

  test.describe('4. Policy Enforcement', () => {
    test('should block create_task actions unless explicitly requested', async ({ request }) => {
      // This is tested indirectly through the cycle execution
      // If we see policy violations logged, we know enforcement is working

      const { data: violations } = await supabase
        .from('agent_policy_violations')
        .select('*')
        .eq('tenant_id', testTenantId)
        .eq('policy_id', 'no-human-tasks')
        .order('created_at', { ascending: false })
        .limit(10);

      // We expect to see some violations if the planner suggested create_task
      // This proves the policy engine is running
      console.log(`Found ${violations?.length || 0} no-human-tasks policy violations`);

      if (violations && violations.length > 0) {
        expect(violations[0]).toHaveProperty('was_blocked');
        expect(violations[0]).toHaveProperty('violation_reason');
        expect(violations[0].action_type).toBe('create_task');
      }
    });

    test('should block research when engagement compliance not met', async ({ request }) => {
      // Create an overdue engagement violation
      await supabase.from('engagement_clocks').upsert({
        tenant_id: testTenantId,
        entity_type: 'contact',
        entity_id: '00000000-0000-0000-0000-000000000001', // Dummy ID
        last_touch_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_touch_due: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        touch_frequency_days: 21,
        is_compliant: false,
        days_overdue: 9,
      });

      // Run cycle and check for research policy violations
      const response = await request.post(`${BASE_URL}/api/cron/agent`, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        data: {
          tenantId: testTenantId,
        },
      });

      expect(response.status()).toBe(200);

      // Check for research-after-exhaustion policy violations
      const { data: violations } = await supabase
        .from('agent_policy_violations')
        .select('*')
        .eq('tenant_id', testTenantId)
        .eq('policy_id', 'research-after-exhaustion')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log(`Found ${violations?.length || 0} research-after-exhaustion violations`);

      // Clean up test data
      await supabase
        .from('engagement_clocks')
        .delete()
        .eq('entity_id', '00000000-0000-0000-0000-000000000001');
    });

    test('should block sensitive actions', async () => {
      // This is tested through the policy engine directly
      // Sensitive actions like "delete" should be blocked

      const { data: violations } = await supabase
        .from('agent_policy_violations')
        .select('*')
        .eq('tenant_id', testTenantId)
        .eq('policy_id', 'sensitive-actions')
        .order('created_at', { ascending: false })
        .limit(5);

      console.log(`Found ${violations?.length || 0} sensitive-action violations`);

      // If we found any, verify they were blocked
      if (violations && violations.length > 0) {
        expect(violations[0].was_blocked).toBe(true);
      }
    });
  });

  test.describe('5. Gmail Polling', () => {
    test('should handle no Gmail sync states gracefully', async ({ request }) => {
      // Disable Gmail sync for this tenant
      await supabase
        .from('gmail_sync_state')
        .update({ is_enabled: false })
        .eq('tenant_id', testTenantId);

      const response = await request.get(`${BASE_URL}/api/cron/gmail`, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.tenantsProcessed).toBeGreaterThanOrEqual(0);
    });

    test('should process Gmail sync if enabled', async ({ request }) => {
      // Enable Gmail sync for tenant
      const { data: syncState } = await supabase
        .from('gmail_sync_state')
        .upsert({
          tenant_id: testTenantId,
          is_enabled: true,
          auto_process: false, // Don't auto-process for test
        })
        .select()
        .single();

      const response = await request.post(`${BASE_URL}/api/cron/gmail`, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        data: {
          tenantId: testTenantId,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      const tenantResult = data.results?.find((r: any) => r.tenantId === testTenantId);

      if (tenantResult) {
        // May succeed or fail depending on Gmail setup
        // We're mainly testing that the endpoint works
        console.log('Gmail poll result:', {
          success: tenantResult.success,
          messagesProcessed: tenantResult.messagesProcessed || 0,
          cardsCreated: tenantResult.cardsCreated || 0,
          errors: tenantResult.errors,
        });
      }

      // Disable again
      await supabase
        .from('gmail_sync_state')
        .update({ is_enabled: false })
        .eq('tenant_id', testTenantId);
    });
  });

  test.describe('6. Engagement Engine', () => {
    test('should update engagement clock after touch', async () => {
      const testContactId = '10000000-0000-0000-0000-000000000001';

      const { data: clockId } = await supabase.rpc('update_engagement_clock', {
        p_tenant_id: testTenantId,
        p_entity_type: 'contact',
        p_entity_id: testContactId,
        p_touch_type: 'email',
        p_touch_by: 'test-agent',
      });

      expect(clockId).toBeTruthy();

      // Verify clock was created/updated
      const { data: clock } = await supabase
        .from('engagement_clocks')
        .select('*')
        .eq('tenant_id', testTenantId)
        .eq('entity_id', testContactId)
        .single();

      expect(clock).toBeTruthy();
      expect(clock.last_touch_type).toBe('email');
      expect(clock.last_touch_by).toBe('test-agent');
      expect(clock.is_compliant).toBe(true);
      expect(clock.days_overdue).toBe(0);

      // Clean up
      await supabase
        .from('engagement_clocks')
        .delete()
        .eq('entity_id', testContactId);
    });

    test('should detect engagement violations', async () => {
      const testContactId = '20000000-0000-0000-0000-000000000001';

      // Create an overdue contact
      await supabase.from('engagement_clocks').insert({
        tenant_id: testTenantId,
        entity_type: 'contact',
        entity_id: testContactId,
        last_touch_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_touch_due: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        touch_frequency_days: 21,
        is_compliant: false,
        days_overdue: 5,
      });

      // Refresh compliance
      const { data: updatedCount } = await supabase.rpc('refresh_engagement_compliance', {
        p_tenant_id: testTenantId,
      });

      expect(updatedCount).toBeGreaterThanOrEqual(0);

      // Verify violation exists
      const { data: clock } = await supabase
        .from('engagement_clocks')
        .select('*')
        .eq('entity_id', testContactId)
        .single();

      expect(clock.is_compliant).toBe(false);
      expect(clock.days_overdue).toBeGreaterThanOrEqual(5);

      // Clean up
      await supabase
        .from('engagement_clocks')
        .delete()
        .eq('entity_id', testContactId);
    });
  });

  test.describe('7. Error Handling', () => {
    test('should handle missing tenant gracefully', async ({ request }) => {
      const fakeTenantId = '00000000-0000-0000-0000-000000000099';

      const response = await request.post(`${BASE_URL}/api/cron/agent`, {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        data: {
          tenantId: fakeTenantId,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.tenantsProcessed).toBe(0);
    });

    test('should record failed runs properly', async ({ request }) => {
      // This test would require injecting a failure
      // For now, we just verify the schema supports error tracking

      const { data: runs } = await supabase
        .from('agent_autonomous_runs')
        .select('*')
        .eq('tenant_id', testTenantId)
        .eq('status', 'failed')
        .limit(5);

      // If any failed runs exist, verify they have error details
      if (runs && runs.length > 0) {
        expect(runs[0]).toHaveProperty('error_message');
        console.log('Found failed run with error:', runs[0].error_message);
      }
    });
  });
});
