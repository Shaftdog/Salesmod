/**
 * Contact Enricher - Information extraction and signal detection
 *
 * Parses email signatures and detects opportunity signals:
 * - Email signature parsing for contact data
 * - Role/title inference
 * - Opportunity signal detection (complaints, urgency, etc.)
 * - Enrichment queue processing
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface ExtractedContactData {
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  address?: string;
  website?: string;
}

export interface EnrichmentQueueItem {
  id: string;
  tenantId: string;
  contactId: string | null;
  emailAddress: string | null;
  source: string;
  sourceId: string | null;
  status: string;
  extractedData: ExtractedContactData;
}

export interface OpportunitySignal {
  id: string;
  tenantId: string;
  sourceType: string;
  sourceId: string;
  clientId: string | null;
  contactId: string | null;
  signalType: SignalType;
  signalStrength: number;
  extractedText: string;
  context: Record<string, any>;
  actioned: boolean;
}

export type SignalType =
  | 'complaint'
  | 'urgency'
  | 'budget_mention'
  | 'competitor_mention'
  | 'expansion'
  | 'renewal'
  | 'upsell'
  | 'referral'
  | 'churn_risk';

export interface SignalDetectionResult {
  signals: Array<{
    type: SignalType;
    strength: number;
    text: string;
    context: Record<string, any>;
  }>;
  hasHighPrioritySignal: boolean;
}

// ============================================================================
// Email Signature Parsing
// ============================================================================

/**
 * Parse contact information from email signature
 *
 * @param emailBody - The email body to parse for signature data
 * @returns Extracted contact data from signature
 */
export function parseEmailSignature(emailBody: string): ExtractedContactData {
  const data: ExtractedContactData = {};

  // Input validation and length limiting to prevent ReDoS attacks
  if (!emailBody || typeof emailBody !== 'string') {
    return data;
  }

  // Limit input length to prevent ReDoS - signatures are typically in last 2000 chars
  const MAX_INPUT_LENGTH = 10000;
  const truncatedBody = emailBody.length > MAX_INPUT_LENGTH
    ? emailBody.slice(-MAX_INPUT_LENGTH)
    : emailBody;

  // Find the signature block (typically after -- or after several newlines at end)
  const signaturePatterns = [
    /(?:--|—|___+|Best regards|Regards|Thanks|Thank you|Sincerely|Cheers)[\s\S]*$/i,
    /\n\n\n[\s\S]{50,500}$/,
  ];

  let signatureBlock = '';
  for (const pattern of signaturePatterns) {
    const match = truncatedBody.match(pattern);
    if (match) {
      signatureBlock = match[0];
      break;
    }
  }

  if (!signatureBlock) {
    // Use last 500 chars as potential signature
    signatureBlock = truncatedBody.slice(-500);
  }

  // Extract phone numbers
  const phonePattern = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  const phones = signatureBlock.match(phonePattern);
  if (phones && phones.length > 0) {
    data.phone = phones[0].replace(/\D/g, '');
    if (phones.length > 1) {
      data.mobile = phones[1].replace(/\D/g, '');
    }
  }

  // Extract email
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = signatureBlock.match(emailPattern);
  if (emails && emails.length > 0) {
    data.email = emails[0].toLowerCase();
  }

  // Extract LinkedIn URL
  const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([a-zA-Z0-9_-]+)/i;
  const linkedinMatch = signatureBlock.match(linkedinPattern);
  if (linkedinMatch) {
    data.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }

  // Extract Twitter handle
  const twitterPattern = /@([a-zA-Z0-9_]{1,15})(?:\s|$)/g;
  const twitterMatch = signatureBlock.match(twitterPattern);
  if (twitterMatch) {
    data.twitter = twitterMatch[0].trim();
  }

  // Extract title/role patterns
  const titlePatterns = [
    /(?:^|\n)([A-Z][a-z]+ (?:Director|Manager|VP|President|CEO|CFO|CTO|COO|Owner|Partner|Associate|Analyst|Specialist|Coordinator|Administrator|Executive|Consultant|Engineer|Developer|Designer|Architect)[^\n]*)/m,
    /(?:Title|Position|Role):\s*([^\n]+)/i,
  ];

  for (const pattern of titlePatterns) {
    const match = signatureBlock.match(pattern);
    if (match) {
      data.title = match[1].trim();
      break;
    }
  }

  // Extract company name patterns
  const companyPatterns = [
    /(?:Company|Organization|Firm):\s*([^\n]+)/i,
    /(?:^|\n)([A-Z][A-Za-z0-9\s&,.]+ (?:LLC|Inc|Corp|Ltd|Company|Co\.|Group|Partners|Associates|Consulting))/m,
  ];

  for (const pattern of companyPatterns) {
    const match = signatureBlock.match(pattern);
    if (match) {
      data.company = match[1].trim();
      break;
    }
  }

  // Extract website
  const websitePattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/g;
  const websites = signatureBlock.match(websitePattern);
  if (websites) {
    // Filter out known domains
    const validWebsite = websites.find(
      w => !w.includes('linkedin') && !w.includes('twitter') && !w.includes('facebook')
    );
    if (validWebsite) {
      data.website = validWebsite.startsWith('http') ? validWebsite : `https://${validWebsite}`;
    }
  }

  return data;
}

