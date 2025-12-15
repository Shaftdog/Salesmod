/**
 * Merge Token System
 * Handles token replacement in email templates
 */

import { AVAILABLE_MERGE_TOKENS, type MergeToken, type MergeTokenData } from './types';

// =====================================================
// Token Extraction
// =====================================================

/**
 * Extract all merge tokens from a template string
 * Example: "Hi {{first_name}}" -> ['first_name']
 */
export function extractMergeTokens(template: string): string[] {
  const regex = /{{\s*([a-z_]+)\s*}}/g;
  const matches = [...template.matchAll(regex)];
  return [...new Set(matches.map(m => m[1]))]; // Remove duplicates
}

/**
 * Validate that all tokens in the template are supported
 */
export function validateMergeTokens(tokens: string[]): {
  valid: boolean;
  invalid: string[];
} {
  const invalid = tokens.filter(t => !AVAILABLE_MERGE_TOKENS.includes(t as MergeToken));
  return {
    valid: invalid.length === 0,
    invalid,
  };
}

/**
 * Extract and validate tokens from a template in one call
 */
export function extractAndValidateTokens(template: string): {
  tokens: string[];
  valid: boolean;
  invalid: string[];
} {
  const tokens = extractMergeTokens(template);
  const validation = validateMergeTokens(tokens);

  return {
    tokens,
    ...validation,
  };
}

// =====================================================
// Token Replacement
// =====================================================

/**
 * Replace merge tokens in a template with actual values
 * Example: "Hi {{first_name}}" + {first_name: "John"} -> "Hi John"
 */
export function replaceMergeTokens(
  template: string,
  data: Record<string, any>
): string {
  let result = template;

  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    const replacement = value !== null && value !== undefined ? String(value) : '';
    result = result.replace(regex, replacement);
  }

  return result;
}

/**
 * Get sample merge token data for preview purposes
 */
export function getSampleMergeData(): MergeTokenData {
  return {
    first_name: 'John',
    last_name: 'Doe',
    company_name: 'Sample AMC Company',
    last_order_date: formatDate(new Date('2024-03-15')),
    days_since_last_order: 247,
    property_count: 15,
    total_orders: 42,
  };
}

// =====================================================
// Data Formatting
// =====================================================

/**
 * Format a date for use in merge tokens
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculate days since a date
 */
export function daysSince(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Build merge token data from recipient/contact information
 */
export function buildMergeData(recipient: {
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  last_order_date?: string | null;
  days_since_last_order?: number | null;
  property_count?: number | null;
  total_orders?: number | null;
}): MergeTokenData {
  return {
    first_name: recipient.first_name || '',
    last_name: recipient.last_name || '',
    company_name: recipient.company_name || '',
    last_order_date: recipient.last_order_date
      ? formatDate(recipient.last_order_date)
      : '',
    days_since_last_order: recipient.days_since_last_order || 0,
    property_count: recipient.property_count || 0,
    total_orders: recipient.total_orders || 0,
  };
}

// =====================================================
// Preview Helpers
// =====================================================

/**
 * Preview template with sample data
 */
export function previewTemplate(template: string): {
  preview: string;
  tokens: string[];
  valid: boolean;
  invalid: string[];
} {
  const { tokens, valid, invalid } = extractAndValidateTokens(template);
  const sampleData = getSampleMergeData();
  const preview = replaceMergeTokens(template, sampleData);

  return {
    preview,
    tokens,
    valid,
    invalid,
  };
}

/**
 * Get token description for UI help text
 */
export function getTokenDescription(token: MergeToken): string {
  const descriptions: Record<MergeToken, string> = {
    first_name: "Recipient's first name",
    last_name: "Recipient's last name",
    company_name: "Company or organization name",
    last_order_date: "Date of most recent order (formatted)",
    days_since_last_order: "Number of days since last order",
    property_count: "Total number of properties",
    total_orders: "Total number of orders placed",
  };

  return descriptions[token] || '';
}

/**
 * Get all available tokens with descriptions
 */
export function getAvailableTokens(): Array<{ token: MergeToken; description: string }> {
  return AVAILABLE_MERGE_TOKENS.map(token => ({
    token,
    description: getTokenDescription(token),
  }));
}
