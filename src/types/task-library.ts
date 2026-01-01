/**
 * Task Library Type Definitions
 *
 * Types for the reusable Task Library system that allows tasks
 * to be managed independently and linked to production templates.
 */

import { z } from 'zod';

// Production stages from production.ts
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

export type ProductionStage = typeof PRODUCTION_STAGES[number];

// Production roles (8 total)
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
export type ProductionRole = typeof PRODUCTION_ROLES[number];

// ============================================================================
// Library Task Types
// ============================================================================

/**
 * A task in the task library (reusable across templates)
 */
export interface LibraryTask {
  id: string;
  org_id: string;
  stage: ProductionStage;
  title: string;
  description: string | null;
  default_role: ProductionRole;
  estimated_minutes: number;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A library task with its subtasks included
 */
export interface LibraryTaskWithSubtasks extends LibraryTask {
  subtasks: LibrarySubtask[];
}

/**
 * A subtask belonging to a library task
 */
export interface LibrarySubtask {
  id: string;
  library_task_id: string;
  title: string;
  description: string | null;
  default_role: ProductionRole;
  estimated_minutes: number;
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Template-Library Link Types
// ============================================================================

/**
 * Junction record linking a template to a library task
 */
export interface TemplateLibraryTask {
  id: string;
  template_id: string;
  library_task_id: string;
  sort_order: number;
  override_estimated_minutes: number | null;
  override_is_required: boolean | null;
  created_at: string;
}

/**
 * Resolved view of a template's library task (with overrides applied)
 */
export interface TemplateTaskResolved {
  id: string;
  template_id: string;
  library_task_id: string;
  stage: ProductionStage;
  title: string;
  description: string | null;
  default_role: ProductionRole;
  estimated_minutes: number;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  library_task_created_at: string;
  library_task_updated_at: string;
}

// ============================================================================
// Input/Form Types
// ============================================================================

/**
 * Input for creating a new library task
 */
export interface CreateLibraryTaskInput {
  stage: ProductionStage;
  title: string;
  description?: string | null;
  default_role?: ProductionRole;
  estimated_minutes?: number;
  is_required?: boolean;
  sort_order?: number;
}

/**
 * Input for updating a library task
 */
export interface UpdateLibraryTaskInput {
  stage?: ProductionStage;
  title?: string;
  description?: string | null;
  default_role?: ProductionRole;
  estimated_minutes?: number;
  is_required?: boolean;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * Input for creating a library subtask
 */
export interface CreateLibrarySubtaskInput {
  library_task_id: string;
  title: string;
  description?: string | null;
  default_role?: ProductionRole;
  estimated_minutes?: number;
  is_required?: boolean;
  sort_order?: number;
}

/**
 * Input for updating a library subtask
 */
export interface UpdateLibrarySubtaskInput {
  title?: string;
  description?: string | null;
  default_role?: ProductionRole;
  estimated_minutes?: number;
  is_required?: boolean;
  sort_order?: number;
}

/**
 * Input for adding library tasks to a template
 */
export interface AddLibraryTasksToTemplateInput {
  template_id: string;
  library_task_ids: string[];
  start_sort_order?: number;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const ProductionStageSchema = z.enum(PRODUCTION_STAGES);
export const ProductionRoleSchema = z.enum(PRODUCTION_ROLES);

export const CreateLibraryTaskSchema = z.object({
  stage: ProductionStageSchema,
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).nullable().optional(),
  default_role: ProductionRoleSchema.default('appraiser'),
  estimated_minutes: z.number().int().min(1).max(480).default(30),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const UpdateLibraryTaskSchema = z.object({
  stage: ProductionStageSchema.optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  default_role: ProductionRoleSchema.optional(),
  estimated_minutes: z.number().int().min(1).max(480).optional(),
  is_required: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const CreateLibrarySubtaskSchema = z.object({
  library_task_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).nullable().optional(),
  default_role: ProductionRoleSchema.default('appraiser'),
  estimated_minutes: z.number().int().min(1).max(480).default(15),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const UpdateLibrarySubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  default_role: ProductionRoleSchema.optional(),
  estimated_minutes: z.number().int().min(1).max(480).optional(),
  is_required: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const AddLibraryTasksToTemplateSchema = z.object({
  template_id: z.string().uuid(),
  library_task_ids: z.array(z.string().uuid()).min(1),
  start_sort_order: z.number().int().min(0).optional(),
});

// ============================================================================
// Query/Filter Types
// ============================================================================

/**
 * Filters for querying library tasks
 */
export interface LibraryTaskFilters {
  stage?: ProductionStage;
  is_active?: boolean;
  search?: string;
}

/**
 * Library tasks grouped by stage
 */
export type LibraryTasksByStage = Record<ProductionStage, LibraryTaskWithSubtasks[]>;

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Human-readable stage names
 */
export const STAGE_DISPLAY_NAMES: Record<ProductionStage, string> = {
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

/**
 * Human-readable role names
 */
export const ROLE_DISPLAY_NAMES: Record<ProductionRole, string> = {
  appraiser: 'Appraiser',
  reviewer: 'Reviewer',
  admin: 'Admin',
  trainee: 'Trainee',
  researcher_level_1: 'Researcher L1',
  researcher_level_2: 'Researcher L2',
  researcher_level_3: 'Researcher L3',
  inspector: 'Inspector',
};

/**
 * Stage colors for UI
 */
export const STAGE_COLORS: Record<ProductionStage, string> = {
  INTAKE: 'bg-blue-100 text-blue-800',
  SCHEDULING: 'bg-purple-100 text-purple-800',
  SCHEDULED: 'bg-indigo-100 text-indigo-800',
  INSPECTED: 'bg-teal-100 text-teal-800',
  FINALIZATION: 'bg-amber-100 text-amber-800',
  READY_FOR_DELIVERY: 'bg-lime-100 text-lime-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CORRECTION: 'bg-orange-100 text-orange-800',
  REVISION: 'bg-rose-100 text-rose-800',
  WORKFILE: 'bg-slate-100 text-slate-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
};
