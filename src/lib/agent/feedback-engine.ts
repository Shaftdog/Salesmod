/**
 * Feedback Engine - Post-delivery feedback collection
 *
 * Automates feedback collection 7 days after order delivery:
 * - Schedules feedback requests
 * - Checks pre-conditions (no open cases)
 * - Sends feedback request emails
 * - Analyzes response sentiment
 * - Triggers service recovery for negative feedback
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface FeedbackRequest {
  id: string;
  tenantId: string;
  orderId: string;
  clientId: string;
  contactId: string | null;
  status: 'pending' | 'sent' | 'responded' | 'expired' | 'skipped';
  deliveryDate: Date;
  scheduledFor: Date;
  sentAt: Date | null;
  respondedAt: Date | null;
  hasOpenCase: boolean;
  skipReason: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  sentimentScore: number | null;
  responseSummary: string | null;
  caseCreatedId: string | null;
  serviceRecoveryTriggered: boolean;
}

export interface FeedbackDueItem {
  id: string;
  orderId: string;
  clientId: string;
  contactId: string | null;
  scheduledFor: Date;
  deliveryDate: Date;
  clientName?: string;
  contactName?: string;
  contactEmail?: string;
  orderNumber?: string;
}

export interface FeedbackPreConditionResult {
  canSend: boolean;
  reason: string | null;
  hasOpenCase: boolean;
  hasValidContact: boolean;
}

export interface FeedbackSendResult {
  success: boolean;
  message: string;
  cardId?: string;
  error?: string;
}

export interface FeedbackAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  summary: string;
  requiresRecovery: boolean;
  keyIssues: string[];
}

// ============================================================================
// Feedback Request Management
// ============================================================================

/**
 * Get feedback requests that are due for sending
 */
