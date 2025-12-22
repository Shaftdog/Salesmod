/**
 * Compliance Engine - Quarterly verification automation
 *
 * Manages periodic compliance checks:
 * - Schedule-based check generation
 * - Required field validation
 * - Reminder and escalation workflow
 * - Completion tracking
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface ComplianceSchedule {
  id: string;
  tenantId: string;
  complianceType: string;
  description: string | null;
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  nextDueAt: Date;
  lastCompletedAt: Date | null;
  targetEntityType: string;
  targetFilter: Record<string, any>;
  requiredFields: string[];
  notificationDaysBefore: number;
  escalationDaysAfter: number;
  isActive: boolean;
}

export interface ComplianceCheck {
  id: string;
  tenantId: string;
  scheduleId: string | null;
  entityType: string;
  entityId: string;
  entityName: string | null;
  periodStart: Date;
  periodEnd: Date;
  dueAt: Date;
  status: 'pending' | 'in_progress' | 'awaiting_response' | 'completed' | 'overdue' | 'escalated' | 'waived';
  requiredFields: string[];
  missingFields: string[];
  validationErrors: string[];
  reminderCount: number;
  reminderSentAt: Date | null;
  escalationSentAt: Date | null;
  completedAt: Date | null;
}

export interface ComplianceDueItem {
  id: string;
  checkId: string;
  scheduleId: string | null;
  entityType: string;
  entityId: string;
  entityName: string | null;
  complianceType: string;
  dueAt: Date;
  status: string;
  daysUntilDue: number;
  isOverdue: boolean;
  reminderCount: number;
  missingFields: string[];
}

export interface ComplianceReminderResult {
  success: boolean;
  message: string;
  cardId?: string;
  error?: string;
}

// ============================================================================
// Schedule Management
// ============================================================================

/**
 * Create a compliance schedule
 */
export async function createComplianceSchedule(
  tenantId: string,
  data: {
    complianceType: string;
    description?: string;
    frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
    targetEntityType: string;
    targetFilter?: Record<string, any>;
    requiredFields?: string[];
    notificationDaysBefore?: number;
    escalationDaysAfter?: number;
  }
): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
  const supabase = createServiceRoleClient();

  // Validate frequency input
  const validFrequencies = ['monthly', 'quarterly', 'semi_annual', 'annual'] as const;
  if (!validFrequencies.includes(data.frequency as typeof validFrequencies[number])) {
    return {
      success: false,
      error: `Invalid frequency: ${data.frequency}. Must be one of: ${validFrequencies.join(', ')}`,
    };
  }

  // Calculate next due date based on frequency
  const now = new Date();
  let nextDue = new Date();

  switch (data.frequency) {
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + 1);
      nextDue.setDate(1);
      break;
    case 'quarterly':
      nextDue.setMonth(Math.ceil((nextDue.getMonth() + 1) / 3) * 3);
      nextDue.setDate(1);
      break;
    case 'semi_annual':
      nextDue.setMonth(nextDue.getMonth() >= 6 ? 12 : 6);
      nextDue.setDate(1);
      break;
    case 'annual':
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      nextDue.setMonth(0);
      nextDue.setDate(1);
      break;
    default:
      // TypeScript exhaustive check
      const _exhaustive: never = data.frequency as never;
      return { success: false, error: `Unhandled frequency: ${_exhaustive}` };
  }

  const { data: schedule, error } = await supabase
    .from('compliance_schedule')
    .insert({
      tenant_id: tenantId,
      compliance_type: data.complianceType,
      description: data.description || null,
      frequency: data.frequency,
      next_due_at: nextDue.toISOString(),
      target_entity_type: data.targetEntityType,
      target_filter: data.targetFilter || {},
      required_fields: data.requiredFields || [],
      notification_days_before: data.notificationDaysBefore || 14,
      escalation_days_after: data.escalationDaysAfter || 7,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[ComplianceEngine] Error creating schedule:', error);
    return { success: false, error: error.message };
  }

  console.log(`[ComplianceEngine] Created schedule ${schedule.id} for ${data.complianceType}`);
  return { success: true, scheduleId: schedule.id };
}

