import { createClient } from '@/lib/supabase/server';

export interface KanbanCard {
  id: string;
  org_id: string;
  tenant_id: string;
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
 * Uses atomic state transition to prevent duplicate execution
 */
export async function executeCard(cardId: string): Promise<ExecutionResult> {
  const supabase = await createClient();

  // Atomically transition from 'approved' to 'executing'
  // This prevents race conditions: only one caller can successfully transition
  const { data: transitioned, error: transitionError } = await supabase
    .from('kanban_cards')
    .update({
      state: 'executing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .eq('state', 'approved') // Only update if STILL approved (idempotency check)
    .select('*')
    .single();

  // If no row was updated, either card doesn't exist, or it's not in 'approved' state
  if (transitionError || !transitioned) {
    // Fetch current state to provide better error message
    const { data: currentCard } = await supabase
      .from('kanban_cards')
      .select('id, state')
      .eq('id', cardId)
      .single();

    if (!currentCard) {
      return {
        success: false,
        cardId,
        message: 'Card not found',
        error: 'Card does not exist',
      };
    }

    // Card exists but wasn't in 'approved' state
    return {
      success: false,
      cardId,
      message: 'Card is not approved or already executing',
      error: `Card state is '${currentCard.state}', must be 'approved' to execute. This may indicate concurrent execution was prevented.`,
    };
  }

  // We successfully transitioned the card - we own it now
  const card = transitioned;

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

  // Use card's tenant_id (already validated by API route)
  const tenantId = card.tenant_id;
  if (!tenantId) {
    throw new Error('Card has no tenant_id assigned');
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
      .eq('tenant_id', card.tenant_id)
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
          tenant_id: tenantId,
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
        tenant_id: tenantId,
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

    // Use card's tenant_id (already validated by API route) with profile fallback
    const tenantId = card.tenant_id;
    if (!tenantId) {
      throw new Error('Card has no tenant_id assigned');
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
        tenant_id: tenantId, // Required for multi-tenant RLS
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
        tenant_id: tenantId,
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

  // Use card's tenant_id (already validated by API route)
  const tenantId = card.tenant_id;
  if (!tenantId) {
    throw new Error('Card has no tenant_id assigned');
  }

  // Create an activity record for the follow-up
  try {
    await supabase
      .from('activities')
      .insert({
        tenant_id: tenantId,
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

    // Use card's tenant_id (already validated by API route)
    const tenantId = card.tenant_id;
    if (!tenantId) {
      throw new Error('Card has no tenant_id assigned - cannot create deal');
    }

    // Get client_id from card or payload
    const clientId = card.client_id || payload?.clientId;
    if (!clientId) {
      return {
        success: false,
        cardId: card.id,
        message: 'Cannot create deal without a client',
        error: 'No client_id associated with this card. Please link a client first.',
      };
    }

    const { data, error } = await supabase
      .from('deals')
      .insert({
        tenant_id: tenantId, // Required for multi-tenant RLS
        client_id: clientId,
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
        tenant_id: tenantId, // Required for multi-tenant RLS
        client_id: clientId,
        contact_id: card.contact_id,
        deal_id: data.id, // Link activity to the deal
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

    // Use card's tenant_id (already validated by API route)
    const tenantId = card.tenant_id;
    if (!tenantId) {
      throw new Error('Card has no tenant_id assigned');
    }

    // Create a task for the user to actually make the call
    const dueDate = payload.scheduledAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        tenant_id: tenantId, // Required for multi-tenant RLS
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
        tenant_id: tenantId,
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

    // Use card's tenant_id (already validated by API route)
    const tenantId = card.tenant_id;
    if (!tenantId) {
      throw new Error('Card has no tenant_id assigned');
    }

    // Dynamic imports to avoid errors if modules don't exist
    const { gatherClientIntel } = await import('../research/internal-search');
    const { searchWeb } = await import('../research/web-search');
    const { summarizeResearch, extractKeyInsights } = await import('../research/summarizer');
    const { indexContent } = await import('../agent/rag');
    const {
      buildContactSearchQueries,
      extractContactsFromResults,
      validateContacts,
      checkExistingContact
    } = await import('../research/contact-extractor');
    const {
      enrichContactWithApollo,
      getBestEmail,
      getBestPhone
    } = await import('../research/apollo-enrichment');

    console.log(`[Research] Starting research for client ${card.client_id}`);

    // Step 1: Gather internal data
    const intel = await gatherClientIntel(card.client_id);
    console.log(`[Research] Gathered internal data: ${intel.metrics.totalOrders} orders, ${intel.metrics.totalRevenue} revenue`);

    // Step 2: Web search for company info AND contacts (if API key configured)
    let webResults: any[] = [];
    let contactResults: any[] = [];
    let contactsCreated = 0;
    const hasSearchAPI = process.env.TAVILY_API_KEY || process.env.BRAVE_SEARCH_API_KEY;

    if (hasSearchAPI && intel.client) {
      try {
        // Search for company info
        const companyQuery = `${intel.client.company_name} company information business`;
        webResults = await searchWeb(companyQuery, 5);
        console.log(`[Research] Found ${webResults.length} web results for company`);

        // Search specifically for contacts
        const contactQueries = buildContactSearchQueries(intel.client.company_name);
        for (const query of contactQueries.slice(0, 2)) { // Limit to 2 contact searches
          const results = await searchWeb(query, 5);
          contactResults.push(...results);
        }
        console.log(`[Research] Found ${contactResults.length} web results for contacts`);

        // Extract contacts using AI
        if (contactResults.length > 0) {
          const allResults = [...webResults, ...contactResults];
          const extraction = await extractContactsFromResults(intel.client.company_name, allResults);
          const validatedContacts = validateContacts(extraction.contacts);

          console.log(`[Research] Extracted ${validatedContacts.length} valid contacts from web search`);

          // Enrich contacts with Apollo.io to get verified emails/phones
          const hasApolloKey = !!process.env.APOLLO_API_KEY;

          for (const contact of validatedContacts) {
            try {
              let finalEmail = contact.email || null;
              let finalPhone = contact.phone || null;
              let finalTitle = contact.title || null;
              let enrichmentSource = 'web-search';

              // Try Apollo enrichment if we have the API key
              if (hasApolloKey && contact.first_name && contact.last_name) {
                const enrichResult = await enrichContactWithApollo({
                  first_name: contact.first_name,
                  last_name: contact.last_name,
                  organization_name: intel.client.company_name,
                  linkedin_url: contact.linkedin_url,
                });

                if (enrichResult.success && enrichResult.person) {
                  const apolloEmail = getBestEmail(enrichResult.person);
                  const apolloPhone = getBestPhone(enrichResult.person);

                  if (apolloEmail) {
                    finalEmail = apolloEmail;
                    enrichmentSource = 'apollo-verified';
                  }
                  if (apolloPhone) {
                    finalPhone = apolloPhone;
                    enrichmentSource = 'apollo-verified';
                  }
                  if (enrichResult.person.title) {
                    finalTitle = enrichResult.person.title;
                  }
                  // Note: linkedin_url available but contacts table doesn't have linkedin column

                  console.log(`[Research] Apollo enriched ${contact.first_name} ${contact.last_name}: email=${apolloEmail || 'none'}, phone=${apolloPhone || 'none'}`);
                }
              }

              // ONLY save contacts that have email OR phone - otherwise useless
              if (!finalEmail && !finalPhone) {
                console.log(`[Research] Skipping ${contact.first_name} ${contact.last_name} - no email or phone found`);
                continue;
              }

              // Check if contact already exists
              const exists = await checkExistingContact(
                supabase,
                tenantId,
                finalEmail || undefined,
                contact.first_name,
                contact.last_name
              );

              if (exists) {
                console.log(`[Research] Contact ${contact.first_name} ${contact.last_name} already exists, skipping`);
                continue;
              }

              // Create the contact with verified info
              const { data: newContact, error: contactError } = await supabase
                .from('contacts')
                .insert({
                  tenant_id: tenantId,
                  client_id: card.client_id,
                  first_name: contact.first_name,
                  last_name: contact.last_name,
                  email: finalEmail,
                  phone: finalPhone,
                  title: finalTitle,
                  department: contact.department || null,
                  notes: `Found via research on ${new Date().toISOString().split('T')[0]}. Source: ${enrichmentSource}. Original source: ${contact.source_url || 'web search'}.`,
                  tags: ['research-found', enrichmentSource === 'apollo-verified' ? 'apollo-verified' : `confidence-${contact.confidence}`],
                  is_primary: false,
                })
                .select('id, first_name, last_name, email, phone')
                .single();

              if (contactError) {
                console.error(`[Research] Failed to create contact ${contact.first_name} ${contact.last_name}:`, contactError);
              } else {
                console.log(`[Research] Created contact: ${newContact.first_name} ${newContact.last_name} (${newContact.email || 'no email'}, ${newContact.phone || 'no phone'})`);
                contactsCreated++;
              }
            } catch (contactErr) {
              console.error(`[Research] Error creating contact:`, contactErr);
            }
          }
        }
      } catch (error) {
        console.error('[Research] Web search failed, continuing with internal data only:', error);
      }
    } else {
      console.log('[Research] No search API key, using internal data only');
    }

    // Step 3: AI summarization
    let summary: string;
    try {
      summary = await summarizeResearch(intel, webResults);
      console.log(`[Research] Generated summary (${summary.length} chars)`);
    } catch (summaryError: any) {
      console.error('[Research] AI summarization failed:', summaryError);
      // Use a basic fallback summary
      summary = `# Research Summary: ${intel.client.company_name}

## Our Relationship
- Total Orders: ${intel.metrics.totalOrders}
- Total Revenue: $${intel.metrics.totalRevenue.toFixed(2)}
- Last Order: ${intel.metrics.lastOrderDate ? new Date(intel.metrics.lastOrderDate).toLocaleDateString() : 'Never'}
- Contacts Found: ${contactsCreated}

## Web Research
Found ${webResults.length} web results.

## Status
AI summarization unavailable. Error: ${summaryError.message}`;
    }

    // Step 4: Save to activities (include contact findings)
    const activityDescription = contactsCreated > 0
      ? `${summary}\n\n---\n**Contacts Found:** ${contactsCreated} new contact(s) added to this company.`
      : summary;

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert({
        tenant_id: tenantId,
        client_id: card.client_id,
        activity_type: 'research',
        subject: `Research Complete: ${intel.client.company_name}${contactsCreated > 0 ? ` (+${contactsCreated} contacts)` : ''}`,
        description: activityDescription,
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
      const orgId = user?.id;

      if (orgId) {
        await indexContent(
          orgId,
          'note',
          card.id,
          `Research: ${intel.client.company_name}`,
          summary,
          {
            client_id: card.client_id,
            client_name: intel.client.company_name,
            research_date: new Date().toISOString(),
            sources: webResults.length > 0 ? ['internal', 'web'] : ['internal'],
            web_results_count: webResults.length,
            contacts_found: contactsCreated,
            metrics: intel.metrics,
          }
        );
        console.log('[Research] Indexed to RAG');
      }
    } catch (error) {
      console.error('[Research] RAG indexing failed:', error);
    }

    // Step 6: Save key insights to agent_memories
    try {
      const insights = extractKeyInsights(summary);

      await supabase.from('agent_memories').insert({
        tenant_id: tenantId,
        org_id: user?.id,
        scope: 'client_context',
        key: `research_${card.client_id}_${Date.now()}`,
        content: {
          client_id: card.client_id,
          client_name: intel.client.company_name,
          ...insights,
          contacts_found: contactsCreated,
          metrics: intel.metrics,
        },
        importance: 0.8,
        expires_at: null,
      });
      console.log('[Research] Saved insights to agent_memories');
    } catch (error) {
      console.error('[Research] Memory save failed:', error);
    }

    // Step 7: Extract actionable tasks and create follow-up cards
    let actionsCreated = 0;
    try {
      const { extractActionsFromResearch, actionsToCardPayloads } = await import('../research/action-extractor');

      // Get existing contacts for this client
      const { data: clientContacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, title')
        .eq('client_id', card.client_id);

      const contactsForExtraction = (clientContacts || []).map(c => ({
        name: `${c.first_name} ${c.last_name}`,
        email: c.email || undefined,
        title: c.title || undefined,
      }));

      const contactsForCards = (clientContacts || []).map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email || undefined,
      }));

      // Extract actions from research summary
      const actions = await extractActionsFromResearch(summary, intel.client.company_name, contactsForExtraction);
      console.log(`[Research] Extracted ${actions.length} actionable tasks`);

      if (actions.length > 0) {
        // Convert to card payloads
        const cardPayloads = actionsToCardPayloads(actions, card.client_id, contactsForCards);

        // Create kanban cards for each action
        for (const payload of cardPayloads) {
          const { error: cardError } = await supabase
            .from('kanban_cards')
            .insert({
              tenant_id: tenantId,
              org_id: user?.id,
              client_id: payload.client_id,
              contact_id: payload.contact_id || null,
              type: payload.type,
              title: payload.title,
              description: payload.description,
              rationale: payload.rationale,
              priority: payload.priority,
              state: payload.state, // 'scheduled' for future, 'suggested' for immediate
              due_at: payload.due_at, // When scheduled cards become due
              action_payload: payload.action_payload || {},
              created_by: user?.id,
            });

          if (cardError) {
            console.error(`[Research] Failed to create action card: ${cardError.message}`);
          } else {
            actionsCreated++;
          }
        }
        console.log(`[Research] Created ${actionsCreated} follow-up action cards`);
      }
    } catch (actionError) {
      console.error('[Research] Action extraction failed:', actionError);
    }

    return {
      success: true,
      cardId: card.id,
      message: contactsCreated > 0 || actionsCreated > 0
        ? `Research completed. ${contactsCreated > 0 ? `Found ${contactsCreated} contact(s). ` : ''}${actionsCreated > 0 ? `Created ${actionsCreated} action card(s).` : ''}`
        : 'Research completed and indexed',
      metadata: {
        summary: summary.substring(0, 200) + '...',
        sources: webResults.length > 0 ? 'internal + web' : 'internal only',
        web_results: webResults.length,
        contacts_found: contactsCreated,
        actions_created: actionsCreated,
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
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use card's tenant_id (already validated by API route)
    const tenantId = card.tenant_id;
    if (!tenantId) {
      throw new Error('Card has no tenant_id assigned');
    }

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

    // Check if this is a reply to a campaign email
    let campaignContext = undefined;
    if (gmailMessage.is_reply_to_campaign && gmailMessage.job_id) {
      // Fetch campaign context
      const { data: job } = await supabase
        .from('jobs')
        .select('name, description')
        .eq('id', gmailMessage.job_id)
        .single();

      // Fetch original email content from the original card
      const { data: originalCard } = await supabase
        .from('kanban_cards')
        .select('action_payload')
        .eq('job_id', gmailMessage.job_id)
        .eq('gmail_thread_id', gmailMessage.gmail_thread_id)
        .eq('type', 'send_email')
        .eq('state', 'done')
        .order('executed_at', { ascending: false })
        .limit(1)
        .single();

      if (job && originalCard) {
        const originalPayload = originalCard.action_payload || {};
        campaignContext = {
          jobName: job.name,
          jobDescription: job.description,
          originalEmailSubject: originalPayload.subject || '',
          originalEmailBody: originalPayload.body || originalPayload.bodyText || '',
        };
      }
    }

    // Get user for org_id (needed by email-response-generator and GmailService)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const orgId = currentUser?.id;
    if (!orgId) {
      throw new Error('User not authenticated');
    }

    // Generate response using AI (with campaign context if available)
    const response = await generateEmailResponse(
      orgId,
      email,
      payload.classification,
      undefined, // business context (will be built automatically)
      campaignContext
    );

    // Create Gmail service
    const gmailService = await GmailService.create(orgId);

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
      tenant_id: tenantId,
      client_id: card.client_id,
      contact_id: card.contact_id,
      activity_type: 'email',
      subject: `Replied to: ${email.subject}`,
      description: response.bodyText,
      status: 'completed',
      completed_at: new Date().toISOString(),
      outcome: 'sent',
      created_by: user.id,
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

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Use card's tenant_id (already validated by API route)
  const tenantId = card.tenant_id;
  if (!tenantId) {
    throw new Error('Card has no tenant_id assigned');
  }

  // This card type should not auto-execute
  // It's meant to stay in "in_review" state until a human handles it

  // Log activity to notify
  await supabase.from('activities').insert({
    tenant_id: tenantId,
    client_id: card.client_id,
    contact_id: card.contact_id,
    activity_type: 'note',
    subject: `Email requires human response: ${card.title}`,
    description: card.description || '',
    status: 'pending',
    created_by: user.id,
  });

  return {
    success: false,
    cardId: card.id,
    message: 'This card requires human response and cannot auto-execute',
    error: 'Human intervention required',
  };
}


