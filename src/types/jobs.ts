/**
 * Jobs System Types and Schemas
 * Campaign runner for AI Agent multi-step workflows
 */

import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const JOB_STATUSES = [
  'pending',
  'running',
  'paused',
  'succeeded',
  'failed',
  'cancelled',
] as const;

export const TASK_KINDS = [
  'draft_email',
  'send_email',
  'create_task',
  'schedule_call',
  'check_portal',
  'update_profile',
  'research',
  'follow_up',
  'create_deal',
] as const;

export const TASK_STATUSES = [
  'pending',
  'running',
  'done',
  'error',
  'skipped',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
export type TaskKind = (typeof TASK_KINDS)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

// ============================================================================
// JOB PARAMS SCHEMAS
// ============================================================================

// Email template structure
export const EmailTemplateSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.record(z.string()).optional(),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

// Cadence configuration
export const CadenceConfigSchema = z.object({
  day0: z.boolean().default(true),   // Initial contact
  day4: z.boolean().default(false),  // First follow-up
  day10: z.boolean().default(false), // Second follow-up
  day21: z.boolean().default(false), // Third follow-up
  custom_days: z.array(z.number()).optional(), // Custom intervals
});

export type CadenceConfig = z.infer<typeof CadenceConfigSchema>;

// Target filter for selecting contacts/clients
export const TargetFilterSchema = z.object({
  client_type: z.string().optional(),           // e.g., "AMC", "Lender"
  state: z.string().optional(),                 // e.g., "FL"
  active: z.boolean().optional(),               // Only active clients
  tags: z.array(z.string()).optional(),         // Client tags
  has_email: z.boolean().default(true),         // Must have email
  last_contact_days_ago: z.number().optional(), // e.g., > 30 days
  custom_query: z.string().optional(),          // SQL WHERE clause
  target_role_codes: z.array(z.string()).optional(), // Filter by contact roles (multi-select)
});

export type TargetFilter = z.infer<typeof TargetFilterSchema>;

// Job parameters (stored in jobs.params JSONB)
export const JobParamsSchema = z.object({
  // Target selection
  target_type: z.enum(['clients', 'contacts']).default('contacts'), // Target clients or contacts
  target_group: z.string(), // e.g., "AMC", "all_clients", "custom"
  target_filter: TargetFilterSchema.optional(),
  target_contact_ids: z.array(z.string()).optional(), // Explicit list

  // Email configuration
  templates: z.record(EmailTemplateSchema).optional(), // key = template name

  // Cadence
  cadence: CadenceConfigSchema.optional(),

  // Behavior
  review_mode: z.boolean().default(true),     // Cards require review before execution
  edit_mode: z.boolean().default(false),      // Cards can be edited before execution
  bulk_mode: z.boolean().default(false),      // Process all contacts ignoring cadence
  batch_size: z.number().default(10),         // Tasks per batch
  auto_approve: z.boolean().default(false),   // Auto-approve cards
  stop_on_error: z.boolean().default(false),  // Stop job on first error

  // Portal checking
  portal_checks: z.boolean().default(false),
  portal_urls: z.record(z.string()).optional(), // company_id -> portal_url

  // Follow-up configuration
  create_tasks: z.boolean().default(false),
  task_template: z.string().optional(),
});

export type JobParams = z.infer<typeof JobParamsSchema>;

// ============================================================================
// DATABASE RECORD TYPES
// ============================================================================

export interface Job {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: JobStatus;
  params: JobParams;
  owner_id: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  last_run_at: string | null;

  // Denormalized metrics
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  cards_created: number;
  cards_approved: number;
  cards_executed: number;
  emails_sent: number;
  errors_count: number;
}

export interface JobTask {
  id: number;
  job_id: string;
  step: number;
  batch: number;
  kind: TaskKind;
  input: Record<string, any>;
  output: Record<string, any> | null;
  status: TaskStatus;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  retry_count: number;
}

export interface JobMetrics {
  job_id: string;
  org_id: string;
  name: string;
  status: JobStatus;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  last_run_at: string | null;

  // Task metrics
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  task_completion_rate: number;

  // Card metrics
  cards_created: number;
  cards_approved: number;
  cards_executed: number;
  approval_rate: number;

  // Email metrics
  emails_sent: number;
  errors_count: number;

  // Card state breakdown
  cards_suggested: number;
  cards_in_review: number;
  cards_approved_pending: number;
  cards_executing: number;
  cards_done: number;
  cards_blocked: number;
  cards_rejected: number;

  // Task type breakdown
  email_cards: number;
  task_cards: number;
  call_cards: number;
  research_cards: number;
  followup_cards: number;
  deal_cards: number;

  // Execution timing
  duration_seconds: number | null;
  total_runs: number;
  last_run_ended_at: string | null;
}

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

// Create Job Request
export const CreateJobRequestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  params: JobParamsSchema,
});

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;

