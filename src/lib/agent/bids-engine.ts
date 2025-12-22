/**
 * Bids Engine - Quote/Bid lifecycle management
 *
 * Manages the complete quote workflow:
 * - Quote creation and validation
 * - Sending and tracking views
 * - Follow-up scheduling
 * - Win/loss outcome capture
 * - Pattern learning from outcomes
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface Quote {
  id: string;
  tenantId: string;
  clientId: string;
  contactId: string | null;
  dealId: string | null;
  quoteNumber: string;
  title: string;
  description: string | null;
  status: 'draft' | 'pending_approval' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'countered';
  totalAmount: number;
  lineItems: QuoteLineItem[];
  validUntil: Date | null;
  sentAt: Date | null;
  viewedAt: Date | null;
  outcome: 'won' | 'lost' | 'no_decision' | null;
  outcomeReason: string | null;
  followUpCount: number;
  nextFollowUpAt: Date | null;
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteFollowUpDue {
  quoteId: string;
  quoteNumber: string;
  title: string;
  clientId: string;
  contactId: string | null;
  totalAmount: number;
  status: string;
  daysSinceLastContact: number;
  daysSinceSent: number;
  followUpCount: number;
  maxFollowUps: number;
  clientName?: string;
  contactName?: string;
  contactEmail?: string;
}

export interface QuoteCreateData {
  tenantId: string;
  clientId: string;
  contactId?: string;
  dealId?: string;
  title: string;
  description?: string;
  totalAmount: number;
  lineItems?: QuoteLineItem[];
  validUntil?: Date;
  createdBy?: string;
}

export interface QuoteOutcomeData {
  outcome: 'won' | 'lost' | 'no_decision';
  primaryReason?: string;
  secondaryReasons?: string[];
  competitor?: string;
  competitorAmount?: number;
  notes?: string;
  recordedBy?: string;
}

// ============================================================================
// Quote Management
// ============================================================================

/**
 * Create a new quote
 *
 * @param data - Quote creation data
 * @returns Success status with quoteId or error message
 */
