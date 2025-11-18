/**
 * Campaign Management System - Type Definitions
 */

// =====================================================
// ENUMS
// =====================================================

export type CampaignChannel = 'email' | 'sms' | 'call' | 'mail';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';

export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export type Disposition =
  | 'HAS_ACTIVE_PROFILE'
  | 'NO_ACTIVE_PROFILE'
  | 'INTERESTED'
  | 'NEEDS_MORE_INFO'
  | 'NOT_INTERESTED'
  | 'OUT_OF_OFFICE'
  | 'ESCALATE_UNCLEAR';

export type ContactEventType = 'pending' | 'sent' | 'replied' | 'bounced' | 'failed' | 'unsubscribed';

export type SuppressionReason = 'unsubscribed' | 'bounced' | 'spam_complaint' | 'manual';

// =====================================================
// TARGET SEGMENT
// =====================================================

export type TargetSegmentType = 'filter' | 'n8n_list';

export interface FilterCriteria {
  client_types?: string[];           // ['AMC', 'Direct Lender', 'Non-QM']
  tags?: string[];                   // ['High-Volume', 'Inactive']
  last_order_days_ago_min?: number;  // e.g., > 180 days
  last_order_days_ago_max?: number;  // e.g., < 365 days
  property_types?: string[];
  states?: string[];
  has_active_profile?: boolean;
}

export interface TargetSegment {
  type: TargetSegmentType;

  // If type = 'filter'
  filters?: FilterCriteria;

  // If type = 'n8n_list'
  n8n_list_id?: string;
  n8n_list_name?: string;
}

// =====================================================
// DATABASE MODELS
// =====================================================

export interface Campaign {
  id: string;
  org_id: string;

  // Basic info
  name: string;
  description: string | null;
  channel: CampaignChannel;
  status: CampaignStatus;

  // Target audience
  target_segment: TargetSegment | null;

  // Email content
  email_subject: string | null;
  email_body: string | null;
  email_template_id: string | null;
  used_merge_tokens: string[] | null;

  // Rate limiting
  send_rate_per_hour: number;
  send_batch_size: number;

  // Scheduling
  start_at: string | null;

  // Job integration
  primary_job_id: string | null;

  // N8n integration
  n8n_list_id: string | null;

  // Metadata
  created_by: string;
  created_at: string;
  launched_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface CampaignResponse {
  id: string;
  org_id: string;
  campaign_id: string;

  // Who responded
  contact_id: string | null;
  client_id: string | null;
  email_address: string;

  // Attribution
  job_id: string | null;
  job_task_id: string | null;
  gmail_message_id: string | null;

  // Classification
  sentiment: Sentiment | null;
  disposition: Disposition | null;

  // Content
  response_text: string;
  ai_summary: string | null;

  // Timing
  received_at: string;
  processed_at: string | null;
  created_at: string;
}

export interface CampaignContactStatus {
  id: string;
  org_id: string;
  campaign_id: string;

  // Recipient
  contact_id: string | null;
  client_id: string | null;
  email_address: string;

  // Current state
  last_event: ContactEventType;
  last_sentiment: Sentiment | null;
  last_disposition: Disposition | null;

  // Tracking
  sent_at: string | null;
  last_reply_at: string | null;
  last_reply_summary: string | null;
  reply_count: number;

  // Task tracking
  open_tasks_count: number;

  // Attribution
  job_task_id: string | null;
  latest_response_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  org_id: string;

  name: string;
  subject: string;
  body: string;

  merge_tokens: string[] | null;

  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface EmailSuppression {
  id: string;
  org_id: string;

  email_address: string;
  reason: SuppressionReason | null;

  campaign_id: string | null;
  contact_id: string | null;

  created_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  target_segment: TargetSegment;
  email_subject: string;
  email_body: string;
  email_template_id?: string;
  send_rate_per_hour?: number;
  start_at?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  target_segment?: TargetSegment;
  email_subject?: string;
  email_body?: string;
  send_rate_per_hour?: number;
  start_at?: string;
  status?: CampaignStatus;
}

export interface PreviewAudienceRequest {
  target_segment: TargetSegment;
}

export interface PreviewAudienceResponse {
  count: number;
  sample: Recipient[];
}

export interface LaunchCampaignResponse {
  campaign_id: string;
  job_id: string;
  recipients_count: number;
}

// =====================================================
// BUSINESS LOGIC TYPES
// =====================================================

export interface Recipient {
  contact_id: string | null;
  client_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string;
  last_order_date: string | null;
  days_since_last_order: number | null;
}

export interface MergeTokenData {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  last_order_date?: string;
  days_since_last_order?: number;
  property_count?: number;
  total_orders?: number;
}

export interface ClassificationResult {
  sentiment: Sentiment;
  disposition: Disposition;
  is_unsubscribe: boolean;
  summary: string;
}

export interface CampaignMetrics {
  sent: number;
  replied: number;
  pending: number;
  bounced: number;
  unsubscribed: number;
  response_rate: number;

  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };

  dispositions: Record<string, number>;

  tasks: {
    total: number;
    completed: number;
    pending: number;
  };

  needs_follow_up: Array<{
    email_address: string;
    last_disposition: string;
    last_reply_summary: string | null;
  }>;
}

// =====================================================
// CONSTANTS
// =====================================================

export const AVAILABLE_MERGE_TOKENS = [
  'first_name',
  'last_name',
  'company_name',
  'last_order_date',
  'days_since_last_order',
  'property_count',
  'total_orders',
] as const;

export type MergeToken = typeof AVAILABLE_MERGE_TOKENS[number];

export const DISPOSITION_LABELS: Record<Disposition, string> = {
  HAS_ACTIVE_PROFILE: 'Has Active Profile',
  NO_ACTIVE_PROFILE: 'No Active Profile',
  INTERESTED: 'Interested',
  NEEDS_MORE_INFO: 'Needs More Info',
  NOT_INTERESTED: 'Not Interested',
  OUT_OF_OFFICE: 'Out of Office',
  ESCALATE_UNCLEAR: 'Escalate - Unclear',
};

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  POSITIVE: 'Positive',
  NEUTRAL: 'Neutral',
  NEGATIVE: 'Negative',
};

export const SENTIMENT_ICONS: Record<Sentiment, string> = {
  POSITIVE: '😊',
  NEUTRAL: '😐',
  NEGATIVE: '☹️',
};
