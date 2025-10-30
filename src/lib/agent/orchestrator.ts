import { createClient } from '@/lib/supabase/server';
import { buildContext } from './context-builder';
import { generatePlan, validatePlan, ProposedAction } from './planner';
import { executeCard, ExecutionResult } from './executor';

export interface AgentRun {
  id: string;
  org_id: string;
  started_at: string;
  ended_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  mode: 'auto' | 'review';
  goal_pressure?: number;
  planned_actions: number;
  approved: number;
  sent: number;
  errors: any[];
}

/**
 * Main orchestrator: Run a complete work block
 */
export async function runWorkBlock(orgId: string, mode: 'auto' | 'review' = 'review'): Promise<AgentRun> {
  const supabase = await createClient();
  const startTime = new Date().toISOString();

  // Check for idempotency: only one running work block per org
  const { data: existingRun } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'running')
    .single();

  if (existingRun) {
    console.log(`Work block already running for org ${orgId}`);
    return existingRun as AgentRun;
  }

  // Create agent run record
  const { data: run, error: runError } = await supabase
    .from('agent_runs')
    .insert({
      org_id: orgId,
      started_at: startTime,
      status: 'running',
      mode,
    })
    .select()
    .single();

  if (runError || !run) {
    throw new Error(`Failed to create agent run: ${runError?.message}`);
  }

  const errors: any[] = [];
  let executedCount = 0;

  try {
    // Step 0: Execute approved cards first
    console.log(`[${run.id}] Checking for approved cards to execute...`);
    const approvedResults = await executeApprovedCards(orgId);
    executedCount = approvedResults.filter(r => r.success).length;
    console.log(`[${run.id}] Executed ${executedCount} of ${approvedResults.length} approved cards`);

    // Step 1: Build context
    console.log(`[${run.id}] Building context for org ${orgId}...`);
    const context = await buildContext(orgId);

    // Calculate average goal pressure
    const avgGoalPressure = context.goals.length > 0
      ? context.goals.reduce((sum, g) => sum + g.pressureScore, 0) / context.goals.length
      : 0;

    // Step 2: Generate plan
    console.log(`[${run.id}] Generating plan...`);
    const plan = await generatePlan(context);

    // Step 3: Validate plan
    console.log(`[${run.id}] Validating plan...`);
    const validation = validatePlan(plan, context);

    if (!validation.valid) {
      errors.push({
        step: 'validation',
        errors: validation.errors,
      });
      console.error(`[${run.id}] Plan validation failed:`, validation.errors);
    }

    if (validation.warnings.length > 0) {
      console.warn(`[${run.id}] Plan warnings:`, validation.warnings);
    }

    // Step 4: Create kanban cards
    console.log(`[${run.id}] Creating ${plan.actions.length} kanban cards...`);
    const cards = await createKanbanCards(orgId, run.id, plan.actions);

    // Step 5: Update run with results
    const emailsSent = approvedResults.filter(r => r.success && r.metadata?.simulated === false).length;
    
    await supabase
      .from('agent_runs')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        goal_pressure: avgGoalPressure,
        planned_actions: cards.length,
        approved: 0, // New cards start as suggested, not approved
        sent: emailsSent,
        errors: errors.length > 0 ? errors : [],
      })
      .eq('id', run.id);

    // Step 6: Create reflection (async, don't wait)
    createReflection(run.id, context, plan, validation).catch(err => {
      console.error(`[${run.id}] Failed to create reflection:`, err);
    });

    console.log(`[${run.id}] Work block completed. Executed ${executedCount} approved cards, created ${cards.length} new cards.`);

    return {
      ...run,
      status: 'completed',
      ended_at: new Date().toISOString(),
      goal_pressure: avgGoalPressure,
      planned_actions: cards.length,
      approved: 0,
      sent: emailsSent,
      errors,
    } as AgentRun;
  } catch (error: any) {
    console.error(`[${run.id}] Work block failed:`, error);

    // Mark run as failed
    await supabase
      .from('agent_runs')
      .update({
        status: 'failed',
        ended_at: new Date().toISOString(),
        errors: [...errors, { step: 'execution', error: error.message }],
      })
      .eq('id', run.id);

    throw error;
  }
}

/**
 * Create kanban cards from proposed actions
 */
