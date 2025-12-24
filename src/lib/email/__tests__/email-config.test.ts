/**
 * Email Configuration and Mode Enforcement Tests
 *
 * Tests all email sending modes:
 * - dry_run: Log only, no actual send
 * - internal_only: Send only to approved domains/emails
 * - limited_live: Send with rate limits
 * - live: Full production sending
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkEmailSendPermission,
  getEmailConfig,
  isEmailSendingDisabled,
  getEnvSendMode,
} from '../email-config';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
};

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => mockSupabaseClient,
}));

// Mock agent config to avoid rate limit checks
vi.mock('@/lib/agent/agent-config', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    currentCount: 1,
    maxAllowed: 20,
    windowStart: new Date().toISOString(),
    windowEnd: new Date().toISOString(),
  }),
}));

describe('Email Mode Enforcement', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.EMAIL_SEND_MODE;
    delete process.env.EMAIL_SEND_DISABLED;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isEmailSendingDisabled', () => {
    it('should return false when EMAIL_SEND_DISABLED is not set', () => {
      delete process.env.EMAIL_SEND_DISABLED;
      expect(isEmailSendingDisabled()).toBe(false);
    });

    it('should return true when EMAIL_SEND_DISABLED is "true"', () => {
      process.env.EMAIL_SEND_DISABLED = 'true';
      expect(isEmailSendingDisabled()).toBe(true);
    });

    it('should return false when EMAIL_SEND_DISABLED is "false"', () => {
      process.env.EMAIL_SEND_DISABLED = 'false';
      expect(isEmailSendingDisabled()).toBe(false);
    });
  });

  describe('getEnvSendMode', () => {
    it('should return null when EMAIL_SEND_MODE is not set', () => {
      delete process.env.EMAIL_SEND_MODE;
      expect(getEnvSendMode()).toBe(null);
    });

    it('should return "dry_run" when set', () => {
      process.env.EMAIL_SEND_MODE = 'dry_run';
      expect(getEnvSendMode()).toBe('dry_run');
    });

    it('should return "internal_only" when set', () => {
      process.env.EMAIL_SEND_MODE = 'internal_only';
      expect(getEnvSendMode()).toBe('internal_only');
    });

    it('should return "limited_live" when set', () => {
      process.env.EMAIL_SEND_MODE = 'limited_live';
      expect(getEnvSendMode()).toBe('limited_live');
    });

    it('should return "live" when set', () => {
      process.env.EMAIL_SEND_MODE = 'live';
      expect(getEnvSendMode()).toBe('live');
    });

    it('should return null for invalid mode', () => {
      process.env.EMAIL_SEND_MODE = 'invalid_mode';
      expect(getEnvSendMode()).toBe(null);
    });
  });

  describe('checkEmailSendPermission - dry_run mode', () => {
    beforeEach(() => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { agent_settings: { email_send_mode: 'dry_run' } },
        error: null,
      });
    });

    it('should allow send but mark as simulation', async () => {
      const result = await checkEmailSendPermission('tenant-1', 'external@gmail.com');

      expect(result.allowed).toBe(true);
      expect(result.mode).toBe('dry_run');
      expect(result.shouldSimulate).toBe(true);
      expect(result.reason).toContain('Dry-run');
    });

    it('should allow any email address in dry_run mode', async () => {
      const result = await checkEmailSendPermission('tenant-1', 'anyone@anywhere.com');

      expect(result.allowed).toBe(true);
      expect(result.shouldSimulate).toBe(true);
    });
  });

  describe('checkEmailSendPermission - internal_only mode', () => {
    beforeEach(() => {
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          agent_settings: {
            email_send_mode: 'internal_only',
            internal_email_domains: ['roiappraise.com', 'company.com'],
            internal_email_addresses: ['vip@external.com'],
          },
        },
        error: null,
      });
    });

    it('should allow send to approved domain', async () => {
      const result = await checkEmailSendPermission('tenant-1', 'user@roiappraise.com');

      expect(result.allowed).toBe(true);
      expect(result.mode).toBe('internal_only');
      expect(result.shouldSimulate).toBe(false);
    });

    it('should allow send to approved email', async () => {
      const result = await checkEmailSendPermission('tenant-1', 'vip@external.com');

      expect(result.allowed).toBe(true);
      expect(result.mode).toBe('internal_only');
      expect(result.shouldSimulate).toBe(false);
    });

    it('should BLOCK send to non-approved domain', async () => {
      const result = await checkEmailSendPermission('tenant-1', 'someone@gmail.com');

      expect(result.allowed).toBe(false);
      expect(result.mode).toBe('internal_only');
      expect(result.shouldSimulate).toBe(true);
      expect(result.reason).toContain('not in approved list');
    });

    it('should be case-insensitive for domain matching', async () => {
      const result = await checkEmailSendPermission('tenant-1', 'User@ROIAppraise.COM');

      expect(result.allowed).toBe(true);
    });

    it('should be case-insensitive for email matching', async () => {
      const result = await checkEmailSendPermission('tenant-1', 'VIP@External.COM');

      expect(result.allowed).toBe(true);
    });
  });

  describe('checkEmailSendPermission - limited_live mode', () => {
    beforeEach(() => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { agent_settings: { email_send_mode: 'limited_live' } },
        error: null,
      });
    });

    it('should allow send when within rate limit', async () => {
      const result = await checkEmailSendPermission('tenant-1', 'anyone@anywhere.com');

      expect(result.allowed).toBe(true);
      expect(result.mode).toBe('limited_live');
      expect(result.shouldSimulate).toBe(false);
    });

    it('should block when rate limit exceeded', async () => {
      const { checkRateLimit } = await import('@/lib/agent/agent-config');
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        currentCount: 21,
        maxAllowed: 20,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString(),
      });

      const result = await checkEmailSendPermission('tenant-1', 'anyone@anywhere.com');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Rate limit exceeded');
      expect(result.shouldSimulate).toBe(true);
    });
  });

  describe('checkEmailSendPermission - live mode', () => {
    beforeEach(() => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { agent_settings: { email_send_mode: 'live' } },
        error: null,
      });
    });

    it('should allow send in live mode', async () => {
      const result = await checkEmailSendPermission('tenant-1', 'anyone@anywhere.com');

      expect(result.allowed).toBe(true);
      expect(result.mode).toBe('live');
      expect(result.shouldSimulate).toBe(false);
    });

    it('should still enforce rate limits in live mode', async () => {
      const { checkRateLimit } = await import('@/lib/agent/agent-config');
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        currentCount: 100,
        maxAllowed: 20,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString(),
      });

      const result = await checkEmailSendPermission('tenant-1', 'anyone@anywhere.com');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Rate limit exceeded');
    });
  });

  describe('checkEmailSendPermission - global disable', () => {
    it('should block all sends when globally disabled', async () => {
      process.env.EMAIL_SEND_DISABLED = 'true';

      const result = await checkEmailSendPermission('tenant-1', 'anyone@anywhere.com');

      expect(result.allowed).toBe(false);
      expect(result.shouldSimulate).toBe(true);
      expect(result.reason).toContain('globally disabled');
    });
  });

  describe('checkEmailSendPermission - environment override', () => {
    it('should respect ENV override over database setting', async () => {
      process.env.EMAIL_SEND_MODE = 'dry_run';

      // Database says live, but ENV says dry_run
      mockSupabaseClient.single.mockResolvedValue({
        data: { agent_settings: { email_send_mode: 'live' } },
        error: null,
      });

      const result = await checkEmailSendPermission('tenant-1', 'anyone@anywhere.com');

      expect(result.mode).toBe('dry_run');
      expect(result.shouldSimulate).toBe(true);
    });
  });

  describe('getEmailConfig', () => {
    it('should return default config when tenant has no settings', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { agent_settings: null },
        error: null,
      });

      const config = await getEmailConfig('tenant-1');

      expect(config.sendMode).toBe('dry_run'); // Safe default
      expect(config.maxEmailsPerHour).toBe(20);
      expect(config.internalDomains).toContain('roiappraise.com');
    });

    it('should use ENV mode override', async () => {
      process.env.EMAIL_SEND_MODE = 'internal_only';

      mockSupabaseClient.single.mockResolvedValue({
        data: { agent_settings: { email_send_mode: 'live' } },
        error: null,
      });

      const config = await getEmailConfig('tenant-1');

      expect(config.sendMode).toBe('internal_only');
    });

    it('should use tenant settings when no ENV override', async () => {
      delete process.env.EMAIL_SEND_MODE;

      mockSupabaseClient.single.mockResolvedValue({
        data: {
          agent_settings: {
            email_send_mode: 'limited_live',
            max_emails_per_hour: 50,
            internal_email_domains: ['custom.com'],
          },
        },
        error: null,
      });

      const config = await getEmailConfig('tenant-1');

      expect(config.sendMode).toBe('limited_live');
      expect(config.maxEmailsPerHour).toBe(50);
      expect(config.internalDomains).toContain('custom.com');
    });
  });
});

describe('Email Mode Enforcement - Critical Safety Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should NEVER allow real send in dry_run mode', async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: { agent_settings: { email_send_mode: 'dry_run' } },
      error: null,
    });

    const result = await checkEmailSendPermission('tenant-1', 'anyone@anywhere.com');

    // This is the critical safety invariant
    expect(result.shouldSimulate).toBe(true);
  });

  it('should NEVER allow external emails in internal_only mode', async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: {
        agent_settings: {
          email_send_mode: 'internal_only',
          internal_email_domains: ['internal.com'],
          internal_email_addresses: [],
        },
      },
      error: null,
    });

    const externalEmails = [
      'user@gmail.com',
      'user@yahoo.com',
      'user@external.org',
      'user@company.net',
    ];

    for (const email of externalEmails) {
      const result = await checkEmailSendPermission('tenant-1', email);

      // Critical safety: external emails MUST be blocked or simulated
      expect(result.shouldSimulate || !result.allowed).toBe(true);
    }
  });
});
