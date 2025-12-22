/**
 * P2.2 Template: Extract Contacts
 * Parses contact information from various text formats
 */

import type { FileReference } from '../types';

interface ExtractContactsParams {
  text?: string;
  includeEmails?: boolean;
  includePhones?: boolean;
  includeAddresses?: boolean;
  includeNames?: boolean;
  deduplicateByEmail?: boolean;
}

interface ExtractedContact {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    full?: string;
  };
  company?: string;
  title?: string;
  confidence: number; // 0-1 confidence score
}

interface ExtractContactsResult {
  contacts: ExtractedContact[];
  totalFound: number;
  emailsFound: number;
  phonesFound: number;
  addressesFound: number;
  duplicatesRemoved: number;
}

/**
 * Execute contact extraction template
 */
export async function executeExtractContacts(
  inputParams: Record<string, unknown>,
  inputFileRefs: FileReference[]
): Promise<{
  outputData: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  memoryUsedMb?: number;
}> {
  const params: ExtractContactsParams = {
    includeEmails: true,
    includePhones: true,
    includeAddresses: true,
    includeNames: true,
    deduplicateByEmail: true,
    ...inputParams,
  };

  // Get text from params or file
  let text = params.text as string | undefined;

  if (!text && inputFileRefs.length > 0) {
    // Would load file content here
    text = `[Content from ${inputFileRefs[0].fileName}]`;
  }

  if (!text) {
    throw new Error('No text content provided');
  }

  const result = extractContactsFromText(text, params);

  return {
    outputData: {
      success: true,
      result,
      processingTime: Date.now(),
    },
    memoryUsedMb: 2,
  };
}

/**
 * Extract contacts from text
 */
function extractContactsFromText(
  text: string,
  params: ExtractContactsParams
): ExtractContactsResult {
  const contacts: ExtractedContact[] = [];
  let emailsFound = 0;
  let phonesFound = 0;
  let addressesFound = 0;
  let duplicatesRemoved = 0;

  // Email regex
  if (params.includeEmails !== false) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex) || [];
    emailsFound = emails.length;

    for (const email of emails) {
      contacts.push({
        email: email.toLowerCase(),
        confidence: 0.9,
      });
    }
  }

  // Phone regex (US format)
  if (params.includePhones !== false) {
    const phoneRegex = /(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const phones = text.match(phoneRegex) || [];
    phonesFound = phones.length;

    for (const phone of phones) {
      const normalized = normalizePhone(phone);
      const existing = contacts.find((c) => c.phone === normalized);
      if (existing) {
        existing.phone = normalized;
      } else {
        contacts.push({
          phone: normalized,
          confidence: 0.8,
        });
      }
    }
  }

  // Address patterns (simplified)
  if (params.includeAddresses !== false) {
    const addressRegex =
      /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir)\.?\s*,?\s*[\w\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?/gi;
    const addresses = text.match(addressRegex) || [];
    addressesFound = addresses.length;

    for (const address of addresses) {
      contacts.push({
        address: parseAddress(address),
        confidence: 0.7,
      });
    }
  }

  // Deduplicate by email if requested
  if (params.deduplicateByEmail) {
    const seen = new Set<string>();
    const deduped: ExtractedContact[] = [];

    for (const contact of contacts) {
      const key = contact.email || contact.phone || JSON.stringify(contact.address);
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(contact);
      } else {
        duplicatesRemoved++;
      }
    }

    return {
      contacts: deduped,
      totalFound: deduped.length,
      emailsFound,
      phonesFound,
      addressesFound,
      duplicatesRemoved,
    };
  }

  return {
    contacts,
    totalFound: contacts.length,
    emailsFound,
    phonesFound,
    addressesFound,
    duplicatesRemoved: 0,
  };
}

/**
 * Normalize phone number
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Parse address into components
 */
function parseAddress(address: string): ExtractedContact['address'] {
  // Simplified address parsing
  const zipMatch = address.match(/\d{5}(?:-\d{4})?/);
  const stateMatch = address.match(/,?\s*([A-Z]{2})\s*\d{5}/);

  return {
    full: address.trim(),
    zip: zipMatch?.[0],
    state: stateMatch?.[1],
  };
}
