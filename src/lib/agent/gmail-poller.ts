import { createClient } from '@/lib/supabase/server';
import { GmailService, GmailMessage } from '@/lib/gmail/gmail-service';
import { classifyEmail, EmailClassification } from '@/lib/agent/email-classifier';
import { createCardFromEmail } from '@/lib/agent/email-to-card';

export interface PollResult {
  success: boolean;
  messagesProcessed: number;
  cardsCreated: number;
  errors: string[];
  autoExecutedCards: number;
}

/**
 * Polls Gmail inbox for new messages and processes them into cards
 * This is the main orchestration function that ties everything together
 */
export async function pollGmailInbox(orgId: string): Promise<PollResult> {
  const result: PollResult = {
    success: false,
    messagesProcessed: 0,
    cardsCreated: 0,
    errors: [],
    autoExecutedCards: 0,
  };

  try {
    console.log(`[Gmail Poller] Starting poll for org ${orgId}`);
    const supabase = await createClient();

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', orgId)
      .single();

    const tenantId = profile?.tenant_id;
    if (!tenantId) {
      result.errors.push('User has no tenant_id assigned');
      return result;
    }

    // Check if Gmail sync is enabled
    console.log(`[Gmail Poller] Checking sync state...`);
    const { data: syncState, error: syncStateError } = await supabase
      .from('gmail_sync_state')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (syncStateError) {
      console.error('[Gmail Poller] Failed to fetch sync state:', syncStateError);
      result.errors.push(`Database error: ${syncStateError.message}`);
      return result;
    }

    if (!syncState || !syncState.is_enabled) {
      console.log('[Gmail Poller] Gmail sync is not enabled');
      result.errors.push('Gmail sync is not enabled for this organization');
      return result;
    }

    console.log('[Gmail Poller] Sync state:', {
      enabled: syncState.is_enabled,
      autoProcess: syncState.auto_process,
      lastSync: syncState.last_sync_at,
    });

    // Create Gmail service
    console.log('[Gmail Poller] Creating Gmail service...');
    let gmailService: GmailService;
    try {
      gmailService = await GmailService.create(orgId);
      console.log('[Gmail Poller] Gmail service created successfully');
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('[Gmail Poller] Failed to create Gmail service:', errorMessage);
      result.errors.push(`Gmail connection failed: ${errorMessage}`);
      return result;
    }

    // Fetch new messages since last sync
    const sinceDate = syncState.last_sync_at
      ? new Date(syncState.last_sync_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours if first sync

    console.log(`[Gmail Poller] Fetching messages since ${sinceDate.toISOString()}...`);

    let messages: GmailMessage[];
    try {
      messages = await gmailService.fetchNewMessages(sinceDate);
      console.log(`[Gmail Poller] Found ${messages.length} new messages`);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('[Gmail Poller] Failed to fetch messages:', errorMessage);
      result.errors.push(`Gmail API error: ${errorMessage}`);
      return result;
    }

    if (messages.length === 0) {
      console.log('[Gmail Poller] No new messages to process');
      result.success = true;
      return result;
    }

    console.log(`[Gmail Poller] Processing ${messages.length} new messages...`);

    // Build context map for classification (check if senders are existing clients)
    console.log('[Gmail Poller] Building context map...');
    let contextMap: Map<string, { isExistingClient?: boolean; hasActiveOrders?: boolean }>;
    try {
      contextMap = await buildContextMap(orgId, messages);
      console.log(`[Gmail Poller] Context map built for ${contextMap.size} senders`);
    } catch (error) {
      console.error('[Gmail Poller] Failed to build context map:', error);
      result.errors.push(`Context building failed: ${(error as Error).message}`);
      return result;
    }

    // Process each message and track card creation
    let cardsCreatedCount = 0;
    const cardCreationErrors: Array<{ messageId: string; subject: string; error: string }> = [];

    for (const message of messages) {
      try {
        console.log(`[Gmail Poller] Processing message ${message.id} from ${message.from.email}`);
        const cardCreated = await processMessage(orgId, message, contextMap, syncState.auto_process);
        result.messagesProcessed++;

        if (cardCreated) {
          cardsCreatedCount++;
          console.log(`[Gmail Poller] Message ${message.id} processed successfully - card created`);
        } else {
          console.log(`[Gmail Poller] Message ${message.id} processed - no card created (auto_process disabled or skipped)`);
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error(`[Gmail Poller] Error processing message ${message.id}:`, {
          error: errorMessage,
          stack: (error as Error).stack,
        });

        cardCreationErrors.push({
          messageId: message.id,
          subject: message.subject,
          error: errorMessage,
        });

        result.errors.push(`Failed to process "${message.subject}": ${errorMessage}`);
      }
    }

    result.cardsCreated = cardsCreatedCount;

    // Update sync state
    const { error: updateError } = await supabase
      .from('gmail_sync_state')
      .update({
        last_sync_at: new Date().toISOString(),
        total_messages_synced: (syncState.total_messages_synced || 0) + result.messagesProcessed,
        last_message_received_at:
          messages.length > 0
            ? messages[messages.length - 1].receivedAt.toISOString()
            : syncState.last_message_received_at,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('[Gmail Poller] Failed to update sync state:', updateError);
    }

    // Count auto-executed cards
    const { count: autoExecuted } = await supabase
      .from('kanban_cards')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in(
        'gmail_message_id',
        messages.map((m) => m.id)
      )
      .eq('state', 'approved');

    result.autoExecutedCards = autoExecuted || 0;

    // Only mark as success if:
    // 1. No errors occurred, OR
    // 2. Messages were processed and stored successfully (even if card creation was skipped due to auto_process being disabled)
    const hasCardCreationErrors = cardCreationErrors.length > 0;
    result.success = result.errors.length === 0;

    if (hasCardCreationErrors) {
      console.error('[Gmail Poller] Card creation errors summary:', cardCreationErrors);
    }

    console.log('[Gmail Poller] Processing complete:', {
      messagesProcessed: result.messagesProcessed,
      cardsCreated: result.cardsCreated,
      autoExecutedCards: result.autoExecutedCards,
      errors: result.errors.length,
      success: result.success,
    });

    return result;
  } catch (error) {
    console.error('Error polling Gmail inbox:', error);
    result.errors.push('Polling error: ' + (error as Error).message);
    return result;
  }
}

/**
 * Processes a single Gmail message
 * @returns true if a card was created, false if not (e.g., auto_process disabled or message already exists)
 */
async function processMessage(
  orgId: string,
  message: GmailMessage,
  contextMap: Map<string, { isExistingClient?: boolean; hasActiveOrders?: boolean }>,
  autoProcess: boolean
): Promise<boolean> {
  const supabase = await createClient();

  // Get user's tenant_id for multi-tenant isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  const tenantId = profile?.tenant_id;
  if (!tenantId) {
    throw new Error('User has no tenant_id assigned');
  }

  // Check if message already processed
  const { data: existing } = await supabase
    .from('gmail_messages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('gmail_message_id', message.id)
    .single();

  if (existing) {
    console.log(`[Gmail Poller] Message ${message.id} already processed, skipping`);
    return false;
  }

  // 1. Store message in database
  console.log(`[Gmail Poller] Storing message ${message.id} in database...`);
  const { data: gmailMessage, error: insertError } = await supabase
    .from('gmail_messages')
    .insert({
      org_id: orgId,
      gmail_message_id: message.id,
      gmail_thread_id: message.threadId,
      from_email: message.from.email,
      from_name: message.from.name,
      to_email: message.to,
      cc_email: message.cc,
      bcc_email: message.bcc,
      reply_to: message.replyTo,
      subject: message.subject,
      body_text: message.bodyText,
      body_html: message.bodyHtml,
      snippet: message.snippet,
      labels: message.labels,
      has_attachments: message.hasAttachments,
      attachment_count: message.attachments.length,
      attachments: message.attachments,
      received_at: message.receivedAt.toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('[Gmail Poller] Error storing Gmail message:', insertError);
    throw new Error(`Failed to store email in database: ${insertError.message}`);
  }

  console.log(`[Gmail Poller] Message ${message.id} stored successfully`);

  // Skip card creation if auto_process is disabled
  if (!autoProcess) {
    console.log(`[Gmail Poller] Auto-process disabled, message ${message.id} stored but card creation skipped`);
    return false;
  }

  // 2. Check if this is a reply to a campaign email
  console.log(`[Gmail Poller] Checking campaign context for message ${message.id}...`);
  const campaignContext = await findCampaignContext(orgId, message);
  if (campaignContext?.isCampaignReply) {
    console.log(`[Gmail Poller] Message ${message.id} is a campaign reply for job ${campaignContext.jobId}`);
  }

  // 3. Classify message using AI (with campaign context and user rules)
  console.log(`[Gmail Poller] Classifying message ${message.id}...`);
  const context = contextMap.get(message.from.email);
  let classification;
  try {
    classification = await classifyEmail(message, {
      orgId, // Pass orgId to enable user-defined classification rules
      ...context,
      isCampaignReply: campaignContext?.isCampaignReply || false,
      jobContext: campaignContext?.jobContext,
    });
    console.log(`[Gmail Poller] Message ${message.id} classified as ${classification.category} (confidence: ${classification.confidence})`);
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`[Gmail Poller] Failed to classify message ${message.id}:`, errorMessage);
    throw new Error(`Email classification failed: ${errorMessage}`);
  }

  // 4. Update message with classification and campaign context
  console.log(`[Gmail Poller] Updating message ${message.id} with classification...`);
  await supabase
    .from('gmail_messages')
    .update({
      category: classification.category,
      confidence: classification.confidence,
      intent: {
        description: classification.intent,
        entities: classification.entities,
        reasoning: classification.reasoning,
      },
      job_id: campaignContext?.jobId || null,
      task_id: campaignContext?.taskId || null,
      is_reply_to_campaign: campaignContext?.isCampaignReply || false,
      original_message_id: campaignContext?.originalMessageId || null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', gmailMessage.id);

  // 5. Create card from email
  console.log(`[Gmail Poller] Creating card for message ${message.id}...`);
  let cardResult;
  try {
    cardResult = await createCardFromEmail(
      orgId,
      message,
      classification,
      gmailMessage.id
    );

    console.log(
      `[Gmail Poller] Created ${cardResult.type} card (${cardResult.state}) for message ${message.id}`
    );
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`[Gmail Poller] FAILED to create card for message ${message.id}:`, {
      error: errorMessage,
      stack: (error as Error).stack,
    });
    throw new Error(`Card creation failed: ${errorMessage}`);
  }

  // 6. Manage Gmail inbox (label, mark read, archive)
  try {
    await manageGmailInbox(orgId, message, classification, cardResult);
  } catch (error) {
    console.error(`[Gmail Poller] WARNING: Failed to manage Gmail inbox for message ${message.id}:`, error);
    // Non-fatal - don't block on inbox management failures
  }

  // 7. If needs escalation, send auto-reply
  if (classification.category === 'ESCALATE' || classification.shouldEscalate) {
    try {
      await sendEscalationAutoReply(orgId, message);
    } catch (error) {
      console.error(`[Gmail Poller] WARNING: Failed to send escalation auto-reply for message ${message.id}:`, error);
      // Non-fatal - don't block on auto-reply failures
    }
  }

  return true; // Card was successfully created
}

/**
 * Finds campaign context if this email is a reply to a job/campaign email
 * Looks up the original outbound email by thread ID
 */
async function findCampaignContext(
  orgId: string,
  message: GmailMessage
): Promise<{
  isCampaignReply: boolean;
  jobId?: string;
  taskId?: number;
  originalMessageId?: string;
  jobContext?: {
    jobName: string;
    jobDescription: string;
    originalEmailSubject: string;
    originalEmailBody: string;
  };
} | null> {
  const supabase = await createClient();

  try {
    // Get user's tenant_id for multi-tenant lookup
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', orgId)
      .single();

    const tenantId = profile?.tenant_id;
    if (!tenantId) {
      return null;
    }

    // Look for cards with the same thread ID that sent emails
    // This indicates the thread was started by our agent
    const { data: originalCard } = await supabase
      .from('kanban_cards')
      .select('id, job_id, task_id, type, action_payload, gmail_thread_id')
      .eq('tenant_id', tenantId)
      .eq('gmail_thread_id', message.threadId)
      .eq('type', 'send_email')
      .eq('state', 'done')
      .order('executed_at', { ascending: false })
      .limit(1)
      .single();

    if (!originalCard || !originalCard.job_id) {
      return null;
    }

    // Get job context
    const { data: job } = await supabase
      .from('jobs')
      .select('name, description, params')
      .eq('id', originalCard.job_id)
      .single();

    if (!job) {
      return null;
    }

    // Extract original email content from card
    const payload = originalCard.action_payload || {};

    return {
      isCampaignReply: true,
      jobId: originalCard.job_id,
      taskId: originalCard.task_id || undefined,
      originalMessageId: payload.messageId || undefined,
      jobContext: {
        jobName: job.name,
        jobDescription: job.description || '',
        originalEmailSubject: payload.subject || '',
        originalEmailBody: payload.body || payload.bodyText || '',
      },
    };
  } catch (error) {
    console.error('Error finding campaign context:', error);
    return null;
  }
}

/**
 * Manages Gmail inbox after processing email
 * - Auto-responded: Mark read, label, archive
 * - Escalated: Label by category, keep in inbox
 */
async function manageGmailInbox(
  orgId: string,
  message: GmailMessage,
  classification: any,
  cardResult: any
): Promise<void> {
  try {
    const { GmailService } = await import('@/lib/gmail/gmail-service');
    const gmailService = await GmailService.create(orgId);

    const category = classification.category;
    const isAutoExecuted = cardResult.autoExecute;

    // Always add category label for organization
    const labelName = `Salesmod/${category}`;
    await gmailService.addLabel(message.id, labelName);

    // If auto-executed (auto-responded), clean up inbox
    if (isAutoExecuted) {
      await gmailService.markAsRead(message.id);
      await gmailService.addLabel(message.id, 'Salesmod/Auto-Responded');
      await gmailService.archive(message.id);
      console.log(`✓ Auto-responded email archived: ${message.id}`);
    } else {
      // Escalated to human - keep in inbox for attention
      console.log(`⚠ Email kept in inbox for human review: ${message.id} (${category})`);
    }
  } catch (error) {
    console.error('Error managing Gmail inbox:', error);
    // Don't throw - inbox management is optional, don't block card creation
  }
}

/**
 * Sends an automatic "we'll get back to you" reply for escalated emails
 */
async function sendEscalationAutoReply(
  orgId: string,
  message: GmailMessage
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', orgId)
      .single();

    const tenantId = profile?.tenant_id;
    if (!tenantId) {
      console.error('[Gmail Poller] User has no tenant_id assigned');
      return;
    }

    // Check if we should send auto-reply
    const { data: syncState } = await supabase
      .from('gmail_sync_state')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    // For now, we'll skip auto-reply and let the human handle it
    // In a production system, you'd want to check settings and send via Gmail API
    console.log(
      `Escalation auto-reply would be sent for message ${message.id} (not implemented yet)`
    );

    // TODO: Implement auto-reply using GmailService.sendReply()
    // const gmailService = await GmailService.create(orgId);
    // await gmailService.sendReply({
    //   threadId: message.threadId,
    //   to: [message.from.email],
    //   subject: `Re: ${message.subject}`,
    //   bodyHtml: `<p>Thank you for your email. We've received it and will respond within 24 hours.</p>`,
    //   inReplyTo: message.id,
    // });
  } catch (error) {
    console.error('Error sending escalation auto-reply:', error);
  }
}

/**
 * Builds context map for email classification
 * Checks if senders are existing clients with active orders
 */
async function buildContextMap(
  orgId: string,
  messages: GmailMessage[]
): Promise<Map<string, { isExistingClient?: boolean; hasActiveOrders?: boolean }>> {
  const supabase = await createClient();
  const contextMap = new Map<
    string,
    { isExistingClient?: boolean; hasActiveOrders?: boolean }
  >();

  // Get the user's tenant_id for multi-tenant lookups
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  const tenantId = profile?.tenant_id;

  // Get all unique sender emails
  const senderEmails = Array.from(new Set(messages.map((m) => m.from.email)));

  // Check if each sender is an existing contact/client
  for (const email of senderEmails) {
    // Use tenant_id for multi-tenant lookup
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, client_id')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .single();

    if (!contact) {
      contextMap.set(email, { isExistingClient: false, hasActiveOrders: false });
      continue;
    }

    // Check if client has active orders
    let hasActiveOrders = false;
    if (contact.client_id) {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', contact.client_id)
        .in('status', ['pending', 'in_progress', 'scheduled'])
        .limit(100); // Limit to prevent unbounded query

      hasActiveOrders = (count || 0) > 0;
    }

    contextMap.set(email, {
      isExistingClient: !!contact.client_id,
      hasActiveOrders,
    });
  }

  return contextMap;
}

/**
 * Manually triggers a Gmail sync for an organization
 */
export async function manualGmailSync(orgId: string): Promise<PollResult> {
  return await pollGmailInbox(orgId);
}
