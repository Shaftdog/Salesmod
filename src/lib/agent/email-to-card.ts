import { createClient } from '@/lib/supabase/server';
import { GmailMessage } from '@/lib/gmail/gmail-service';
import { EmailClassification, EmailCategory } from '@/lib/agent/email-classifier';

// Valid card types from database schema
// CHECK constraint: type IN ('send_email', 'schedule_call', 'research', 'create_task', 'follow_up', 'create_deal')
type CardType =
  | 'send_email'      // For email replies (auto or manual)
  | 'schedule_call'   // For scheduling requests
  | 'research'        // For information gathering
  | 'create_task'     // For actionable tasks
  | 'follow_up'       // For follow-up actions
  | 'create_deal';    // For sales opportunities

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
  console.log('[Email-to-Card] Starting card creation from email:', {
    messageId: email.id,
    subject: email.subject,
    from: email.from.email,
    category: classification.category,
    confidence: classification.confidence,
  });

  // Validate required inputs
  if (!orgId) {
    const error = new Error('Cannot create card: orgId is required');
    console.error('[Email-to-Card] Validation failed:', error.message);
    throw error;
  }

  if (!classification.category) {
    const error = new Error('Cannot create card: classification category is missing');
    console.error('[Email-to-Card] Validation failed:', error.message);
    throw error;
  }

  const supabase = await createClient();

  // Determine card type and state based on category
  console.log('[Email-to-Card] Determining card strategy...');
  const { cardType, state, priority, autoExecute } = determineCardStrategy(classification);
  console.log('[Email-to-Card] Card strategy:', { cardType, state, priority, autoExecute });

  // Find or create contact
  console.log('[Email-to-Card] Finding or creating contact...');
  let contactId: string;
  try {
    contactId = await findOrCreateContact(orgId, email);
    console.log('[Email-to-Card] Contact ID:', contactId);
  } catch (error) {
    console.error('[Email-to-Card] FAILED to find/create contact:', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw new Error(`Contact creation failed: ${(error as Error).message}`);
  }

  // Get client if exists
  console.log('[Email-to-Card] Looking up client for contact...');
  let clientId: string | null;
  try {
    clientId = await findClientByContact(contactId);
    console.log('[Email-to-Card] Client ID:', clientId || 'none');
  } catch (error) {
    console.error('[Email-to-Card] WARNING: Client lookup failed:', error);
    clientId = null; // Non-fatal, continue without client
  }

  // Build card title and description
  console.log('[Email-to-Card] Building card content...');
  const { title, description, rationale, actionPayload } = buildCardContent(
    email,
    classification,
    cardType
  );

  // Create the card
  console.log('[Email-to-Card] Inserting card into database...', {
    org_id: orgId,
    client_id: clientId,
    contact_id: contactId,
    type: cardType,
    state,
    priority,
  });

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
    console.error('[Email-to-Card] FAILED to create card in database:', {
      messageId: email.id,
      subject: email.subject,
      cardType,
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      insertData: {
        org_id: orgId,
        client_id: clientId,
        contact_id: contactId,
        type: cardType,
        state,
        priority,
      },
    });
    throw new Error(`Card insertion failed: ${error.message} (code: ${error.code})`);
  }

  console.log('[Email-to-Card] Card created successfully:', {
    cardId: card.id,
    type: cardType,
    state,
  });

  // Update gmail_message with card_id
  console.log('[Email-to-Card] Updating gmail_message with card_id...');
  const { error: updateError } = await supabase
    .from('gmail_messages')
    .update({ card_id: card.id })
    .eq('gmail_message_id', email.id);

  if (updateError) {
    console.error('[Email-to-Card] WARNING: Failed to update gmail_message with card_id:', updateError);
    // Non-fatal - card was created successfully
  }

  console.log('[Email-to-Card] Card creation complete:', {
    cardId: card.id,
    messageId: email.id,
  });

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
 *
 * Maps email categories to valid card types:
 * - send_email: For email replies
 * - schedule_call: For scheduling requests
 * - research: For information gathering
 * - create_task: For actionable tasks
 * - follow_up: For follow-up actions
 * - create_deal: For sales opportunities
 */
function determineCardStrategy(classification: EmailClassification): {
  cardType: CardType;
  state: CardState;
  priority: Priority;
  autoExecute: boolean;
} {
  const { category, confidence, entities } = classification;

  // Escalate low confidence - create a task for human review
  if (category === 'ESCALATE' || confidence < 0.95) {
    return {
      cardType: 'create_task',
      state: 'in_review',
      priority: 'medium',
      autoExecute: false,
    };
  }

  // Map email categories to appropriate card types
  switch (category) {
    case 'SCHEDULING':
      // Scheduling requests → schedule_call card
      return {
        cardType: 'schedule_call',
        state: confidence >= 0.95 ? 'approved' : 'in_review',
        priority: entities.urgency === 'high' ? 'high' : 'medium',
        autoExecute: confidence >= 0.95,
      };

    case 'OPPORTUNITY':
      // Business opportunities → create_deal card
      return {
        cardType: 'create_deal',
        state: 'in_review', // Always requires human review
        priority: 'high',
        autoExecute: false,
      };

    case 'STATUS':
    case 'REMOVE':
    case 'NOTIFICATIONS':
      // Simple responses → send_email card
      return {
        cardType: 'send_email',
        state: confidence >= 0.95 ? 'approved' : 'in_review',
        priority: entities.urgency === 'high' ? 'high' : 'medium',
        autoExecute: confidence >= 0.95,
      };

    case 'UPDATES':
      // Updates may need follow-up → follow_up card
      return {
        cardType: 'follow_up',
        state: 'in_review',
        priority: 'medium',
        autoExecute: false,
      };

    case 'AMC_ORDER':
    case 'CASE':
    case 'AP':
    case 'AR':
      // Complex actions requiring human intervention → create_task card
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
        cardType: 'create_task',
        state: 'in_review',
        priority: priorityMap[category] || 'medium',
        autoExecute: false,
      };

    case 'INFORMATION':
      // Informational emails → research card
      return {
        cardType: 'research',
        state: 'suggested',
        priority: 'low',
        autoExecute: false,
      };

    default:
      // Fallback: create a task for human review
      return {
        cardType: 'create_task',
        state: 'suggested',
        priority: 'low',
        autoExecute: false,
      };
  }
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

  // Add card-type-specific payload data
  if (cardType === 'send_email') {
    // For email reply cards, include response template hints
    actionPayload = {
      ...actionPayload,
      category,
      entities,
      shouldAutoSend: classification.confidence >= 0.95,
    };
  } else if (cardType === 'schedule_call') {
    // For scheduling cards, include time/date entities
    actionPayload = {
      ...actionPayload,
      requestedTime: entities.timeframe,
      urgency: entities.urgency,
    };
  } else if (cardType === 'create_deal') {
    // For opportunity cards, include deal details
    actionPayload = {
      ...actionPayload,
      opportunityType: category,
      estimatedValue: entities.amount,
    };
  } else {
    // For tasks, research, follow-ups: include full email context
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
