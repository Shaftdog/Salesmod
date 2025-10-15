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
          created_by: card.org_id,
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
        to: [payload.to],
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
        created_by: card.org_id,
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
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: card.title,
        description: payload.description || card.description,
        client_id: card.client_id,
        contact_id: card.contact_id,
        priority: card.priority === 'high' ? 'urgent' : card.priority,
        status: 'pending',
        due_date: payload.dueDate || null,
        assigned_to: card.org_id,
        created_by: card.org_id,
      })
      .select()
      .single();

    if (error) throw error;

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
        created_by: card.org_id,
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
        assigned_to: card.org_id,
        created_by: card.org_id,
      })
      .select()
      .single();

    if (error) throw error;

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
 */
async function executeScheduleCall(card: KanbanCard): Promise<ExecutionResult> {
  const supabase = await createClient();
  const payload = card.action_payload;

  try {
    // Create a scheduled activity
    const scheduledAt = payload.scheduledAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // Default 2 days from now

    await supabase
      .from('activities')
      .insert({
        client_id: card.client_id,
        contact_id: card.contact_id,
        activity_type: 'call',
        subject: card.title,
        description: card.description || 'Scheduled by AI agent',
        status: 'scheduled',
        scheduled_at: scheduledAt,
        duration_minutes: payload.durationMinutes || 30,
        assigned_to: card.org_id,
        created_by: card.org_id,
      });

    return {
      success: true,
      cardId: card.id,
      message: 'Call scheduled successfully',
      metadata: { scheduledAt },
    };
  } catch (error: any) {
    return {
      success: false,
      cardId: card.id,
      message: 'Call scheduling failed',
      error: error.message,
    };
  }
}

/**
 * Execute: Research
 */
async function executeResearch(card: KanbanCard): Promise<ExecutionResult> {
  // For now, research is just marked as done
  // In the future, this could trigger web search, data gathering, etc.

  const supabase = await createClient();

  try {
    // Log as an internal note
    await supabase
      .from('activities')
      .insert({
        client_id: card.client_id,
        activity_type: 'note',
        subject: `Research: ${card.title}`,
        description: card.description || card.rationale,
        status: 'completed',
        completed_at: new Date().toISOString(),
        created_by: card.org_id,
      });

    return {
      success: true,
      cardId: card.id,
      message: 'Research task completed',
    };
  } catch (error: any) {
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


