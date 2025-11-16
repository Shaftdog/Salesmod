/**
 * API Error Handling Utilities
 * Provides consistent error responses across all API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

// =============================================
// ERROR TYPES
// =============================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

// =============================================
// ERROR RESPONSE INTERFACE
// =============================================

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
    statusCode: number;
  };
}

// =============================================
// ERROR FORMATTING
// =============================================

/**
 * Format Zod validation errors into a readable format
 */
export function formatZodError(error: ZodError): ErrorResponse {
  const details = error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return {
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
      statusCode: 400,
    },
  };
}

/**
 * Format Supabase PostgrestError into a readable format
 */
export function formatSupabaseError(error: PostgrestError): ErrorResponse {
  // Map common Postgres error codes
  const errorCodeMap: Record<string, { message: string; code: string; statusCode: number }> = {
    '23505': {
      message: 'A record with this value already exists',
      code: 'DUPLICATE_RECORD',
      statusCode: 409,
    },
    '23503': {
      message: 'Referenced record does not exist',
      code: 'FOREIGN_KEY_VIOLATION',
      statusCode: 400,
    },
    '23514': {
      message: 'Check constraint violation',
      code: 'CHECK_VIOLATION',
      statusCode: 400,
    },
    '42501': {
      message: 'Insufficient privileges',
      code: 'INSUFFICIENT_PRIVILEGES',
      statusCode: 403,
    },
    'PGRST116': {
      message: 'Record not found',
      code: 'NOT_FOUND',
      statusCode: 404,
    },
  };

  const mapped = errorCodeMap[error.code] || {
    message: error.message || 'Database operation failed',
    code: error.code || 'DATABASE_ERROR',
    statusCode: 500,
  };

  return {
    error: {
      message: mapped.message,
      code: mapped.code,
      details: {
        hint: error.hint,
        details: error.details,
      },
      statusCode: mapped.statusCode,
    },
  };
}

/**
 * Format ApiError into a response
 */
export function formatApiError(error: ApiError): ErrorResponse {
  return {
    error: {
      message: error.message,
      code: error.code,
      details: error.details,
      statusCode: error.statusCode,
    },
  };
}

/**
 * Format generic Error into a response
 */
export function formatGenericError(error: Error): ErrorResponse {
  console.error('Unexpected error:', error);

  return {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode: 500,
    },
  };
}

// =============================================
// ERROR HANDLER
// =============================================

/**
 * Centralized error handler for API routes
 * Automatically formats and returns appropriate error responses
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Zod validation error
  if (error instanceof ZodError) {
    const formatted = formatZodError(error);
    return NextResponse.json(formatted, { status: formatted.error.statusCode });
  }

  // Custom API error
  if (error instanceof ApiError) {
    const formatted = formatApiError(error);
    return NextResponse.json(formatted, { status: formatted.error.statusCode });
  }

  // Supabase error
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const formatted = formatSupabaseError(error as PostgrestError);
    return NextResponse.json(formatted, { status: formatted.error.statusCode });
  }

  // Generic error
  const formatted = formatGenericError(error as Error);
  return NextResponse.json(formatted, { status: formatted.error.statusCode });
}

// =============================================
// SUCCESS RESPONSE HELPERS
// =============================================

export interface SuccessResponse<T = any> {
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Create a success response with data
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: SuccessResponse<T>['meta']
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({
    data,
    message,
    meta,
  });
}

/**
 * Create a created (201) response
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      data,
      message: message || 'Resource created successfully',
    },
    { status: 201 }
  );
}

/**
 * Create a no content (204) response
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create a not found (404) response
 */
export function notFoundResponse(message: string = 'Resource not found'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        message,
        code: 'NOT_FOUND',
        statusCode: 404,
      },
    },
    { status: 404 }
  );
}

// =============================================
// VALIDATION HELPERS
// =============================================

/**
 * Validate request body against a Zod schema
 * Throws ValidationError if validation fails
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid request body', error.errors);
    }
    throw error;
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  url: URL,
  schema: { parse: (data: unknown) => T }
): T {
  const params: Record<string, string> = {};

  // Keep all query params as strings - let Zod schema handle transformations
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  try {
    return schema.parse(params) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw error;
  }
}

// =============================================
// AUTHORIZATION HELPERS
// =============================================

/**
 * Get the authenticated user's org_id from Supabase session
 */
export async function getAuthenticatedOrgId(supabase: any): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError('Authentication required');
  }

  // In this app, user.id is the org_id (profile id)
  return user.id;
}

/**
 * Verify that a resource belongs to the authenticated user's org
 */
// Valid tables for ownership verification (must have org_id column)
const TABLES_WITH_ORG_ID = [
  'invoices',
  'payments',
  'clients',
  'orders',
  'properties',
  'comparables',
] as const;

export async function verifyResourceOwnership(
  supabase: SupabaseClient,
  table: string,
  resourceId: string,
  orgId: string
): Promise<void> {
  // Validate table name to prevent potential misuse
  if (!TABLES_WITH_ORG_ID.includes(table as any)) {
    console.error('SECURITY: Invalid table for ownership verification', {
      table,
      resourceId,
      orgId,
    });
    throw new Error(`Invalid table for ownership verification: ${table}`);
  }

  const { data, error } = await supabase
    .from(table)
    .select('org_id')
    .eq('id', resourceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Resource');
    }
    console.error('Ownership verification error', {
      table,
      resourceId,
      error: error.message,
      code: error.code,
    });
    throw error;
  }

  if (!data || data.org_id !== orgId) {
    // Log potential unauthorized access attempts
    console.warn('SECURITY: Unauthorized resource access attempt', {
      table,
      resourceId,
      attemptedBy: orgId,
      actualOwner: data?.org_id || 'unknown',
      timestamp: new Date().toISOString(),
    });
    throw new ForbiddenError('You do not have access to this resource');
  }
}
