/**
 * Production Kanban System Types and Schemas
 * 10-stage production workflow with templates, tasks, and time tracking
 */

import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const PRODUCTION_STAGES = [
  'INTAKE',
  'SCHEDULING',
  'SCHEDULED',
  'INSPECTED',
  'CORRECTION',
  'FINALIZATION',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'REVISION',
  'WORKFILE',
  'ON_HOLD',
  'CANCELLED',
] as const;

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  INTAKE: 'Intake',
  SCHEDULING: 'Scheduling',
  SCHEDULED: 'Scheduled',
  INSPECTED: 'Inspected',
  FINALIZATION: 'Finalization',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DELIVERED: 'Delivered',
  CORRECTION: 'Correction',
  REVISION: 'Revision',
  WORKFILE: 'Workfile',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
};

export const PRODUCTION_STAGE_COLORS: Record<ProductionStage, string> = {
  INTAKE: 'bg-blue-50 border-blue-200 text-blue-700',
  SCHEDULING: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  SCHEDULED: 'bg-orange-50 border-orange-200 text-orange-700',
  INSPECTED: 'bg-teal-50 border-teal-200 text-teal-700',
  FINALIZATION: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  READY_FOR_DELIVERY: 'bg-purple-50 border-purple-200 text-purple-700',
  DELIVERED: 'bg-green-50 border-green-200 text-green-700',
  CORRECTION: 'bg-red-50 border-red-200 text-red-700',
  REVISION: 'bg-pink-50 border-pink-200 text-pink-700',
  WORKFILE: 'bg-gray-50 border-gray-200 text-gray-700',
  ON_HOLD: 'bg-amber-50 border-amber-300 text-amber-700',
  CANCELLED: 'bg-red-100 border-red-300 text-red-800',
};

export const PRODUCTION_ROLES = [
  'appraiser',
  'reviewer',
  'admin',
  'trainee',
  'researcher_level_1',
  'researcher_level_2',
  'researcher_level_3',
  'inspector',
] as const;

export const PRODUCTION_ROLE_LABELS: Record<ProductionRole, string> = {
  appraiser: 'Appraiser',
  reviewer: 'Reviewer',
  admin: 'Admin',
  trainee: 'Trainee',
  researcher_level_1: 'Researcher L1',
  researcher_level_2: 'Researcher L2',
  researcher_level_3: 'Researcher L3',
  inspector: 'Inspector',
};

export const TASK_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'blocked',
] as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
};

export const CARD_PRIORITIES = [
  'low',
  'normal',
  'high',
  'urgent',
] as const;

export const PRIORITY_LABELS: Record<CardPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLORS: Record<CardPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export const ALERT_TYPES = [
  'due_date_at_risk',
  'overdue',
  'blocked',
  'capacity_exceeded',
  'unassigned_task',
  'stuck_in_stage',
] as const;

export const ALERT_SEVERITIES = [
  'info',
  'warning',
  'critical',
] as const;

export const AGENT_TRIGGER_TYPES = [
  'scheduled',
  'order_created',
  'stage_change',
  'task_completed',
  'manual',
] as const;

export const TIME_ENTRY_TYPES = [
  'stopwatch',
  'manual',
] as const;

// Type definitions
export type ProductionStage = (typeof PRODUCTION_STAGES)[number];
export type ProductionRole = (typeof PRODUCTION_ROLES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type CardPriority = (typeof CARD_PRIORITIES)[number];
export type AlertType = (typeof ALERT_TYPES)[number];
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];
export type AgentTriggerType = (typeof AGENT_TRIGGER_TYPES)[number];
export type TimeEntryType = (typeof TIME_ENTRY_TYPES)[number];

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