export async function getFeedbackDue(
  tenantId: string,
  limit: number = 10
): Promise<FeedbackDueItem[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('feedback_requests')
    .select(`
      id,
      order_id,
      client_id,
      contact_id,
      scheduled_for,
      delivery_date,
      order:orders(order_number),
      client:clients(company_name),
      contact:contacts(first_name, last_name, email)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[FeedbackEngine] Error getting due feedback:', error);
    return [];
  }

  // Note: Supabase joins return objects for single relations (not arrays)
  return (data || []).map((row: any) => ({
    id: row.id,
    orderId: row.order_id,
    clientId: row.client_id,
    contactId: row.contact_id,
    scheduledFor: new Date(row.scheduled_for),
    deliveryDate: new Date(row.delivery_date),
    clientName: row.client?.company_name,
    contactName: row.contact ? `${row.contact.first_name} ${row.contact.last_name}` : undefined,
    contactEmail: row.contact?.email,
    orderNumber: row.order?.order_number,
  }));
}

/**
 * Check pre-conditions before sending feedback request
 */
export async function checkPreConditions(
  requestId: string
): Promise<FeedbackPreConditionResult> {
  const supabase = createServiceRoleClient();

  // Get the feedback request with related data
  const { data: request, error } = await supabase
    .from('feedback_requests')
    .select(`
      id,
      order_id,
      client_id,
      contact_id,
      contact:contacts(id, email)
    `)
    .eq('id', requestId)
    .single();

  if (error || !request) {
    return {
      canSend: false,
      reason: 'Feedback request not found',
      hasOpenCase: false,
      hasValidContact: false,
    };
  }

  // Type assertion for Supabase joined data
  const requestData = request as any;
  const contact = requestData.contact as { id: string; email: string } | null;

  // Check for open cases on this order
  const { count: openCaseCount } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', request.order_id)
    .in('status', ['open', 'in_progress', 'pending']);

  const hasOpenCase = (openCaseCount || 0) > 0;

  // Check for valid contact with email
  const hasValidContact = !!(contact?.email);

  // Determine if we can send
  const canSend = !hasOpenCase && hasValidContact;
  let reason: string | null = null;

  if (hasOpenCase) {
    reason = 'Open case exists for this order';
  } else if (!hasValidContact) {
    reason = 'No valid contact email available';
  }

  // Update the request with pre-condition check results
  if (!canSend) {
    await supabase
      .from('feedback_requests')
      .update({
        status: 'skipped',
        has_open_case: hasOpenCase,
        skip_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);
  }

  return {
    canSend,
    reason,
    hasOpenCase,
    hasValidContact,
  };
}

/**
 * Create a card to send feedback request email
 */
export async function sendFeedbackRequest(
  requestId: string
): Promise<FeedbackSendResult> {
  const supabase = createServiceRoleClient();

  // Get request with full details
  const { data: request, error } = await supabase
    .from('feedback_requests')
    .select(`
      id,
      tenant_id,
      order_id,
      client_id,
      contact_id,
      order:orders(order_number, property:properties(street_address, city, state)),
      client:clients(company_name),
      contact:contacts(first_name, last_name, email)
    `)
    .eq('id', requestId)
    .single();

  if (error || !request) {
    return {
      success: false,
      message: 'Feedback request not found',
      error: error?.message,
    };
  }

  // Type assertion for Supabase joined data
  const requestData = request as any;
  const order = requestData.order as { order_number: string; property: { street_address: string; city: string; state: string } | null } | null;
  const contact = requestData.contact as { first_name: string; last_name: string; email: string } | null;

  // Create kanban card for the feedback email
  const emailSubject = `How was your experience with order ${order?.order_number}?`;
  const propertyAddress = order?.property
    ? `${order.property.street_address}, ${order.property.city}, ${order.property.state}`
    : 'your recent order';

  const emailBody = `Hi ${contact?.first_name || 'there'},

We hope your recent order for ${propertyAddress} met your expectations.

We'd love to hear your feedback! Please take a moment to let us know:
- How satisfied were you with the service?
- Was the delivery timely?
- Any suggestions for improvement?

Your feedback helps us serve you better.

Thank you for your business!

Best regards,
The Team`;

  const { data: card, error: cardError } = await supabase
    .from('kanban_cards')
    .insert({
      tenant_id: request.tenant_id,
      type: 'send_email',
      title: `Feedback Request: ${order?.order_number}`,
      description: `Send feedback request email to ${contact?.first_name} ${contact?.last_name}`,
      state: 'suggested',
      priority: 'medium',
      contact_id: request.contact_id,
      client_id: request.client_id,
      action_payload: {
        to: contact?.email,
        subject: emailSubject,
        body: emailBody,
        feedbackRequestId: requestId,
        type: 'feedback_request',
      },
      source: 'feedback_engine',
    })
    .select('id')
    .single();

  if (cardError) {
    console.error('[FeedbackEngine] Error creating card:', cardError);
    return {
      success: false,
      message: 'Failed to create feedback email card',
      error: cardError.message,
    };
  }

  // Update request status
  await supabase
    .from('feedback_requests')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  console.log(`[FeedbackEngine] Created feedback request card ${card.id} for request ${requestId}`);

  return {
    success: true,
    message: 'Feedback request email card created',
    cardId: card.id,
  };
}

/**
 * Analyze feedback response using AI sentiment analysis
 *
 * @param requestId - Unique identifier for the feedback request
 * @param responseText - Customer's feedback response text
 * @returns Analysis result with sentiment, score, and key issues
 * @throws Error if responseText is empty or invalid
 */
export async function analyzeFeedbackResponse(
  requestId: string,
  responseText: string
): Promise<FeedbackAnalysisResult> {
  // Validate input
  if (!requestId || typeof requestId !== 'string') {
    throw new Error('requestId is required and must be a non-empty string');
  }
  if (!responseText || typeof responseText !== 'string' || responseText.trim().length === 0) {
    throw new Error('responseText is required and must be a non-empty string');
  }

  // Simple sentiment analysis based on keywords
  // In production, this would use OpenAI or similar
  const positiveKeywords = ['great', 'excellent', 'thank', 'happy', 'satisfied', 'good', 'wonderful', 'amazing', 'perfect'];
  const negativeKeywords = ['bad', 'poor', 'disappointed', 'unhappy', 'terrible', 'awful', 'issue', 'problem', 'complaint', 'wrong'];

  const lowerText = responseText.trim().toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveKeywords) {
    if (lowerText.includes(word)) positiveCount++;
  }
  for (const word of negativeKeywords) {
    if (lowerText.includes(word)) negativeCount++;
  }

  let sentiment: 'positive' | 'neutral' | 'negative';
  let sentimentScore: number;

  if (positiveCount > negativeCount) {
    sentiment = 'positive';
    sentimentScore = Math.min(0.5 + (positiveCount * 0.1), 1.0);
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    sentimentScore = Math.max(-0.5 - (negativeCount * 0.1), -1.0);
  } else {
    sentiment = 'neutral';
    sentimentScore = 0;
  }

  const keyIssues: string[] = [];
  if (lowerText.includes('late') || lowerText.includes('delay')) keyIssues.push('Timeliness concern');
  if (lowerText.includes('quality') || lowerText.includes('error')) keyIssues.push('Quality issue');
  if (lowerText.includes('communication') || lowerText.includes('response')) keyIssues.push('Communication gap');
  if (lowerText.includes('price') || lowerText.includes('cost')) keyIssues.push('Pricing concern');

  const requiresRecovery = sentiment === 'negative' || keyIssues.length >= 2;

  // Update the feedback request
  const supabase = createServiceRoleClient();
  await supabase
    .from('feedback_requests')
    .update({
      status: 'responded',
      responded_at: new Date().toISOString(),
      sentiment,
      sentiment_score: sentimentScore,
      response_summary: keyIssues.length > 0 ? keyIssues.join('; ') : 'No specific issues identified',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  return {
    sentiment,
    sentimentScore,
    summary: keyIssues.length > 0 ? keyIssues.join('; ') : 'No specific issues identified',
    requiresRecovery,
    keyIssues,
  };
}

/**
 * Trigger service recovery for negative feedback
 */
export async function triggerServiceRecovery(
  requestId: string,
  analysis: FeedbackAnalysisResult
): Promise<{ success: boolean; caseId?: string }> {
  const supabase = createServiceRoleClient();

  // Get the feedback request
  const { data: request, error } = await supabase
    .from('feedback_requests')
    .select(`
      id,
      tenant_id,
      order_id,
      client_id,
      contact_id,
      order:orders(order_number)
    `)
    .eq('id', requestId)
    .single();

  if (error || !request) {
    console.error('[FeedbackEngine] Request not found for service recovery:', error);
    return { success: false };
  }

  // Type assertion for Supabase joined data
  const requestData = request as any;
  const order = requestData.order as { order_number: string } | null;

  // Create a case for service recovery
  const { data: newCase, error: caseError } = await supabase
    .from('cases')
    .insert({
      tenant_id: request.tenant_id,
      order_id: request.order_id,
      client_id: request.client_id,
      contact_id: request.contact_id,
      title: `Service Recovery: Order ${order?.order_number}`,
      description: `Negative feedback received.\n\nIssues: ${analysis.keyIssues.join(', ')}\n\nSentiment Score: ${analysis.sentimentScore}`,
      status: 'open',
      priority: 'high',
      source: 'feedback_engine',
      category: 'service_recovery',
    })
    .select('id')
    .single();

  if (caseError) {
    console.error('[FeedbackEngine] Error creating case:', caseError);
    return { success: false };
  }

  // Update feedback request with case reference
  await supabase
    .from('feedback_requests')
    .update({
      case_created_id: newCase.id,
      service_recovery_triggered: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  console.log(`[FeedbackEngine] Created service recovery case ${newCase.id} for feedback ${requestId}`);

  return {
    success: true,
    caseId: newCase.id,
  };
}

/**
 * Queue a feedback request when an order is delivered
 */
export async function queueFeedbackRequest(
  tenantId: string,
  orderId: string,
  clientId: string,
  contactId: string | null,
  deliveryDate: Date = new Date()
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const scheduledFor = new Date(deliveryDate);
  scheduledFor.setDate(scheduledFor.getDate() + 7); // 7 days after delivery

  const { data, error } = await supabase
    .from('feedback_requests')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      client_id: clientId,
      contact_id: contactId,
      delivery_date: deliveryDate.toISOString(),
      scheduled_for: scheduledFor.toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique violation - already exists
      console.log(`[FeedbackEngine] Feedback request already exists for order ${orderId}`);
      return null;
    }
    console.error('[FeedbackEngine] Error queuing feedback request:', error);
    return null;
  }

  console.log(`[FeedbackEngine] Queued feedback request ${data.id} for order ${orderId}`);
  return data.id;
}

/**
 * Get feedback statistics for tenant
 */
export async function getFeedbackStats(tenantId: string): Promise<{
  pending: number;
  sent: number;
  responded: number;
  positive: number;
  negative: number;
  neutral: number;
  responseRate: number;
  averageSentiment: number;
}> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('feedback_requests')
    .select('status, sentiment, sentiment_score')
    .eq('tenant_id', tenantId);

  if (error || !data) {
    return {
      pending: 0,
      sent: 0,
      responded: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      responseRate: 0,
      averageSentiment: 0,
    };
  }

  const stats = {
    pending: data.filter(r => r.status === 'pending').length,
    sent: data.filter(r => r.status === 'sent').length,
    responded: data.filter(r => r.status === 'responded').length,
    positive: data.filter(r => r.sentiment === 'positive').length,
    negative: data.filter(r => r.sentiment === 'negative').length,
    neutral: data.filter(r => r.sentiment === 'neutral').length,
    responseRate: 0,
    averageSentiment: 0,
  };

  const sentAndResponded = stats.sent + stats.responded;
  stats.responseRate = sentAndResponded > 0 ? (stats.responded / sentAndResponded) * 100 : 0;

  const sentimentScores = data.filter(r => r.sentiment_score !== null).map(r => r.sentiment_score);
  stats.averageSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    : 0;

  return stats;
}
