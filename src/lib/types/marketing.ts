import { PartyRoleCode } from '../roles/mapPartyRole';

// =============================================
// CAMPAIGN TYPES
// =============================================

export const campaignGoals = [
  'reactivation',
  'nurture',
  'acquisition',
  'education',
  'retention',
  'brand_awareness'
] as const;
export type CampaignGoal = typeof campaignGoals[number];

export const campaignStatuses = [
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
] as const;
export type CampaignStatus = typeof campaignStatuses[number];

export const marketingChannels = [
  'email',
  'linkedin',
  'substack',
  'tiktok',
  'instagram',
  'facebook',
  'pinterest',
  'youtube',
  'blog',
  'newsletter',
  'webinar',
  'podcast'
] as const;
export type MarketingChannel = typeof marketingChannels[number];

export interface CampaignMetrics {
  impressions?: number;
  clicks?: number;
  ctr?: number; // Click-through rate
  leads?: number;
  deals?: number;
  revenue?: number;
  contentCount?: number;
  avgEngagement?: number;
}

export interface AudienceFilter {
  // Role-based targeting
  targetRoleCodes?: PartyRoleCode[];
  targetRoleCategories?: ('lender' | 'investor' | 'service_provider' | 'other')[];
  excludeRoleCodes?: PartyRoleCode[];

  // Tag-based segmentation
  includeTags?: string[];
  excludeTags?: string[];

  // Engagement-based
  minLeadScore?: number;
  maxLeadScore?: number;
  leadLabels?: ('cold' | 'warm' | 'hot')[];

  // Activity-based
  lastActivityDays?: number;
  hasOrders?: boolean;
  orderCountMin?: number;
  orderCountMax?: number;
  totalRevenueMin?: number;

  // Geographic
  states?: string[];
  cities?: string[];
}

export interface Campaign {
  id: string;
  orgId: string;
  name: string;
  goal: CampaignGoal;
  description?: string;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;

  // Audience targeting
  targetRoleCodes?: PartyRoleCode[];
  targetRoleCategories?: string[];
  excludeRoleCodes?: PartyRoleCode[];
  includeTags?: string[];
  excludeTags?: string[];
  minLeadScore?: number;
  additionalFilters?: Record<string, any>;

  channels: MarketingChannel[];
  metrics?: CampaignMetrics;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// CONTENT TYPES
// =============================================

export const contentTypes = [
  'blog',
  'social_post',
  'email',
  'case_study',
  'testimonial',
  'market_update',
  'educational'
] as const;
export type ContentType = typeof contentTypes[number];

export const contentStatuses = [
  'draft',
  'needs_review',
  'approved',
  'published',
  'archived'
] as const;
export type ContentStatus = typeof contentStatuses[number];

export const funnelStages = [
  'awareness',
  'consideration',
  'conversion',
  'retention'
] as const;
export type FunnelStage = typeof funnelStages[number];

export interface ContentBody {
  short?: string;    // Twitter/X, TikTok caption (280 chars)
  medium?: string;   // Instagram, Facebook (2200 chars)
  long?: string;     // LinkedIn, Blog, Substack (full article)
  html?: string;     // Email, Blog HTML formatted
}

export interface MarketingContent {
  id: string;
  orgId: string;
  campaignId?: string;

  title: string;
  contentType: ContentType;
  body: ContentBody;

  audienceTags: string[];
  themeTags: string[];
  funnelStage?: FunnelStage;

  status: ContentStatus;
  publishedAt?: string;

  featuredImageUrl?: string;
  previewText?: string;

  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// CONTENT SCHEDULE TYPES
// =============================================

export const scheduleStatuses = [
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled'
] as const;
export type ScheduleStatus = typeof scheduleStatuses[number];

export interface EngagementMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  clicks?: number;
  opens?: number;
  saves?: number;
  impressions?: number;
}

export interface ContentSchedule {
  id: string;
  orgId: string;
  contentId: string;
  campaignId?: string;

  channel: MarketingChannel;

  scheduledFor: string;
  publishedAt?: string;

  status: ScheduleStatus;
  errorMessage?: string;

  platformPostId?: string;
  platformUrl?: string;

