import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { SearchResult } from './web-search';

// Schema for extracted contacts
const ExtractedContactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  source_url: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

const ContactExtractionResultSchema = z.object({
  contacts: z.array(ExtractedContactSchema),
  company_info: z.object({
    website: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
});

export type ExtractedContact = z.infer<typeof ExtractedContactSchema>;
export type ContactExtractionResult = z.infer<typeof ContactExtractionResultSchema>;

/**
 * Build search queries specifically for finding contacts at a company
 */
export function buildContactSearchQueries(companyName: string): string[] {
  return [
    `"${companyName}" contact email`,
    `"${companyName}" team leadership management`,
    `site:linkedin.com "${companyName}"`,
    `"${companyName}" appraiser coordinator manager`,
  ];
}

/**
 * Extract contact information from web search results using AI
 */
export async function extractContactsFromResults(
  companyName: string,
  searchResults: SearchResult[]
): Promise<ContactExtractionResult> {
  if (searchResults.length === 0) {
    return { contacts: [] };
  }

  // Combine all snippets for analysis
  const combinedContent = searchResults
    .map((r, i) => `Source ${i + 1}: ${r.title}\nURL: ${r.url}\nContent: ${r.snippet}`)
    .join('\n\n---\n\n');

  const prompt = `You are extracting contact information for "${companyName}" from web search results.

SEARCH RESULTS:
${combinedContent}

TASK:
Extract any contact information found for people who work at or are associated with "${companyName}".

IMPORTANT:
- Only extract contacts that clearly belong to "${companyName}"
- Confidence levels:
  - "high": Full name + verified email or multiple data points
  - "medium": Full name + title or partial contact info
  - "low": Name only or uncertain association
- Skip generic info@ or sales@ emails unless no other contacts found
- Include LinkedIn URLs if found
- Extract company contact info (main phone, website, address) separately

Focus on finding decision-makers, managers, coordinators, or key contacts.`;

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250929'),
      schema: ContactExtractionResultSchema,
      prompt,
      temperature: 0.3,
    });

    console.log(`[ContactExtractor] Extracted ${object.contacts.length} contacts for ${companyName}`);
    return object;
  } catch (error) {
    console.error('[ContactExtractor] AI extraction failed:', error);
    return { contacts: [] };
  }
}

/**
 * Validate and dedupe extracted contacts
 */
export function validateContacts(contacts: ExtractedContact[]): ExtractedContact[] {
  const seen = new Set<string>();
  const validated: ExtractedContact[] = [];

  for (const contact of contacts) {
    // Create unique key based on name + email
    const key = `${contact.first_name.toLowerCase()}_${contact.last_name.toLowerCase()}_${contact.email?.toLowerCase() || ''}`;

    if (seen.has(key)) continue;
    seen.add(key);

    // Basic validation
    if (contact.first_name.length < 2 || contact.last_name.length < 2) continue;

    // Skip obviously fake names
    const fakePhrases = ['test', 'example', 'admin', 'info', 'contact'];
    if (fakePhrases.some(p => contact.first_name.toLowerCase().includes(p))) continue;

    validated.push(contact);
  }

  // Sort by confidence (high first)
  return validated.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });
}

/**
 * Check if a contact already exists in the database
 */
export async function checkExistingContact(
  supabase: any,
  tenantId: string,
  email?: string,
  firstName?: string,
  lastName?: string
): Promise<boolean> {
  if (email) {
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('email', email)
      .limit(1);

    if (data && data.length > 0) return true;
  }

  // Check by name if no email
  if (firstName && lastName) {
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('first_name', firstName)
      .ilike('last_name', lastName)
      .limit(1);

    if (data && data.length > 0) return true;
  }

  return false;
}
