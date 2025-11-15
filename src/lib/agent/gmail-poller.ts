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
    const supabase = await createClient();

    // Check if Gmail sync is enabled
    const { data: syncState } = await supabase
      .from('gmail_sync_state')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!syncState || !syncState.is_enabled) {
      result.errors.push('Gmail sync is not enabled');
      return result;
    }

    // Create Gmail service
    let gmailService: GmailService;
    try {
      gmailService = await GmailService.create(orgId);
    } catch (error) {
      result.errors.push('Failed to connect to Gmail: ' + (error as Error).message);
      return result;
    }

    // Fetch new messages since last sync
    const sinceDate = syncState.last_sync_at
      ? new Date(syncState.last_sync_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours if first sync

    const messages = await gmailService.fetchNewMessages(sinceDate);

    if (messages.length === 0) {
      result.success = true;
      return result;
    }

    console.log(`Found ${messages.length} new Gmail messages for org ${orgId}`);

    // Build context map for classification (check if senders are existing clients)
    const contextMap = await buildContextMap(orgId, messages);

    // Process each message
    for (const message of messages) {
      try {
        await processMessage(orgId, message, contextMap, syncState.auto_process);
        result.messagesProcessed++;
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        result.errors.push(`Message ${message.id}: ${(error as Error).message}`);
      }
    }

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
      .eq('org_id', orgId);

    if (updateError) {
      console.error('Failed to update sync state:', updateError);
    }

    // Count cards created
    const { count: cardsCreated } = await supabase
      .from('kanban_cards')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in(
        'gmail_message_id',
        messages.map((m) => m.id)
      );

    result.cardsCreated = cardsCreated || 0;

    // Count auto-executed cards
    const { count: autoExecuted } = await supabase
      .from('kanban_cards')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in(
        'gmail_message_id',
        messages.map((m) => m.id)
      )
      .eq('state', 'approved');

    result.autoExecutedCards = autoExecuted || 0;

    result.success = true;
    return result;
  } catch (error) {
    console.error('Error polling Gmail inbox:', error);
    result.errors.push('Polling error: ' + (error as Error).message);
    return result;
  }
}

/**
 * Processes a single Gmail message
 */
async function processMessage(
  orgId: string,
  message: GmailMessage,
  contextMap: Map<string, { isExistingClient?: boolean; hasActiveOrders?: boolean }>,
  autoProcess: boolean
): Promise<void> {
  const supabase = await createClient();

  // Check if message already processed
  const { data: existing } = await supabase
    .from('gmail_messages')
    .select('id')
    .eq('org_id', orgId)
    .eq('gmail_message_id', message.id)
    .single();

  if (existing) {
    console.log(`Message ${message.id} already processed, skipping`);
    return;
  }

  // 1. Store message in database
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
    console.error('Error storing Gmail message:', insertError);
    throw insertError;
  }

  // Skip processing if auto_process is disabled
  if (!autoProcess) {
    console.log(`Auto-process disabled, message ${message.id} stored but not processed`);
    return;
  }

  // 2. Check if this is a reply to a campaign email
  const campaignContext = await findCampaignContext(orgId, message);

  // 3. Classify message using AI (with campaign context)
  const context = contextMap.get(message.from.email);
  const classification = await classifyEmail(message, {
    ...context,
    isCampaignReply: campaignContext?.isCampaignReply || false,
    jobContext: campaignContext?.jobContext,
  });

  // 4. Update message with classification and campaign context
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

  // 4. Create card from email
  const cardResult = await createCardFromEmail(
    orgId,
    message,
    classification,
    gmailMessage.id
  );

  console.log(
    `Created ${cardResult.type} card (${cardResult.state}) for message ${message.id}`
  );

  // 5. Manage Gmail inbox (label, mark read, archive)
  await manageGmailInbox(orgId, message, classification, cardResult);

  // 6. If needs escalation, send auto-reply
  if (classification.category === 'ESCALATE' || classification.shouldEscalate) {
    await sendEscalationAutoReply(orgId, message);
  }
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
    // Look for cards with the same thread ID that sent emails
    // This indicates the thread was started by our agent
    const { data: originalCard } = await supabase
      .from('kanban_cards')
      .select('id, job_id, task_id, type, action_payload, gmail_thread_id')
      .eq('org_id', orgId)
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

    // Check if we should send auto-reply
    const { data: syncState } = await supabase
      .from('gmail_sync_state')
      .select('*')
      .eq('org_id', orgId)
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

  // Get all unique sender emails
  const senderEmails = Array.from(new Set(messages.map((m) => m.from.email)));

  // Check if each sender is an existing contact/client
  for (const email of senderEmails) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, client_id')
      .eq('org_id', orgId)
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
        .in('status', ['pending', 'in_progress', 'scheduled']);

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