async function createKanbanCards(
  orgId: string,
  runId: string,
  actions: ProposedAction[]
): Promise<any[]> {
  const supabase = await createClient();
  const cards = [];

  for (const action of actions) {
    // Build action payload based on type
    let actionPayload: any = {};

    if (action.emailDraft) {
      actionPayload = {
        to: action.emailDraft.to,
        subject: action.emailDraft.subject,
        body: action.emailDraft.body,
        replyTo: action.emailDraft.replyTo,
      };
      console.log('Creating card with emailDraft:', {
        title: action.title,
        hasTo: !!action.emailDraft.to,
        to: action.emailDraft.to,
        hasSubject: !!action.emailDraft.subject,
        hasBody: !!action.emailDraft.body,
        subjectLength: action.emailDraft.subject?.length || 0,
        bodyLength: action.emailDraft.body?.length || 0,
      });

      // Warn if email is missing critical fields
      if (!action.emailDraft.to) {
        console.error('WARNING: Email card created without "to" field!', {
          title: action.title,
          clientId: action.clientId,
          contactId: action.contactId,
        });
      }
    } else if (action.taskDetails) {
      actionPayload = {
        description: action.taskDetails.description,
        dueDate: action.taskDetails.dueDate,
      };
    } else if (action.dealDetails) {
      actionPayload = {
        title: action.dealDetails.title,
        value: action.dealDetails.value,
        stage: action.dealDetails.stage,
        description: action.dealDetails.description,
      };
    } else if (action.type === 'send_email') {
      console.error('ERROR: send_email action missing emailDraft!', {
        title: action.title,
        type: action.type,
        rationale: action.rationale,
      });
    }

    // Validate contactId is a UUID (not an email address)
    const isValidUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };
    
    const contactId = action.contactId && isValidUUID(action.contactId) ? action.contactId : null;

    const { data: card, error } = await supabase
      .from('kanban_cards')
      .insert({
        org_id: orgId,
        run_id: runId,
        client_id: action.clientId,
        contact_id: contactId,
        type: action.type,
        title: action.title,
        rationale: action.rationale,
        priority: action.priority,
        state: 'suggested', // Start in suggested state
        action_payload: actionPayload,
        created_by: null, // Agent-created
      })
      .select()
      .single();

    if (error) {
      console.error(`Failed to create card: ${error.message}`);
    } else if (card) {
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Execute all approved cards
 */
async function executeApprovedCards(orgId: string): Promise<ExecutionResult[]> {
  const supabase = await createClient();

  // Get all approved cards
  const { data: approvedCards, error } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('org_id', orgId)
    .eq('state', 'approved')
    .order('priority', { ascending: false }); // High priority first

  if (error) {
    console.error('[Execute] Failed to fetch approved cards:', error);
    return [];
  }

  if (!approvedCards || approvedCards.length === 0) {
    console.log('[Execute] No approved cards to execute');
    return [];
  }

  console.log(`[Execute] Found ${approvedCards.length} approved cards to execute`);

  const results: ExecutionResult[] = [];

  // Execute each card sequentially
  for (const card of approvedCards) {
    try {
      console.log(`[Execute] Executing card: ${card.title} (${card.type})`);
      const result = await executeCard(card.id);
      results.push(result);
      
      if (result.success) {
        console.log(`[Execute] ✓ ${card.title}: Success`);
      } else {
        console.error(`[Execute] ✗ ${card.title}: ${result.error}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`[Execute] Card ${card.id} threw error:`, error);
      results.push({
        success: false,
        cardId: card.id,
        message: 'Execution error',
        error: error.message,
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`[Execute] Completed: ${successCount}/${results.length} successful`);

  return results;
}

/**
 * Create a reflection after a run
 */
async function createReflection(
  runId: string,
  context: any,
  plan: any,
  validation: any
): Promise<void> {
  const supabase = await createClient();

  const summary = `
Generated ${plan.actions.length} action proposals.
Goal alignment: ${plan.goalAlignment}
Validation: ${validation.valid ? 'Passed' : 'Failed'} (${validation.errors.length} errors, ${validation.warnings.length} warnings)
`;

  const metrics = {
    actions_proposed: plan.actions.length,
    validation_errors: validation.errors.length,
    validation_warnings: validation.warnings.length,
    top_clients_analyzed: context.clients.slice(0, 10).map((c: any) => ({
      id: c.client.id,
      name: c.client.companyName,
      priority_score: c.priorityScore,
    })),
    signals: context.signals,
  };

  const hypotheses = validation.warnings.length > 0
    ? `Noted warnings: ${validation.warnings.join('; ')}`
    : 'Plan executed cleanly without warnings';

  await supabase
    .from('agent_reflections')
    .insert({
      run_id: runId,
      summary,
      metrics,
      hypotheses,
      next_adjustments: {},
    });
}

/**
 * Get the latest run for an org
 */
export async function getLatestRun(orgId: string): Promise<AgentRun | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AgentRun;
}

/**
 * Get run history for an org
 */
export async function getRunHistory(orgId: string, limit: number = 20): Promise<AgentRun[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as AgentRun[];
}

/**
 * Cancel a running work block
 */
export async function cancelRun(runId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('agent_runs')
    .update({
      status: 'cancelled',
      ended_at: new Date().toISOString(),
    })
    .eq('id', runId)
    .eq('status', 'running');
}


