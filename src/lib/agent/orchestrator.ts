import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { buildContext } from './context-builder';
import { generatePlan, validatePlan, ProposedAction } from './planner';
import { executeCard, ExecutionResult } from './executor';
import { planNextBatch, expandTaskToCards } from './job-planner';
import { promoteScheduledCards } from './scheduler';
import { Job, JobTask } from '@/types/jobs';

/**
 * Format email body with proper HTML
 * Converts plain text or poorly formatted text into proper HTML
 */
function formatEmailBody(body: string): string {
  if (!body) return body;

  // If already has substantial HTML tags, return as-is
  if (body.includes('<p>') && body.includes('</p>')) {
    return body;
  }

  // Step 1: Detect and format bullet/numbered lists with various patterns
  // Pattern 1: "1. Item" or "• Item" style
  const hasNumberedList = /\d+\.\s+[A-Z]/.test(body);
  const hasBulletList = /[•\-\*]\s+[A-Z]/.test(body);

  // Pattern 2: "First bullet point", "Second bullet point" style
  const hasWordedList = /(First|Second|Third|Fourth|Fifth)[\s\w]*:/gi.test(body);

  let formatted = body;

  // Convert "First bullet point:", "Second bullet point:" to proper list
  if (hasWordedList) {
    // Split on sentence patterns that indicate list items
    const listPattern = /((?:First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:[\s\S]*?)(?=(?:First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:|$)/gi;
    const listItems = body.match(listPattern);

    if (listItems && listItems.length > 1) {
      // Find intro text before the list
      const introMatch = body.match(/^([\s\S]*?)(?=First|Second|Third|Fourth|Fifth)/i);
      let result = '';

      if (introMatch && introMatch[1].trim()) {
        result += `<p>${introMatch[1].trim()}</p>`;
      }

      result += '<ol>';
      listItems.forEach(item => {
        const cleanItem = item.replace(/^(First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:\s*/i, '').trim();
        if (cleanItem) {
          result += `<li>${cleanItem}</li>`;
        }
      });
      result += '</ol>';

      // Find closing text after the list
      const lastItem = listItems[listItems.length - 1];
      const closingMatch = body.split(lastItem)[1];
      if (closingMatch && closingMatch.trim()) {
        result += `<p>${closingMatch.trim()}</p>`;
      }

      return result;
    }
  }

  // Convert numbered lists (1. 2. 3. etc.)
  if (hasNumberedList) {
    const lines = body.split(/\.\s+(?=\d+\.|\w)/);
    let result = '';
    let inList = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^\d+\./.test(trimmed)) {
        if (!inList) {
          result += '<ol>';
          inList = true;
        }
        const item = trimmed.replace(/^\d+\.\s*/, '');
        result += `<li>${item}</li>`;
      } else if (trimmed) {
        if (inList) {
          result += '</ol>';
          inList = false;
        }
        result += `<p>${trimmed}</p>`;
      }
    });

    if (inList) result += '</ol>';
    return result;
  }

  // Convert bullet lists (• or - or *)
  if (hasBulletList) {
    const lines = body.split(/\n/);
    let result = '';
    let inList = false;
    let currentParagraph = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^[•\-\*]\s+/.test(trimmed)) {
        if (currentParagraph) {
          result += `<p>${currentParagraph.trim()}</p>`;
          currentParagraph = '';
        }
        if (!inList) {
          result += '<ul>';
          inList = true;
        }
        const item = trimmed.replace(/^[•\-\*]\s+/, '');
        result += `<li>${item}</li>`;
      } else if (trimmed) {
        if (inList) {
          result += '</ul>';
          inList = false;
        }
        currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
      }
    });

    if (currentParagraph) {
      result += `<p>${currentParagraph.trim()}</p>`;
    }
    if (inList) result += '</ul>';
    return result;
  }

  // No lists detected - format as paragraphs
  // Split by double line breaks first
  const paragraphs = body.split(/\n\n+/);
  if (paragraphs.length > 1) {
    return paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p.replace(/\n/g, ' ')}</p>`)
      .join('');
  }

  // Split by single line breaks and group as sentences
  const sentences = body.split(/\.\s+/);
  if (sentences.length > 3) {
    // Group every 2-3 sentences into a paragraph
    let result = '<p>';
    sentences.forEach((sentence, idx) => {
      result += sentence.trim();
      if (!sentence.trim().endsWith('.')) result += '.';

      // Start new paragraph every 2-3 sentences
      if ((idx + 1) % 2 === 0 && idx < sentences.length - 1) {
        result += '</p><p>';
      } else if (idx < sentences.length - 1) {
        result += ' ';
      }
    });
    result += '</p>';
    return result;
  }

  // Single paragraph - just wrap it
  return `<p>${body}</p>`;
}

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

  // SECURITY: Get user's tenant_id first
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  const tenantId = profile?.tenant_id;

  if (!tenantId) {
    throw new Error(`User ${orgId} has no tenant_id assigned`);
  }

  // Check for idempotency: only one running work block per tenant
  const { data: existingRun } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'running')
    .single();

  if (existingRun) {
    console.log(`Work block already running for tenant ${tenantId}`);
    return existingRun as AgentRun;
  }

  // Create agent run record
  const { data: run, error: runError } = await supabase
    .from('agent_runs')
    .insert({
      org_id: orgId,
      tenant_id: tenantId,
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
    // Step 0: Promote scheduled cards that are now due
    console.log(`[${run.id}] Promoting scheduled cards...`);
    const promotedCount = await promoteScheduledCards(tenantId);
    if (promotedCount > 0) {
      console.log(`[${run.id}] Promoted ${promotedCount} scheduled cards to suggested`);
    }

    // Step 1: Execute approved cards first
    console.log(`[${run.id}] Checking for approved cards to execute...`);
    const approvedResults = await executeApprovedCards(orgId);
    executedCount = approvedResults.filter(r => r.success).length;
    console.log(`[${run.id}] Executed ${executedCount} of ${approvedResults.length} approved cards`);

    // Step 2: Process active jobs (generate next batch of tasks/cards)
    console.log(`[${run.id}] Processing active jobs...`);
    const jobCardsCreated = await processActiveJobs(orgId, run.id);
    console.log(`[${run.id}] Created ${jobCardsCreated} cards from jobs`);

    // Step 3: Build context
    console.log(`[${run.id}] Building context for org ${orgId}...`);
    const context = await buildContext(orgId);

    // Calculate average goal pressure
    const avgGoalPressure = context.goals.length > 0
      ? context.goals.reduce((sum, g) => sum + g.pressureScore, 0) / context.goals.length
      : 0;

    // Step 4: Generate plan
    console.log(`[${run.id}] Generating plan...`);
    const plan = await generatePlan(context);

    // Step 5: Validate plan
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

    // Step 6: Create kanban cards
    console.log(`[${run.id}] Creating ${plan.actions.length} kanban cards...`);
    const cards = await createKanbanCards(orgId, tenantId, run.id, plan.actions);

    // Step 7: Update run with results
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

    // Step 8: Create reflection (async, don't wait)
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
  tenantId: string,
  runId: string,
  actions: ProposedAction[]
): Promise<any[]> {
  const supabase = await createClient();
  const cards = [];

  // Fetch existing pending cards to prevent duplicates
  const { data: existingPendingCards } = await supabase
    .from('kanban_cards')
    .select('client_id, contact_id, type')
    .eq('tenant_id', tenantId)
    .in('state', ['suggested', 'in_review', 'approved']);

  // Create a Set of existing card keys for O(1) lookup
  const existingCardKeys = new Set(
    (existingPendingCards || []).map((card: any) =>
      `${card.client_id || ''}-${card.contact_id || ''}-${card.type}`
    )
  );

  console.log(`[createKanbanCards] Found ${existingPendingCards?.length || 0} existing pending cards`);

  for (const action of actions) {
    // Build action payload based on type
    let actionPayload: any = {};

    if (action.emailDraft) {
      // Validate email draft has required fields
      if (!action.emailDraft.to || !action.emailDraft.to.includes('@')) {
        console.error('ERROR: emailDraft missing or invalid to field!', {
          title: action.title,
          emailDraft: action.emailDraft,
        });
        // Skip this card - don't create invalid email cards
        continue;
      }

      actionPayload = {
        to: action.emailDraft.to,
        subject: action.emailDraft.subject,
        body: formatEmailBody(action.emailDraft.body),
        replyTo: action.emailDraft.replyTo,
      };
      console.log('Creating card with emailDraft:', {
        title: action.title,
        to: action.emailDraft.to,
        hasTo: !!action.emailDraft.to,
        hasSubject: !!action.emailDraft.subject,
        hasBody: !!action.emailDraft.body,
        subjectLength: action.emailDraft.subject?.length || 0,
        bodyLength: action.emailDraft.body?.length || 0,
      });
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

    // Check for duplicate before creating
    const cardKey = `${action.clientId || ''}-${contactId || ''}-${action.type}`;
    if (existingCardKeys.has(cardKey)) {
      console.log(`[createKanbanCards] Skipping duplicate card: "${action.title}" (client: ${action.clientId}, contact: ${contactId}, type: ${action.type})`);
      continue;
    }

    // Add to existing keys to prevent duplicates within this batch
    existingCardKeys.add(cardKey);

    const { data: card, error } = await supabase
      .from('kanban_cards')
      .insert({
        org_id: orgId,
        tenant_id: tenantId,
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

  // Get user's tenant_id for multi-tenant isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  if (!profile?.tenant_id) {
    console.error('[Execute] User has no tenant_id assigned');
    return [];
  }

  // Get all approved cards for this tenant
  const { data: approvedCards, error } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
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

  // Get user's tenant_id for multi-tenant isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  if (!profile?.tenant_id) {
    return null;
  }

  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
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

  // Get user's tenant_id for multi-tenant isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  if (!profile?.tenant_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
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

/**
 * Process active jobs: generate next batch of tasks and expand to cards
 */
async function processActiveJobs(orgId: string, runId: string): Promise<number> {
  const supabase = createServiceRoleClient();
  let totalCardsCreated = 0;

  // SECURITY: Get user's tenant_id for proper tenant scoping
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', orgId)
    .single();

  const tenantId = profile?.tenant_id;

  if (!tenantId) {
    const errorMsg = `User ${orgId} has no tenant_id assigned - cannot process jobs securely`;
    console.error(`[Jobs] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Get all running jobs for this tenant
  const { data: activeJobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'running')
    .order('created_at', { ascending: true });

  if (jobsError || !activeJobs || activeJobs.length === 0) {
    console.log('[Jobs] No active jobs to process');
    return 0;
  }

  console.log(`[Jobs] Processing ${activeJobs.length} active jobs`);

  for (const job of activeJobs as Job[]) {
    try {
      console.log(`[Jobs] Processing job: ${job.name} (${job.id})`);

      // Update job to track this run
      await supabase
        .from('agent_runs')
        .update({ job_id: job.id })
        .eq('id', runId);

      // Get current batch number (max batch for this job)
      const { data: latestTask } = await supabase
        .from('job_tasks')
        .select('batch')
        .eq('job_id', job.id)
        .order('batch', { ascending: false })
        .limit(1)
        .single();

      const currentBatch = latestTask?.batch || 0;

      // Get pending tasks in current batch
      const { data: pendingTasksData } = await supabase
        .from('job_tasks')
        .select('*')
        .eq('job_id', job.id)
        .eq('batch', currentBatch)
        .in('status', ['pending', 'running']);

      // Process pending tasks in current batch
      if (pendingTasksData && pendingTasksData.length > 0) {
        console.log(`[Jobs] Job ${job.name} has ${pendingTasksData.length} pending tasks in batch ${currentBatch}, processing them...`);

        // Expand each pending task to cards
        for (const task of (pendingTasksData as JobTask[])) {
          try {
            // Handle send_email tasks separately (they don't create cards)
            if (task.kind === 'send_email') {
              console.log(`[Jobs] Marking send_email task ${task.id} as done (no cards to create)`);

              // Mark task as done immediately since send_email tasks don't create cards
              await supabase
                .from('job_tasks')
                .update({
                  status: 'done',
                  output: {
                    cards_created: 0,
                    note: 'send_email tasks execute existing cards, no new cards created',
                  },
                  finished_at: new Date().toISOString(),
                })
                .eq('id', task.id);

              continue;
            }

            console.log(`[Jobs] Expanding task ${task.id} (${task.kind})...`);
            const { cards } = await expandTaskToCards(task, job);
            console.log(`[Jobs] Task ${task.id} expanded to ${cards.length} cards`);

            if (cards.length === 0) {
              console.error(`[Jobs] Task ${task.id} (${task.kind}) expanded to 0 cards - marking as error`);

              // Mark task as error instead of leaving it pending
              await supabase
                .from('job_tasks')
                .update({
                  status: 'error',
                  error_message: 'Expansion returned 0 cards - check target filter and contact query',
                  finished_at: new Date().toISOString(),
                })
                .eq('id', task.id);

              continue;
            }

            // Insert cards with job_id, task_id, and tenant_id for multi-tenant isolation
            const { data: insertedCards, error: cardsError } = await supabase
              .from('kanban_cards')
              .insert(cards.map(card => ({ ...card, org_id: orgId, tenant_id: tenantId, run_id: runId })))
              .select('id');

            if (cardsError) {
              console.error(`[Jobs] Failed to create cards for task ${task.id}:`, cardsError);

              // Mark task as error
              await supabase
                .from('job_tasks')
                .update({
                  status: 'error',
                  error_message: cardsError.message,
                  finished_at: new Date().toISOString(),
                })
                .eq('id', task.id);
            } else {
              totalCardsCreated += cards.length;

              // Mark task as done
              await supabase
                .from('job_tasks')
                .update({
                  status: 'done',
                  output: {
                    cards_created: cards.length,
                    card_ids: (insertedCards || []).map((c: any) => c.id),
                  },
                  finished_at: new Date().toISOString(),
                })
                .eq('id', task.id);
            }
          } catch (taskError: any) {
            console.error(`[Jobs] Error expanding task ${task.id}:`, taskError);

            // Mark task as error
            await supabase
              .from('job_tasks')
              .update({
                status: 'error',
                error_message: taskError.message,
                finished_at: new Date().toISOString(),
              })
              .eq('id', task.id);
          }
        }

        // Update job's last_run_at
        await supabase
          .from('jobs')
          .update({ last_run_at: new Date().toISOString() })
          .eq('id', job.id);

        continue; // Move to next job after processing pending tasks
      }

      // Current batch is complete - plan next batch
      const { tasks: newTasks, batch_number } = await planNextBatch(job, currentBatch);

      if (newTasks.length === 0) {
        // No more work to do - mark job as succeeded
        console.log(`[Jobs] Job ${job.name} has no more work, marking as succeeded`);
        await supabase
          .from('jobs')
          .update({
            status: 'succeeded',
            finished_at: new Date().toISOString(),
          })
          .eq('id', job.id);
        continue;
      }

      console.log(`[Jobs] Generated ${newTasks.length} tasks for batch ${batch_number}`);

      // Insert new tasks
      const { data: createdTasks, error: tasksError } = await supabase
        .from('job_tasks')
        .insert(newTasks)
        .select();

      if (tasksError) {
        console.error(`[Jobs] Failed to create tasks for job ${job.name}:`, tasksError);
        continue;
      }

      // Expand each task to cards
      for (const task of (createdTasks as JobTask[])) {
        try {
          // Handle send_email tasks separately (they don't create cards)
          if (task.kind === 'send_email') {
            console.log(`[Jobs] Marking send_email task ${task.id} as done (no cards to create)`);

            // Mark task as done immediately since send_email tasks don't create cards
            await supabase
              .from('job_tasks')
              .update({
                status: 'done',
                output: {
                  cards_created: 0,
                  note: 'send_email tasks execute existing cards, no new cards created',
                },
                finished_at: new Date().toISOString(),
              })
              .eq('id', task.id);

            continue;
          }

          console.log(`[Jobs] Expanding task ${task.id} (${task.kind})...`);
          const { cards } = await expandTaskToCards(task, job);
          console.log(`[Jobs] Task ${task.id} expanded to ${cards.length} cards`);

          if (cards.length === 0) {
            console.error(`[Jobs] Task ${task.id} (${task.kind}) expanded to 0 cards - marking as error`);

            // Mark task as error instead of leaving it pending
            await supabase
              .from('job_tasks')
              .update({
                status: 'error',
                error_message: 'Expansion returned 0 cards - check target filter and contact query',
                finished_at: new Date().toISOString(),
              })
              .eq('id', task.id);

            continue;
          }

          console.log(`[Jobs] Expanding task ${task.id} to ${cards.length} cards`);

          // Insert cards with job_id, task_id, and tenant_id for multi-tenant isolation
          const { data: insertedCards, error: cardsError } = await supabase
            .from('kanban_cards')
            .insert(cards.map(card => ({ ...card, org_id: orgId, tenant_id: tenantId, run_id: runId })))
            .select('id');

          if (cardsError) {
            console.error(`[Jobs] Failed to create cards for task ${task.id}:`, cardsError);

            // Mark task as error
            await supabase
              .from('job_tasks')
              .update({
                status: 'error',
                error_message: cardsError.message,
                finished_at: new Date().toISOString(),
              })
              .eq('id', task.id);
          } else {
            totalCardsCreated += cards.length;

            // Mark task as done
            await supabase
              .from('job_tasks')
              .update({
                status: 'done',
                output: {
                  cards_created: cards.length,
                  card_ids: (insertedCards || []).map((c: any) => c.id),
                },
                finished_at: new Date().toISOString(),
              })
              .eq('id', task.id);
          }
        } catch (taskError: any) {
          console.error(`[Jobs] Error expanding task ${task.id}:`, taskError);

          // Mark task as error
          await supabase
            .from('job_tasks')
            .update({
              status: 'error',
              error_message: taskError.message,
              finished_at: new Date().toISOString(),
            })
            .eq('id', task.id);
        }
      }

      // Update job's last_run_at
      await supabase
        .from('jobs')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', job.id);

    } catch (jobError: any) {
      console.error(`[Jobs] Error processing job ${job.id}:`, jobError);

      // Mark job as failed
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }
  }

  console.log(`[Jobs] Created ${totalCardsCreated} cards from active jobs`);
  return totalCardsCreated;
}