export async function createQuote(data: QuoteCreateData): Promise<{ success: boolean; quoteId?: string; error?: string }> {
  // Validate required inputs
  if (!data.tenantId || typeof data.tenantId !== 'string') {
    return { success: false, error: 'Invalid tenantId' };
  }
  if (!data.clientId || typeof data.clientId !== 'string') {
    return { success: false, error: 'Invalid clientId' };
  }
  if (!data.title || typeof data.title !== 'string' || data.title.length > 500) {
    return { success: false, error: 'Title is required and must be under 500 characters' };
  }
  if (data.description && data.description.length > 5000) {
    return { success: false, error: 'Description must be under 5000 characters' };
  }

  // Validate amount
  if (typeof data.totalAmount !== 'number' || data.totalAmount < 0 || data.totalAmount > 999999999) {
    return { success: false, error: 'Total amount must be between 0 and 999,999,999' };
  }

  // Validate line items array
  if (data.lineItems && (!Array.isArray(data.lineItems) || data.lineItems.length > 100)) {
    return { success: false, error: 'Line items must be an array with max 100 items' };
  }

  const supabase = createServiceRoleClient();

  // Generate quote number
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', data.tenantId);

  const quoteNumber = `Q-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(5, '0')}`;

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert({
      tenant_id: data.tenantId,
      client_id: data.clientId,
      contact_id: data.contactId || null,
      deal_id: data.dealId || null,
      quote_number: quoteNumber,
      title: data.title,
      description: data.description || null,
      total_amount: data.totalAmount,
      line_items: data.lineItems || [],
      valid_until: data.validUntil?.toISOString() || null,
      created_by: data.createdBy || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[BidsEngine] Error creating quote:', error);
    return { success: false, error: error.message };
  }

  // Record activity
  await recordQuoteActivity(quote.id, data.tenantId, 'created', 'Quote created');

  console.log(`[BidsEngine] Created quote ${quoteNumber} (${quote.id})`);
  return { success: true, quoteId: quote.id };
}

/**
 * Get quotes needing follow-up
 */
export async function getQuotesNeedingFollowUp(
  tenantId: string,
  limit: number = 20
): Promise<QuoteFollowUpDue[]> {
  const supabase = createServiceRoleClient();

  // Validate limit to prevent DoS
  const safeLimit = Math.max(1, Math.min(limit, 100));

  // Use database function
  const { data, error } = await supabase.rpc('get_quotes_needing_followup', {
    p_tenant_id: tenantId,
    p_limit: safeLimit,
  });

  if (error) {
    console.error('[BidsEngine] Error getting quotes needing follow-up:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Batch fetch client and contact names
  const clientIds = [...new Set(data.map((q: any) => q.client_id))];
  const contactIds = [...new Set(data.filter((q: any) => q.contact_id).map((q: any) => q.contact_id))];

  const [{ data: clients }, { data: contacts }] = await Promise.all([
    supabase.from('clients').select('id, company_name').in('id', clientIds),
    contactIds.length > 0
      ? supabase.from('contacts').select('id, first_name, last_name, email').in('id', contactIds)
      : { data: [] },
  ]);

  const clientsMap = new Map((clients || []).map(c => [c.id, c]));
  const contactsMap = new Map((contacts || []).map(c => [c.id, c]));

  return data.map((row: any) => {
    const client = clientsMap.get(row.client_id);
    const contact = row.contact_id ? contactsMap.get(row.contact_id) : null;

    return {
      quoteId: row.quote_id,
      quoteNumber: row.quote_number,
      title: row.title,
      clientId: row.client_id,
      contactId: row.contact_id,
      totalAmount: row.total_amount,
      status: row.status,
      daysSinceLastContact: row.days_since_last_contact,
      daysSinceSent: row.days_since_sent || row.days_since_last_contact,
      followUpCount: row.follow_up_count,
      maxFollowUps: row.max_follow_ups,
      clientName: client?.company_name,
      contactName: contact ? `${contact.first_name} ${contact.last_name}` : undefined,
      contactEmail: contact?.email,
    };
  });
}

/**
 * Send a quote email
 */
export async function sendQuote(quoteId: string): Promise<{ success: boolean; message: string; cardId?: string; error?: string }> {
  const supabase = createServiceRoleClient();

  // Get quote with details
  const { data: quoteData, error } = await supabase
    .from('quotes')
    .select(`
      id,
      tenant_id,
      quote_number,
      title,
      total_amount,
      line_items,
      valid_until,
      client_id,
      contact_id,
      client:clients(company_name),
      contact:contacts(first_name, last_name, email)
    `)
    .eq('id', quoteId)
    .single();

  if (error || !quoteData) {
    return { success: false, message: 'Quote not found', error: error?.message || 'Quote not found' };
  }

  // Type assertion for Supabase joined data
  const quote = quoteData as any;
  const contact = quote.contact as { first_name: string; last_name: string; email: string } | null;
  const client = quote.client as { company_name: string } | null;

  if (!contact?.email) {
    return { success: false, message: 'No contact email available', error: 'No contact email available' };
  }

  // Generate email
  const validUntilText = quote.valid_until
    ? `This quote is valid until ${new Date(quote.valid_until).toLocaleDateString()}.`
    : 'Please let us know if you have any questions.';

  const emailBody = `Hi ${contact.first_name},

Please find attached our quote for "${quote.title}".

Quote Number: ${quote.quote_number}
Total Amount: $${quote.total_amount.toLocaleString()}

${validUntilText}

We look forward to working with you.

Best regards`;

  // Create kanban card
  const { data: card, error: cardError } = await supabase
    .from('kanban_cards')
    .insert({
      tenant_id: quote.tenant_id,
      type: 'send_email',
      title: `Send Quote: ${quote.quote_number}`,
      description: `Send quote to ${contact.first_name} ${contact.last_name} at ${client?.company_name}`,
      state: 'suggested',
      priority: quote.total_amount > 10000 ? 'high' : 'medium',
      contact_id: quote.contact_id,
      client_id: quote.client_id,
      action_payload: {
        to: contact.email,
        subject: `Quote ${quote.quote_number}: ${quote.title}`,
        body: emailBody,
        quoteId: quote.id,
        type: 'send_quote',
      },
      source: 'bids_engine',
    })
    .select('id')
    .single();

  if (cardError) {
    console.error('[BidsEngine] Error creating send quote card:', cardError);
    return { success: false, message: 'Failed to create quote card', error: cardError.message };
  }

  // Update quote status
  await supabase
    .from('quotes')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      next_follow_up_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId);

  await recordQuoteActivity(quoteId, quote.tenant_id, 'sent', 'Quote sent via email');

  console.log(`[BidsEngine] Created send quote card ${card.id} for quote ${quoteId}`);
  return { success: true, message: 'Quote sent successfully', cardId: card.id };
}

/**
 * Schedule a follow-up for a quote
 */
export async function followUpQuote(quoteId: string): Promise<{ success: boolean; message: string; cardId?: string; error?: string }> {
  const supabase = createServiceRoleClient();

  // Get quote with details
  const { data: quoteData, error } = await supabase
    .from('quotes')
    .select(`
      id,
      tenant_id,
      quote_number,
      title,
      total_amount,
      follow_up_count,
      client_id,
      contact_id,
      client:clients(company_name),
      contact:contacts(first_name, last_name, email)
    `)
    .eq('id', quoteId)
    .single();

  if (error || !quoteData) {
    return { success: false, message: 'Quote not found', error: error?.message || 'Quote not found' };
  }

  // Type assertion for Supabase joined data
  const quote = quoteData as any;
  const contact = quote.contact as { first_name: string; last_name: string; email: string } | null;

  if (!contact?.email) {
    return { success: false, message: 'No contact email available', error: 'No contact email available' };
  }

  const followUpNumber = quote.follow_up_count + 1;

  // Generate follow-up email with increasing urgency
  const urgencyMessages = [
    "I wanted to follow up on the quote I sent over.",
    "I'm checking in on the quote we discussed. Do you have any questions?",
    "I wanted to make sure you received our quote and see if you need any additional information.",
    "This is my final follow-up on our quote. Please let me know if you'd like to proceed or if there's anything else you need.",
  ];

  const urgencyMessage = urgencyMessages[Math.min(followUpNumber - 1, 3)];

  const emailBody = `Hi ${contact.first_name},

${urgencyMessage}

Quote: ${quote.quote_number}
Amount: $${quote.total_amount.toLocaleString()}

I'm happy to schedule a call to discuss any questions you might have.

Best regards`;

  // Create kanban card
  const { data: card, error: cardError } = await supabase
    .from('kanban_cards')
    .insert({
      tenant_id: quote.tenant_id,
      type: 'send_email',
      title: `Quote Follow-up #${followUpNumber}: ${quote.quote_number}`,
      description: `Follow-up on quote sent to ${contact.first_name} ${contact.last_name}`,
      state: 'suggested',
      priority: followUpNumber >= 3 ? 'high' : 'medium',
      contact_id: quote.contact_id,
      client_id: quote.client_id,
      action_payload: {
        to: contact.email,
        subject: `Re: Quote ${quote.quote_number} - Following up`,
        body: emailBody,
        quoteId: quote.id,
        type: 'quote_follow_up',
        followUpNumber,
      },
      source: 'bids_engine',
    })
    .select('id')
    .single();

  if (cardError) {
    console.error('[BidsEngine] Error creating follow-up card:', cardError);
    return { success: false, message: 'Failed to create follow-up card', error: cardError.message };
  }

  // Update quote with follow-up tracking
  const nextFollowUp = new Date();
  nextFollowUp.setDate(nextFollowUp.getDate() + 3); // 3 days between follow-ups

  await supabase
    .from('quotes')
    .update({
      follow_up_count: followUpNumber,
      last_follow_up_at: new Date().toISOString(),
      next_follow_up_at: nextFollowUp.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId);

  await recordQuoteActivity(quoteId, quote.tenant_id, 'follow_up', `Follow-up #${followUpNumber} sent`);

  console.log(`[BidsEngine] Created follow-up card ${card.id} for quote ${quoteId} (follow-up #${followUpNumber})`);
  return { success: true, message: `Follow-up #${followUpNumber} scheduled`, cardId: card.id };
}

/**
 * Track when a quote is viewed
 */
export async function trackQuoteView(quoteId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: quote } = await supabase
    .from('quotes')
    .select('tenant_id, view_count, status')
    .eq('id', quoteId)
    .single();

  if (!quote) return;

  const updates: any = {
    view_count: (quote.view_count || 0) + 1,
    updated_at: new Date().toISOString(),
  };

  // Update status to viewed if this is the first view after sending
  if (quote.status === 'sent') {
    updates.status = 'viewed';
    updates.viewed_at = new Date().toISOString();
  }

  await supabase
    .from('quotes')
    .update(updates)
    .eq('id', quoteId);

  await recordQuoteActivity(quoteId, quote.tenant_id, 'viewed', 'Quote viewed by recipient');

  console.log(`[BidsEngine] Tracked view for quote ${quoteId}`);
}

/**
 * Record quote outcome
 */
export async function recordOutcome(
  quoteId: string,
  outcomeData: QuoteOutcomeData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  // Get quote
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('tenant_id, total_amount')
    .eq('id', quoteId)
    .single();

  if (error || !quote) {
    return { success: false, error: error?.message || 'Quote not found' };
  }

  // Update quote with outcome
  await supabase
    .from('quotes')
    .update({
      status: outcomeData.outcome === 'won' ? 'accepted' : 'rejected',
      outcome: outcomeData.outcome,
      outcome_reason: outcomeData.primaryReason || null,
      outcome_competitor: outcomeData.competitor || null,
      outcome_notes: outcomeData.notes || null,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId);

  // Record outcome for pattern learning
  await supabase
    .from('quote_outcomes')
    .insert({
      tenant_id: quote.tenant_id,
      quote_id: quoteId,
      outcome: outcomeData.outcome,
      primary_reason: outcomeData.primaryReason || null,
      secondary_reasons: outcomeData.secondaryReasons || [],
      competitor: outcomeData.competitor || null,
      our_amount: quote.total_amount,
      competitor_amount: outcomeData.competitorAmount || null,
      recorded_by: outcomeData.recordedBy || null,
    });

  await recordQuoteActivity(
    quoteId,
    quote.tenant_id,
    'outcome',
    `Outcome: ${outcomeData.outcome}${outcomeData.primaryReason ? ` - ${outcomeData.primaryReason}` : ''}`
  );

  console.log(`[BidsEngine] Recorded outcome ${outcomeData.outcome} for quote ${quoteId}`);
  return { success: true };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Record quote activity
 */
async function recordQuoteActivity(
  quoteId: string,
  tenantId: string,
  activityType: string,
  notes: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('quote_activities')
    .insert({
      tenant_id: tenantId,
      quote_id: quoteId,
      activity_type: activityType,
      notes,
    });
}

/**
 * Get quote statistics for tenant
 */
export async function getQuoteStats(tenantId: string): Promise<{
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
  wonValue: number;
  lostValue: number;
  winRate: number;
}> {
  const supabase = createServiceRoleClient();

  const { data: quotes } = await supabase
    .from('quotes')
    .select('status, outcome, total_amount')
    .eq('tenant_id', tenantId);

  if (!quotes) {
    return {
      total: 0,
      byStatus: {},
      totalValue: 0,
      wonValue: 0,
      lostValue: 0,
      winRate: 0,
    };
  }

  const byStatus: Record<string, number> = {};
  let totalValue = 0;
  let wonValue = 0;
  let lostValue = 0;
  let wonCount = 0;
  let decidedCount = 0;

  for (const quote of quotes) {
    byStatus[quote.status] = (byStatus[quote.status] || 0) + 1;
    totalValue += quote.total_amount || 0;

    if (quote.outcome === 'won') {
      wonValue += quote.total_amount || 0;
      wonCount++;
      decidedCount++;
    } else if (quote.outcome === 'lost') {
      lostValue += quote.total_amount || 0;
      decidedCount++;
    }
  }

  return {
    total: quotes.length,
    byStatus,
    totalValue,
    wonValue,
    lostValue,
    winRate: decidedCount > 0 ? (wonCount / decidedCount) * 100 : 0,
  };
}
