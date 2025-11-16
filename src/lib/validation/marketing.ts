/**
 * Zod Validation Schemas for Marketing Module
 *
 * Provides comprehensive input validation for all marketing API routes
 * to prevent malformed data, injection attacks, and business logic errors.
 */

import { z } from 'zod';
import {
  campaignGoals,
  campaignStatuses,
  marketingChannels,
  contentTypes,
  contentStatuses,
  funnelStages,
} from '@/lib/types/marketing';

// =============================================
// CAMPAIGN SCHEMAS
// =============================================

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  goal: z.enum(campaignGoals, { errorMap: () => ({ message: 'Invalid campaign goal' }) }),
  description: z.string().max(2000, 'Description too long').optional(),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format').optional(),

  // Audience targeting
  targetRoleCodes: z.array(z.string()).optional(),
  targetRoleCategories: z.array(z.enum(['lender', 'investor', 'service_provider', 'other'])).optional(),
  excludeRoleCodes: z.array(z.string()).optional(),
  includeTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
  minLeadScore: z.number().min(0).max(100).optional(),
  additionalFilters: z.record(z.any()).optional(),

  channels: z.array(
    z.enum(marketingChannels, { errorMap: () => ({ message: 'Invalid marketing channel' }) })
  ).min(1, 'At least one channel is required'),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  goal: z.enum(campaignGoals).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(campaignStatuses).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  targetRoleCodes: z.array(z.string()).optional(),
  targetRoleCategories: z.array(z.enum(['lender', 'investor', 'service_provider', 'other'])).optional(),
  excludeRoleCodes: z.array(z.string()).optional(),
  includeTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
  minLeadScore: z.number().min(0).max(100).optional(),
  additionalFilters: z.record(z.any()).optional(),

  channels: z.array(z.enum(marketingChannels)).optional(),
});

// =============================================
// CONTENT SCHEMAS
// =============================================

export const createContentSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID').optional(),
  type: z.enum(contentTypes, { errorMap: () => ({ message: 'Invalid content type' }) }),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),

  body: z.object({
    short: z.string().max(280, 'Short content must be 280 characters or less').optional(),
    medium: z.string().max(2200, 'Medium content must be 2200 characters or less').optional(),
    long: z.string().max(100000, 'Long content too long').optional(),
    html: z.string().max(100000, 'HTML content too long').optional(),
  }).optional(),

  channel: z.enum(marketingChannels, { errorMap: () => ({ message: 'Invalid channel' }) }),
  funnelStage: z.enum(funnelStages, { errorMap: () => ({ message: 'Invalid funnel stage' }) }).optional(),
  tags: z.array(z.string()).optional(),
  scheduledFor: z.string().datetime('Invalid scheduled date').optional(),
});

export const updateContentSchema = z.object({
  campaignId: z.string().uuid().optional(),
  type: z.enum(contentTypes).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(contentStatuses).optional(),

  body: z.object({
    short: z.string().max(280).optional(),
    medium: z.string().max(2200).optional(),
    long: z.string().max(100000).optional(),
    html: z.string().max(100000).optional(),
  }).optional(),

  channel: z.enum(marketingChannels).optional(),
  funnelStage: z.enum(funnelStages).optional(),
  tags: z.array(z.string()).optional(),
  scheduledFor: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
});

// =============================================
// EMAIL TEMPLATE SCHEMAS
// =============================================

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['newsletter', 'campaign', 'follow_up', 'announcement', 'transactional'], {
    errorMap: () => ({ message: 'Invalid category' })
  }),
  subjectTemplate: z.string().min(1, 'Subject template is required').max(255, 'Subject too long'),
  previewText: z.string().max(255).optional(),
  bodyTemplate: z.string().min(1, 'Body template is required').max(500000, 'Body template too long'),
  variables: z.record(z.string()).optional(),
});

export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(['newsletter', 'campaign', 'follow_up', 'announcement', 'transactional']).optional(),
  subjectTemplate: z.string().min(1).max(255).optional(),
  previewText: z.string().max(255).optional(),
  bodyTemplate: z.string().min(1).max(500000).optional(),
  variables: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// =============================================
// NEWSLETTER SCHEMAS
// =============================================

export const createNewsletterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly'], {
    errorMap: () => ({ message: 'Invalid frequency' })
  }),
  fromName: z.string().min(1, 'From name is required').max(255, 'From name too long').optional(),
  fromEmail: z.string().email('Invalid email address').max(255).optional(),
  replyTo: z.string().email('Invalid reply-to email').max(255).optional(),
  targetAudience: z.record(z.any()).optional(),
});

export const updateNewsletterSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly']).optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  fromName: z.string().min(1).max(255).optional(),
  fromEmail: z.string().email().max(255).optional(),
  replyTo: z.string().email().max(255).optional(),
  targetAudience: z.record(z.any()).optional(),
});

export const createNewsletterIssueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject too long'),
  htmlContent: z.string().min(1, 'HTML content is required').max(500000, 'HTML content too long'),
  textContent: z.string().max(100000, 'Text content too long').optional(),
  scheduledFor: z.string().datetime('Invalid scheduled date').optional(),
});

export const updateNewsletterIssueSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(255).optional(),
  htmlContent: z.string().min(1).max(500000).optional(),
  textContent: z.string().max(100000).optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed']).optional(),
  scheduledFor: z.string().datetime().optional(),
  sentAt: z.string().datetime().optional(),
});

// =============================================
// WEBINAR SCHEMAS
// =============================================

export const createWebinarSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  scheduledAt: z.string().datetime('Invalid scheduled time'),
  duration: z.number().int().min(15).max(480).optional(),
  presenters: z.array(z.string()).optional(),
  maxAttendees: z.number().int().min(1).max(10000).optional(),
  registrationDeadline: z.string().datetime('Invalid registration deadline').optional(),
  meetingUrl: z.string().url('Invalid meeting URL').max(500).optional(),
  recordingUrl: z.string().url('Invalid recording URL').max(500).optional(),
  campaignId: z.string().uuid('Invalid campaign ID').optional(),
});

export const updateWebinarSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'scheduled', 'live', 'completed', 'cancelled']).optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  presenters: z.array(z.string()).optional(),
  maxAttendees: z.number().int().min(1).max(10000).optional(),
  registrationDeadline: z.string().datetime().optional(),
  meetingUrl: z.string().url().max(500).optional(),
  recordingUrl: z.string().url().max(500).optional(),
  campaignId: z.string().uuid().optional(),
});

export const createWebinarRegistrationSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  email: z.string().email('Invalid email address').max(255),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  company: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
});

// =============================================
// AUDIENCE BUILDER SCHEMAS
// =============================================

export const calculateAudienceSizeSchema = z.object({
  targetRoleCodes: z.array(z.string()).optional(),
  targetRoleCategories: z.array(z.enum(['lender', 'investor', 'service_provider', 'other'])).optional(),
  excludeRoleCodes: z.array(z.string()).optional(),
  includeTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
  minLeadScore: z.number().min(0).max(100).optional(),
  maxLeadScore: z.number().min(0).max(100).optional(),
  leadLabels: z.array(z.enum(['cold', 'warm', 'hot'])).optional(),
  lastActivityDays: z.number().int().min(0).max(3650).optional(),
  hasOrders: z.boolean().optional(),
  orderCountMin: z.number().int().min(0).optional(),
  orderCountMax: z.number().int().min(0).optional(),
  totalRevenueMin: z.number().min(0).optional(),
  states: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
});