/**
 * Infer role category from title
 */
export function inferRoleFromTitle(title: string): 'decision_maker' | 'influencer' | 'user' | 'unknown' {
  const lowerTitle = title.toLowerCase();

  const decisionMakerKeywords = [
    'president', 'ceo', 'cfo', 'cto', 'coo', 'chief', 'owner', 'partner',
    'vp', 'vice president', 'director', 'head of', 'general manager',
  ];

  const influencerKeywords = [
    'manager', 'lead', 'senior', 'principal', 'supervisor', 'team lead',
    'coordinator', 'specialist', 'consultant',
  ];

  for (const keyword of decisionMakerKeywords) {
    if (lowerTitle.includes(keyword)) return 'decision_maker';
  }

  for (const keyword of influencerKeywords) {
    if (lowerTitle.includes(keyword)) return 'influencer';
  }

  return 'user';
}

// ============================================================================
// Opportunity Signal Detection
// ============================================================================

/**
 * Detect opportunity signals from text
 */
export function detectOpportunitySignals(
  text: string,
  context: { clientId?: string; contactId?: string; sourceType: string }
): SignalDetectionResult {
  const lowerText = text.toLowerCase();
  const signals: SignalDetectionResult['signals'] = [];

  // Complaint signals
  const complaintKeywords = [
    'disappointed', 'frustrated', 'unhappy', 'unacceptable', 'problem',
    'issue', 'complaint', 'wrong', 'error', 'mistake', 'fix this',
  ];
  const complaintMatches = complaintKeywords.filter(kw => lowerText.includes(kw));
  if (complaintMatches.length > 0) {
    signals.push({
      type: 'complaint',
      strength: Math.min(0.3 + complaintMatches.length * 0.1, 1.0),
      text: complaintMatches.join(', '),
      context: { keywords: complaintMatches },
    });
  }

  // Urgency signals
  const urgencyKeywords = [
    'urgent', 'asap', 'immediately', 'right away', 'as soon as possible',
    'time sensitive', 'deadline', 'rush', 'priority', 'critical',
  ];
  const urgencyMatches = urgencyKeywords.filter(kw => lowerText.includes(kw));
  if (urgencyMatches.length > 0) {
    signals.push({
      type: 'urgency',
      strength: Math.min(0.4 + urgencyMatches.length * 0.15, 1.0),
      text: urgencyMatches.join(', '),
      context: { keywords: urgencyMatches },
    });
  }

  // Budget mention
  const budgetPatterns = [
    /budget\s+(?:of\s+)?\$?[\d,]+/i,
    /\$[\d,]+(?:\s+(?:budget|allocated|available))?/i,
    /spending\s+(?:up to\s+)?\$?[\d,]+/i,
  ];
  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      signals.push({
        type: 'budget_mention',
        strength: 0.7,
        text: match[0],
        context: { extractedAmount: match[0] },
      });
      break;
    }
  }

  // Competitor mention
  const competitorKeywords = [
    'competitor', 'other vendor', 'alternative', 'comparing',
    'considering other', 'also looking at', 'quoted by',
  ];
  const competitorMatches = competitorKeywords.filter(kw => lowerText.includes(kw));
  if (competitorMatches.length > 0) {
    signals.push({
      type: 'competitor_mention',
      strength: 0.6,
      text: competitorMatches.join(', '),
      context: { keywords: competitorMatches },
    });
  }

  // Expansion signals
  const expansionKeywords = [
    'expanding', 'growing', 'new location', 'additional', 'more properties',
    'scaling up', 'increase volume', 'more orders',
  ];
  const expansionMatches = expansionKeywords.filter(kw => lowerText.includes(kw));
  if (expansionMatches.length > 0) {
    signals.push({
      type: 'expansion',
      strength: 0.8,
      text: expansionMatches.join(', '),
      context: { keywords: expansionMatches },
    });
  }

  // Renewal signals
  const renewalKeywords = [
    'renewal', 'renew', 'continue', 'extend', 'contract expiring',
    'next year', 'annual review',
  ];
  const renewalMatches = renewalKeywords.filter(kw => lowerText.includes(kw));
  if (renewalMatches.length > 0) {
    signals.push({
      type: 'renewal',
      strength: 0.7,
      text: renewalMatches.join(', '),
      context: { keywords: renewalMatches },
    });
  }

  // Referral signals
  const referralKeywords = [
    'referral', 'recommend', 'colleague', 'friend mentioned',
    'heard about you', 'was told', 'suggested I contact',
  ];
  const referralMatches = referralKeywords.filter(kw => lowerText.includes(kw));
  if (referralMatches.length > 0) {
    signals.push({
      type: 'referral',
      strength: 0.85,
      text: referralMatches.join(', '),
      context: { keywords: referralMatches },
    });
  }

  // Churn risk signals
  const churnKeywords = [
    'cancel', 'discontinue', 'end our', 'terminate', 'no longer need',
    'switching to', 'moving away', 'not satisfied',
  ];
  const churnMatches = churnKeywords.filter(kw => lowerText.includes(kw));
  if (churnMatches.length > 0) {
    signals.push({
      type: 'churn_risk',
      strength: Math.min(0.5 + churnMatches.length * 0.15, 1.0),
      text: churnMatches.join(', '),
      context: { keywords: churnMatches },
    });
  }

  return {
    signals,
    hasHighPrioritySignal: signals.some(s => s.strength >= 0.7),
  };
}

