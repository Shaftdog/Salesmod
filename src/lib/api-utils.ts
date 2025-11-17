/**
 * API Utility Functions
 * Common helpers for API endpoints including auth, logging, pagination, rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZodError } from 'zod';
import { formatValidationError } from '@/lib/validations/field-services';

// =====================================================
// Types
// =====================================================

export interface ApiContext {
  user: any;
  userId: string;
  orgId: string;
  supabase: any;
  requestId: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// =====================================================
// Request ID Generation
// =====================================================

let requestCounter = 0;

export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  const counter = (++requestCounter).toString(36).padStart(3, '0');
  return `req_${timestamp}${random}${counter}`;
}

// =====================================================
// Authentication & Authorization
// =====================================================

/**
 * Get authenticated API context with user and org info
 * Throws 401 if not authenticated
 */
export async function getApiContext(request: NextRequest): Promise<ApiContext> {
  const requestId = generateRequestId();
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ApiError('Unauthorized', 401, 'AUTH_REQUIRED', requestId);
  }

  // Extract org ID from user metadata or app metadata
  const orgId = user.user_metadata?.org_id || user.app_metadata?.org_id;

  if (!orgId) {
    throw new ApiError('Organization ID required', 403, 'ORG_ID_REQUIRED', requestId);
  }

  return {
    user,
    userId: user.id,
    orgId,
    supabase,
    requestId,
  };
}

/**
 * Check if user has admin role
 */
export async function requireAdmin(context: ApiContext): Promise<void> {
  const { supabase, userId, requestId } = context;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    throw new ApiError(
      'Admin access required',
      403,
      'ADMIN_REQUIRED',
      requestId
    );
  }
}

/**
 * Check if user has specific permission
 */
export async function requirePermission(
  context: ApiContext,
  resource: string,
  action: string
): Promise<void> {
  const { supabase, userId, requestId } = context;

  const { data: hasPermission } = await supabase.rpc('has_permission', {
    p_user_id: userId,
    p_resource: resource,
    p_action: action,
  });

  if (!hasPermission) {
    throw new ApiError(
      `Permission denied: ${action} on ${resource}`,
      403,
      'PERMISSION_DENIED',
      requestId
    );
  }
}

// =====================================================
// Pagination
// =====================================================

/**
 * Parse pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrevious: pagination.page > 1,
    },
  };
}

// =====================================================
// Error Handling
// =====================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public requestId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: any, requestId?: string): NextResponse {
  // Log error
  logError(error, requestId);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        ...formatValidationError(error),
      },
      { status: 400 }
    );
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId: error.requestId || requestId,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // Handle Supabase errors
  if (error?.code) {
    const message = getSupabaseErrorMessage(error);
    return NextResponse.json(
      {
        error: message,
        code: 'DATABASE_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }

  // Generic error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId,
    },
    { status: 500 }
  );
}

/**
 * Get user-friendly error message from Supabase error
 */
function getSupabaseErrorMessage(error: any): string {
  const errorMap: Record<string, string> = {
    '23505': 'A record with this value already exists',
    '23503': 'Referenced record does not exist',
    '23502': 'Required field is missing',
    'PGRST116': 'Record not found',
  };

  return errorMap[error.code] || 'Database operation failed';
}

// =====================================================
// Logging
// =====================================================

interface LogContext {
  requestId?: string;
  userId?: string;
  orgId?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

/**
 * Log error with context
 */
export function logError(error: any, requestId?: string, context?: LogContext): void {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'error',
    requestId,
    error: {
      name: error?.name || 'Error',
      message: error?.message || 'Unknown error',
      code: error?.code,
      stack: error?.stack,
    },
    ...context,
  };

  console.error('[API Error]', JSON.stringify(logData, null, 2));

  // In production, send to logging service (e.g., Sentry, DataDog)
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: logData });
  // }
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: LogContext): void {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    ...context,
  };

  console.log('[API Info]', JSON.stringify(logData));
}

/**
 * Log warning message
 */
export function logWarning(message: string, context?: LogContext): void {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'warning',
    message,
    ...context,
  };

  console.warn('[API Warning]', JSON.stringify(logData));
}

// =====================================================
// Rate Limiting (Simple in-memory implementation)
// =====================================================

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

/**
 * Check rate limit for a key (user ID, IP address, etc.)
 * Returns true if rate limit exceeded
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }
): { limited: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore[key];

  // Initialize or reset if window expired
  if (!record || record.resetAt <= now) {
    rateLimitStore[key] = {
      count: 1,
      resetAt: now + config.windowMs,
    };

    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetAt: rateLimitStore[key].resetAt,
    };
  }

  // Increment count
  record.count++;

  const remaining = Math.max(0, config.maxRequests - record.count);
  const limited = record.count > config.maxRequests;

  return {
    limited,
    remaining,
    resetAt: record.resetAt,
  };
}

/**
 * Middleware to apply rate limiting
 */
export async function applyRateLimit(
  request: NextRequest,
  context: ApiContext,
  config?: RateLimitConfig
): Promise<void> {
  const key = `ratelimit:${context.userId}`;
  const result = checkRateLimit(key, config);

  if (result.limited) {
    throw new ApiError(
      'Rate limit exceeded',
      429,
      'RATE_LIMIT_EXCEEDED',
      context.requestId,
      {
        resetAt: new Date(result.resetAt).toISOString(),
        remaining: 0,
      }
    );
  }
}

// Clean up expired rate limit entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    Object.keys(rateLimitStore).forEach((key) => {
      if (rateLimitStore[key].resetAt <= now) {
        delete rateLimitStore[key];
      }
    });
  }, 60000);
}

// =====================================================
// Response Helpers
// =====================================================

/**
 * Success response with optional pagination
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  });
}

/**
 * Created response (201)
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: 201 }
  );
}

/**
 * No content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// =====================================================
// Audit Logging
// =====================================================

/**
 * Create audit log entry
 */
export async function createAuditLog(
  context: ApiContext,
  action: string,
  entityType: string,
  entityId?: string,
  oldValues?: any,
  newValues?: any,
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical' = 'info'
): Promise<void> {
  const { supabase, userId, requestId } = context;

  try {
    await supabase.from('audit_logs').insert({
      org_id: context.orgId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      severity,
      metadata: { requestId },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    logError(error, requestId, {
      message: 'Failed to create audit log',
      action,
      entityType,
    });
  }
}

// =====================================================
// Query Helpers
// =====================================================

/**
 * Apply common filters to Supabase query
 */
export function applyFilters(query: any, filters: Record<string, any>): any {
  let filteredQuery = query;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      filteredQuery = filteredQuery.eq(key, value);
    }
  });

  return filteredQuery;
}

/**
 * Apply date range filter
 */
export function applyDateRange(
  query: any,
  field: string,
  dateFrom?: string,
  dateTo?: string
): any {
  let filteredQuery = query;

  if (dateFrom) {
    filteredQuery = filteredQuery.gte(field, dateFrom);
  }

  if (dateTo) {
    filteredQuery = filteredQuery.lte(field, dateTo);
  }

  return filteredQuery;
}

/**
 * Apply sorting
 */
export function applySorting(
  query: any,
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): any {
  if (sortBy) {
    return query.order(sortBy, { ascending: sortOrder === 'asc' });
  }
  return query.order('created_at', { ascending: false });
}

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
