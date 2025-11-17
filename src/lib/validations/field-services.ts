/**
 * Zod validation schemas for Field Services API endpoints
 * Ensures type-safe input validation and prevents injection attacks
 */

import { z } from 'zod';

// =====================================================
// Common/Shared Schemas
// =====================================================

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
});

const uuidSchema = z.string().uuid();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
const emailSchema = z.string().email();
const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional();

// =====================================================
// Phase 4: Mileage & Route Schemas
// =====================================================

export const createMileageLogSchema = z.object({
  resourceId: uuidSchema,
  bookingId: uuidSchema.optional(),
  routePlanId: uuidSchema.optional(),
  logDate: dateSchema,
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  startLocation: z.string().max(500).optional(),
  endLocation: z.string().max(500).optional(),
  startCoordinates: coordinatesSchema.optional(),
  endCoordinates: coordinatesSchema.optional(),
  distanceMiles: z.number().positive().max(9999).optional(),
  purpose: z.enum(['business', 'personal', 'commute']).default('business'),
  isBillable: z.boolean().default(true),
  vehicleId: uuidSchema.optional(),
  odometerStart: z.number().int().positive().max(999999).optional(),
  odometerEnd: z.number().int().positive().max(999999).optional(),
  ratePerMile: z.number().positive().max(10).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateMileageLogSchema = z.object({
  distanceMiles: z.number().positive().max(9999).optional(),
  purpose: z.enum(['business', 'personal', 'commute']).optional(),
  isBillable: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  isReimbursed: z.boolean().optional(),
  reimbursedDate: dateSchema.optional(),
});

export const optimizeRouteSchema = z.object({
  resourceId: uuidSchema,
  planDate: dateSchema,
  bookingIds: z.array(uuidSchema).min(1).max(50),
  startLocation: z.string().max(500).optional(),
});

export const trackGpsSchema = z.object({
  resourceId: uuidSchema,
  coordinates: coordinatesSchema,
  bookingId: uuidSchema.optional(),
  speed: z.number().nonnegative().max(200).optional(), // mph
  heading: z.number().int().min(0).max(359).optional(),
  altitude: z.number().optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  isOnline: z.boolean().default(true),
});

// =====================================================
// Phase 5: Notification & Portal Schemas
// =====================================================

export const sendNotificationSchema = z.object({
  type: z.enum(['sms', 'email', 'push']),
  recipient: z.string().min(1).max(255), // email or phone
  subject: z.string().max(255).optional(),
  message: z.string().min(1).max(5000),
  entityType: z.string().max(50).optional(),
  entityId: uuidSchema.optional(),
}).refine(
  (data) => {
    // Validate recipient format based on type
    if (data.type === 'email') {
      return z.string().email().safeParse(data.recipient).success;
    }
    if (data.type === 'sms') {
      return z.string().regex(/^\+?[\d\s\-\(\)]+$/).safeParse(data.recipient).success;
    }
    return true;
  },
  {
    message: 'Recipient format must match notification type (email or phone)',
    path: ['recipient'],
  }
);

export const createPortalAccessSchema = z.object({
  bookingId: uuidSchema,
  customerName: z.string().min(1).max(255),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  expiresHours: z.number().int().positive().max(8760).default(168), // Max 1 year
});

export const createDigitalSignatureSchema = z.object({
  bookingId: uuidSchema,
  signerName: z.string().min(1).max(255),
  signerEmail: emailSchema.optional(),
  signerRole: z.enum(['customer', 'appraiser', 'witness']).default('customer'),
  signatureData: z.string().min(100), // Base64 encoded image
  signatureMethod: z.enum(['drawn', 'typed', 'uploaded']).default('drawn'),
  documentType: z.string().max(50).optional(),
  documentUrl: z.string().url().optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(500).optional(),
  deviceInfo: z.record(z.any()).optional(),
});

export const uploadFieldPhotoSchema = z.object({
  bookingId: uuidSchema,
  photoType: z.enum(['exterior', 'interior', 'damage', 'amenity', 'comparable']),
  photoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().max(500).optional(),
  photoOrder: z.number().int().nonnegative().optional(),
  locationCoordinates: coordinatesSchema.optional(),
  takenAt: z.string().datetime().optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(100).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  isPublic: z.boolean().default(false),
});

export const submitFeedbackSchema = z.object({
  bookingId: uuidSchema.optional(),
  customerName: z.string().max(255).optional(),
  customerEmail: emailSchema.optional(),
  rating: z.number().int().min(1).max(5),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  overallExperienceRating: z.number().int().min(1).max(5).optional(),
  comments: z.string().max(2000).optional(),
  wouldRecommend: z.boolean().optional(),
  allowPublicTestimonial: z.boolean().default(false),
});

// =====================================================
// Phase 6: Analytics & Reports Schemas
// =====================================================

export const getAnalyticsDashboardSchema = z.object({
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  resourceId: uuidSchema.optional(),
  territoryId: uuidSchema.optional(),
});

export const createCustomReportSchema = z.object({
  reportName: z.string().min(1).max(255),
  reportType: z.enum(['table', 'chart', 'dashboard']),
  category: z.string().max(50).optional(),
  dataSource: z.string().min(1).max(100),
  filters: z.record(z.any()).optional(),
  grouping: z.array(z.string()).optional(),
  aggregations: z.record(z.any()).optional(),
  sorting: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
  chartType: z.enum(['bar', 'line', 'pie', 'area', 'scatter']).optional(),
  chartConfig: z.record(z.any()).optional(),
  isFavorite: z.boolean().default(false),
  isPublic: z.boolean().default(false),
});

export const createReportSubscriptionSchema = z.object({
  reportId: uuidSchema,
  deliverySchedule: z.enum(['daily', 'weekly', 'monthly']),
  deliveryMethod: z.enum(['email', 'slack', 'webhook']),
  deliveryTime: timeSchema.optional(),
  deliveryDayOfWeek: z.number().int().min(0).max(6).optional(),
  deliveryDayOfMonth: z.number().int().min(1).max(31).optional(),
});

// =====================================================
// Phase 7: Webhooks & Integrations Schemas
// =====================================================

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(255),
  targetUrl: z.string().url(),
  eventTypes: z.array(z.string()).min(1).max(50),
  isActive: z.boolean().default(true),
  secretKey: z.string().min(16).max(255).optional(),
  authHeaderName: z.string().max(100).optional(),
  authHeaderValue: z.string().max(500).optional(),
  retryCount: z.number().int().min(0).max(10).default(3),
  timeoutSeconds: z.number().int().min(5).max(120).default(30),
});

