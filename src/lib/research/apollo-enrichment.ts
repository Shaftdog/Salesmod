/**
 * Apollo.io API integration for contact enrichment
 * Docs: https://docs.apollo.io/reference/people-enrichment
 */

export interface ApolloEnrichmentRequest {
  first_name: string;
  last_name: string;
  organization_name: string;
  domain?: string;
  linkedin_url?: string;
}

export interface ApolloEnrichedContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string | null;
  email_status: string | null;
  personal_emails: string[];
  organization_name: string | null;
  title: string | null;
  headline: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  phone_numbers: Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
    position: number;
    status: string;
  }>;
  city: string | null;
  state: string | null;
  country: string | null;
  departments: string[];
  subdepartments: string[];
  seniority: string | null;
  functions: string[];
}

export interface ApolloEnrichmentResult {
  success: boolean;
  person: ApolloEnrichedContact | null;
  error?: string;
  credits_used?: number;
}

/**
 * Enrich a single contact using Apollo.io People Enrichment API
 */
export async function enrichContactWithApollo(
  request: ApolloEnrichmentRequest
): Promise<ApolloEnrichmentResult> {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    console.log('[Apollo] No API key configured, skipping enrichment');
    return {
      success: false,
      person: null,
      error: 'Apollo API key not configured',
    };
  }

  try {
    console.log(`[Apollo] Enriching: ${request.first_name} ${request.last_name} @ ${request.organization_name}`);

    const response = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        first_name: request.first_name,
        last_name: request.last_name,
        organization_name: request.organization_name,
        domain: request.domain,
        linkedin_url: request.linkedin_url,
        reveal_personal_emails: true,
        reveal_phone_number: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Apollo] API error:', response.status, errorText);
      return {
        success: false,
        person: null,
        error: `Apollo API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Apollo returns { person: {...} } or { person: null } if no match
    if (!data.person) {
      console.log(`[Apollo] No match found for ${request.first_name} ${request.last_name}`);
      return {
        success: true,
        person: null,
      };
    }

    console.log(`[Apollo] Found: ${data.person.email || 'no email'}, ${data.person.phone_numbers?.length || 0} phone(s)`);

    return {
      success: true,
      person: data.person as ApolloEnrichedContact,
    };
  } catch (error: any) {
    console.error('[Apollo] Enrichment failed:', error);
    return {
      success: false,
      person: null,
      error: error.message,
    };
  }
}

/**
 * Bulk enrich contacts (up to 10 at a time)
 */
export async function bulkEnrichContactsWithApollo(
  requests: ApolloEnrichmentRequest[]
): Promise<ApolloEnrichmentResult[]> {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    return requests.map(() => ({
      success: false,
      person: null,
      error: 'Apollo API key not configured',
    }));
  }

  // Apollo limits bulk requests to 10
  if (requests.length > 10) {
    console.warn('[Apollo] Bulk enrichment limited to 10 contacts, truncating');
    requests = requests.slice(0, 10);
  }

  try {
    console.log(`[Apollo] Bulk enriching ${requests.length} contacts`);

    const response = await fetch('https://api.apollo.io/api/v1/people/bulk_match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        reveal_personal_emails: true,
        reveal_phone_number: true,
        details: requests.map(r => ({
          first_name: r.first_name,
          last_name: r.last_name,
          organization_name: r.organization_name,
          domain: r.domain,
          linkedin_url: r.linkedin_url,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Apollo] Bulk API error:', response.status, errorText);
      return requests.map(() => ({
        success: false,
        person: null,
        error: `Apollo API error: ${response.status}`,
      }));
    }

    const data = await response.json();
    const matches = data.matches || [];

    console.log(`[Apollo] Bulk enrichment found ${matches.filter((m: any) => m).length}/${requests.length} matches`);

    return matches.map((match: any) => ({
      success: true,
      person: match as ApolloEnrichedContact | null,
    }));
  } catch (error: any) {
    console.error('[Apollo] Bulk enrichment failed:', error);
    return requests.map(() => ({
      success: false,
      person: null,
      error: error.message,
    }));
  }
}

/**
 * Extract the best email from Apollo enrichment result
 */
export function getBestEmail(person: ApolloEnrichedContact): string | null {
  // Prefer work email over personal
  if (person.email && person.email_status === 'verified') {
    return person.email;
  }
  if (person.email) {
    return person.email;
  }
  // Fall back to personal emails
  if (person.personal_emails && person.personal_emails.length > 0) {
    return person.personal_emails[0];
  }
  return null;
}

/**
 * Extract the best phone from Apollo enrichment result
 */
export function getBestPhone(person: ApolloEnrichedContact): string | null {
  if (!person.phone_numbers || person.phone_numbers.length === 0) {
    return null;
  }
  // Prefer direct/mobile numbers
  const direct = person.phone_numbers.find(p => p.type === 'mobile' || p.type === 'direct');
  if (direct) {
    return direct.sanitized_number || direct.raw_number;
  }
  // Fall back to any number
  return person.phone_numbers[0].sanitized_number || person.phone_numbers[0].raw_number;
}
