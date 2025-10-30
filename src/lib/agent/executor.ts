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

  // Check for email suppression
  const contactId = card.contact_id;
  if (contactId) {
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
        error: `Contact is suppressed due to: ${suppression.reason}`,
      };
    }
  }

  // Send email via Resend directly
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey || resendApiKey === 're_YOUR_API_KEY_HERE') {
      // Simulate send if no Resend key
      console.log('Email send (simulated):', { to: payload.to, subject: payload.subject });
      
      await supabase
        .from('activities')
        .insert({
          client_id: card.client_id,
          contact_id: card.contact_id,
          activity_type: 'email',
          subject: payload.subject,
          description: `Email sent (simulated) via agent: ${card.title}`,
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
          to: payload.to,
          simulated: true,
        },
      };
    }

    // Real Resend send
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Account Manager <onboarding@resend.dev>', // Use Resend's verified onboarding domain
        to: payload.to, // Must be a string for onboarding domain
        subject: payload.subject,
        html: payload.body,
        reply_to: payload.replyTo || 'manager@myroihome.com',
      }),
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
        subject: payload.subject,
        description: `Email sent via agent: ${card.title} (ID: ${messageId})`,
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
        to: payload.to,
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
        'research',
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