/**
 * Generate compliance checks for a schedule
 */
export async function generateComplianceChecks(
  scheduleId: string
): Promise<{ success: boolean; checksCreated: number; error?: string }> {
  const supabase = createServiceRoleClient();

  // Get schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from('compliance_schedule')
    .select('*')
    .eq('id', scheduleId)
    .single();

  if (scheduleError || !schedule) {
    return { success: false, checksCreated: 0, error: 'Schedule not found' };
  }

  // Get target entities based on filter
  let entities: Array<{ id: string; name: string }> = [];

  // Whitelist of allowed filter keys to prevent SQL injection
  const ALLOWED_CLIENT_FILTERS = ['is_active', 'status', 'priority', 'tier'] as const;
  const ALLOWED_CONTACT_FILTERS = ['is_active', 'role', 'status'] as const;

  if (schedule.target_entity_type === 'client') {
    let query = supabase
      .from('clients')
      .select('id, company_name')
      .eq('tenant_id', schedule.tenant_id);

    // Apply whitelisted filters only
    const filter = schedule.target_filter as Record<string, unknown>;
    for (const key of ALLOWED_CLIENT_FILTERS) {
      if (filter[key] !== undefined) {
        query = query.eq(key, filter[key] as string | boolean);
      }
    }

    const { data } = await query;
    entities = (data || []).map(c => ({ id: c.id, name: c.company_name }));
  } else if (schedule.target_entity_type === 'contact') {
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('tenant_id', schedule.tenant_id);

    entities = (data || []).map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` }));
  }

  // Calculate period
  const dueAt = new Date(schedule.next_due_at);
  const periodEnd = new Date(dueAt);
  const periodStart = new Date(dueAt);

  switch (schedule.frequency) {
    case 'monthly':
      periodStart.setMonth(periodStart.getMonth() - 1);
      break;
    case 'quarterly':
      periodStart.setMonth(periodStart.getMonth() - 3);
      break;
    case 'semi_annual':
      periodStart.setMonth(periodStart.getMonth() - 6);
      break;
    case 'annual':
      periodStart.setFullYear(periodStart.getFullYear() - 1);
      break;
  }

  // Create checks for each entity
  let checksCreated = 0;

  for (const entity of entities) {
    const { error: insertError } = await supabase
      .from('compliance_checks')
      .insert({
        tenant_id: schedule.tenant_id,
        schedule_id: scheduleId,
        entity_type: schedule.target_entity_type,
        entity_id: entity.id,
        entity_name: entity.name,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        due_at: dueAt.toISOString(),
        required_fields: schedule.required_fields,
      });

    if (!insertError) {
      checksCreated++;
    }
  }

  // Update schedule with next due date
  const nextDue = new Date(dueAt);
  switch (schedule.frequency) {
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
    case 'quarterly':
      nextDue.setMonth(nextDue.getMonth() + 3);
      break;
    case 'semi_annual':
      nextDue.setMonth(nextDue.getMonth() + 6);
      break;
    case 'annual':
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      break;
  }

  await supabase
    .from('compliance_schedule')
    .update({ next_due_at: nextDue.toISOString() })
    .eq('id', scheduleId);

  console.log(`[ComplianceEngine] Generated ${checksCreated} checks for schedule ${scheduleId}`);
  return { success: true, checksCreated };
}

// ============================================================================
// Check Processing
// ============================================================================

/**
 * Get compliance checks that are due
 */
export async function getComplianceDue(
  tenantId: string,
  limit: number = 20
): Promise<ComplianceDueItem[]> {
  const supabase = createServiceRoleClient();

  // Use database function
  const { data, error } = await supabase.rpc('get_compliance_due', {
    p_tenant_id: tenantId,
    p_limit: limit,
  });

  if (error) {
    console.error('[ComplianceEngine] Error getting due compliance:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.check_id, // Use check_id as id for consistency
    checkId: row.check_id,
    scheduleId: row.schedule_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityName: row.entity_name,
    complianceType: row.compliance_type || 'general',
    dueAt: new Date(row.due_at),
    status: row.status,
    daysUntilDue: row.days_until_due,
    isOverdue: row.is_overdue,
    reminderCount: row.reminder_count,
    missingFields: row.missing_fields || [],
  }));
}

/**
 * Validate entity profile for required fields
 */
export async function validateEntityProfile(
  checkId: string
): Promise<{ valid: boolean; missingFields: string[]; errors: string[] }> {
  const supabase = createServiceRoleClient();

  // Get check with details
  const { data: check, error } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('id', checkId)
    .single();

  if (error || !check) {
    return { valid: false, missingFields: [], errors: ['Check not found'] };
  }

  const requiredFields = (check.required_fields as string[]) || [];
  const missingFields: string[] = [];
  const errors: string[] = [];

  // Get entity data
  let entityData: Record<string, any> | null = null;

  if (check.entity_type === 'client') {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', check.entity_id)
      .single();
    entityData = data;
  } else if (check.entity_type === 'contact') {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', check.entity_id)
      .single();
    entityData = data;
  }

  if (!entityData) {
    return { valid: false, missingFields: [], errors: ['Entity not found'] };
  }

  // Check required fields
  for (const field of requiredFields) {
    const value = entityData[field];
    if (value === null || value === undefined || value === '') {
      missingFields.push(field);
    }
  }

  // Update check with validation results
  await supabase
    .from('compliance_checks')
    .update({
      missing_fields: missingFields,
      validation_errors: errors,
      status: missingFields.length > 0 ? 'in_progress' : 'completed',
      completed_at: missingFields.length === 0 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', checkId);

  return {
    valid: missingFields.length === 0,
    missingFields,
    errors,
  };
}

/**
 * Send compliance reminder
 */
export async function sendComplianceReminder(
  checkId: string
): Promise<ComplianceReminderResult> {
  const supabase = createServiceRoleClient();

  // Get check with entity details
  const { data: check, error } = await supabase
    .from('compliance_checks')
    .select(`
      *,
      schedule:compliance_schedule(compliance_type, description)
    `)
    .eq('id', checkId)
    .single();

  if (error || !check) {
    return { success: false, message: 'Check not found', error: error?.message };
  }

  // Get entity contact email
  let contactEmail: string | null = null;
  let contactName: string | null = null;

  if (check.entity_type === 'client') {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email')
      .eq('client_id', check.entity_id)
      .eq('is_primary', true)
      .single();

    if (contact) {
      contactEmail = contact.email;
      contactName = `${contact.first_name} ${contact.last_name}`;
    }
  } else if (check.entity_type === 'contact') {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email')
      .eq('id', check.entity_id)
      .single();

    if (contact) {
      contactEmail = contact.email;
      contactName = `${contact.first_name} ${contact.last_name}`;
    }
  }

  if (!contactEmail) {
    return { success: false, message: 'No contact email available' };
  }

  // Generate reminder email
  const missingFields = (check.missing_fields as string[]) || [];
  const fieldsList = missingFields.length > 0
    ? `\n\nMissing Information:\n- ${missingFields.join('\n- ')}`
    : '';

  const emailBody = `Hi ${contactName || 'there'},

This is a reminder that your ${check.schedule?.compliance_type || 'compliance'} verification is due by ${new Date(check.due_at).toLocaleDateString()}.

${check.schedule?.description || 'Please ensure all required information is up to date.'}${fieldsList}

Please take a moment to review and update your profile.

Thank you for your cooperation.

Best regards`;

  // Create kanban card for reminder
  const { data: card, error: cardError } = await supabase
    .from('kanban_cards')
    .insert({
      tenant_id: check.tenant_id,
      type: 'send_email',
      title: `Compliance Reminder: ${check.entity_name}`,
      description: `Send ${check.schedule?.compliance_type} reminder to ${contactName}`,
      state: 'suggested',
      priority: check.status === 'overdue' ? 'high' : 'medium',
      action_payload: {
        to: contactEmail,
        subject: `Action Required: ${check.schedule?.compliance_type || 'Compliance'} Verification`,
        body: emailBody,
        complianceCheckId: checkId,
        type: 'compliance_reminder',
      },
      source: 'compliance_engine',
    })
    .select('id')
    .single();

  if (cardError) {
    return { success: false, message: 'Failed to create reminder card', error: cardError.message };
  }

  // Update check
  await supabase
    .from('compliance_checks')
    .update({
      status: 'awaiting_response',
      reminder_count: (check.reminder_count || 0) + 1,
      reminder_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', checkId);

  console.log(`[ComplianceEngine] Created reminder card ${card.id} for check ${checkId}`);
  return { success: true, message: 'Reminder scheduled', cardId: card.id };
}

/**
 * Escalate overdue compliance check
 */
export async function escalateOverdueCompliance(
  checkId: string,
  escalateTo?: string
): Promise<ComplianceReminderResult> {
  const supabase = createServiceRoleClient();

  // Get check
  const { data: check, error } = await supabase
    .from('compliance_checks')
    .select(`
      *,
      schedule:compliance_schedule(compliance_type)
    `)
    .eq('id', checkId)
    .single();

  if (error || !check) {
    return { success: false, message: 'Check not found', error: error?.message };
  }

  // Create escalation task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      tenant_id: check.tenant_id,
      title: `Escalation: ${check.schedule?.compliance_type} - ${check.entity_name}`,
      description: `Compliance check overdue for ${check.entity_name}.\n\nDue date: ${new Date(check.due_at).toLocaleDateString()}\nMissing fields: ${(check.missing_fields as string[])?.join(', ') || 'None specified'}`,
      priority: 'high',
      status: 'todo',
      assigned_to: escalateTo || null,
    })
    .select('id')
    .single();

  if (taskError) {
    return { success: false, message: 'Failed to create escalation task', error: taskError.message };
  }

  // Update check
  await supabase
    .from('compliance_checks')
    .update({
      status: 'escalated',
      escalation_sent_at: new Date().toISOString(),
      escalated_to: escalateTo || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', checkId);

  console.log(`[ComplianceEngine] Escalated check ${checkId}, created task ${task.id}`);
  return { success: true, message: 'Escalation created' };
}

/**
 * Mark compliance check as complete
 */
export async function completeComplianceCheck(
  checkId: string,
  completedBy?: string,
  notes?: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('compliance_checks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: completedBy || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', checkId);

  console.log(`[ComplianceEngine] Completed check ${checkId}`);
}

/**
 * Waive compliance check
 */
export async function waiveComplianceCheck(
  checkId: string,
  reason: string,
  waivedBy?: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('compliance_checks')
    .update({
      status: 'waived',
      waived_reason: reason,
      completed_at: new Date().toISOString(),
      completed_by: waivedBy || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', checkId);

  console.log(`[ComplianceEngine] Waived check ${checkId}: ${reason}`);
}

/**
 * Get compliance statistics for tenant
 */
export async function getComplianceStats(tenantId: string): Promise<{
  totalChecks: number;
  pending: number;
  overdue: number;
  completed: number;
  complianceRate: number;
}> {
  const supabase = createServiceRoleClient();

  const { data: checks } = await supabase
    .from('compliance_checks')
    .select('status')
    .eq('tenant_id', tenantId);

  if (!checks) {
    return {
      totalChecks: 0,
      pending: 0,
      overdue: 0,
      completed: 0,
      complianceRate: 0,
    };
  }

  const pending = checks.filter(c => ['pending', 'in_progress', 'awaiting_response'].includes(c.status)).length;
  const overdue = checks.filter(c => c.status === 'overdue').length;
  const completed = checks.filter(c => ['completed', 'waived'].includes(c.status)).length;

  return {
    totalChecks: checks.length,
    pending,
    overdue,
    completed,
    complianceRate: checks.length > 0 ? (completed / checks.length) * 100 : 0,
  };
}
