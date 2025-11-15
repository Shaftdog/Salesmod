import { createClient } from '@/lib/supabase/server';

export interface KanbanCard {
  id: string;
  org_id: string;
  run_id?: string;
  client_id: string;
  contact_id?: string;
  type: string;
  title: string;
  description?: string;
  rationale: string;
  priority: string;
  state: string;
  action_payload: any;
  approved_by?: string;
  executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionResult {
  success: boolean;
  cardId: string;
  message: string;
  error?: string;
  metadata?: any;
}

/**
 * Execute an approved kanban card
 */
export async function executeCard(cardId: string): Promise<ExecutionResult> {
  const supabase = await createClient();

  // Fetch the card
  const { data: card, error: fetchError } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('id', cardId)
    .single();

  if (fetchError || !card) {
    return {
      success: false,
      cardId,
      message: 'Card not found',
      error: fetchError?.message || 'Card does not exist',
    };
  }

  // Check card is approved
  if (card.state !== 'approved') {
    return {
      success: false,
      cardId,
      message: 'Card is not approved',
      error: `Card state is '${card.state}', must be 'approved' to execute`,
    };
  }

  // Update to executing state
  await supabase
    .from('kanban_cards')
    .update({ state: 'executing' })
    .eq('id', cardId);

  try {
    let result: ExecutionResult;

    // Execute based on card type
    switch (card.type) {
      case 'send_email':
        result = await executeSendEmail(card);
        break;

      case 'create_task':
        result = await executeCreateTask(card);
        break;

      case 'follow_up':
        result = await executeFollowUp(card);
        break;

      case 'create_deal':
        result = await executeCreateDeal(card);
        break;

      case 'schedule_call':
        result = await executeScheduleCall(card);
        break;

      case 'research':
        result = await executeResearch(card);
        break;

      case 'reply_to_email':
        result = await executeReplyToEmail(card);
        break;

      case 'needs_human_response':
        result = await executeNeedsHumanResponse(card);
        break;

      default:
        result = {
          success: false,
          cardId,
          message: 'Unknown card type',
          error: `Card type '${card.type}' is not supported`,
        };
    }

    // Update card based on result
    if (result.success) {
      await supabase
        .from('kanban_cards')
        .update({
          state: 'done',
          executed_at: new Date().toISOString(),
        })
        .eq('id', cardId);
    } else {
      await supabase
        .from('kanban_cards')
        .update({
          state: 'blocked',
          description: `${card.description || ''}\n\n❌ Execution failed: ${result.error}`,
        })
        .eq('id', cardId);
    }

    return result;
  } catch (error: any) {
    // Mark as blocked on error
    await supabase
      .from('kanban_cards')
      .update({
        state: 'blocked',
        description: `${card.description || ''}\n\n❌ Execution error: ${error.message}`,
      })
      .eq('id', cardId);

    return {
      success: false,
      cardId,
      message: 'Execution failed with exception',
      error: error.message,
    };
  }
}

/**
 * Execute: Send Email
 */
async function executeSendEmail(card: KanbanCard): Promise<ExecutionResult> {
  const supabase = await createClient();
  const payload = card.action_payload;

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      cardId: card.id,
      message: 'User not authenticated',
      error: 'No authenticated user found',
    };
  }

  // Get recipient email from payload, contact, or client
  let recipientEmail = payload.to;
  const debugInfo: string[] = [];
  
  debugInfo.push(`payload.to: ${payload.to || 'missing'}`);
  
  // Fallback: Try to extract email from rationale or description if missing
  if (!recipientEmail) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const textToSearch = `${card.rationale || ''} ${card.description || ''}`;
    const emails = textToSearch.match(emailRegex);
    if (emails && emails.length > 0) {
      recipientEmail = emails[0]; // Use first email found
      debugInfo.push(`extracted from text: ${recipientEmail}`);
      console.log('[Email Execution] Extracted email from card text:', recipientEmail);
    }
  }
  
  if (!recipientEmail) {
    // Try to get email from contact if contact_id exists
    if (card.contact_id) {
      debugInfo.push(`contact_id: ${card.contact_id}`);
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('email')
        .eq('id', card.contact_id)
        .single();
      
      if (contactError) {
        debugInfo.push(`contact lookup error: ${contactError.message}`);
      } else {
        debugInfo.push(`contact.email: ${contact?.email || 'missing'}`);
      }
      
      if (contact?.email) {
        recipientEmail = contact.email;
      }
    } else {
      debugInfo.push('contact_id: not set');
    }
    
    // Fallback to client email if still no email
    if (!recipientEmail && card.client_id) {
      debugInfo.push(`client_id: ${card.client_id}`);
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('email')
        .eq('id', card.client_id)
        .single();
      
      if (clientError) {
        debugInfo.push(`client lookup error: ${clientError.message}`);
      } else {
        debugInfo.push(`client.email: ${client?.email || 'missing'}`);
      }
      
      if (client?.email) {
        recipientEmail = client.email;
      }
    } else if (!recipientEmail) {
      debugInfo.push(`client_id: ${card.client_id || 'not set'}`);
    }
  }

  // Validate we have an email address
  if (!recipientEmail) {
    console.error('[Email Execution] Missing recipient email:', {
      cardId: card.id,
      cardTitle: card.title,
      payload: JSON.stringify(payload),
      debugInfo,
    });
    
    return {
      success: false,
      cardId: card.id,
      message: 'No recipient email address',
      error: `Cannot send email: no email address found in payload, contact, or client record. Debug: ${debugInfo.join(', ')}`,
    };
  }

  // Validate we have email content (html or text)
  const emailHtml = payload.body || payload.html;
  const emailText = payload.text;
  const emailSubject = payload.subject || card.title || 'No Subject';

  if (!emailHtml && !emailText) {
    console.error('[Email Execution] Missing email content:', {
      cardId: card.id,
      cardTitle: card.title,
      hasBody: !!payload.body,
      hasHtml: !!payload.html,
      hasText: !!payload.text,
      payload: JSON.stringify(payload),
    });
    
    return {
      success: false,
      cardId: card.id,
      message: 'No email content',
      error: 'Cannot send email: missing both html and text content. Please ensure the email draft has a body.',
    };
  }
  
  console.log('[Email Execution] Recipient email resolved:', {
    cardId: card.id,
    recipientEmail,
    source: payload.to ? 'payload' : (card.contact_id ? 'contact' : 'client'),
  });

  // Check for email suppression and bounce tags
  const contactId = card.contact_id;
  if (contactId) {
    // Check for bounce tags
    const { data: contact } = await supabase
      .from('contacts')
      .select('tags, first_name, last_name')
      .eq('id', contactId)
      .single();

    if (contact?.tags) {
      const tags = contact.tags || [];
      if (tags.includes('email_bounced_hard')) {
        return {
          success: false,
          cardId: card.id,
          message: 'Email address bounced (hard bounce)',
          error: `Cannot send email to ${contact.first_name} ${contact.last_name}: email address has permanently bounced`,
        };
      }
      if (tags.includes('email_bounced_soft')) {
        return {
          success: false,
          cardId: card.id,
          message: 'Email address bounced (soft bounce)',
          error: `Cannot send email to ${contact.first_name} ${contact.last_name}: email address has bounced multiple times`,
        };
      }
    }

    // Check suppression list
    const { data: suppression } = await supabase
      .from('email_suppressions')
      .select('*')
      .eq('org_id', card.org_id)
      .eq('contact_id', contactId)
      .single();

    if (suppression) {
      return {
        success: false,
        cardId: card.id,
        message: 'Email suppressed',
        error: `Contact is suppressed due to: ${suppression.reason}${suppression.bounce_type ? ` (${suppression.bounce_type} bounce)` : ''}`,
      };
    }
  }

  // Send email via Resend directly
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey || resendApiKey === 're_YOUR_API_KEY_HERE') {
      // Simulate send if no Resend key
      console.log('Email send (simulated):', { to: recipientEmail, subject: payload.subject });
      
      await supabase
        .from('activities')
        .insert({
          client_id: card.client_id,
          contact_id: card.contact_id,
          activity_type: 'email',
          subject: emailSubject,
          description: `Email sent (simulated) to ${recipientEmail} via agent: ${card.title}`,
          status: 'completed',
          completed_at: new Date().toISOString(),
          outcome: 'sent',
          created_by: user.id,
        });

      return {
        success: true,
        cardId: card.id,
        message: 'Email sent successfully (simulated)',
        metadata: {
          messageId: `sim_${Date.now()}`,
          to: recipientEmail,
          simulated: true,
        },
      };
    }

    // Real Resend send
    const resendPayload: any = {
      from: 'Admin <Admin@roiappraise.com>', // Use verified Resend domain
      to: recipientEmail, // Must be a string for verified domain
      subject: emailSubject,
      reply_to: payload.replyTo || 'Admin@roiappraise.com',
    };

    // Add html and/or text content (at least one is required)
    if (emailHtml) {
      resendPayload.html = emailHtml;
    }
    if (emailText) {
      resendPayload.text = emailText;
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    const data = await resendResponse.json();
    const messageId = data.id || `resend_${Date.now()}`;

    // Log activity
    await supabase
      .from('activities')
      .insert({
        client_id: card.client_id,
        contact_id: card.contact_id,
        activity_type: 'email',
        subject: emailSubject,
        description: `Email sent to ${recipientEmail} via agent: ${card.title} (ID: ${messageId})`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: 'sent',
        created_by: user.id,
      });

    return {
      success: true,
      cardId: card.id,
      message: 'Email sent successfully via Resend',
      metadata: {
        messageId,
        to: recipientEmail,
        simulated: false,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      cardId: card.id,
      message: 'Email send failed',
      error: error.message,
    };
  }
}