  engagementMetrics?: EngagementMetrics;

  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  content?: MarketingContent;
  campaign?: Campaign;
}

// =============================================
// LEAD SCORING TYPES
// =============================================

export const leadLabels = ['cold', 'warm', 'hot'] as const;
export type LeadLabel = typeof leadLabels[number];

export interface LeadSignals {
  emailOpens?: number;
  emailClicks?: number;
  websiteVisits?: number;
  contentDownloads?: number;
  webinarAttendance?: number;
  socialInteractions?: number;
  lastEngagement?: string;
  preferredChannels?: MarketingChannel[];
  topicInterests?: string[];
}

export interface LeadScore {
  id: string;
  contactId: string;

  fitScore: number;        // 0-25
  engagementScore: number; // 0-50
  recencyScore: number;    // 0-15
  valueScore: number;      // 0-10
  totalScore: number;      // 0-100

  label: LeadLabel;
  signals?: LeadSignals;

  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// AUDIENCE TYPES
// =============================================

export interface MarketingAudience {
  id: string;
  orgId: string;
  name: string;
  description?: string;

  // Saved filter configuration
  targetRoleCodes?: PartyRoleCode[];
  targetRoleCategories?: string[];
  excludeRoleCodes?: PartyRoleCode[];
  includeTags?: string[];
  excludeTags?: string[];
  minLeadScore?: number;
  additionalFilters?: Record<string, any>;

  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Computed
  estimatedSize?: number;
}

// =============================================
// NEWSLETTER TYPES
// =============================================

export const newsletterFrequencies = [
  'weekly',
  'biweekly',
  'monthly',
  'quarterly'
] as const;
export type NewsletterFrequency = typeof newsletterFrequencies[number];

export interface Newsletter {
  id: string;
  orgId: string;
  name: string;
  description?: string;

  targetRoleCodes?: PartyRoleCode[];
  targetRoleCategories?: string[];
  includeTags?: string[];

  frequency: NewsletterFrequency;
  templateId?: string;

  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const newsletterIssueStatuses = [
  'draft',
  'scheduled',
  'sending',
  'sent',
  'failed'
] as const;
export type NewsletterIssueStatus = typeof newsletterIssueStatuses[number];

export interface ContentBlock {
  type: 'content' | 'custom';
  contentId?: string;
  html?: string;
  order: number;
}

export interface NewsletterMetrics {
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  unsubscribed?: number;
  bounced?: number;
}

export interface NewsletterIssue {
  id: string;
  newsletterId: string;
  campaignId?: string;

  subject: string;
  introText?: string;
  contentBlocks?: ContentBlock[];

  scheduledFor?: string;
  sentAt?: string;

  status: NewsletterIssueStatus;
  metrics?: NewsletterMetrics;

  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  newsletter?: Newsletter;
  campaign?: Campaign;
}

// =============================================
// EMAIL TEMPLATE TYPES
// =============================================

export const emailTemplateCategories = [
  'newsletter',
  'campaign',
  'follow_up',
  'announcement',
  'transactional'
] as const;
export type EmailTemplateCategory = typeof emailTemplateCategories[number];

export interface TemplateVariable {
  [key: string]: string; // e.g., { "first_name": "Contact first name", "company_name": "Client company" }
}

export interface EmailTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  category: EmailTemplateCategory;

  subjectTemplate: string;
  previewText?: string;
  bodyTemplate: string;

  variables?: TemplateVariable;

  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// EMAIL CAMPAIGN TYPES
// =============================================

export const emailCampaignStatuses = [
  'draft',
  'scheduled',
  'sending',
  'sent',
  'failed',
  'cancelled'
] as const;
export type EmailCampaignStatus = typeof emailCampaignStatuses[number];

export interface EmailCampaignMetrics {
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  bounced?: number;
  unsubscribed?: number;
  openRate?: number;
  clickRate?: number;
}

export interface EmailCampaign {
  id: string;
  orgId: string;
  campaignId?: string;
  templateId?: string;

  name: string;
  subject: string;
  previewText?: string;
  bodyHtml: string;

  fromName: string;
  fromEmail: string;
  replyTo?: string;

  audienceFilter?: AudienceFilter;

  scheduledFor?: string;
  sentAt?: string;

