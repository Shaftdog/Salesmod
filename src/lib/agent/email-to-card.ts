import { createClient } from '@/lib/supabase/server';
import { GmailMessage } from '@/lib/gmail/gmail-service';
import { EmailClassification, EmailCategory } from '@/lib/agent/email-classifier';

type CardType =
  | 'reply_to_email'
  | 'needs_human_response'
  | 'create_task'
  | 'send_email';
type CardState = 'suggested' | 'in_review' | 'approved' | 'executing' | 'done' | 'blocked' | 'rejected';
type Priority = 'low' | 'medium' | 'high';

interface CardGenerationResult {
  cardId: string;
  type: CardType;
  state: CardState;
  autoExecute: boolean;
}

/**
 * Creates a kanban card from a classified email
 * Implements triage logic based on category and confidence
 */
export async function createCardFromEmail(
  orgId: string,
  email: GmailMessage,
  classification: EmailClassification,
  gmailMessageId: string
): Promise<CardGenerationResult> {
  const supabase = await createClient();

  // Determine card type and state based on category
  const { cardType, state, priority, autoExecute } = determineCardStrategy(classification);

  // Find or create contact
  const contactId = await findOrCreateContact(orgId, email);

  // Get client if exists
  const clientId = await findClientByContact(contactId);

  // Build card title and description
  const { title, description, rationale, actionPayload } = buildCardContent(
    email,
    classification,
    cardType
  );

  // Create the card
  const { data: card, error } = await supabase
    .from('kanban_cards')
    .insert({
      org_id: orgId,
      client_id: clientId,
      contact_id: contactId,
      gmail_message_id: email.id,
      gmail_thread_id: email.threadId,
      email_category: classification.category,
      type: cardType,
      title,
      description,
      rationale,
      priority,
      state,
      action_payload: actionPayload,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating card from email:', error);
    throw error;
  }

  // Update gmail_message with card_id
  await supabase
    .from('gmail_messages')
    .update({ card_id: card.id })
    .eq('gmail_message_id', email.id);

  return {
    cardId: card.id,
    type: cardType,
    state,
    autoExecute,
  };
}

/**
 * Determines card type, state, and priority based on classification
 * Implements Lindy-style triage logic
 */
function determineCardStrategy(classification: EmailClassification): {
  cardType: CardType;
  state: CardState;
  priority: Priority;
  autoExecute: boolean;
} {
  const { category, confidence, entities } = classification;

  // Escalate low confidence
  if (category === 'ESCALATE' || confidence < 0.95) {
    return {
      cardType: 'needs_human_response',
      state: 'in_review',
      priority: 'medium',
      autoExecute: false,
    };
  }

  // Auto-handle categories (high confidence)
  const autoHandleCategories: EmailCategory[] = [
    'STATUS',
    'SCHEDULING',
    'REMOVE',
    'NOTIFICATIONS',
  ];

  if (autoHandleCategories.includes(category) && confidence >= 0.95) {
    return {
      cardType: 'reply_to_email',
      state: 'approved', // Auto-approved for execution
      priority: entities.urgency === 'high' ? 'high' : 'medium',
      autoExecute: true,
    };
  }

  // Review mode categories (draft for review)
  const reviewCategories: EmailCategory[] = ['OPPORTUNITY', 'UPDATES'];

  if (reviewCategories.includes(category)) {
    return {
      cardType: 'reply_to_email',
      state: 'in_review', // Requires human approval
      priority: category === 'OPPORTUNITY' ? 'high' : 'medium',
      autoExecute: false,
    };
  }

  // Human required categories
  const humanCategories: EmailCategory[] = [
    'AMC_ORDER',
    'CASE',
    'AP',
    'AR',
  ];

  if (humanCategories.includes(category)) {
    const priorityMap: Record<EmailCategory, Priority> = {
      AMC_ORDER: 'high',
      CASE: 'high',
      AP: 'medium',
      AR: 'medium',
      OPPORTUNITY: 'high',
      STATUS: 'medium',
      SCHEDULING: 'medium',
      UPDATES: 'medium',
      INFORMATION: 'low',
      NOTIFICATIONS: 'low',
      REMOVE: 'low',
      ESCALATE: 'medium',
    };

    return {
      cardType: 'needs_human_response',
      state: 'in_review',
      priority: priorityMap[category] || 'medium',
      autoExecute: false,
    };
  }

  // Information/notifications - just log, no card needed (but we'll create one anyway)
  return {
    cardType: 'reply_to_email',
    state: 'suggested',
    priority: 'low',
    autoExecute: false,
  };
}

/**
 * Builds card content (title, description, rationale, action payload)
 */
function buildCardContent(
  email: GmailMessage,
  classification: EmailClassification,
  cardType: CardType
): {
  title: string;
  description: string;
  rationale: string;
  actionPayload: any;
} {
  const { category, intent, entities } = classification;

  // Build title
  const categoryLabels: Record<EmailCategory, string> = {
    AMC_ORDER: 'New AMC Order',
    OPPORTUNITY: 'New Business Opportunity',
    CASE: 'Case Requiring Investigation',
    STATUS: 'Status Request',
    SCHEDULING: 'Scheduling Request',
    UPDATES: 'Order Update',
    AP: 'Invoice to Pay',
    AR: 'Payment Received',
    INFORMATION: 'Information',
    NOTIFICATIONS: 'Notification',
    REMOVE: 'Unsubscribe Request',
    ESCALATE: 'Needs Review',
  };

  const title = `${categoryLabels[category]}: ${email.subject}`;

  // Build description
  const description = `Email from: ${email.from.name || email.from.email}
Subject: ${email.subject}
Intent: ${intent}

${email.snippet}

${entities.orderNumber ? `Order #: ${entities.orderNumber}` : ''}
${entities.propertyAddress ? `Property: ${entities.propertyAddress}` : ''}
${entities.amount ? `Amount: $${entities.amount}` : ''}
${entities.requestedAction ? `Action: ${entities.requestedAction}` : ''}`;

  // Build rationale
  const rationale = `${classification.reasoning}

Classification: ${category} (${Math.round(classification.confidence * 100)}% confident)
${classification.shouldEscalate ? 'Escalated for human review due to low confidence.' : ''}`;

  // Build action payload based on card type
  let actionPayload: any = {
    emailId: email.id,
    threadId: email.threadId,
    from: email.from,
    subject: email.subject,
    classification,
  };

  if (cardType === 'reply_to_email') {
    // For auto-reply cards, include response template hints
    actionPayload = {
      ...actionPayload,
      category,
      entities,
      shouldAutoSend: classification.confidence >= 0.95,
    };
  } else if (cardType === 'needs_human_response') {
    // For human cards, include full email context
    actionPayload = {
      ...actionPayload,
      bodyText: email.bodyText,
      bodyHtml: email.bodyHtml,
      needsResponse: true,
      suggestedActions: getSuggestedActions(category, entities),
    };
  }

  return {
    title,
    description,
    rationale,
    actionPayload,
  };
}

/**
 * Gets suggested actions for human-required cards
 */
function getSuggestedActions(
  category: EmailCategory,
  entities: EmailClassification['entities']
): string[] {
  const actions: Record<EmailCategory, string[]> = {
    AMC_ORDER: [
      'Review order details',
      'Create order in system',
      'Assign to appraiser',
      'Send acceptance confirmation',
    ],
    CASE: [
      'Review complaint details',
      'Investigate the issue',
      'Respond to client',
      'Escalate if needed',
    ],
    AP: [
      'Review invoice',
      'Verify amount and details',
      'Approve for payment',
      'Process payment',
    ],
    AR: [
      'Confirm payment received',
      'Update order status',
      'Send receipt',
      'Close invoice',
    ],
    OPPORTUNITY: [
      'Review opportunity',
      'Prepare quote',
      'Send proposal',
      'Schedule follow-up',
    ],
    STATUS: ['Look up order', 'Provide status update'],
    SCHEDULING: ['Check availability', 'Confirm appointment'],
    UPDATES: ['Review update', 'Acknowledge'],
    INFORMATION: ['Read and file'],
    NOTIFICATIONS: ['Acknowledge'],
    REMOVE: ['Process unsubscribe'],
    ESCALATE: ['Review email', 'Determine appropriate action', 'Respond'],
  };

  return actions[category] || ['Review and respond'];
}

/**
 * Finds or creates a contact from email
 */
async function findOrCreateContact(
  orgId: string,
  email: GmailMessage
): Promise<string> {
  const supabase = await createClient();

  // Try to find existing contact by email
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', email.from.email)
    .single();

  if (existingContact) {
    return existingContact.id;
  }

  // Create new contact
  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert({
      org_id: orgId,
      email: email.from.email,
      name: email.from.name || email.from.email,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw error;
  }

  return newContact.id;
}

/**
 * Finds client associated with a contact
 */
async function findClientByContact(contactId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: contact } = await supabase
    .from('contacts')
    .select('client_id')
    .eq('id', contactId)
    .single();

  return contact?.client_id || null;
}

/**
 * Batch creates cards from multiple emails
 */
export async function createCardsFromEmails(
  orgId: string,
  emails: GmailMessage[],
  classifications: Map<string, EmailClassification>,
  gmailMessageIds: Map<string, string>
): Promise<Map<string, CardGenerationResult>> {
  const results = new Map<string, CardGenerationResult>();

  for (const email of emails) {
    const classification = classifications.get(email.id);
    const gmailMessageId = gmailMessageIds.get(email.id);

    if (!classification || !gmailMessageId) {
      console.warn(`Skipping email ${email.id} - missing classification or DB ID`);
      continue;
    }

    try {
      const result = await createCardFromEmail(
        orgId,
        email,
        classification,
        gmailMessageId
      );
      results.set(email.id, result);
    } catch (error) {
      console.error(`Failed to create card for email ${email.id}:`, error);
    }
  }

  return results;
}