export const createIntegrationSchema = z.object({
  integrationType: z.enum(['calendar', 'accounting', 'sms', 'email', 'crm']),
  provider: z.string().min(1).max(100),
  displayName: z.string().min(1).max(255),
  isActive: z.boolean().default(true),
  authType: z.enum(['oauth2', 'api_key', 'basic']),
  authConfig: z.record(z.any()), // Will be encrypted
  settings: z.record(z.any()).optional(),
  syncEnabled: z.boolean().default(true),
  syncDirection: z.enum(['import', 'export', 'bidirectional']).default('bidirectional'),
  syncFrequency: z.enum(['realtime', 'hourly', 'daily']).default('realtime'),
});

export const createApiKeySchema = z.object({
  keyName: z.string().min(1).max(255),
  scopes: z.array(z.string()).min(1).max(100),
  expiresAt: z.string().datetime().optional(),
  rateLimitPerHour: z.number().int().positive().max(100000).default(1000),
});

// =====================================================
// Phase 8: Audit & Permissions Schemas
// =====================================================

export const getAuditLogsSchema = z.object({
  userId: uuidSchema.optional(),
  entityType: z.string().max(50).optional(),
  action: z.string().max(50).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  severity: z.enum(['debug', 'info', 'warning', 'error', 'critical']).optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0),
});

export const createRoleSchema = z.object({
  roleName: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  displayName: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  permissions: z.record(z.object({
    actions: z.array(z.enum(['read', 'write', 'delete', 'admin'])),
  })),
  isActive: z.boolean().default(true),
});

export const assignUserRoleSchema = z.object({
  userId: uuidSchema,
  roleId: uuidSchema,
  expiresAt: z.string().datetime().optional(),
});

export const batchOperationSchema = z.object({
  operationType: z.string().min(1).max(100),
  entityType: z.string().min(1).max(100),
  entityIds: z.array(uuidSchema).min(1).max(1000),
  operationData: z.record(z.any()),
});

export const updateSystemSettingSchema = z.object({
  category: z.string().min(1).max(100),
  settingKey: z.string().min(1).max(100),
  settingValue: z.any(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
  isEncrypted: z.boolean().default(false),
});

// =====================================================
// Common Pagination Schema
// =====================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(1000).default(50),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =====================================================
// Helper Functions
// =====================================================

/**
 * Validate and parse request body
 * Throws ZodError with detailed validation errors if invalid
 */
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate request body and return result with error handling
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format Zod validation errors for API responses
 */
export function formatValidationError(error: z.ZodError): {
  message: string;
  errors: Array<{ field: string; message: string }>;
} {
  return {
    message: 'Validation failed',
    errors: error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
