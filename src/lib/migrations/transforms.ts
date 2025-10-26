import { TransformFunction } from './types';

/**
 * Transform functions for field mapping
 * Applied during migration to normalize and convert data
 */

export function applyTransform(
  value: any,
  transform: TransformFunction,
  params?: Record<string, any>,
  fullRow?: Record<string, any>
): any {
  // Special handling for composite transforms that need access to multiple fields
  if (transform === 'combineAddress') {
    return combineAddress(params, fullRow);
  }

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
    case 'toBoolean':
      return transformToBoolean(value);
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
    // Appraisal workflow field transforms
    case 'mapScopeOfWork':
      return mapScopeOfWork(value);
    case 'mapReportFormat':
      return mapReportFormat(value);
    case 'splitFormsArray':
      return splitFormsArray(value);
    case 'mapBillingMethod':
      return mapBillingMethod(value);
    case 'mapSalesCampaign':
      return mapSalesCampaign(value);
    case 'mapSiteInfluence':
      return mapSiteInfluence(value);
    case 'extractMultiunitType':
      return extractMultiunitType(value);
    case 'extractNewConstructionType':
      return extractNewConstructionType(value);
    case 'extractZoningType':
      return extractZoningType(value);
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
 * Enhanced version with better parsing for malformed addresses
 * Handles formats like:
 * - "123 Main St, Tampa, FL 33602" (ideal)
 * - "123 Main St, Tampa FL 33602" (no comma before state)
 * - "123 Main St Tampa FL 33602" (no commas - problematic)
 * - "123 Main St Orlando, FL 32805" (city in street field)
 */
export function splitUSAddress(input: string): { street: string; city: string; state: string; zip: string } {
  if (!input) return { street: "", city: "", state: "", zip: "" };
  
  const t = input.trim().replace(/\s{2,}/g, " ");
  
  // Pattern 1: Standard format with commas "123 Main St, Tampa, FL 33602"
  const standardMatch = t.match(/^(.*?),\s*(.*?)[,\s]+([A-Z]{2})[,\s]+(\d{5})(?:-\d{4})?$/i);
  if (standardMatch) {
    return {
      street: standardMatch[1].trim(),
      city: standardMatch[2].trim(),
      state: standardMatch[3].toUpperCase(),
      zip: standardMatch[4]
    };
  }
  
  // Pattern 2: Extract state and zip from end (always reliable)
  const zip = (t.match(/(\d{5})(?:-\d{4})?/) || [])[1] || "";
  const state = (t.match(/\b([A-Z]{2})\b/i) || [])[1]?.toUpperCase() || "";
  
  // Pattern 3: Common Florida cities - try to detect in address
  // This helps when comma is missing: "10 N Ohio St Orlando, FL 32805"
  const flCities = [
    'Orlando', 'Tampa', 'Miami', 'Jacksonville', 'Tallahassee', 'Fort Lauderdale',
    'St Petersburg', 'Hialeah', 'Port St Lucie', 'Cape Coral', 'Pembroke Pines',
    'Hollywood', 'Miramar', 'Coral Springs', 'Clearwater', 'Gainesville', 
    'Brandon', 'Palm Bay', 'Lakeland', 'Pompano Beach', 'West Palm Beach',
    'Davie', 'Boca Raton', 'Deltona', 'Plantation', 'Sunrise', 'Palm Coast',
    'Largo', 'Melbourne', 'Boynton Beach', 'Deerfield Beach', 'Fort Myers',
    'Kissimmee', 'Homestead', 'Tamarac', 'Daytona Beach', 'Delray Beach',
    'Port Charlotte', 'North Miami', 'Wellington', 'North Port', 'Jupiter',
    'Ocala', 'Coconut Creek', 'Sanford', 'Sarasota', 'Bradenton', 'Apopka',
    'Palm Beach Gardens', 'Doral', 'Bonita Springs', 'Titusville', 'Venice',
    'Ocoee', 'Eustis', 'Lady Lake', 'Port Charlotte', 'Fort Meade', 'LaBelle',
    'Davenport', 'Grand Island', 'Winter Garden', 'Clermont'
  ];
  
  // Try to find city name in the address string
  let detectedCity = "";
  let streetWithoutCity = t;
  
  for (const city of flCities) {
    const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
    if (cityRegex.test(t)) {
      detectedCity = city;
      // Remove city from street field
      streetWithoutCity = t.replace(cityRegex, '').trim();
      break;
    }
  }
  
  // Pattern 4: Standard comma-separated parsing
  const parts = t.split(",").map(p => p.trim());
  
  if (parts.length >= 3) {
    // Format: "Street, City, State Zip"
    return {
      street: parts[0],
      city: parts[1] || detectedCity,
      state: state,
      zip: zip
    };
  } else if (parts.length === 2) {
    // Format: "Street City, State Zip" or "Street, City State Zip"
    if (detectedCity) {
      // City was detected in first part, extract it
      const streetPart = parts[0].replace(new RegExp(`\\b${detectedCity}\\b`, 'i'), '').trim();
      return {
        street: streetPart,
        city: detectedCity,
        state: state,
        zip: zip
      };
    } else {
      // Assume first part is street, city is in second part
      const secondPartWords = parts[1].split(/\s+/);
      const possibleCity = secondPartWords[0]; // First word might be city
      return {
        street: parts[0],
        city: possibleCity && !['FL', 'AL', 'GA'].includes(possibleCity.toUpperCase()) ? possibleCity : "",
        state: state,
        zip: zip
      };
    }
  } else {
    // Single part or no commas - use detected city if found
    if (detectedCity && state && zip) {
      const streetPart = streetWithoutCity
        .replace(/,/g, '')
        .replace(new RegExp(`\\s*${state}\\s*`, 'i'), '')
        .replace(zip, '')
        .trim();
      return {
        street: streetPart,
        city: detectedCity,
        state: state,
        zip: zip
      };
    }
    
    // Last resort fallback
    return {
      street: parts[0],
      city: detectedCity || "",
      state: state,
      zip: zip
    };
  }
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

/**
 * Combine address components into a single address string
 * Supports two patterns:
 * 1. Multi-line: { line1: "Address", line2: "Address 2", line3: "Address 3" }
 * 2. Components: { street: "Street", city: "City", state: "State", zip: "Zip" }
 * where each value is the SOURCE COLUMN NAME to pull from fullRow
 */
export function combineAddress(
  params?: Record<string, any>,
  fullRow?: Record<string, any>
): string | null {
  if (!params || !fullRow) return null;

  // Get all possible field values
  const line1 = params.line1 ? fullRow[params.line1] : null;
  const line2 = params.line2 ? fullRow[params.line2] : null;
  const line3 = params.line3 ? fullRow[params.line3] : null;
  const street = params.street ? fullRow[params.street] : null;
  const city = params.city ? fullRow[params.city] : null;
  const state = params.state ? fullRow[params.state] : null;
  const zip = params.zip ? fullRow[params.zip] : null;

  // Build complete address from ALL available parts
  // This handles ANY combination: street/line1/line2/line3 + city/state/zip
  const parts: string[] = [];
  
  // Add street or line1 (primary address line)
  if (street && String(street).trim()) {
    parts.push(String(street).trim());
  } else if (line1 && String(line1).trim()) {
    parts.push(String(line1).trim());
  }
  
  // Add line2 and line3 (secondary address lines)
  if (line2 && String(line2).trim()) {
    parts.push(String(line2).trim());
  }
  if (line3 && String(line3).trim()) {
    parts.push(String(line3).trim());
  }
  
  // Add city, state, zip
  if (city && String(city).trim()) {
    parts.push(String(city).trim());
  }
  if (state && String(state).trim()) {
    parts.push(String(state).trim());
  }
  if (zip && String(zip).trim()) {
    parts.push(String(zip).trim());
  }

  // Return combined address or null if nothing
  return parts.length > 0 ? parts.join(', ') : null;
}

// ==================================================================
// APPRAISAL WORKFLOW FIELD TRANSFORMS
// ==================================================================

/**
 * Convert value to boolean
 * Handles: "Yes", "No", "true", "false", 1, 0, "Y", "N"
 */
export function transformToBoolean(value: any): boolean | null {
  if (value === null || value === undefined || value === '') return null;
  
  const str = String(value).toLowerCase().trim();
  
  // Check for "No" explicitly (before "yes" check)
  if (str === 'no' || str === 'n' || str === 'false' || str === '0') {
    return false;
  }
  
  // Check for "Yes" - includes variations like "Yes - ..."
  if (str.startsWith('yes') || str === 'y' || str === 'true' || str === '1') {
    return true;
  }
  
  return null;
}

/**
 * Map Scope of Work from Asana format to database enum
 * Maps: "Interior Appraisal" → "interior"
 */
export function mapScopeOfWork(value: string): string | null {
  if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  
  const mapping: Record<string, string> = {
    'desktop appraisal': 'desktop',
    'desktop': 'desktop',
    'exterior only appraisal': 'exterior_only',
    'exterior only': 'exterior_only',
    'exterior': 'exterior_only',
    'interior appraisal': 'interior',
    'interior': 'interior',
    'inspection only': 'inspection_only',
    'desk review': 'desk_review',
    'field review': 'field_review',
  };
  
  return mapping[normalized] || 'interior'; // default to interior
}

/**
 * Map Report Format to simplified form type
 * Maps: "1004 - Interior" → "1004"
 */
export function mapReportFormat(value: string): string | null {
  if (!value) return null;
  
  const normalized = value.trim();
  
  // Extract form number/code (before the dash if present)
  const match = normalized.match(/^([A-Z0-9]+)/i);
  if (match) {
    return match[1].toUpperCase();
  }
  
  return normalized;
}

/**
 * Split additional forms string into array
 * Maps: "1007 - Rent Survey" → ["1007"]
 * Maps: "N/A" → null
 */
export function splitFormsArray(value: string): string[] | null {
  if (!value) return null;
  
  const normalized = value.trim().toLowerCase();
  
  // Check for N/A or None
  if (normalized === 'n/a' || normalized === 'none' || normalized === '') {
    return null;
  }
  
  // Split by common delimiters and extract form codes
  const forms: string[] = [];
  const parts = value.split(/[,;]/).map(p => p.trim());
  
  for (const part of parts) {
    // Extract form number/code
    const match = part.match(/(\d{3,4}|[A-Z]{2,})/i);
    if (match) {
      forms.push(match[1].toUpperCase());
    } else {
      // Keep full text for non-standard forms
      forms.push(part);
    }
  }
  
  return forms.length > 0 ? forms : null;
}

/**
 * Map Billing Method to database enum
 * Maps: "Bill" → "bill", "Online" → "online", "COD" → "cod"
 */
export function mapBillingMethod(value: string): string | null {
  if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  
  if (normalized === 'bill') return 'bill';
  if (normalized === 'online') return 'online';
  if (normalized === 'cod') return 'cod';
  
  // Default to bill if unrecognized
  return 'bill';
}

/**
 * Map Sales Campaign to snake_case enum value
 * Maps: "CLIENT SELECTION" → "client_selection"
 */
export function mapSalesCampaign(value: string): string | null {
  if (!value) return null;
  
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Map Site Influence to database enum
 * Maps: "None", "Water", "Commercial", "Woods", "Golf Course"
 */
export function mapSiteInfluence(value: string): string | null {
  if (!value) return 'none';
  
  const normalized = value.toLowerCase().trim();
  
  const mapping: Record<string, string> = {
    'none': 'none',
    'water': 'water',
    'waterfront': 'water',
    'commercial': 'commercial',
    'woods': 'woods',
    'wooded': 'woods',
    'golf course': 'golf_course',
    'golf': 'golf_course',
  };
  
  return mapping[normalized] || 'none';
}

/**
 * Extract multiunit type from Yes/No answer
 * Maps: "Yes - 2 Units" → "two_unit"
 * Maps: "No" → null (handled by is_multiunit boolean)
 */
export function extractMultiunitType(value: string): string | null {
  if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  
  // If it's a "No" answer, return null
  if (normalized === 'no' || !normalized.startsWith('yes')) {
    return null;
  }
  
  // Extract type from "Yes - TYPE" format
  if (normalized.includes('adu') || normalized.includes('apartment') || normalized.includes('inlaw')) {
    return 'adu_apartment_inlaw';
  }
  if (normalized.includes('2 unit')) {
    return 'two_unit';
  }
  if (normalized.includes('3 unit')) {
    return 'three_unit';
  }
  if (normalized.includes('4 unit')) {
    return 'four_unit';
  }
  if (normalized.includes('5 unit') || normalized.includes('commercial')) {
    return 'five_plus_commercial';
  }
  
  return null;
}

/**
 * Extract new construction type from Yes/No answer
 * Maps: "Yes - Community Builder" → "community_builder"
 * Maps: "No" → null (handled by is_new_construction boolean)
 */
export function extractNewConstructionType(value: string): string | null {
  if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  
  // If it's a "No" answer, return null
  if (normalized.startsWith('no')) {
    return null;
  }
  
  // Extract type from "Yes - TYPE" format
  if (normalized.includes('community builder')) {
    return 'community_builder';
  }
  if (normalized.includes('spec') || normalized.includes('custom')) {
    return 'spec_custom';
  }
  if (normalized.includes('refinance') && normalized.includes('newly constructed')) {
    return 'refinance_newly_constructed';
  }
  
  return null;
}

/**
 * Extract zoning type from Yes/No answer
 * Maps: "Yes - Residential" → "residential"
 * Maps: "Yes - Planned Unit Development" → "planned_unit_development"
 */
export function extractZoningType(value: string): string | null {
  if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  
  // Extract zoning type
  if (normalized.includes('residential') && !normalized.includes('unit') && !normalized.includes('mixed')) {
    return 'residential';
  }
  if (normalized.includes('planned unit development') || normalized.includes('pud')) {
    return 'planned_unit_development';
  }
  if (normalized.includes('2 unit')) {
    return 'two_unit';
  }
  if (normalized.includes('3 unit')) {
    return 'three_unit';
  }
  if (normalized.includes('4 unit')) {
    return 'four_unit';
  }
  if (normalized.includes('mixed use')) {
    return 'mixed_use';
  }
  if (normalized.includes('agricultural')) {
    return 'agricultural';
  }
  if (normalized.includes('commercial')) {
    return 'commercial';
  }
  
  // Default to residential
  return 'residential';
}

/**
 * Detect if a client name represents an individual vs a company
 * Returns 'individual' or 'company'
 */
export function detectClientType(name: string): 'individual' | 'company' {
  if (!name) return 'company';
  
  const normalized = name.trim();
  
  // Business entity suffixes/keywords indicating it's a company
  const companyIndicators = [
    // Legal suffixes
    'LLC', 'Inc', 'Corp', 'Ltd', 'Limited', 'Corporation', 'Company', 'Co',
    'L.P.', 'LP', 'LLP', 'Partnership',
    // Business structures
    'Group', 'Partners', 'Associates', 'Services', 'Solutions', 'Holdings',
    'Enterprises', 'Properties', 'Investments', 'Management', 'Consulting',
    'Advisors', 'Capital', 'Ventures',
    // Industry-specific terms
    'AMC', 'Appraisal', 'Valuation', 'Analytics', 'Real Estate', 'Realty',
    'Lending', 'Mortgage', 'Finance', 'Financial', 'Law', 'Legal',
    'Title', 'Settlement', 'VMS', 'Network', 'National', 'Global',
    'Agency', 'Firm', 'Alliance', 'Affiliates'
  ];
  
  // Check if name contains company indicators
  const hasCompanyIndicator = companyIndicators.some(indicator => 
    normalized.match(new RegExp(`\\b${indicator}\\b`, 'i'))
  );
  
  if (hasCompanyIndicator) {
    return 'company';
  }
  
  // Check name pattern: 2-3 words without business suffixes = likely individual
  const words = normalized.split(/\s+/);
  if (words.length >= 2 && words.length <= 3) {
    // Looks like "FirstName LastName" or "FirstName Middle LastName"
    return 'individual';
  }
  
  // Single word could be either, default to company
  // Multi-word (4+) without indicators likely a company
  return 'company';
}

/**
 * Normalize name for individual clients
 * Ensures proper capitalization for person names
 */
export function normalizeIndividualName(name: string): string {
  if (!name) return name;
  
  return name
    .split(/\s+/)
    .map(word => {
      // Capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

