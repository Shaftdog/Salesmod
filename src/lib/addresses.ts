/**
 * Address normalization and unit extraction utilities
 * Used for building-level property deduplication and USPAP compliance
 */

/**
 * Normalize address components into a consistent hash key
 * Used for building-level deduplication (excludes unit)
 * 
 * @param line1 - Street address
 * @param city - City name
 * @param state - State (2-letter code)
 * @param zip - ZIP code
 * @returns Normalized hash: STREET|CITY|STATE|ZIP5
 */
export function normalizeAddressKey(
  line1: string = "",
  city: string = "",
  state: string = "",
  zip: string = ""
): string {
  const clean = (s: string) =>
    s.trim()
      .toUpperCase()
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .replace(/\b(AVENUE|AVE\.)\b/g, "AVE")
      .replace(/\b(STREET|ST\.)\b/g, "ST")
      .replace(/\b(ROAD|RD\.)\b/g, "RD")
      .replace(/\b(BOULEVARD|BLVD\.)\b/g, "BLVD")
      .replace(/\b(DRIVE|DR\.)\b/g, "DR")
      .replace(/\b(LANE|LN\.)\b/g, "LN")
      .replace(/\b(COURT|CT\.)\b/g, "CT")
      .replace(/\b(PLACE|PL\.)\b/g, "PL")
      .replace(/\b(CIRCLE|CIR\.)\b/g, "CIR")
      .replace(/\b(WAY)\b/g, "WAY")
      .replace(/\b(TRAIL|TRL\.)\b/g, "TRL")
      .replace(/[^A-Z0-9 #]/g, ""); // Remove punctuation except # and space

  return [
    clean(line1),
    clean(city),
    clean(state),
    (zip || "").slice(0, 5) // 5-digit ZIP only
  ].join("|");
}

/**
 * Extract unit number from street address
 * Handles common unit patterns: Apt, Unit, Ste, Suite, #, and half-duplex patterns
 * 
 * @param line1 - Street address that may contain unit
 * @returns Object with street (without unit), extracted unit, and optional unit type
 * 
 * @example
 * extractUnit("123 Main St Apt 2B") // { street: "123 Main St", unit: "2B" }
 * extractUnit("456 Oak Ave #305") // { street: "456 Oak Ave", unit: "305" }
 * extractUnit("789 Elm St East Unit") // { street: "789 Elm St", unit: "EAST", unitType: "half_duplex" }
 * extractUnit("123 Oak A Side") // { street: "123 Oak", unit: "A", unitType: "half_duplex" }
 * extractUnit("456 Main St") // { street: "456 Main St" }
 */
export function extractUnit(line1: string): { 
  street: string; 
  unit?: string;
  unitType?: string;
} {
  if (!line1) return { street: "" };
  
  const trimmed = line1.trim();
  
  // Pattern 1: Standard unit patterns (APT, UNIT, STE, SUITE, #, RM, FLOOR, FL, BLDG)
  const standardMatch = trimmed.match(
    /^(.*?)(?:\s+(?:APT|APARTMENT|UNIT|STE|SUITE|RM|ROOM|FL|FLOOR|BLDG|BUILDING|#)\s*([A-Z0-9\-]+))$/i
  );
  
  if (standardMatch) {
    return {
      street: standardMatch[1].trim(),
      unit: standardMatch[2].toUpperCase()
    };
  }
  
  // Pattern 2: Half-duplex patterns (East/West Unit, A/B Side, Left/Right, Upper/Lower)
  const halfDuplexMatch = trimmed.match(
    /^(.*?)(?:\s+(EAST|WEST|LEFT|RIGHT|UPPER|LOWER|FRONT|REAR)\s*(?:UNIT|SIDE)?|(?:SIDE\s+)?(A|B|C|D)(?:\s+SIDE)?)$/i
  );
  
  if (halfDuplexMatch) {
    const unitLabel = (halfDuplexMatch[2] || halfDuplexMatch[3] || "").toUpperCase();
    
    // Map to single letter for common patterns
    const unitMap: Record<string, string> = {
      'EAST': 'E',
      'WEST': 'W',
      'LEFT': 'L',
      'RIGHT': 'R',
      'UPPER': 'U',
      'LOWER': 'L',
      'FRONT': 'F',
      'REAR': 'R'
    };
    
    return {
      street: halfDuplexMatch[1].trim(),
      unit: unitMap[unitLabel] || unitLabel,
      unitType: 'half_duplex'
    };
  }
  
  // Pattern 3: Trailing single letter/number that might be a unit (be conservative)
  // Only match if preceded by clear separator to avoid false positives
  const trailingSingleMatch = trimmed.match(/^(.*?)[\s,]+([A-D]|\d{1,3})$/);
  
  if (trailingSingleMatch) {
    const possibleUnit = trailingSingleMatch[2];
    const possibleStreet = trailingSingleMatch[1].trim();
    
    // Only extract if it looks like a deliberate unit designation
    // (avoid capturing street numbers like "123 Main 5" where 5 is part of address)
    if (possibleStreet.match(/\b(STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|LANE|LN|COURT|CT|PLACE|PL|BOULEVARD|BLVD|WAY|CIRCLE|CIR|TRAIL|TRL)\.?\s*$/i)) {
      return {
        street: possibleStreet,
        unit: possibleUnit.toUpperCase()
      };
    }
  }
  
  return { street: trimmed };
}

/**
 * Validate address components for completeness
 * Used to determine if an address is suitable for property creation
 * 
 * @param address - Address object with street, city, state, zip
 * @returns Validation result with missing fields
 */
export function validateAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!address.street?.trim()) missing.push("street");
  if (!address.city?.trim()) missing.push("city");
  if (!address.state?.trim()) missing.push("state");
  if (!address.zip?.trim()) missing.push("zip");
  
  return {
    isValid: missing.length === 0,
    missing
  };
}

/**
 * Format address for display
 * Combines components into a readable address string
 * 
 * @param address - Address components
 * @param includeUnit - Whether to include unit in display
 * @returns Formatted address string
 */
export function formatAddress(
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    unit?: string;
  },
  includeUnit: boolean = true
): string {
  const parts = [
    address.street,
    includeUnit && address.unit ? `Unit ${address.unit}` : null,
    `${address.city}, ${address.state} ${address.zip}`
  ].filter(Boolean);
  
  return parts.join(", ");
}

/**
 * Check if two addresses are the same building
 * Compares normalized address keys (ignores unit differences)
 * 
 * @param addr1 - First address
 * @param addr2 - Second address
 * @returns True if same building (ignoring unit)
 */
export function isSameBuilding(
  addr1: { street: string; city: string; state: string; zip: string },
  addr2: { street: string; city: string; state: string; zip: string }
): boolean {
  const hash1 = normalizeAddressKey(addr1.street, addr1.city, addr1.state, addr1.zip);
  const hash2 = normalizeAddressKey(addr2.street, addr2.city, addr2.state, addr2.zip);
  
  return hash1 === hash2;
}

/**
 * Detect if address is a PO Box
 * PO Boxes should be treated as unique (skip property merge)
 * 
 * @param street - Street address to check
 * @returns True if address is a PO Box
 */
export function isPOBox(street: string): boolean {
  if (!street) return false;
  
  const normalized = street.trim().toUpperCase();
  
  // Match PO Box patterns
  const poBoxPatterns = [
    /\bP\.?\s*O\.?\s*BOX\b/,
    /\bPO\s*BOX\b/,
    /\bPOB\s+\d+/,
    /\bPOST\s*OFFICE\s*BOX\b/,
  ];
  
  return poBoxPatterns.some(pattern => pattern.test(normalized));
}
