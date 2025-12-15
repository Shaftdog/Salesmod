/**
 * Production Agent Orchestrator
 *
 * Manages production workflow automation:
 * - Task assignment based on workload/availability
 * - Due date management
 * - Alert creation for overdue tasks
 * - Resource load balancing
 */

import { createClient } from '@/lib/supabase/server';
import {
  ProductionStage,
  PRODUCTION_STAGES,
  isTaskOverdue,
} from '@/types/production';
import { addDays, addHours, format, differenceInHours } from 'date-fns';

export interface ProductionAgentResult {
  run_id: string;
  tasks_assigned: number;
  alerts_created: number;
  cards_processed: number;
  errors: string[];
}

interface ResourceWorkload {
  user_id: string;
  name: string | null;
  email: string;
  pending_tasks: number;
  in_progress_tasks: number;
  total_estimated_minutes: number;
}

/**
 * Run a complete production agent cycle
 */
export async function runProductionAgentCycle(
  orgId: string,
  triggerType: string = 'manual'
): Promise<ProductionAgentResult> {
  const supabase = await createClient();
  const errors: string[] = [];
  let tasksAssigned = 0;
  let alertsCreated = 0;
  let cardsProcessed = 0;

  // Create agent run record
  const { data: runRecord, error: runError } = await supabase
    .from('production_agent_runs')
    .insert({
      org_id: orgId,
      trigger_type: triggerType,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (runError) {
    throw new Error(`Failed to create agent run record: ${runError.message}`);
  }

  const runId = runRecord.id;

  try {
    // Step 1: Get all active production cards
    const { data: activeCards, error: cardsError } = await supabase
      .from('production_cards')
      .select(`
        *,
        order:orders(id, file_number, due_date),
        template:production_templates(id, name)
      `)
      .eq('org_id', orgId)
      .is('completed_at', null)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (cardsError) {
      errors.push(`Failed to fetch cards: ${cardsError.message}`);
    }

    // Step 2: Get all unassigned tasks
    const { data: unassignedTasks, error: tasksError } = await supabase
      .from('production_tasks')
      .select(`
        *,
        production_card:production_cards(id, order_id, due_date, priority)
      `)
      .eq('org_id', orgId)
      .is('assigned_to', null)
      .neq('status', 'completed')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (tasksError) {
      errors.push(`Failed to fetch unassigned tasks: ${tasksError.message}`);
    }

    // Step 3: Get resource workloads
    const workloads = await getResourceWorkloads(supabase, orgId);

    // Step 4: Auto-assign unassigned tasks
    if (unassignedTasks && unassignedTasks.length > 0) {
      for (const task of unassignedTasks) {
        try {
          const assignedTo = findBestResource(task, workloads);
          if (assignedTo) {
            const { error: assignError } = await supabase
              .from('production_tasks')
              .update({ assigned_to: assignedTo })
              .eq('id', task.id);

            if (!assignError) {
              tasksAssigned++;
              // Update workload tracking
              const resource = workloads.find(w => w.user_id === assignedTo);
              if (resource) {
                resource.pending_tasks++;
                resource.total_estimated_minutes += task.estimated_minutes || 30;
              }
            } else {
              errors.push(`Failed to assign task ${task.id}: ${assignError.message}`);
            }
          }
        } catch (err: any) {
          errors.push(`Error assigning task ${task.id}: ${err.message}`);
        }
      }
    }

    // Step 5: Check for overdue tasks and create alerts
    const { data: allTasks, error: allTasksError } = await supabase
      .from('production_tasks')
      .select('*')
      .eq('org_id', orgId)
      .neq('status', 'completed')
      .not('due_date', 'is', null);

    if (!allTasksError && allTasks) {
      const now = new Date();
      for (const task of allTasks) {
        if (task.due_date && new Date(task.due_date) < now) {
          // Check if alert already exists
          const { data: existingAlert } = await supabase
            .from('production_alerts')
            .select('id')
            .eq('task_id', task.id)
            .eq('type', 'overdue')
            .eq('resolved', false)
            .single();

          if (!existingAlert) {
            const { error: alertError } = await supabase
              .from('production_alerts')
              .insert({
                org_id: orgId,
                card_id: task.production_card_id,
                task_id: task.id,
                type: 'overdue',
                severity: 'high',
                message: `Task "${task.title}" is overdue`,
                resolved: false,
              });

            if (!alertError) {
              alertsCreated++;
            } else {
              errors.push(`Failed to create overdue alert: ${alertError.message}`);
            }
          }
        }
      }
    }

    // Step 6: Check for cards approaching due date
    if (activeCards) {
      for (const card of activeCards) {
        cardsProcessed++;
        if (card.due_date) {
          const hoursUntilDue = differenceInHours(new Date(card.due_date), new Date());

          // Create warning alert if due in less than 24 hours
          if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
            const { data: existingAlert } = await supabase
              .from('production_alerts')
              .select('id')
              .eq('card_id', card.id)
              .eq('type', 'deadline_warning')
              .eq('resolved', false)
              .single();

            if (!existingAlert) {
              const { error: alertError } = await supabase
                .from('production_alerts')
                .insert({
                  org_id: orgId,
                  card_id: card.id,
                  type: 'deadline_warning',
                  severity: 'medium',
                  message: `Card for ${card.order?.file_number || 'Unknown'} due in ${hoursUntilDue} hours`,
                  resolved: false,
                });

              if (!alertError) {
                alertsCreated++;
              }
            }
          }
        }
      }
    }

    // Update run record with success
    await supabase
      .from('production_agent_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        tasks_processed: tasksAssigned,
        alerts_created: alertsCreated,
        errors: errors.length > 0 ? errors : null,
      })
      .eq('id', runId);

  } catch (error: any) {
    // Update run record with failure
    await supabase
      .from('production_agent_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: [error.message, ...errors],
      })
      .eq('id', runId);

    throw error;
  }

  return {
    run_id: runId,
    tasks_assigned: tasksAssigned,
    alerts_created: alertsCreated,
    cards_processed: cardsProcessed,
    errors,
  };
}