  status: EmailCampaignStatus;
  metrics?: EmailCampaignMetrics;

  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  campaign?: Campaign;
  template?: EmailTemplate;
}

// =============================================
// EMAIL SEND TYPES
// =============================================

export const bounceTypes = ['hard', 'soft', 'complaint'] as const;
export type BounceType = typeof bounceTypes[number];

export interface EmailSend {
  id: string;
  emailCampaignId: string;
  contactId: string;

  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  firstClickAt?: string;

  openCount: number;
  clickCount: number;

  bounced: boolean;
  bounceReason?: string;
  bounceType?: BounceType;

  unsubscribed: boolean;
  unsubscribedAt?: string;

  createdAt: string;
  updatedAt: string;
}

// =============================================
// CONTACT PREFERENCES TYPES
// =============================================

export interface EmailTypePreferences {
  newsletter?: boolean;
  marketing?: boolean;
  transactional?: boolean;
  product_updates?: boolean;
}

export interface ChannelPreferences {
  email?: boolean;
  sms?: boolean;
  phone?: boolean;
}

export const contactFrequencies = ['daily', 'weekly', 'monthly', 'never'] as const;
export type ContactFrequency = typeof contactFrequencies[number];

export interface ContactPreferences {
  contactId: string;

  emailTypes?: EmailTypePreferences;
  channels?: ChannelPreferences;
  frequency?: ContactFrequency;

  optedOut: boolean;
  optedOutAt?: string;
  optOutReason?: string;

  updatedAt: string;
  createdAt: string;
}

// =============================================
// FORM INPUT TYPES (for creating/updating)
// =============================================

export interface CreateCampaignInput {
  name: string;
  goal: CampaignGoal;
  description?: string;
  startDate: string;
  endDate?: string;
  targetRoleCodes?: PartyRoleCode[];
  targetRoleCategories?: string[];
  excludeRoleCodes?: PartyRoleCode[];
  includeTags?: string[];
  excludeTags?: string[];
  minLeadScore?: number;
  additionalFilters?: Record<string, any>;
  channels: MarketingChannel[];
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  status?: CampaignStatus;
}

export interface CreateContentInput {
  title: string;
  contentType: ContentType;
  body: ContentBody;
  campaignId?: string;
  audienceTags?: string[];
  themeTags?: string[];
  funnelStage?: FunnelStage;
  featuredImageUrl?: string;
  previewText?: string;
}

export interface UpdateContentInput extends Partial<CreateContentInput> {
  status?: ContentStatus;
}

export interface ScheduleContentInput {
  contentId: string;
  campaignId?: string;
  channel: MarketingChannel;
  scheduledFor: string;
}

export interface CreateNewsletterInput {
  name: string;
  description?: string;
  targetRoleCodes?: PartyRoleCode[];
  targetRoleCategories?: string[];
  includeTags?: string[];
  frequency: NewsletterFrequency;
  templateId?: string;
}

export interface CreateNewsletterIssueInput {
  newsletterId: string;
  campaignId?: string;
  subject: string;
  introText?: string;
  contentBlocks?: ContentBlock[];
  scheduledFor?: string;
}

// =============================================
// ANALYTICS TYPES
// =============================================

export interface CampaignAnalytics {
  campaignId: string;
  channel: MarketingChannel;

  impressions: number;
  clicks: number;
  ctr: number;

  leadsGenerated: number;
  contactsEngaged: number;

  dealsCreated: number;
  revenueAttributed: number;

  contentCount: number;
  avgEngagement: number;

  lastUpdatedAt: string;
}

export interface ContentPerformance {
  contentId: string;
  title: string;
  contentType: ContentType;

  totalImpressions: number;
  totalClicks: number;
  totalEngagement: number;

  avgEngagementRate: number;

  topChannel: MarketingChannel;
  publishCount: number;
}

export interface AudienceEngagement {
  roleCode: PartyRoleCode;
  roleLabel: string;
  contactCount: number;

  avgLeadScore: number;
  hotLeadsCount: number;

  emailOpenRate: number;
  emailClickRate: number;

  topContent: string[]; // Content IDs
  preferredChannels: MarketingChannel[];
}
