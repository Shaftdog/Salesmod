/**
 * Authentication Validation Schemas
 *
 * Zod schemas for validating auth-related requests
 * Reference: docs/client-portal/01-REQUIREMENTS.md#fr-1
 */

import { z } from 'zod';

/**
 * Registration schema
 * Requirements: FR-1.1
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  tenantName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must be less than 200 characters')
    .trim(),

  tenantType: z.enum(
    [
      'lender',
      'investor',
      'amc',
      'attorney',
      'accountant',
      'borrower',
      'internal',
    ],
    {
      errorMap: () => ({ message: 'Please select a valid company type' }),
    }
  ),
});

/**
 * Login schema
 * Requirements: FR-1.2
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z.string().min(1, 'Password is required'),
});

/**
 * Password reset request schema
 * Requirements: FR-1.3
 */
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
});

/**
 * MFA setup/verify schema
 * Requirements: FR-1.4
 */
export const mfaVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^[0-9]+$/, 'Verification code must contain only numbers'),

  factorId: z
    .string()
    .uuid('Invalid factor ID'),
});

/**
 * Update password schema (for logged-in users)
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),

  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

/**
 * Type exports for TypeScript
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type MFAVerifyInput = z.infer<typeof mfaVerifySchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