/**
 * Get workload for each resource/user
 */
async function getResourceWorkloads(
  supabase: any,
  orgId: string
): Promise<ResourceWorkload[]> {
  // Get all resources
  const { data: resources, error: resourcesError } = await supabase
    .from('production_resources')
    .select(`
      user_id,
      user:profiles!production_resources_user_id_fkey(id, name, email)
    `)
    .eq('org_id', orgId)
    .eq('is_active', true);

  if (resourcesError || !resources) {
    return [];
  }

  // Get task counts for each resource
  const workloads: ResourceWorkload[] = [];

  for (const resource of resources) {
    const { data: pendingTasks } = await supabase
      .from('production_tasks')
      .select('id, estimated_minutes, status')
      .eq('assigned_to', resource.user_id)
      .neq('status', 'completed');

    const pending = pendingTasks?.filter((t: any) => t.status === 'pending') || [];
    const inProgress = pendingTasks?.filter((t: any) => t.status === 'in_progress') || [];
    const totalMinutes = pendingTasks?.reduce(
      (sum: number, t: any) => sum + (t.estimated_minutes || 30),
      0
    ) || 0;

    workloads.push({
      user_id: resource.user_id,
      name: resource.user?.name || null,
      email: resource.user?.email || '',
      pending_tasks: pending.length,
      in_progress_tasks: inProgress.length,
      total_estimated_minutes: totalMinutes,
    });
  }

  return workloads;
}

/**
 * Find the best resource to assign a task to
 * Based on: role match, workload, availability
 */
function findBestResource(
  task: any,
  workloads: ResourceWorkload[]
): string | null {
  if (workloads.length === 0) {
    return null;
  }

  // Sort by workload (least busy first)
  const sortedResources = [...workloads].sort((a, b) => {
    // First by in-progress tasks
    if (a.in_progress_tasks !== b.in_progress_tasks) {
      return a.in_progress_tasks - b.in_progress_tasks;
    }
    // Then by total estimated time
    return a.total_estimated_minutes - b.total_estimated_minutes;
  });

  // Return the least busy resource
  return sortedResources[0]?.user_id || null;
}

/**
 * Calculate task due dates based on template and card due date
 */
export async function calculateTaskDueDates(
  cardId: string,
  cardDueDate: Date
): Promise<void> {
  const supabase = await createClient();

  // Get all tasks for the card ordered by stage
  const { data: tasks, error } = await supabase
    .from('production_tasks')
    .select('id, stage, estimated_minutes')
    .eq('production_card_id', cardId)
    .order('stage')
    .order('sort_order');

  if (error || !tasks) {
    return;
  }

  // Calculate due dates working backwards from card due date
  let currentDue = cardDueDate;
  const stageGroups = groupTasksByStage(tasks);

  // Work through stages in reverse order
  const reversedStages = [...PRODUCTION_STAGES].reverse();

  for (const stage of reversedStages) {
    const stageTasks = stageGroups[stage] || [];
    if (stageTasks.length === 0) continue;

    // Set due date for all tasks in this stage
    const taskIds = stageTasks.map((t: any) => t.id);
    await supabase
      .from('production_tasks')
      .update({ due_date: currentDue.toISOString() })
      .in('id', taskIds);

    // Calculate time for this stage
    const stageMinutes = stageTasks.reduce(
      (sum: number, t: any) => sum + (t.estimated_minutes || 30),
      0
    );
    // Move due date back by stage duration (minimum 2 hours per stage)
    const hoursForStage = Math.max(2, Math.ceil(stageMinutes / 60));
    currentDue = addHours(currentDue, -hoursForStage);
  }
}

function groupTasksByStage(tasks: any[]): Record<string, any[]> {
  return tasks.reduce((acc, task) => {
    if (!acc[task.stage]) acc[task.stage] = [];
    acc[task.stage].push(task);
    return acc;
  }, {} as Record<string, any[]>);
}

/**
 * Trigger event-based agent run
 * Called when specific events occur (card move, task completion, etc.)
 */
export async function triggerProductionAgentEvent(
  orgId: string,
  eventType: 'card_moved' | 'task_completed' | 'task_blocked' | 'deadline_approaching'
): Promise<ProductionAgentResult | null> {
  // Only run for certain high-priority events
  if (eventType === 'task_blocked' || eventType === 'deadline_approaching') {
    return runProductionAgentCycle(orgId, `event:${eventType}`);
  }
  // For other events, we could queue them for batch processing
  return null;
}
