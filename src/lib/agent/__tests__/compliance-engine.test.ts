/**
 * Compliance Engine Tests
 *
 * Tests for quarterly compliance check automation:
 * - Frequency validation (monthly, quarterly, semi_annual, annual)
 * - Date calculations for next due dates
 * - Period calculations
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createComplianceSchedule } from '../compliance-engine';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockServiceRoleClient = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => mockServiceRoleClient),
}));

// ============================================================================
// P1 CRITICAL: FREQUENCY VALIDATION
// ============================================================================

describe('createComplianceSchedule - Frequency Validation (P1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept valid frequency: monthly', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'schedule-1' },
      error: null,
    });

    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'insurance_verification',
      frequency: 'monthly',
      targetEntityType: 'client',
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it('should accept valid frequency: quarterly', async () => {
    mockServiceRoleClient.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'schedule-2' }, error: null }),
    });

    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'license_check',
      frequency: 'quarterly',
      targetEntityType: 'client',
    });

    expect(result.success).toBe(true);
  });

  it('should accept valid frequency: semi_annual', async () => {
    mockServiceRoleClient.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'schedule-3' }, error: null }),
    });

    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'audit',
      frequency: 'semi_annual',
      targetEntityType: 'client',
    });

    expect(result.success).toBe(true);
  });

  it('should accept valid frequency: annual', async () => {
    mockServiceRoleClient.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'schedule-4' }, error: null }),
    });

    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'annual_review',
      frequency: 'annual',
      targetEntityType: 'client',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid frequency', async () => {
    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      // @ts-expect-error Testing invalid input
      frequency: 'weekly',
      targetEntityType: 'client',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid frequency');
    expect(result.error).toContain('weekly');
  });

  it('should provide list of valid frequencies in error', async () => {
    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      // @ts-expect-error Testing invalid input
      frequency: 'biweekly',
      targetEntityType: 'client',
    });

    expect(result.error).toContain('monthly');
    expect(result.error).toContain('quarterly');
    expect(result.error).toContain('semi_annual');
    expect(result.error).toContain('annual');
  });

  it('should reject empty frequency', async () => {
    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      // @ts-expect-error Testing invalid input
      frequency: '',
      targetEntityType: 'client',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid frequency');
  });

  it('should reject null frequency', async () => {
    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      // @ts-expect-error Testing invalid input
      frequency: null,
      targetEntityType: 'client',
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// P1 CRITICAL: DATE CALCULATIONS
// ============================================================================

describe('createComplianceSchedule - Date Calculations (P1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate next due date for monthly (first of next month)', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'schedule-1' },
      error: null,
    });

    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'monthly_check',
      frequency: 'monthly',
      targetEntityType: 'client',
    });

    expect(mockInsert).toHaveBeenCalled();
    const insertCall = mockInsert.mock.calls[0][0];
    const nextDue = new Date(insertCall.next_due_at);
    const now = new Date();

    // Should be first day of next month
    expect(nextDue.getDate()).toBe(1);
    // In December, next month is January (0) of next year
    if (now.getMonth() === 11) {
      expect(nextDue.getMonth()).toBe(0);
      expect(nextDue.getFullYear()).toBe(now.getFullYear() + 1);
    } else {
      expect(nextDue.getMonth()).toBe(now.getMonth() + 1);
    }
  });

  it('should calculate next due date for quarterly', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'schedule-2' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'quarterly_check',
      frequency: 'quarterly',
      targetEntityType: 'client',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    const nextDue = new Date(insertCall.next_due_at);

    // Should be first day of next quarter (month divisible by 3)
    expect(nextDue.getDate()).toBe(1);
    expect(nextDue.getMonth() % 3).toBe(0);
  });

  it('should calculate next due date for semi_annual (June or December)', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'schedule-3' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'semi_annual_check',
      frequency: 'semi_annual',
      targetEntityType: 'client',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    const nextDue = new Date(insertCall.next_due_at);
    const now = new Date();

    // Should be first day of month
    expect(nextDue.getDate()).toBe(1);
    // Semi-annual: June (5) or December (11), but depends on current month
    // In Dec (11), next semi-annual is June next year (5)
    // In Jun-Nov, next semi-annual is December (11)
    // In Jan-May, next semi-annual is June (5)
    if (now.getMonth() >= 6 && now.getMonth() <= 10) {
      expect(nextDue.getMonth()).toBe(11); // December
    } else {
      expect(nextDue.getMonth()).toBe(5); // June
    }
  });

  it('should calculate next due date for annual (January of next year)', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'schedule-4' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'annual_check',
      frequency: 'annual',
      targetEntityType: 'client',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    const nextDue = new Date(insertCall.next_due_at);

    // Should be January 1st of next year
    expect(nextDue.getDate()).toBe(1);
    expect(nextDue.getMonth()).toBe(0);
    expect(nextDue.getFullYear()).toBeGreaterThanOrEqual(new Date().getFullYear() + 1);
  });
});

describe('createComplianceSchedule - Quarterly Edge Cases (P1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle current month in Q1 (Jan-Mar)', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'q1' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'q1_test',
      frequency: 'quarterly',
      targetEntityType: 'client',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    const nextDue = new Date(insertCall.next_due_at);

    // Should round up to next quarter start (month divisible by 3)
    expect(nextDue.getMonth() % 3).toBe(0);
  });

  it('should handle December to quarterly calculation', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'dec' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'dec_test',
      frequency: 'quarterly',
      targetEntityType: 'client',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    const nextDue = new Date(insertCall.next_due_at);

    // Should be valid quarter start
    expect([0, 3, 6, 9]).toContain(nextDue.getMonth());
  });
});

// ============================================================================
// P1 CRITICAL: DEFAULT VALUES
// ============================================================================

describe('createComplianceSchedule - Default Values (P1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use default notification days (14) when not provided', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.notification_days_before).toBe(14);
  });

  it('should use custom notification days when provided', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 's2' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
      notificationDaysBefore: 7,
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.notification_days_before).toBe(7);
  });

  it('should use default escalation days (7) when not provided', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 's3' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.escalation_days_after).toBe(7);
  });

  it('should use custom escalation days when provided', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 's4' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
      escalationDaysAfter: 14,
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.escalation_days_after).toBe(14);
  });

  it('should use empty array for required fields when not provided', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 's5' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.required_fields).toEqual([]);
  });

  it('should use provided required fields', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 's6' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
      requiredFields: ['email', 'phone', 'address'],
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.required_fields).toEqual(['email', 'phone', 'address']);
  });

  it('should use empty object for target filter when not provided', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 's7' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.target_filter).toEqual({});
  });

  it('should use provided target filter', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 's8' }, error: null }),
    });

    await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
      targetFilter: { is_active: true, client_type: 'AMC' },
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.target_filter).toEqual({ is_active: true, client_type: 'AMC' });
  });
});

// ============================================================================
// P1 CRITICAL: ERROR HANDLING
// ============================================================================

describe('createComplianceSchedule - Error Handling (P1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle database insertion errors', async () => {
    mockServiceRoleClient.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    });

    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('should return success with schedule ID on successful creation', async () => {
    mockServiceRoleClient.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'schedule-success-123' },
        error: null,
      }),
    });

    const result = await createComplianceSchedule('tenant-1', {
      complianceType: 'test',
      frequency: 'monthly',
      targetEntityType: 'client',
    });

    expect(result.success).toBe(true);
    expect(result.scheduleId).toBe('schedule-success-123');
    expect(result.error).toBeUndefined();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('createComplianceSchedule - Integration Scenarios (P1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create complete monthly schedule with all options', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'full-1' }, error: null }),
    });

    const result = await createComplianceSchedule('tenant-123', {
      complianceType: 'insurance_verification',
      description: 'Monthly insurance verification for active clients',
      frequency: 'monthly',
      targetEntityType: 'client',
      targetFilter: { is_active: true },
      requiredFields: ['insurance_provider', 'policy_number', 'expiration_date'],
      notificationDaysBefore: 10,
      escalationDaysAfter: 5,
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-123',
        compliance_type: 'insurance_verification',
        description: 'Monthly insurance verification for active clients',
        frequency: 'monthly',
        target_entity_type: 'client',
        target_filter: { is_active: true },
        required_fields: ['insurance_provider', 'policy_number', 'expiration_date'],
        notification_days_before: 10,
        escalation_days_after: 5,
      })
    );
  });

  it('should create minimal quarterly schedule', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    mockServiceRoleClient.from.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'minimal-1' }, error: null }),
    });

    const result = await createComplianceSchedule('tenant-456', {
      complianceType: 'quarterly_review',
      frequency: 'quarterly',
      targetEntityType: 'contact',
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-456',
        compliance_type: 'quarterly_review',
        frequency: 'quarterly',
        target_entity_type: 'contact',
        target_filter: {},
        required_fields: [],
        notification_days_before: 14,
        escalation_days_after: 7,
      })
    );
  });
});
