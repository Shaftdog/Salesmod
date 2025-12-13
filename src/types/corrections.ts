// Corrections & Revisions System Types

// Status constants
export const CORRECTION_STATUSES = ['pending', 'in_progress', 'review', 'approved', 'rejected'] as const;
export type CorrectionStatus = typeof CORRECTION_STATUSES[number];

export const CORRECTION_TYPES = ['correction', 'revision'] as const;
export type CorrectionType = typeof CORRECTION_TYPES[number];

export const SEVERITY_LEVELS = ['minor', 'major', 'critical'] as const;
export type SeverityLevel = typeof SEVERITY_LEVELS[number];

export const CORRECTION_CATEGORIES = ['data', 'format', 'compliance', 'calculation', 'other'] as const;
export type CorrectionCategory = typeof CORRECTION_CATEGORIES[number];

export const WORK_HISTORY_EVENT_TYPES = [
  'correction_received',
  'correction_completed',
  'correction_approved',
  'correction_rejected',
  'revision_received',
  'revision_completed'
] as const;
export type WorkHistoryEventType = typeof WORK_HISTORY_EVENT_TYPES[number];

// Main interfaces
export interface CorrectionRequest {
  id: string;
  tenant_id: string;
  production_card_id: string;
  source_task_id: string | null;
  case_id: string | null;
  request_type: CorrectionType;
  status: CorrectionStatus;
  description: string;
  severity: SeverityLevel | null;
  category: CorrectionCategory | null;
  previous_stage: string;
  assigned_to: string | null;
  reviewer_id: string | null;
  requested_by: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  ai_summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ResourceWorkHistory {
  id: string;
  tenant_id: string;
  resource_id: string;
  user_id: string;
  correction_request_id: string | null;
  production_task_id: string | null;
  production_card_id: string | null;
  event_type: WorkHistoryEventType;
  summary: string;
  impact_score: number | null;
  created_at: string;
}

// Extended types with relations
export interface CorrectionRequestWithRelations extends CorrectionRequest {
  source_task?: {
    id: string;
    title: string;
    stage: string;
  } | null;
  production_card?: {
    id: string;
    order_id: string;
    current_stage: string;
    order?: {
      order_number: string;
      property_address: string;
    };
  } | null;
  case?: {
    id: string;
    case_number: string;
    subject: string;
  } | null;
  assigned_profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  reviewer_profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  requested_by_profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export interface ResourceWorkHistoryWithRelations extends ResourceWorkHistory {
  correction_request?: CorrectionRequest | null;
  production_task?: {
    id: string;
    title: string;
    stage: string;
  } | null;
  production_card?: {
    id: string;
    order?: {
      order_number: string;
    };
  } | null;
  resource?: {
    id: string;
    name: string;
  } | null;
}

// Input types for mutations
export interface CreateCorrectionInput {
  production_card_id: string;
  source_task_id?: string;
  description: string;
  severity?: SeverityLevel;
  category?: CorrectionCategory;
  ai_summary?: string;
}

export interface CreateRevisionInput {
  case_id: string;
  description: string;
  severity?: SeverityLevel;
  category?: CorrectionCategory;
  ai_summary?: string;
}

export interface CompleteCorrectionInput {
  correction_id: string;
  resolution_notes: string;
}

export interface ApproveCorrectionInput {
  correction_id: string;
  notes?: string;
}

export interface RejectCorrectionInput {
  correction_id: string;
  notes: string;
  create_new_correction?: boolean;
}

// AI Summary types
export interface AISummaryCorrectionInput {
  task_title: string;
  task_description?: string;
  user_description: string;
  order_context?: {
    order_number: string;
    property_address: string;
    client_name?: string;
  };
}

export interface AISummaryCorrectionOutput {
  summary: string;
  suggested_severity: SeverityLevel;
  suggested_category: CorrectionCategory;
}

// Filter types for queries
export interface CorrectionFilters {
  status?: CorrectionStatus | CorrectionStatus[];
  request_type?: CorrectionType;
  assigned_to?: string;
  reviewer_id?: string;
  production_card_id?: string;
  case_id?: string;
  severity?: SeverityLevel | SeverityLevel[];
  category?: CorrectionCategory | CorrectionCategory[];
  date_from?: string;
  date_to?: string;
}

export interface WorkHistoryFilters {
  user_id?: string;
  resource_id?: string;
  event_type?: WorkHistoryEventType | WorkHistoryEventType[];
  date_from?: string;
  date_to?: string;
}

// UI helper types
export const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; bgColor: string }> = {
  minor: { label: 'Minor', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  major: { label: 'Major', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const STATUS_CONFIG: Record<CorrectionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  review: { label: 'Under Review', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  approved: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const CATEGORY_CONFIG: Record<CorrectionCategory, { label: string; icon: string }> = {
  data: { label: 'Data Issue', icon: 'Database' },
  format: { label: 'Formatting', icon: 'FileText' },
  compliance: { label: 'Compliance', icon: 'Shield' },
  calculation: { label: 'Calculation', icon: 'Calculator' },
  other: { label: 'Other', icon: 'MoreHorizontal' },
};

export const REQUEST_TYPE_CONFIG: Record<CorrectionType, { label: string; color: string; bgColor: string }> = {
  correction: { label: 'Correction', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  revision: { label: 'Revision', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
};