// Update Job Request
export const UpdateJobRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  params: JobParamsSchema.optional(),
  status: z.enum(JOB_STATUSES).optional(),
});

export type UpdateJobRequest = z.infer<typeof UpdateJobRequestSchema>;

// Create Task Request
export const CreateTaskRequestSchema = z.object({
  step: z.number().int().min(0),
  batch: z.number().int().min(0).default(0),
  kind: z.enum(TASK_KINDS),
  input: z.record(z.any()),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

// Bulk Create Tasks Request
export const BulkCreateTasksRequestSchema = z.object({
  tasks: z.array(CreateTaskRequestSchema),
});

export type BulkCreateTasksRequest = z.infer<typeof BulkCreateTasksRequestSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CreateJobResponse {
  job: Job;
  initial_tasks_created: number;
}

export interface GetJobResponse {
  job: Job;
  metrics: JobMetrics | null;
  recent_tasks: JobTask[];
}

export interface ListJobsResponse {
  jobs: Job[];
  total: number;
}

export interface ListJobTasksResponse {
  tasks: JobTask[];
  total: number;
}

export interface CancelJobResponse {
  job: Job;
  tasks_skipped: number;
}

// ============================================================================
// TASK INPUT/OUTPUT SCHEMAS
// ============================================================================

// Draft Email Task Input
export const DraftEmailTaskInputSchema = z.object({
  target_type: z.enum(['contact', 'contact_group', 'client']),
  contact_ids: z.array(z.string()).optional(),
  client_ids: z.array(z.string()).optional(),
  template: z.string(), // Template name from job.params.templates
  variables: z.record(z.string()).optional(),
});

export type DraftEmailTaskInput = z.infer<typeof DraftEmailTaskInputSchema>;

// Draft Email Task Output
export interface DraftEmailTaskOutput {
  cards_created: number;
  card_ids: string[];
  errors: Array<{ contact_id: string; error: string }>;
  completed_at: string;
}

// Send Email Task Input
export const SendEmailTaskInputSchema = z.object({
  card_ids: z.array(z.string()), // Cards to execute
});

export type SendEmailTaskInput = z.infer<typeof SendEmailTaskInputSchema>;

// Send Email Task Output
export interface SendEmailTaskOutput {
  sent_count: number;
  failed_count: number;
  errors: Array<{ card_id: string; error: string }>;
  completed_at: string;
}

// Check Portal Task Input
export const CheckPortalTaskInputSchema = z.object({
  company_id: z.string(),
  portal_url: z.string().url(),
  credentials: z.record(z.string()).optional(),
});

export type CheckPortalTaskInput = z.infer<typeof CheckPortalTaskInputSchema>;

// Check Portal Task Output
export interface CheckPortalTaskOutput {
  accessible: boolean;
  status: 'active' | 'inactive' | 'error';
  message: string;
  checked_at: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

// Job with populated metrics
export interface JobWithMetrics extends Job {
  metrics: JobMetrics;
}

// Job list item (lightweight for table display)
export interface JobListItem {
  id: string;
  name: string;
  status: JobStatus;
  created_at: string;
  last_run_at: string | null;
  cards_created: number;
  cards_executed: number;
  emails_sent: number;
  errors_count: number;
  approval_rate: number;
}

// Job progress summary
export interface JobProgress {
  total_cards: number;
  by_state: Record<string, number>;
  by_type: Record<string, number>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidJobStatus(status: string): status is JobStatus {
  return JOB_STATUSES.includes(status as JobStatus);
}

export function isValidTaskKind(kind: string): kind is TaskKind {
  return TASK_KINDS.includes(kind as TaskKind);
}

export function isValidTaskStatus(status: string): status is TaskStatus {
  return TASK_STATUSES.includes(status as TaskStatus);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateJobParams(params: unknown): JobParams {
  return JobParamsSchema.parse(params);
}

export function validateCreateJobRequest(data: unknown): CreateJobRequest {
  return CreateJobRequestSchema.parse(data);
}

export function validateUpdateJobRequest(data: unknown): UpdateJobRequest {
  return UpdateJobRequestSchema.parse(data);
}

export function validateCreateTaskRequest(data: unknown): CreateTaskRequest {
  return CreateTaskRequestSchema.parse(data);
}
