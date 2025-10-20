/**
 * Property Units Utilities
 * Handles unit normalization, validation, and type checking for fee simple units
 */

import { PropertyType } from './types';

/**
 * Normalize unit identifier for deduplication
 * Strips common prefixes, special chars, and whitespace
 * 
 * Examples:
 * - "Apt 2B" → "2B"
 * - "#305" → "305"
 * - "Unit A" → "A"
 * - "Suite 12-B" → "12B"
 * - "East Unit" → "EAST"
 * 
 * @param label - Raw unit identifier from user input
 * @returns Normalized string for unique constraint, or null if empty
 */
export function normalizeUnit(label?: string | null): string | null {
  if (!label) return null;
  
  const normalized = label
    .toUpperCase()
    // Remove common unit prefixes
    .replace(/\b(APT|APARTMENT|UNIT|STE|SUITE|FL|FLOOR|RM|ROOM|BLDG|BUILDING)\b/g, '')
    // Remove special characters
    .replace(/[#.,]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, '')
    .trim();
  
  return normalized || null;
}

/**
 * Check if property type suggests fee-simple units
 * These property types typically have multiple units with individual ownership
 * 
 * @param type - Property type
 * @returns True if property type commonly has fee-simple units
 */
export function isFeeSimplePropertyType(type: string): boolean {
  const feeSimpleTypes = [
    'condo',
    'multi_family',
    'townhouse'
  ];
  
  return feeSimpleTypes.includes(type);
}

/**
 * Determine if a unit record should be created
 * Considers property type, unit label presence, and custom props
 * 
 * @param propertyType - Type of property
 * @param unitLabel - Raw unit identifier
 * @param props - Additional property metadata
 * @returns True if unit should be created in property_units table
 */
export function shouldCreateUnit(
  propertyType: string, 
  unitLabel?: string | null,
  props?: Record<string, any>
): boolean {
  const norm = normalizeUnit(unitLabel);
  if (!norm) return false;
  
  // Don't create units for single-family with stray "#" like "# Front"
  // These are typically not actual unit numbers
  if (propertyType === 'single_family' && norm.length < 2) {
    return false;
  }
  
  // Create if fee-simple type OR property explicitly marked as having units
  return isFeeSimplePropertyType(propertyType) || props?.has_units === true;
}

/**
 * Validate unit identifier format
 * Returns validation errors or null if valid
 * 
 * @param identifier - Unit identifier to validate
 * @returns Error message or null if valid
 */
export function validateUnitIdentifier(identifier: string): string | null {
  if (!identifier || identifier.trim().length === 0) {
    return 'Unit identifier cannot be empty';
  }
  
  if (identifier.length > 50) {
    return 'Unit identifier must be 50 characters or less';
  }
  
  const norm = normalizeUnit(identifier);
  if (!norm) {
    return 'Unit identifier must contain alphanumeric characters';
  }
  
  return null;
}

/**
 * Format unit identifier for display
 * Ensures consistent presentation across the UI
 * 
 * @param identifier - Unit identifier
 * @param includePrefix - Whether to add "Unit" prefix if not present
 * @returns Formatted unit string
 */
export function formatUnitDisplay(identifier: string, includePrefix: boolean = false): string {
  if (!identifier) return '';
  
  const trimmed = identifier.trim();
  
  // If already has a prefix, return as-is
  if (/^(Apt|Unit|Suite|#|Ste|Rm|Floor|FL)\s*/i.test(trimmed)) {
    return trimmed;
  }
  
  // Add prefix if requested and not present
  if (includePrefix) {
    return `Unit ${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Check if two unit identifiers are equivalent after normalization
 * 
 * @param a - First unit identifier
 * @param b - Second unit identifier
 * @returns True if normalized forms match
 */
export function areUnitsEquivalent(a?: string | null, b?: string | null): boolean {
  const normA = normalizeUnit(a);
  const normB = normalizeUnit(b);
  
  if (!normA || !normB) return false;
  
  return normA === normB;
}

/**
 * Extract unit type from identifier or property type
 * Attempts to infer unit type from the label
 * 
 * @param identifier - Unit identifier
 * @param propertyType - Property type
 * @returns Suggested unit type
 */
export function inferUnitType(identifier?: string, propertyType?: PropertyType): string | null {
  if (!identifier) {
    // Infer from property type
    if (propertyType === 'condo') return 'condo';
    if (propertyType === 'townhouse') return 'townhouse';
    if (propertyType === 'multi_family') return 'apartment';
    return null;
  }
  
  const lower = identifier.toLowerCase();
  
  if (lower.includes('apt') || lower.includes('apartment')) return 'apartment';
  if (lower.includes('suite') || lower.includes('ste')) return 'office';
  if (lower.includes('floor') || lower.includes('fl')) return 'floor';
  if (lower.includes('penthouse') || lower.includes('ph')) return 'penthouse';
  if (lower.includes('townhouse') || lower.includes('th')) return 'townhouse';
  
  // Default based on property type
  if (propertyType === 'condo') return 'condo';
  if (propertyType === 'commercial') return 'office';
  if (propertyType === 'multi_family') return 'apartment';
  
  return null;
}