/**
 * Execute: Create Task
 */
async function executeCreateTask(card: KanbanCard): Promise<ExecutionResult> {
  const supabase = await createClient();
  const payload = card.action_payload;

  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Map priority values from kanban card to tasks table
    // Kanban: low, medium, high → Tasks: low, normal, high, urgent
    const priorityMap: Record<string, string> = {
      'low': 'low',
      'medium': 'normal',
      'high': 'high',
    };
    const taskPriority = priorityMap[card.priority] || 'normal';

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: card.title,
        description: payload.description || card.description,
        client_id: card.client_id,
        contact_id: card.contact_id,
        priority: taskPriority,
        status: 'pending',
        due_date: payload.dueDate || null,
        assigned_to: user.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity for visibility in client timeline
    await supabase
      .from('activities')
      .insert({
        client_id: card.client_id,
        contact_id: card.contact_id,
        activity_type: 'task',
        subject: card.title,
        description: `Task created via AI agent: ${card.rationale}\n\nTask Details: ${payload.description || card.description || 'No details provided'}`,
        status: 'scheduled',
        created_by: user.id,
      });

    return {
      success: true,
      cardId: card.id,
      message: 'Task created successfully',
      metadata: { taskId: data.id },
    };
  } catch (error: any) {
    return {
      success: false,
      cardId: card.id,
      message: 'Task creation failed',
      error: error.message,
    };
  }
}