// Production Template Task Schema
export const ProductionTemplateTaskSchema = z.object({
  id: z.string().uuid().optional(),
  template_id: z.string().uuid(),
  stage: z.enum(PRODUCTION_STAGES),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  default_role: z.enum(PRODUCTION_ROLES),
  estimated_minutes: z.number().int().min(1).default(30),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export type ProductionTemplateTaskInput = z.infer<typeof ProductionTemplateTaskSchema>;

// Production Template Subtask Schema
export const ProductionTemplateSubtaskSchema = z.object({
  id: z.string().uuid().optional(),
  parent_task_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  default_role: z.enum(PRODUCTION_ROLES),
  estimated_minutes: z.number().int().min(1).default(15),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export type ProductionTemplateSubtaskInput = z.infer<typeof ProductionTemplateSubtaskSchema>;

// Production Template Schema
export const ProductionTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  applicable_order_types: z.array(z.string()).default([]),
  applicable_property_types: z.array(z.string()).default([]),
});

export type ProductionTemplateInput = z.infer<typeof ProductionTemplateSchema>;

// Create Template with Tasks Schema (for API)
export const CreateTemplateRequestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  applicable_order_types: z.array(z.string()).default([]),
  applicable_property_types: z.array(z.string()).default([]),
  tasks: z.array(z.object({
    stage: z.enum(PRODUCTION_STAGES),
    title: z.string().min(1).max(255),
    description: z.string().optional().nullable(),
    default_role: z.enum(PRODUCTION_ROLES),
    estimated_minutes: z.number().int().min(1).default(30),
    is_required: z.boolean().default(true),
    sort_order: z.number().int().min(0).default(0),
    subtasks: z.array(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional().nullable(),
      default_role: z.enum(PRODUCTION_ROLES),
      estimated_minutes: z.number().int().min(1).default(15),
      is_required: z.boolean().default(true),
      sort_order: z.number().int().min(0).default(0),
    })).optional(),
  })).optional(),
});

export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequestSchema>;

