import { TransformFunction } from './types';

/**
 * Transform functions for field mapping
 * Applied during migration to normalize and convert data
 */

export function applyTransform(
  value: any,
  transform: TransformFunction,
  params?: Record<string, any>
): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (transform) {
    case 'lowercase':
      return transformLowercase(value);
    case 'toNumber':
      return transformToNumber(value);
    case 'toDate':
      return transformToDate(value);
    case 'concat':
      return transformConcat(value, params);
    case 'coalesce':
      return transformCoalesce(value, params);
    case 'extract_domain':
      return transformExtractDomain(value);
    case 'none':
    default:
      return value;
  }
}

/**
 * Convert value to lowercase (for emails, domains, etc.)
 */
export function transformLowercase(value: any): string | null {
  if (typeof value !== 'string') {
    return String(value).toLowerCase();
  }
  return value.toLowerCase().trim();
}

/**
 * Convert value to number (parse currency, percentages, etc.)
 */
export function transformToNumber(value: any): number | null {
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    // Remove common currency symbols and formatting
    const cleaned = value.replace(/[$,€£¥%\s]/g, '').trim();
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) return null;
    return parsed;
  }
  
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Convert value to ISO date string
 */
export function transformToDate(value: any): string | null {
  if (!value) return null;
  
  // Already an ISO string
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toISOString();
  }
  
  // Try parsing various date formats
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Concatenate multiple fields
 * params: { fields: string[], separator: string }
 */
export function transformConcat(value: any, params?: Record<string, any>): string | null {
  if (!params?.fields || !Array.isArray(params.fields)) {
    return String(value);
  }
  
  const separator = params.separator || ' ';
  const values = params.fields
    .map((f: any) => f?.toString()?.trim())
    .filter(Boolean);
  
  return values.length > 0 ? values.join(separator) : null;
}

/**
 * Return first non-null value (fallback)
 * params: { fields: string[] }
 */
export function transformCoalesce(value: any, params?: Record<string, any>): any {
  if (value !== null && value !== undefined && value !== '') {
    return value;
  }
  
  if (!params?.fields || !Array.isArray(params.fields)) {
    return null;
  }
  
  for (const field of params.fields) {
    if (field !== null && field !== undefined && field !== '') {
      return field;
    }
  }
  
  return null;
}

/**
 * Extract domain from email address
 */
export function transformExtractDomain(value: any): string | null {
  if (!value || typeof value !== 'string') return null;
  
  const email = value.trim().toLowerCase();
  const match = email.match(/@([a-z0-9.-]+\.[a-z]{2,})$/i);
  
  return match ? match[1] : null;
}

/**
 * Validate email format
 */
export function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Validate phone format (basic - accepts various formats)
 */
export function isValidPhone(value: string): boolean {
  const cleaned = value.replace(/[\s().-]/g, '');
  return /^\+?[0-9]{10,15}$/.test(cleaned);
}

/**
 * Normalize company name for matching (remove common suffixes, lowercase)
 */
export function normalizeCompanyName(name: string): string {
  const suffixes = ['inc', 'llc', 'ltd', 'corp', 'corporation', 'co', 'company', 'limited'];
  let normalized = name.toLowerCase().trim();
  
  // Remove punctuation
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  
  // Remove common suffixes
  const words = normalized.split(/\s+/);
  const filtered = words.filter(word => !suffixes.includes(word));
  
  return filtered.join(' ').trim();
}

/**
 * Generate a hash for idempotency keys
 */
export function generateHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Sanitize field name for use as a key
 */
export function sanitizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

