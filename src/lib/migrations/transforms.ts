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
    case 'splitUSAddress':
      return splitUSAddress(value);
    case 'mapOrderStatus':
      return mapOrderStatus(value);
    case 'mapOrderType':
      return mapOrderType(value);
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

/**
 * Split US address into components
 * Handles formats like "123 Main St, Tampa FL 33602" or "123 Main St, Tampa, FL 33602"
 */
export function splitUSAddress(input: string): { street: string; city: string; state: string; zip: string } {
  if (!input) return { street: "", city: "", state: "", zip: "" };
  
  const t = input.trim().replace(/\s{2,}/g, " ");
  
  // Primary pattern: "123 Main St, Tampa FL 33602" or "123 Main St, Tampa, FL 33602"
  const m = t.match(/^(.*?),(?:\s*)(.*?)[,\s]+([A-Z]{2})[,\s]+(\d{5})(?:-\d{4})?$/i);
  if (m) {
    return {
      street: m[1].trim(),
      city: m[2].trim(),
      state: m[3].toUpperCase(),
      zip: m[4]
    };
  }
  
  // Fallback: split by commas; try last tokens for state + zip
  const parts = t.split(",");
  const last = parts[parts.length - 1] || "";
  const zip = (last.match(/(\d{5})(?:-\d{4})?/) || [])[1] || "";
  const state = (last.match(/\b([A-Z]{2})\b/i) || [])[1]?.toUpperCase() || "";
  const city = parts.length > 1 ? parts[parts.length - 2].trim() : "";
  const street = parts[0].trim();
  
  return { street, city, state, zip };
}

/**
 * Map order status from various formats to standardized values
 */
export function mapOrderStatus(s?: string): string {
  const t = (s || "").toUpperCase();
  if (t.includes("DELIVER")) return "delivered";
  if (t.includes("SCHEDULE")) return "scheduled";
  if (t.includes("PRODUCTION") || t.includes("INSPECTION")) return "in_progress";
  if (t.includes("REVIEW")) return "in_review";
  if (t.includes("REVISION")) return "revisions";
  if (t.includes("CANCEL")) return "cancelled";
  if (t.includes("COMPLETE")) return "completed";
  if (t.includes("ASSIGN")) return "assigned";
  return "new";
}

/**
 * Map order type from various formats to standardized values
 */
export function mapOrderType(p?: string): string {
  const t = (p || "").toLowerCase();
  if (t.includes("purchase")) return "purchase";
  if (t.includes("refinance")) return "refinance";
  if (t.includes("home equity")) return "home_equity";
  if (t.includes("estate")) return "estate";
  if (t.includes("divorce")) return "divorce";
  if (t.includes("tax")) return "tax_appeal";
  return "other";
}