// Production Card Schema
export const CreateProductionCardSchema = z.object({
  order_id: z.string().uuid(),
  template_id: z.string().uuid(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(CARD_PRIORITIES).default('normal'),
  // Role assignments
  assigned_appraiser_id: z.string().uuid().optional().nullable(),
  assigned_reviewer_id: z.string().uuid().optional().nullable(),
  assigned_admin_id: z.string().uuid().optional().nullable(),
  assigned_trainee_id: z.string().uuid().optional().nullable(),
  assigned_researcher_level_1_id: z.string().uuid().optional().nullable(),
  assigned_researcher_level_2_id: z.string().uuid().optional().nullable(),
  assigned_researcher_level_3_id: z.string().uuid().optional().nullable(),
  assigned_inspector_id: z.string().uuid().optional().nullable(),
});

export type CreateProductionCardInput = z.infer<typeof CreateProductionCardSchema>;

// Move Card Schema
export const MoveCardSchema = z.object({
  target_stage: z.enum(PRODUCTION_STAGES),
});

export type MoveCardInput = z.infer<typeof MoveCardSchema>;

// Production Task Update Schema
export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  status: z.enum(TASK_STATUSES).optional(),
  due_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  completed_at: z.string().optional().nullable(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// Time Entry Schema
export const CreateTimeEntrySchema = z.object({
  task_id: z.string().uuid(),
  started_at: z.string(), // ISO timestamp
  ended_at: z.string().optional().nullable(),
  entry_type: z.enum(TIME_ENTRY_TYPES).default('stopwatch'),
  notes: z.string().optional().nullable(),
});

export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>;

// Stop Timer Schema
export const StopTimerSchema = z.object({
  notes: z.string().optional().nullable(),
});

export type StopTimerInput = z.infer<typeof StopTimerSchema>;

// Resource Schema
export const ProductionResourceSchema = z.object({
  user_id: z.string().uuid(),
  roles: z.array(z.enum(PRODUCTION_ROLES)).min(1),
  max_daily_tasks: z.number().int().min(1).default(10),
  max_weekly_hours: z.number().int().min(1).default(40),
  is_available: z.boolean().default(true),
  availability_schedule: z.record(z.object({
    start: z.string(),
    end: z.string(),
  })).optional(),
});

export type ProductionResourceInput = z.infer<typeof ProductionResourceSchema>;

// ============================================================================
// DATABASE RECORD TYPES
// ============================================================================

export interface ProductionTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  applicable_order_types: string[];
  applicable_property_types: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductionTemplateTask {
  id: string;
  template_id: string;
  stage: ProductionStage;
  title: string;
  description: string | null;
  default_role: ProductionRole;
  estimated_minutes: number;
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductionTemplateSubtask {
  id: string;
  parent_task_id: string;
  title: string;
  description: string | null;
  default_role: ProductionRole;
  estimated_minutes: number;
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductionCard {
  id: string;
  org_id: string;
  order_id: string;
  template_id: string;
  current_stage: ProductionStage;
  processed_stages: ProductionStage[];
  total_tasks: number;
  completed_tasks: number;
  due_date: string | null;
  priority: CardPriority;
  // Role assignments
  assigned_appraiser_id: string | null;
  assigned_reviewer_id: string | null;
  assigned_admin_id: string | null;
  assigned_trainee_id: string | null;
  assigned_researcher_level_1_id: string | null;
  assigned_researcher_level_2_id: string | null;
  assigned_researcher_level_3_id: string | null;
  assigned_inspector_id: string | null;
  // Hold/Cancel tracking
  hold_reason: string | null;
  cancelled_reason: string | null;
  previous_stage: ProductionStage | null;
  held_at: string | null;
  cancelled_at: string | null;
  // Timestamps
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductionTask {
  id: string;
  production_card_id: string;
  template_task_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  stage: ProductionStage;
  role: ProductionRole;
  assigned_to: string | null;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  is_on_time: boolean | null;
  total_time_minutes: number;
  estimated_minutes: number | null;
  is_required: boolean;
  sort_order: number;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductionTimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  entry_type: TimeEntryType;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProductionResource {
  id: string;
  org_id: string;
  user_id: string;
  roles: ProductionRole[];
  max_daily_tasks: number;
  max_weekly_hours: number;
  current_load: number;
  is_available: boolean;
  availability_schedule: Record<string, { start: string; end: string }>;
  avg_task_completion_minutes: number | null;
  tasks_completed_count: number;
  on_time_completion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ProductionAlert {
  id: string;
  org_id: string;
  production_card_id: string | null;
  task_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProductionAgentRun {
  id: string;
  org_id: string;
  trigger_type: AgentTriggerType;
  trigger_details: Record<string, unknown>;
  started_at: string;
  ended_at: string | null;
  status: 'running' | 'completed' | 'failed';
  tasks_assigned: number;
  alerts_generated: number;
  cards_processed: number;
  errors: Array<{ message: string; details?: unknown }>;
  created_at: string;
}

// ============================================================================
// EXPANDED TYPES (with relations)
// ============================================================================

export interface ProductionTemplateWithTasks extends ProductionTemplate {
  tasks: Array<ProductionTemplateTask & {
    subtasks: ProductionTemplateSubtask[];
  }>;
}

// Helper type for joined user profiles
type JoinedUser = {
  id: string;
  name: string | null;
  email: string;
} | null;

export interface ProductionCardWithOrder extends ProductionCard {
  order: {
    id: string;
    order_number: string | null;
    status: string;
    property_address: string | null;
    property_city: string | null;
    property_state: string | null;
    property_zip: string | null;
    property_id: string | null;
    inspection_date: string | null;
    borrower_name: string | null;
    borrower_email: string | null;
    borrower_phone: string | null;
    property_contact_name: string | null;
    property_contact_phone: string | null;
    property_contact_email: string | null;
    access_instructions: string | null;
    special_instructions: string | null;
  };
  template: {
    id: string;
    name: string;
  };
  // Joined user profiles for all role assignments
  assigned_appraiser: JoinedUser;
  assigned_reviewer: JoinedUser;
  assigned_admin: JoinedUser;
  assigned_trainee: JoinedUser;
  assigned_researcher_level_1: JoinedUser;
  assigned_researcher_level_2: JoinedUser;
  assigned_researcher_level_3: JoinedUser;
  assigned_inspector: JoinedUser;
}

export interface ProductionCardWithTasks extends ProductionCardWithOrder {
  tasks: Array<ProductionTask & {
    subtasks: ProductionTask[];
    assigned_user: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    time_entries: ProductionTimeEntry[];
    active_timer: ProductionTimeEntry | null;
  }>;
}

export interface ProductionTaskWithRelations extends ProductionTask {
  production_card: {
    id: string;
    order_id: string;
    current_stage: ProductionStage;
    order: {
      id: string;
      order_number: string | null;
    };
  };
  assigned_user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  subtasks: ProductionTask[];
  time_entries: ProductionTimeEntry[];
  active_timer: ProductionTimeEntry | null;
}

export interface ProductionResourceWithUser extends ProductionResource {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  assigned_tasks_count: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ListTemplatesResponse {
  templates: ProductionTemplate[];
  total: number;
}

export interface GetTemplateResponse {
  template: ProductionTemplateWithTasks;
}

export interface ListCardsResponse {
  cards: ProductionCardWithOrder[];
  total: number;
  by_stage: Record<ProductionStage, number>;
}

export interface GetCardResponse {
  card: ProductionCardWithTasks;
  can_move_to_next_stage: boolean;
  incomplete_tasks: number;
}

export interface ListTasksResponse {
  tasks: ProductionTaskWithRelations[];
  total: number;
}

export interface MyTasksTodayResponse {
  tasks: ProductionTaskWithRelations[];
  total: number;
  overdue_count: number;
  due_today_count: number;
  upcoming_count: number;
}

export interface ListResourcesResponse {
  resources: ProductionResourceWithUser[];
  total: number;
}

export interface ListAlertsResponse {
  alerts: ProductionAlert[];
  total: number;
  by_severity: Record<AlertSeverity, number>;
}

export interface AgentRunResponse {
  run: ProductionAgentRun;
}

// ============================================================================
// KANBAN BOARD TYPES
// ============================================================================

export interface KanbanColumn {
  id: ProductionStage;
  title: string;
  color: string;
  cards: ProductionCardWithOrder[];
  count: number;
}

export interface KanbanBoardData {
  columns: KanbanColumn[];
  total_cards: number;
}

// ============================================================================
// TIMER STATE
// ============================================================================

export interface TimerState {
  isRunning: boolean;
  startedAt: string | null;
  elapsed: number; // seconds
  taskId: string | null;
  entryId: string | null;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidProductionStage(stage: string): stage is ProductionStage {
  return PRODUCTION_STAGES.includes(stage as ProductionStage);
}

export function isValidProductionRole(role: string): role is ProductionRole {
  return PRODUCTION_ROLES.includes(role as ProductionRole);
}

export function isValidTaskStatus(status: string): status is TaskStatus {
  return TASK_STATUSES.includes(status as TaskStatus);
}

export function isValidCardPriority(priority: string): priority is CardPriority {
  return CARD_PRIORITIES.includes(priority as CardPriority);
}

export function isValidAlertType(type: string): type is AlertType {
  return ALERT_TYPES.includes(type as AlertType);
}

export function isValidAlertSeverity(severity: string): severity is AlertSeverity {
  return ALERT_SEVERITIES.includes(severity as AlertSeverity);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateCreateTemplateRequest(data: unknown): CreateTemplateRequest {
  return CreateTemplateRequestSchema.parse(data);
}

export function validateCreateProductionCard(data: unknown): CreateProductionCardInput {
  return CreateProductionCardSchema.parse(data);
}

export function validateMoveCard(data: unknown): MoveCardInput {
  return MoveCardSchema.parse(data);
}

export function validateUpdateTask(data: unknown): UpdateTaskInput {
  return UpdateTaskSchema.parse(data);
}

export function validateCreateTimeEntry(data: unknown): CreateTimeEntryInput {
  return CreateTimeEntrySchema.parse(data);
}

export function validateProductionResource(data: unknown): ProductionResourceInput {
  return ProductionResourceSchema.parse(data);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the next stage in the production workflow
 */
export function getNextStage(currentStage: ProductionStage): ProductionStage | null {
  const index = PRODUCTION_STAGES.indexOf(currentStage);
  if (index === -1 || index >= PRODUCTION_STAGES.length - 1) {
    return null;
  }
  return PRODUCTION_STAGES[index + 1];
}

/**
 * Get the previous stage in the production workflow
 */
export function getPreviousStage(currentStage: ProductionStage): ProductionStage | null {
  const index = PRODUCTION_STAGES.indexOf(currentStage);
  if (index <= 0) {
    return null;
  }
  return PRODUCTION_STAGES[index - 1];
}

/**
 * Get stage index (0-based)
 */
export function getStageIndex(stage: ProductionStage): number {
  return PRODUCTION_STAGES.indexOf(stage);
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: { due_date: string | null; status: TaskStatus }): boolean {
  if (!task.due_date || task.status === 'completed') {
    return false;
  }
  return new Date(task.due_date) < new Date();
}

/**
 * Check if a task is due today
 */
export function isTaskDueToday(task: { due_date: string | null; status: TaskStatus }): boolean {
  if (!task.due_date || task.status === 'completed') {
    return false;
  }
  const today = new Date();
  const dueDate = new Date(task.due_date);
  return (
    dueDate.getFullYear() === today.getFullYear() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getDate() === today.getDate()
  );
}

// ============================================================================
// CALENDAR VIEW TYPES
// ============================================================================

export type CalendarViewMode = 'month' | 'week';

export interface CalendarItem {
  id: string;
  title: string;
  dueDate: string;
  type: 'card' | 'task';
  priority: CardPriority;
  stage: ProductionStage;
  orderNumber?: string;
  propertyAddress?: string;
  cardId: string; // Always set - for tasks, this is the parent card ID
  assignedTo?: string;
}

export interface CalendarData {
  items: CalendarItem[];
  cards: ProductionCardWithOrder[];
  startDate: string;
  endDate: string;
}

// ============================================================================
// WORKLOAD CHART TYPES
// ============================================================================

export type WorkloadMetric = 'task_count' | 'hours';
export type WorkloadPeriod = 'day' | 'week' | 'month';

export interface ResourceWorkload {
  resourceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  roles: ProductionRole[];
  taskCount: number;
  estimatedHours: number;
  maxDailyTasks: number;
  maxWeeklyHours: number;
  capacityUsedPercent: number;
  isOverloaded: boolean;
}

export interface WorkloadData {
  resources: ResourceWorkload[];
  period: WorkloadPeriod;
  startDate: string;
  endDate: string;
}

// ============================================================================
// SLA CONFIGURATION TYPES
// ============================================================================

export const SLA_REFERENCE_POINTS = [
  'stage_entry',
  'card_created',
  'inspection_before',
  'inspection_after',
] as const;

export type SLAReferencePoint = (typeof SLA_REFERENCE_POINTS)[number];

export const SLA_REFERENCE_POINT_LABELS: Record<SLAReferencePoint, string> = {
  stage_entry: 'Days after entering stage',
  card_created: 'Days after card created',
  inspection_before: 'Days before inspection',
  inspection_after: 'Days after inspection',
};

export interface ProductionSLAConfig {
  id: string;
  tenant_id: string;
  stage: ProductionStage;
  sla_days: number;
  reference_point: SLAReferencePoint;
  created_at: string;
  updated_at: string;
}

export interface SLAConfigInput {
  stage: ProductionStage;
  sla_days: number;
  reference_point: SLAReferencePoint;
}

// Default SLA configuration
export const DEFAULT_SLA_CONFIG: Record<ProductionStage, { sla_days: number; reference_point: SLAReferencePoint }> = {
  INTAKE: { sla_days: 1, reference_point: 'card_created' },
  SCHEDULING: { sla_days: 1, reference_point: 'stage_entry' },
  SCHEDULED: { sla_days: 1, reference_point: 'inspection_before' },
  INSPECTED: { sla_days: 1, reference_point: 'inspection_after' },
  FINALIZATION: { sla_days: 1, reference_point: 'inspection_after' },
  READY_FOR_DELIVERY: { sla_days: 1, reference_point: 'inspection_after' },
  DELIVERED: { sla_days: 1, reference_point: 'stage_entry' },
  CORRECTION: { sla_days: 2, reference_point: 'stage_entry' },
  REVISION: { sla_days: 2, reference_point: 'stage_entry' },
  WORKFILE: { sla_days: 1, reference_point: 'stage_entry' },
  ON_HOLD: { sla_days: 0, reference_point: 'stage_entry' },
  CANCELLED: { sla_days: 0, reference_point: 'stage_entry' },
};

// ============================================================================
// RESOURCE TASKS KANBAN TYPES
// ============================================================================

export const RESOURCE_TASK_COLUMNS = [
  'NOT_STARTED',
  'NEXT_DAY',
  'TOMORROW',
  'TODAY',
  'OVERDUE',
  'STARTED',
  'ISSUES',
  'IMPEDED',
  'CORRECTION',
  'COMPLETED',
] as const;

export type ResourceTaskColumn = (typeof RESOURCE_TASK_COLUMNS)[number];

export const RESOURCE_TASK_COLUMN_LABELS: Record<ResourceTaskColumn, string> = {
  NOT_STARTED: 'Not Started',
  NEXT_DAY: 'Next Day',
  TOMORROW: 'Tomorrow',
  TODAY: 'Today',
  OVERDUE: 'Overdue',
  STARTED: 'Started',
  ISSUES: 'Issues',
  IMPEDED: 'Impeded',
  CORRECTION: 'Correction',
  COMPLETED: 'Completed',
};

export const RESOURCE_TASK_COLUMN_COLORS: Record<ResourceTaskColumn, string> = {
  NOT_STARTED: 'bg-slate-50 border-slate-200',
  NEXT_DAY: 'bg-blue-50 border-blue-200',
  TOMORROW: 'bg-cyan-50 border-cyan-200',
  TODAY: 'bg-amber-50 border-amber-200',
  OVERDUE: 'bg-red-50 border-red-200',
  STARTED: 'bg-green-50 border-green-200',
  ISSUES: 'bg-rose-50 border-rose-300',
  IMPEDED: 'bg-orange-50 border-orange-200',
  CORRECTION: 'bg-pink-50 border-pink-200',
  COMPLETED: 'bg-emerald-50 border-emerald-200',
};

// Extended ProductionTask with issue fields
export interface ProductionTaskWithIssue extends ProductionTask {
  has_issue?: boolean;
  issue_description?: string | null;
  issue_created_at?: string | null;
  issue_created_by?: string | null;
}

// Subtask type for resource tasks kanban
export interface ResourceSubtask extends ProductionTask {
  assigned_user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

// Extended task with relations for kanban board
export interface ResourceTaskWithRelations extends ProductionTaskWithIssue {
  production_card: {
    id: string;
    order_id: string;
    current_stage: ProductionStage;
    due_date: string | null;
    order: {
      id: string;
      order_number: string | null;
      property_address: string | null;
    };
  };
  assigned_user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  subtasks?: ResourceSubtask[];
}

export interface ResourceTaskKanbanColumn {
  id: ResourceTaskColumn;
  title: string;
  color: string;
  tasks: ResourceTaskWithRelations[];
  count: number;
}

export interface ResourceTaskKanbanData {
  columns: ResourceTaskKanbanColumn[];
  total_tasks: number;
}

// Input types for resource task actions
export interface CreateTaskIssueInput {
  task_id: string;
  issue_description: string;
}

export interface ResourceTaskDropInput {
  task_id: string;
  target_column: ResourceTaskColumn;
  issue_description?: string;
}

export const ResourceTaskDropSchema = z.object({
  target_column: z.enum(RESOURCE_TASK_COLUMNS),
  issue_description: z.string().optional(),
});

export type ResourceTaskDropSchemaInput = z.infer<typeof ResourceTaskDropSchema>;

export function isValidResourceTaskColumn(column: string): column is ResourceTaskColumn {
  return RESOURCE_TASK_COLUMNS.includes(column as ResourceTaskColumn);
}
