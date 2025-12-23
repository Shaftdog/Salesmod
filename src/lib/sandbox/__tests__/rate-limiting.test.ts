/**
 * Sandbox Rate Limiting Tests
 * Tests for max_sandbox_jobs_per_hour enforcement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock functions so they're available when vi.mock runs
const { mockGetAgentConfig, mockCheckRateLimit, mockRecordAlert, mockGetTemplateByName, mockExecuteTemplate } = vi.hoisted(() => ({
  mockGetAgentConfig: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockRecordAlert: vi.fn(),
  mockGetTemplateByName: vi.fn(),
  mockExecuteTemplate: vi.fn(),
}));

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'exec-1' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    rpc: vi.fn(),
  })),
}));

vi.mock('@/lib/agent/agent-config', () => ({
  getAgentConfig: mockGetAgentConfig,
  checkRateLimit: mockCheckRateLimit,
  recordAlert: mockRecordAlert,
}));

vi.mock('../templates', () => ({
  getTemplateByName: mockGetTemplateByName,
  executeTemplate: mockExecuteTemplate,
}));

import { executeSandboxJob } from '../executor';

describe('Sandbox Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeSandboxJob - Rate Limit Enforcement', () => {
    it('should reject execution when rate limit is exceeded', async () => {
      // Mock rate limit exceeded
      mockGetAgentConfig.mockResolvedValue({
        globalEnabled: true,
        tenantEnabled: true,
        maxActionsPerHour: 100,
        maxEmailsPerHour: 20,
        maxEmailsPerDay: 100,
        maxSandboxJobsPerHour: 10,
        maxBrowserJobsPerHour: 5,
      });

      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        currentCount: 11,
        maxAllowed: 10,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString(),
      });

      const result = await executeSandboxJob('tenant-1', {
        templateName: 'parse_pdf',
        inputParams: { filePath: '/test.pdf' },
        triggeredBy: 'agent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.error).toContain('11/10');
      expect(mockRecordAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rate_limit_exceeded',
          severity: 'warning',
          tenantId: 'tenant-1',
        })
      );
    });

    it('should allow execution when rate limit is not exceeded', async () => {
      // Mock rate limit OK
      mockGetAgentConfig.mockResolvedValue({
        globalEnabled: true,
        tenantEnabled: true,
        maxActionsPerHour: 100,
        maxEmailsPerHour: 20,
        maxEmailsPerDay: 100,
        maxSandboxJobsPerHour: 10,
        maxBrowserJobsPerHour: 5,
      });

      mockCheckRateLimit.mockResolvedValue({
        allowed: true,
        currentCount: 5,
        maxAllowed: 10,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString(),
      });

      // Mock template not found (to short-circuit the test)
      mockGetTemplateByName.mockResolvedValue(null);

      const result = await executeSandboxJob('tenant-1', {
        templateName: 'parse_pdf',
        inputParams: { filePath: '/test.pdf' },
        triggeredBy: 'agent',
      });

      // Template not found, but rate limit check passed
      expect(result.error).toContain('Template not found');
      expect(mockRecordAlert).not.toHaveBeenCalled();
    });

    it('should use tenant-specific rate limit from config', async () => {
      // Mock tenant with custom rate limit
      mockGetAgentConfig.mockResolvedValue({
        globalEnabled: true,
        tenantEnabled: true,
        maxActionsPerHour: 100,
        maxEmailsPerHour: 20,
        maxEmailsPerDay: 100,
        maxSandboxJobsPerHour: 20, // Custom higher limit
        maxBrowserJobsPerHour: 5,
      });

      mockCheckRateLimit.mockResolvedValue({
        allowed: true,
        currentCount: 15,
        maxAllowed: 20,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString(),
      });

      mockGetTemplateByName.mockResolvedValue(null);

      await executeSandboxJob('tenant-premium', {
        templateName: 'parse_pdf',
        inputParams: {},
        triggeredBy: 'agent',
      });

      // Verify rate limit was checked with correct max
      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        'tenant-premium',
        'sandbox_job',
        20 // Custom limit
      );
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should default to 10 sandbox jobs per hour', async () => {
      mockGetAgentConfig.mockResolvedValue({
        globalEnabled: true,
        tenantEnabled: true,
        maxActionsPerHour: 100,
        maxEmailsPerHour: 20,
        maxEmailsPerDay: 100,
        maxSandboxJobsPerHour: 10, // Default
        maxBrowserJobsPerHour: 5,
      });

      mockCheckRateLimit.mockResolvedValue({
        allowed: true,
        currentCount: 1,
        maxAllowed: 10,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString(),
      });

      mockGetTemplateByName.mockResolvedValue(null);

      await executeSandboxJob('tenant-1', {
        templateName: 'test',
        inputParams: {},
        triggeredBy: 'agent',
      });

      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        'tenant-1',
        'sandbox_job',
        10
      );
    });
  });
});