// ============================================================================
// Enrichment Queue Management
// ============================================================================

/**
 * Queue contact for enrichment
 */
export async function queueEnrichment(
  tenantId: string,
  source: 'email_signature' | 'apollo' | 'manual' | 'web_search',
  data: {
    contactId?: string;
    emailAddress?: string;
    sourceId?: string;
    extractedData: ExtractedContactData;
  }
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data: queueItem, error } = await supabase
    .from('contact_enrichment_queue')
    .insert({
      tenant_id: tenantId,
      contact_id: data.contactId || null,
      email_address: data.emailAddress || null,
      source,
      source_id: data.sourceId || null,
      extracted_data: data.extractedData,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[ContactEnricher] Error queuing enrichment:', error);
    return null;
  }

  console.log(`[ContactEnricher] Queued enrichment ${queueItem.id} from ${source}`);
  return queueItem.id;
}

/**
 * Process enrichment queue for a tenant
 */
export async function processEnrichmentQueue(
  tenantId: string,
  limit: number = 10
): Promise<{ processed: number; merged: number; failed: number }> {
  const supabase = createServiceRoleClient();

  // Get pending items
  const { data: items, error } = await supabase
    .from('contact_enrichment_queue')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !items) {
    return { processed: 0, merged: 0, failed: 0 };
  }

  let merged = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // Mark as processing
      await supabase
        .from('contact_enrichment_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);

      let contactId = item.contact_id;

      // Find or create contact
      if (!contactId && item.email_address) {
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('email', item.email_address)
          .single();

        if (existingContact) {
          contactId = existingContact.id;
        }
      }

      if (contactId) {
        // Merge extracted data into contact
        const extractedData = item.extracted_data as ExtractedContactData;
        const updates: Record<string, any> = {};

        if (extractedData.title) updates.title = extractedData.title;
        if (extractedData.phone) updates.phone = extractedData.phone;
        if (extractedData.mobile) updates.mobile = extractedData.mobile;
        if (extractedData.linkedin) updates.linkedin_url = extractedData.linkedin;

        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();

          await supabase
            .from('contacts')
            .update(updates)
            .eq('id', contactId);

          merged++;
        }

        // Mark as completed
        await supabase
          .from('contact_enrichment_queue')
          .update({
            status: 'completed',
            merged_to_contact_id: contactId,
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      } else {
        // No contact to merge to
        await supabase
          .from('contact_enrichment_queue')
          .update({
            status: 'skipped',
            error_message: 'No matching contact found',
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }
    } catch (err) {
      failed++;
      await supabase
        .from('contact_enrichment_queue')
        .update({
          status: 'failed',
          error_message: (err as Error).message,
          processed_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    }
  }

  console.log(`[ContactEnricher] Processed ${items.length} items: ${merged} merged, ${failed} failed`);
  return { processed: items.length, merged, failed };
}

// ============================================================================
// Signal Recording
// ============================================================================

/**
 * Record an opportunity signal
 */
export async function recordOpportunitySignal(
  tenantId: string,
  signal: {
    sourceType: string;
    sourceId: string;
    clientId?: string;
    contactId?: string;
    signalType: SignalType;
    signalStrength: number;
    extractedText: string;
    context?: Record<string, any>;
  }
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('opportunity_signals')
    .insert({
      tenant_id: tenantId,
      source_type: signal.sourceType,
      source_id: signal.sourceId,
      client_id: signal.clientId || null,
      contact_id: signal.contactId || null,
      signal_type: signal.signalType,
      signal_strength: signal.signalStrength,
      extracted_text: signal.extractedText,
      context: signal.context || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('[ContactEnricher] Error recording signal:', error);
    return null;
  }

  console.log(`[ContactEnricher] Recorded ${signal.signalType} signal (strength: ${signal.signalStrength})`);
  return data.id;
}

/**
 * Get unactioned signals for a tenant
 */
export async function getUnactionedSignals(
  tenantId: string,
  limit: number = 10,
  minStrength: number = 0.5
): Promise<OpportunitySignal[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('opportunity_signals')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('actioned', false)
    .gte('signal_strength', minStrength)
    .order('signal_strength', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ContactEnricher] Error getting unactioned signals:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    clientId: row.client_id,
    contactId: row.contact_id,
    signalType: row.signal_type as SignalType,
    signalStrength: row.signal_strength,
    extractedText: row.extracted_text,
    context: row.context || {},
    actioned: row.actioned,
  }));
}

/**
 * Mark signal as actioned
 */
export async function markSignalActioned(
  signalId: string,
  actionTaken: string,
  result?: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('opportunity_signals')
    .update({
      actioned: true,
      actioned_at: new Date().toISOString(),
      action_taken: actionTaken,
      action_result: result || null,
    })
    .eq('id', signalId);

  console.log(`[ContactEnricher] Marked signal ${signalId} as actioned: ${actionTaken}`);
}