/**
 * Execute: Follow Up
 */
async function executeFollowUp(card: KanbanCard): Promise<ExecutionResult> {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      cardId: card.id,
      message: 'User not authenticated',
      error: 'No authenticated user found',
    };
  }

  // Create an activity record for the follow-up
  try {
    await supabase
      .from('activities')
      .insert({
        client_id: card.client_id,
        contact_id: card.contact_id,
        activity_type: 'note',
        subject: card.title,
        description: card.description || card.rationale,
        status: 'completed',
        completed_at: new Date().toISOString(),
        created_by: user.id,
      });

    return {
      success: true,
      cardId: card.id,
      message: 'Follow-up logged',
    };
  } catch (error: any) {
    return {
      success: false,
      cardId: card.id,
      message: 'Follow-up logging failed',
      error: error.message,
    };
  }
}

/**
 * Execute: Create Deal
 */
async function executeCreateDeal(card: KanbanCard): Promise<ExecutionResult> {
  const supabase = await createClient();
  const payload = card.action_payload;

  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('deals')
      .insert({
        client_id: card.client_id,
        contact_id: card.contact_id,
        title: payload.title || card.title,
        description: payload.description || card.description,
        value: payload.value || null,
        probability: 50, // Default 50% probability
        stage: payload.stage || 'lead',
        assigned_to: user.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity for visibility in client timeline
    await supabase
      .from('activities')
      .insert({
        client_id: card.client_id,
        contact_id: card.contact_id,
        activity_type: 'note',
        subject: `Deal Created: ${data.title}`,
        description: `AI agent created new deal opportunity: ${card.rationale}\n\nDeal Stage: ${data.stage}\nEstimated Value: ${data.value ? `$${data.value}` : 'Not specified'}\n\n${data.description || ''}`,
        status: 'completed',
        completed_at: new Date().toISOString(),
        created_by: user.id,
      });

    return {
      success: true,
      cardId: card.id,
      message: 'Deal created successfully',
      metadata: { dealId: data.id },
    };
  } catch (error: any) {
    return {
      success: false,
      cardId: card.id,
      message: 'Deal creation failed',
      error: error.message,
    };
  }
}

/**
 * Execute: Schedule Call
 * NOTE: This creates a TASK for the user to complete (agent can't make actual calls)
 */
async function executeScheduleCall(card: KanbanCard): Promise<ExecutionResult> {
  const supabase = await createClient();
  const payload = card.action_payload;

  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create a task for the user to actually make the call
    const dueDate = payload.scheduledAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: card.title,
        description: `${card.rationale}\n\nCall Purpose: ${card.description || 'Strategic discussion'}\nDuration: ${payload.durationMinutes || 30} minutes`,
        client_id: card.client_id,
        contact_id: card.contact_id,
        priority: card.priority === 'high' ? 'high' : card.priority === 'low' ? 'low' : 'normal',
        status: 'pending',
        due_date: dueDate,
        assigned_to: user.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Also create an activity record for the timeline
    await supabase
      .from('activities')
      .insert({
        client_id: card.client_id,
        contact_id: card.contact_id,
        activity_type: 'task',
        subject: `Task Created: ${card.title}`,
        description: `AI agent created call task: ${card.rationale}\n\nThis is a task for you to complete - the agent cannot make calls automatically.`,
        status: 'scheduled',
        created_by: user.id,
      });

    return {
      success: true,
      cardId: card.id,
      message: 'Call task created successfully',
      metadata: { taskId: task.id, dueDate },
    };
  } catch (error: any) {
    return {
      success: false,
      cardId: card.id,
      message: 'Call task creation failed',
      error: error.message,
    };
  }
}

/**
 * Execute: Research
 */
async function executeResearch(card: KanbanCard): Promise<ExecutionResult> {
  const supabase = await createClient();

  try {
    // Get authenticated user for created_by field
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Dynamic imports to avoid errors if modules don't exist
    const { gatherClientIntel, formatClientIntel } = await import('../research/internal-search');
    const { searchWeb } = await import('../research/web-search');
    const { summarizeResearch, extractKeyInsights } = await import('../research/summarizer');
    const { indexContent } = await import('../agent/rag');

    console.log(`[Research] Starting research for client ${card.client_id}`);

    // Step 1: Gather internal data
    const intel = await gatherClientIntel(card.client_id);
    console.log(`[Research] Gathered internal data: ${intel.metrics.totalOrders} orders, ${intel.metrics.totalRevenue} revenue`);

    // Step 2: Web search (if API key configured)
    let webResults: any[] = [];
    const hasSearchAPI = process.env.TAVILY_API_KEY || process.env.BRAVE_SEARCH_API_KEY;
    
    if (hasSearchAPI && intel.client) {
      try {
        const query = `${intel.client.company_name} company information business`;
        webResults = await searchWeb(query, 5);
        console.log(`[Research] Found ${webResults.length} web results`);
      } catch (error) {
        console.error('[Research] Web search failed, continuing with internal data only:', error);
      }
    } else {
      console.log('[Research] No search API key, using internal data only');
    }

    // Step 3: AI summarization
    const summary = await summarizeResearch(intel, webResults);
    console.log(`[Research] Generated summary (${summary.length} chars)`);

    // Step 4: Save to activities
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert({
        client_id: card.client_id,
        activity_type: 'note',
        subject: `Research Complete: ${intel.client.company_name}`,
        description: summary,
        status: 'completed',
        completed_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single();
    
    if (activityError) {
      console.error('[Research] Failed to save activity:', activityError);
      throw new Error(`Failed to save research to activities: ${activityError.message}`);
    }
    
    console.log('[Research] Saved to activities:', activity.id);

    // Step 5: Index to RAG for future reference
    try {
      await indexContent(
        card.org_id,
        'note', // Changed from 'research' to match DB constraint
        card.id,
        `Research: ${intel.client.company_name}`,
        summary,
        {
          client_id: card.client_id,
          client_name: intel.client.company_name,
          research_date: new Date().toISOString(),
          sources: webResults.length > 0 ? ['internal', 'web'] : ['internal'],
          web_results_count: webResults.length,
          metrics: intel.metrics,
        }
      );
      console.log('[Research] Indexed to RAG');
    } catch (error) {
      console.error('[Research] RAG indexing failed:', error);
    }

    // Step 6: Save key insights to agent_memories
    try {
      const insights = extractKeyInsights(summary);
      
      await supabase.from('agent_memories').insert({
        org_id: card.org_id,
        scope: 'client_context',
        key: `research_${card.client_id}_${Date.now()}`,
        content: {
          client_id: card.client_id,
          client_name: intel.client.company_name,
          ...insights,
          metrics: intel.metrics,
        },
        importance: 0.8,
        expires_at: null, // Never expires
      });
      console.log('[Research] Saved insights to agent_memories');
    } catch (error) {
      console.error('[Research] Memory save failed:', error);
    }

    return {
      success: true,
      cardId: card.id,
      message: 'Research completed and indexed',
      metadata: {
        summary: summary.substring(0, 200) + '...',
        sources: webResults.length > 0 ? 'internal + web' : 'internal only',
        web_results: webResults.length,
      },
    };
  } catch (error: any) {
    console.error('[Research] Research execution failed:', error);
    return {
      success: false,
      cardId: card.id,
      message: 'Research task failed',
      error: error.message,
    };
  }
}

/**
 * Bulk execute multiple approved cards
 */
export async function executeApprovedCards(runId: string, limit: number = 10): Promise<ExecutionResult[]> {
  const supabase = await createClient();

  // Fetch approved cards for this run
  const { data: cards, error } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('run_id', runId)
    .eq('state', 'approved')
    .order('priority', { ascending: false }) // High priority first
    .limit(limit);

  if (error || !cards || cards.length === 0) {
    return [];
  }

  // Execute each card sequentially
  const results: ExecutionResult[] = [];
  for (const card of cards) {
    const result = await executeCard(card.id);
    results.push(result);

    // Small delay between actions to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Execute: Reply to Email
 * Generates an AI response and sends it via Gmail API
 */
async function executeReplyToEmail(card: KanbanCard): Promise<ExecutionResult> {
  const supabase = await createClient();
  const payload = card.action_payload;

  try {
    // Import Gmail service and response generator
    const { GmailService } = await import('@/lib/gmail/gmail-service');
    const { generateEmailResponse } = await import('@/lib/agent/email-response-generator');

    // Get Gmail message from database
    const { data: gmailMessage, error: msgError } = await supabase
      .from('gmail_messages')
      .select('*')
      .eq('gmail_message_id', payload.emailId)
      .single();

    if (msgError || !gmailMessage) {
      return {
        success: false,
        cardId: card.id,
        message: 'Gmail message not found',
        error: msgError?.message || 'Message does not exist',
      };
    }

    // Reconstruct Gmail message object
    const email = {
      id: gmailMessage.gmail_message_id,
      threadId: gmailMessage.gmail_thread_id,
      from: {
        email: gmailMessage.from_email,
        name: gmailMessage.from_name,
      },
      to: gmailMessage.to_email,
      cc: gmailMessage.cc_email,
      subject: gmailMessage.subject,
      bodyText: gmailMessage.body_text,
      bodyHtml: gmailMessage.body_html,
      snippet: gmailMessage.snippet,
      receivedAt: new Date(gmailMessage.received_at),
      labels: gmailMessage.labels || [],
      hasAttachments: gmailMessage.has_attachments,
      attachments: gmailMessage.attachments || [],
    };

    // Generate response using AI
    const response = await generateEmailResponse(
      card.org_id,
      email,
      payload.classification
    );

    // Create Gmail service
    const gmailService = await GmailService.create(card.org_id);

    // Send reply via Gmail API
    const sentMessageId = await gmailService.sendReply({
      threadId: email.threadId,
      to: [email.from.email],
      subject: response.subject,
      bodyHtml: response.bodyHtml,
      inReplyTo: email.id,
    });

    // Log activity
    await supabase.from('activities').insert({
      org_id: card.org_id,
      client_id: card.client_id,
      contact_id: card.contact_id,
      type: 'email_sent',
      subject: `Replied to: ${email.subject}`,
      body: response.bodyText,
      metadata: {
        cardId: card.id,
        gmailMessageId: sentMessageId,
        threadId: email.threadId,
        category: payload.category,
        autoSent: response.shouldAutoSend,
      },
    });

    return {
      success: true,
      cardId: card.id,
      message: `Email reply sent to ${email.from.email}`,
      metadata: {
        sentMessageId,
        recipient: email.from.email,
        subject: response.subject,
      },
    };
  } catch (error: any) {
    console.error('Error executing reply_to_email:', error);
    return {
      success: false,
      cardId: card.id,
      message: 'Failed to send email reply',
      error: error.message,
    };
  }
}

/**
 * Execute: Needs Human Response
 * This card type is for human-only tasks - logs that it needs attention
 */
async function executeNeedsHumanResponse(card: KanbanCard): Promise<ExecutionResult> {
  const supabase = await createClient();

  // This card type should not auto-execute
  // It's meant to stay in "in_review" state until a human handles it

  // Log activity to notify
  await supabase.from('activities').insert({
    org_id: card.org_id,
    client_id: card.client_id,
    contact_id: card.contact_id,
    type: 'note',
    subject: `Email requires human response: ${card.title}`,
    body: card.description || '',
    metadata: {
      cardId: card.id,
      emailCategory: card.action_payload?.category,
      urgent: card.priority === 'high',
    },
  });

  return {
    success: false,
    cardId: card.id,
    message: 'This card requires human response and cannot auto-execute',
    error: 'Human intervention required',
  };
}


