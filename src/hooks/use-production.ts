/**
 * React Query hooks for Production Kanban System
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './use-toast'
import type {
  ProductionTemplate,
  ProductionTemplateWithTasks,
  ProductionCard,
  ProductionCardWithOrder,
  ProductionCardWithTasks,
  ProductionTask,
  ProductionTaskWithRelations,
  ProductionTimeEntry,
  ProductionResource,
  ProductionResourceWithUser,
  ProductionAlert,
  ProductionStage,
  ProductionRole,
  CreateTemplateRequest,
  CreateProductionCardInput,
  UpdateTaskInput,
  CreateTimeEntryInput,
  ProductionResourceInput,
  KanbanBoardData,
} from '@/types/production'
import { PRODUCTION_STAGES, SLA_REFERENCE_POINTS } from '@/types/production'
import { z } from 'zod'

// Zod schema for SLA config input validation
const SLAConfigInputSchema = z.object({
  stage: z.enum(PRODUCTION_STAGES.filter(s => s !== 'ON_HOLD' && s !== 'CANCELLED') as unknown as [string, ...string[]]),
  sla_days: z.number().int().min(0).max(30),
  reference_point: z.enum(SLA_REFERENCE_POINTS as unknown as [string, ...string[]]),
})

// ============================================================================
// TEMPLATES
// ============================================================================

export function useProductionTemplates(filters?: { active_only?: boolean }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-templates', filters],
    queryFn: async () => {
      let query = supabase
        .from('production_templates')
        .select(`
          *,
          tasks:production_template_tasks(
            *,
            subtasks:production_template_subtasks(*)
          )
        `)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (filters?.active_only) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ProductionTemplateWithTasks[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useProductionTemplate(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-templates', id],
    queryFn: async () => {
      // Get template
      const { data: template, error: templateError } = await supabase
        .from('production_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (templateError) throw templateError

      // Get tasks with subtasks
      const { data: tasks, error: tasksError } = await supabase
        .from('production_template_tasks')
        .select('*')
        .eq('template_id', id)
        .order('stage')
        .order('sort_order')

      if (tasksError) throw tasksError

      // Get subtasks for all tasks
      const taskIds = tasks?.map(t => t.id) || []
      const { data: subtasks, error: subtasksError } = await supabase
        .from('production_template_subtasks')
        .select('*')
        .in('parent_task_id', taskIds.length > 0 ? taskIds : ['00000000-0000-0000-0000-000000000000'])
        .order('sort_order')

      if (subtasksError) throw subtasksError

      // Combine tasks with their subtasks
      const tasksWithSubtasks = (tasks || []).map(task => ({
        ...task,
        subtasks: (subtasks || []).filter(s => s.parent_task_id === task.id),
      }))

      return {
        ...template,
        tasks: tasksWithSubtasks,
      } as ProductionTemplateWithTasks
    },
    enabled: !!id,
  })
}

export function useCreateProductionTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateTemplateRequest) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's tenant_id for multi-tenant isolation
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.tenant_id) {
        throw new Error('User has no tenant_id assigned')
      }

      // Create template with tenant_id
      const { data: template, error: templateError } = await supabase
        .from('production_templates')
        .insert({
          org_id: user.id,
          tenant_id: profile.tenant_id,
          name: input.name,
          description: input.description,
          is_default: input.is_default,
          is_active: input.is_active,
          applicable_order_types: input.applicable_order_types,
          applicable_property_types: input.applicable_property_types,
          created_by: user.id,
        })
        .select()
        .single()

      if (templateError) throw templateError

      // Create tasks if provided
      if (input.tasks && input.tasks.length > 0) {
        for (const task of input.tasks) {
          const { data: createdTask, error: taskError } = await supabase
            .from('production_template_tasks')
            .insert({
              template_id: template.id,
              stage: task.stage,
              title: task.title,
              description: task.description,
              default_role: task.default_role,
              estimated_minutes: task.estimated_minutes,
              is_required: task.is_required,
              sort_order: task.sort_order,
            })
            .select()
            .single()

          if (taskError) throw taskError

          // Create subtasks if provided
          if (task.subtasks && task.subtasks.length > 0) {
            const subtasksToInsert = task.subtasks.map((subtask, index) => ({
              parent_task_id: createdTask.id,
              title: subtask.title,
              description: subtask.description,
              default_role: subtask.default_role,
              estimated_minutes: subtask.estimated_minutes,
              is_required: subtask.is_required,
              sort_order: subtask.sort_order ?? index,
            }))

            const { error: subtaskError } = await supabase
              .from('production_template_subtasks')
              .insert(subtasksToInsert)

            if (subtaskError) throw subtaskError
          }
        }
      }

      return template as ProductionTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-templates'] })
      toast({
        title: 'Template Created',
        description: 'Production template has been created.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create template.',
      })
    },
  })
}

export function useUpdateProductionTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, tasks, ...updates }: Partial<ProductionTemplate> & { id: string; tasks?: CreateTemplateRequest['tasks'] }) => {
      // Update template metadata
      const { data: template, error: templateError } = await supabase
        .from('production_templates')
        .update({
          name: updates.name,
          description: updates.description,
          is_active: updates.is_active,
          is_default: updates.is_default,
          applicable_order_types: updates.applicable_order_types,
          applicable_property_types: updates.applicable_property_types,
        })
        .eq('id', id)
        .select()
        .single()

      if (templateError) throw templateError

      // If tasks are provided, replace all existing tasks
      if (tasks !== undefined) {
        // Get existing tasks to find subtasks
        const { data: existingTasks } = await supabase
          .from('production_template_tasks')
          .select('id')
          .eq('template_id', id)

        // Delete existing subtasks first (due to foreign key constraint)
        if (existingTasks && existingTasks.length > 0) {
          const taskIds = existingTasks.map(t => t.id)
          await supabase
            .from('production_template_subtasks')
            .delete()
            .in('parent_task_id', taskIds)
        }

        // Delete existing tasks
        await supabase
          .from('production_template_tasks')
          .delete()
          .eq('template_id', id)

        // Create new tasks
        if (tasks.length > 0) {
          for (const task of tasks) {
            const { data: createdTask, error: taskError } = await supabase
              .from('production_template_tasks')
              .insert({
                template_id: id,
                stage: task.stage,
                title: task.title,
                description: task.description,
                default_role: task.default_role,
                estimated_minutes: task.estimated_minutes,
                is_required: task.is_required,
                sort_order: task.sort_order,
              })
              .select()
              .single()

            if (taskError) throw taskError

            // Create subtasks if provided
            if (task.subtasks && task.subtasks.length > 0) {
              const subtasksToInsert = task.subtasks.map((subtask, index) => ({
                parent_task_id: createdTask.id,
                title: subtask.title,
                description: subtask.description,
                default_role: subtask.default_role,
                estimated_minutes: subtask.estimated_minutes,
                is_required: subtask.is_required,
                sort_order: subtask.sort_order ?? index,
              }))

              const { error: subtaskError } = await supabase
                .from('production_template_subtasks')
                .insert(subtasksToInsert)

              if (subtaskError) throw subtaskError
            }
          }
        }
      }

      return template as ProductionTemplate
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-templates'] })
      queryClient.invalidateQueries({ queryKey: ['production-templates', data.id] })
      toast({
        title: 'Template Updated',
        description: 'Production template has been updated.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update template.',
      })
    },
  })
}

export function useDeleteProductionTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('production_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-templates'] })
      toast({
        title: 'Template Deleted',
        description: 'Production template has been deleted.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete template.',
      })
    },
  })
}

export function useDuplicateProductionTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's tenant_id for multi-tenant isolation
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.tenant_id) {
        throw new Error('User has no tenant_id assigned')
      }

      // Get the original template with tasks
      const { data: original, error: fetchError } = await supabase
        .from('production_templates')
        .select(`
          *,
          tasks:production_template_tasks(
            *,
            subtasks:production_template_subtasks(*)
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Create new template with tenant_id
      const { data: newTemplate, error: createError } = await supabase
        .from('production_templates')
        .insert({
          org_id: original.org_id,
          tenant_id: profile.tenant_id,
          name: `${original.name} (Copy)`,
          description: original.description,
          is_active: false, // Start as inactive
        })
        .select()
        .single()

      if (createError) throw createError

      // Copy tasks
      if (original.tasks && original.tasks.length > 0) {
        for (const task of original.tasks) {
          const { data: newTask, error: taskError } = await supabase
            .from('production_template_tasks')
            .insert({
              template_id: newTemplate.id,
              title: task.title,
              description: task.description,
              stage: task.stage,
              role: task.role,
              is_required: task.is_required,
              estimated_minutes: task.estimated_minutes,
              sort_order: task.sort_order,
            })
            .select()
            .single()

          if (taskError) throw taskError

          // Copy subtasks
          if (task.subtasks && task.subtasks.length > 0) {
            const { error: subtaskError } = await supabase
              .from('production_template_subtasks')
              .insert(
                task.subtasks.map((sub: any) => ({
                  template_task_id: newTask.id,
                  title: sub.title,
                  sort_order: sub.sort_order,
                }))
              )

            if (subtaskError) throw subtaskError
          }
        }
      }

      return newTemplate as ProductionTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-templates'] })
      toast({
        title: 'Template Duplicated',
        description: 'Production template has been duplicated.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to duplicate template.',
      })
    },
  })
}

// ============================================================================
// PRODUCTION CARDS
// ============================================================================

// Shared select for production cards with all role joins
const PRODUCTION_CARD_SELECT = `
  *,
  order:orders(
    id,
    order_number,
    status,
    property_address,
    property_city,
    property_state,
    property_zip,
    property_id,
    inspection_date,
    borrower_name,
    borrower_email,
    borrower_phone,
    property_contact_name,
    property_contact_phone,
    property_contact_email,
    access_instructions,
    special_instructions
  ),
  template:production_templates(id, name),
  assigned_appraiser:profiles!production_cards_assigned_appraiser_id_fkey(id, name, email),
  assigned_reviewer:profiles!production_cards_assigned_reviewer_id_fkey(id, name, email),
  assigned_admin:profiles!production_cards_assigned_admin_id_fkey(id, name, email),
  assigned_trainee:profiles!production_cards_assigned_trainee_id_fkey(id, name, email),
  assigned_researcher_level_1:profiles!production_cards_assigned_researcher_level_1_id_fkey(id, name, email),
  assigned_researcher_level_2:profiles!production_cards_assigned_researcher_level_2_id_fkey(id, name, email),
  assigned_researcher_level_3:profiles!production_cards_assigned_researcher_level_3_id_fkey(id, name, email),
  assigned_inspector:profiles!production_cards_assigned_inspector_id_fkey(id, name, email)
`

export function useProductionCards(filters?: { stage?: ProductionStage; appraiser_id?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-cards', filters],
    queryFn: async () => {
      let query = supabase
        .from('production_cards')
        .select(PRODUCTION_CARD_SELECT)
        .order('due_date', { ascending: true, nullsFirst: false })

      if (filters?.stage) {
        query = query.eq('current_stage', filters.stage)
      }
      if (filters?.appraiser_id) {
        query = query.eq('assigned_appraiser_id', filters.appraiser_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ProductionCardWithOrder[]
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}

export function useOrderProductionCard(orderId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-card-by-order', orderId],
    queryFn: async () => {
      if (!orderId) return null

      const { data, error } = await supabase
        .from('production_cards')
        .select(PRODUCTION_CARD_SELECT)
        .eq('order_id', orderId)
        .maybeSingle()

      if (error) throw error
      return data as ProductionCardWithOrder | null
    },
    enabled: !!orderId,
    staleTime: 1000 * 30,
  })
}

export function useProductionBoardData() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-board'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_cards')
        .select(PRODUCTION_CARD_SELECT)
        .is('completed_at', null) // Only active cards
        .order('due_date', { ascending: true, nullsFirst: false })

      if (error) {
        throw error
      }

      const cards = data as ProductionCardWithOrder[]

      // Build columns
      const columns = PRODUCTION_STAGES.map(stage => ({
        id: stage,
        title: stage.replace(/_/g, ' '),
        color: getStageColor(stage),
        cards: cards.filter(c => c.current_stage === stage),
        count: cards.filter(c => c.current_stage === stage).length,
      }))

      return {
        columns,
        total_cards: cards.length,
      } as KanbanBoardData
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

export function useProductionCard(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-cards', id],
    queryFn: async () => {
      // Get card with order and template
      const { data: card, error: cardError } = await supabase
        .from('production_cards')
        .select(PRODUCTION_CARD_SELECT)
        .eq('id', id)
        .single()

      if (cardError) throw cardError

      // Get tasks with their subtasks, assigned users, and time entries
      const { data: tasks, error: tasksError } = await supabase
        .from('production_tasks')
        .select(`
          *,
          assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
        `)
        .eq('production_card_id', id)
        .order('stage')
        .order('sort_order')

      if (tasksError) throw tasksError

      // Get time entries for all tasks
      const taskIds = tasks?.map(t => t.id) || []
      const { data: timeEntries, error: timeError } = await supabase
        .from('production_time_entries')
        .select('*')
        .in('task_id', taskIds.length > 0 ? taskIds : ['00000000-0000-0000-0000-000000000000'])
        .order('started_at', { ascending: false })

      if (timeError) throw timeError

      // Build task hierarchy with time entries
      const parentTasks = (tasks || []).filter(t => !t.parent_task_id)
      const tasksWithSubtasks = parentTasks.map(task => ({
        ...task,
        subtasks: (tasks || []).filter(t => t.parent_task_id === task.id),
        time_entries: (timeEntries || []).filter(te => te.task_id === task.id),
        active_timer: (timeEntries || []).find(te => te.task_id === task.id && !te.ended_at) || null,
      }))

      // Check if can move to next stage
      const currentStageTasks = tasksWithSubtasks.filter(t => t.stage === card.current_stage)
      const incompleteTasks = currentStageTasks.filter(t => t.is_required && t.status !== 'completed').length

      return {
        card: {
          ...card,
          tasks: tasksWithSubtasks,
        } as ProductionCardWithTasks,
        can_move_to_next_stage: incompleteTasks === 0,
        incomplete_tasks: incompleteTasks,
      }
    },
    enabled: !!id,
  })
}

export function useCreateProductionCard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateProductionCardInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's tenant_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      // Create the production card with all role assignments
      const { data: card, error: cardError } = await supabase
        .from('production_cards')
        .insert({
          org_id: user.id,
          tenant_id: profile?.tenant_id,
          order_id: input.order_id,
          template_id: input.template_id,
          due_date: input.due_date,
          priority: input.priority,
          // Role assignments
          assigned_appraiser_id: input.assigned_appraiser_id,
          assigned_reviewer_id: input.assigned_reviewer_id,
          assigned_admin_id: input.assigned_admin_id,
          assigned_trainee_id: input.assigned_trainee_id,
          assigned_researcher_level_1_id: input.assigned_researcher_level_1_id,
          assigned_researcher_level_2_id: input.assigned_researcher_level_2_id,
          assigned_researcher_level_3_id: input.assigned_researcher_level_3_id,
          assigned_inspector_id: input.assigned_inspector_id,
          current_stage: 'INTAKE',
          processed_stages: [],
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (cardError) throw cardError

      // Generate INTAKE stage tasks from template
      const { error: genError } = await supabase.rpc('generate_stage_tasks', {
        p_card_id: card.id,
        p_stage: 'INTAKE',
      })

      if (genError) {
        console.error('Error generating tasks:', genError)
        // Don't fail the whole operation if task generation fails
      }

      return card as ProductionCard
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Production Card Created',
        description: 'Order has been added to production board.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create production card.',
      })
    },
  })
}

export function useMoveProductionCard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ cardId, targetStage }: { cardId: string; targetStage: ProductionStage }) => {
      // Use the database function for safe stage transitions
      const { error } = await supabase.rpc('move_production_card', {
        p_card_id: cardId,
        p_target_stage: targetStage,
      })

      if (error) throw error

      // Generate tasks for new stage if not already processed
      const { error: genError } = await supabase.rpc('generate_stage_tasks', {
        p_card_id: cardId,
        p_stage: targetStage,
      })

      if (genError) {
        console.error('Error generating tasks:', genError)
      }

      return { cardId, targetStage }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Card Moved',
        description: 'Production card has been moved to the next stage.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Cannot Move Card',
        description: error.message || 'Complete all required tasks first.',
      })
    },
  })
}

export function useUpdateProductionCard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductionCard> & { id: string }) => {
      const { data, error } = await supabase
        .from('production_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ProductionCard
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards', data.id] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Card Updated',
        description: 'Production card has been updated.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update card.',
      })
    },
  })
}

// ============================================================================
// PRODUCTION TASKS
// ============================================================================

export function useProductionTasks(filters?: { card_id?: string; assigned_to?: string; status?: string; stage?: ProductionStage }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('production_tasks')
        .select(`
          *,
          production_card:production_cards(
            id, order_id, current_stage,
            order:orders(id, order_number)
          ),
          assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
        `)
        .is('parent_task_id', null) // Only parent tasks
        .order('due_date', { ascending: true, nullsFirst: false })

      if (filters?.card_id) {
        query = query.eq('production_card_id', filters.card_id)
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.stage) {
        query = query.eq('stage', filters.stage)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ProductionTaskWithRelations[]
    },
    staleTime: 1000 * 30,
  })
}

export function useMyProductionTasksToday() {
  return useQuery({
    queryKey: ['production-tasks', 'my-tasks-today'],
    queryFn: async () => {
      // Use the API endpoint which fetches subtasks and active timers
      const response = await fetch('/api/production/my-tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      return response.json()
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

export function useUpdateProductionTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTaskInput & { id: string }) => {
      // If setting status to completed, add completed_at timestamp
      if (updates.status === 'completed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('production_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ProductionTask
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Task Updated',
        description: 'Production task has been updated.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update task.',
      })
    },
  })
}

// Fetch single task with all relations (subtasks, time entries, etc.)
export function useProductionTask(taskId: string) {
  return useQuery({
    queryKey: ['production-task', taskId],
    queryFn: async () => {
      const response = await fetch(`/api/production/tasks/${taskId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch task')
      }
      const data = await response.json()
      return data.task as ProductionTaskWithRelations
    },
    enabled: !!taskId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useCompleteProductionTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('production_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ProductionTask
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Task Completed',
        description: 'Great job! Task marked as complete.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to complete task.',
      })
    },
  })
}

export function useDeleteProductionTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete the task (also cascades to subtasks via FK)
      const { error } = await supabase
        .from('production_tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Task Deleted',
        description: 'Task has been removed.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete task.',
      })
    },
  })
}

// ============================================================================
// TIME TRACKING
// ============================================================================

export function useStartTimer() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's tenant_id for RLS compliance
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) {
        throw new Error('User profile not found or missing tenant')
      }

      // Check for existing active timer
      const { data: existing } = await supabase
        .from('production_time_entries')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .is('ended_at', null)
        .single()

      if (existing) {
        throw new Error('Timer already running for this task')
      }

      // Create new time entry with tenant_id for RLS
      const { data, error } = await supabase
        .from('production_time_entries')
        .insert({
          task_id: taskId,
          user_id: user.id,
          tenant_id: profile.tenant_id,
          started_at: new Date().toISOString(),
          entry_type: 'stopwatch',
        })
        .select()
        .single()

      if (error) throw error

      // Update task status to in_progress if pending
      await supabase
        .from('production_tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId)
        .eq('status', 'pending')

      return data as ProductionTimeEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      toast({
        title: 'Timer Started',
        description: 'Time tracking has begun.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start timer.',
      })
    },
  })
}

export function useStopTimer() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ entryId, notes }: { entryId: string; notes?: string }) => {
      const endedAt = new Date()

      // Get the entry to calculate duration
      const { data: entry, error: getError } = await supabase
        .from('production_time_entries')
        .select('started_at')
        .eq('id', entryId)
        .single()

      if (getError) throw getError

      const startedAt = new Date(entry.started_at)
      const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)

      const { data, error } = await supabase
        .from('production_time_entries')
        .update({
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes,
          notes: notes,
        })
        .eq('id', entryId)
        .select()
        .single()

      if (error) throw error
      return data as ProductionTimeEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      toast({
        title: 'Timer Stopped',
        description: 'Time entry has been saved.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to stop timer.',
      })
    },
  })
}

export function useActiveTimer() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['active-timer'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('production_time_entries')
        .select(`
          *,
          task:production_tasks(id, title, production_card_id)
        `)
        .eq('user_id', user.id)
        .is('ended_at', null)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return data as (ProductionTimeEntry & { task: { id: string; title: string; production_card_id: string } }) | null
    },
    refetchInterval: 1000 * 30, // Check every 30 seconds
  })
}

// ============================================================================
// RESOURCES
// ============================================================================

export function useProductionResources() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-resources'],
    queryFn: async () => {
      // Get user's tenant_id for multi-tenant isolation
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      let query = supabase
        .from('production_resources')
        .select(`
          *,
          user:profiles!production_resources_user_id_fkey(id, name, email)
        `)
        .order('user_id')

      // Filter by tenant_id if available
      if (profile?.tenant_id) {
        query = query.eq('tenant_id', profile.tenant_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ProductionResourceWithUser[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateProductionResource() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: ProductionResourceInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's tenant_id for multi-tenant isolation
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.tenant_id) {
        throw new Error('User has no tenant_id assigned')
      }

      const { data, error } = await supabase
        .from('production_resources')
        .insert({
          org_id: user.id,
          tenant_id: profile.tenant_id,
          ...input,
        })
        .select()
        .single()

      if (error) throw error
      return data as ProductionResource
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-resources'] })
      toast({
        title: 'Resource Added',
        description: 'Production resource has been added.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add resource.',
      })
    },
  })
}

export function useUpdateProductionResource() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductionResource> & { id: string }) => {
      const { data, error } = await supabase
        .from('production_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ProductionResource
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-resources'] })
      toast({
        title: 'Resource Updated',
        description: 'Production resource has been updated.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update resource.',
      })
    },
  })
}

export function useDeleteProductionResource() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('production_resources')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-resources'] })
      toast({
        title: 'Resource Removed',
        description: 'Production resource has been removed.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove resource.',
      })
    },
  })
}

export function useResourcesByRole(role: ProductionRole) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-resources', 'by-role', role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_resources')
        .select(`
          *,
          user:profiles!production_resources_user_id_fkey(id, name, email)
        `)
        .eq('is_available', true)
        .contains('roles', [role])
        .order('user_id')

      if (error) throw error
      return data as ProductionResourceWithUser[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

// ============================================================================
// ALERTS
// ============================================================================

export function useProductionAlerts(filters?: { unresolved_only?: boolean }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-alerts', filters],
    queryFn: async () => {
      let query = supabase
        .from('production_alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.unresolved_only) {
        query = query.eq('is_resolved', false)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ProductionAlert[]
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('production_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes: notes,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ProductionAlert
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-alerts'] })
      toast({
        title: 'Alert Resolved',
        description: 'The alert has been resolved.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to resolve alert.',
      })
    },
  })
}

// ============================================================================
// ADD TASKS FROM LIBRARY TO CARD
// ============================================================================

export function useAddTasksToCard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ cardId, libraryTaskIds }: { cardId: string; libraryTaskIds: string[] }) => {
      const response = await fetch(`/api/production/cards/${cardId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryTaskIds }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add tasks')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards', variables.cardId] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Tasks Added',
        description: data.message || `${data.tasks_created} task(s) added to the card.`,
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add tasks to card.',
      })
    },
  })
}

// ============================================================================
// HOLD / CANCEL / RESUME WORKFLOWS
// ============================================================================

export function useHoldProductionCard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ cardId, holdReason }: { cardId: string; holdReason?: string }) => {
      const { error } = await supabase.rpc('hold_production_card', {
        p_card_id: cardId,
        p_hold_reason: holdReason || null,
      })

      if (error) throw error
      return { cardId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Order On Hold',
        description: 'Production card has been put on hold.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Cannot Put On Hold',
        description: error.message || 'Failed to put card on hold.',
      })
    },
  })
}

export function useResumeProductionCard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ cardId }: { cardId: string }) => {
      const { data, error } = await supabase.rpc('resume_production_card', {
        p_card_id: cardId,
      })

      if (error) throw error
      return { cardId, resumedToStage: data }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Order Resumed',
        description: `Production card has been resumed to ${data.resumedToStage} stage.`,
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Cannot Resume',
        description: error.message || 'Failed to resume card.',
      })
    },
  })
}

export function useCancelProductionCard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ cardId, cancelReason }: { cardId: string; cancelReason?: string }) => {
      const { error } = await supabase.rpc('cancel_production_card', {
        p_card_id: cardId,
        p_cancel_reason: cancelReason || null,
      })

      if (error) throw error
      return { cardId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-board'] })
      toast({
        title: 'Order Cancelled',
        description: 'Production card has been cancelled.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Cannot Cancel',
        description: error.message || 'Failed to cancel card.',
      })
    },
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStageColor(stage: ProductionStage): string {
  const colors: Record<ProductionStage, string> = {
    INTAKE: 'bg-blue-50 border-blue-200',
    SCHEDULING: 'bg-yellow-50 border-yellow-200',
    SCHEDULED: 'bg-orange-50 border-orange-200',
    INSPECTED: 'bg-teal-50 border-teal-200',
    FINALIZATION: 'bg-indigo-50 border-indigo-200',
    READY_FOR_DELIVERY: 'bg-purple-50 border-purple-200',
    DELIVERED: 'bg-green-50 border-green-200',
    CORRECTION: 'bg-red-50 border-red-200',
    REVISION: 'bg-pink-50 border-pink-200',
    WORKFILE: 'bg-gray-50 border-gray-200',
    ON_HOLD: 'bg-amber-50 border-amber-300',
    CANCELLED: 'bg-red-100 border-red-300',
  }
  return colors[stage]
}

// ============================================================================
// CALENDAR VIEW
// ============================================================================

import type {
  CalendarItem,
  CalendarData,
  WorkloadPeriod,
  ResourceWorkload,
  WorkloadData,
  ProductionSLAConfig,
  SLAConfigInput,
} from '@/types/production'
import { DEFAULT_SLA_CONFIG } from '@/types/production'

// Constants for workload calculations
const BUSINESS_DAYS_PER_WEEK = 5
const BUSINESS_DAYS_PER_MONTH = 22
const WEEKS_PER_MONTH = 4.33
const WEEK_TO_DAY_RATIO = 0.2

// Date format validation regex
const ISO_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/

export function useCalendarData(startDate: Date, endDate: Date) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-calendar', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Validate input dates
      if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        throw new Error('Invalid startDate: must be a valid Date object')
      }
      if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        throw new Error('Invalid endDate: must be a valid Date object')
      }

      // Format dates for server-side query
      const startISO = startDate.toISOString().split('T')[0]
      const endISO = endDate.toISOString().split('T')[0]

      // Validate date format
      if (!ISO_DATE_FORMAT.test(startISO)) {
        throw new Error(`Invalid startISO format: ${startISO}`)
      }
      if (!ISO_DATE_FORMAT.test(endISO)) {
        throw new Error(`Invalid endISO format: ${endISO}`)
      }

      // Fetch cards with due dates in range
      const { data: cards, error: cardsError } = await supabase
        .from('production_cards')
        .select(`
          *,
          order:orders(id, order_number, status, property_address),
          template:production_templates(id, name),
          assigned_appraiser:profiles!production_cards_assigned_appraiser_id_fkey(id, name, email),
          assigned_reviewer:profiles!production_cards_assigned_reviewer_id_fkey(id, name, email),
          assigned_admin:profiles!production_cards_assigned_admin_id_fkey(id, name, email),
          assigned_trainee:profiles!production_cards_assigned_trainee_id_fkey(id, name, email),
          assigned_researcher_level_1:profiles!production_cards_assigned_researcher_level_1_id_fkey(id, name, email),
          assigned_researcher_level_2:profiles!production_cards_assigned_researcher_level_2_id_fkey(id, name, email),
          assigned_researcher_level_3:profiles!production_cards_assigned_researcher_level_3_id_fkey(id, name, email),
          assigned_inspector:profiles!production_cards_assigned_inspector_id_fkey(id, name, email)
        `)
        .gte('due_date', startISO)
        .lte('due_date', endISO)
        .is('completed_at', null) // Only active cards

      if (cardsError) throw cardsError

      // Get card IDs for task query
      const cardIds = cards?.map(c => c.id) || []

      // Fetch tasks with due dates in range (including subtasks)
      // Note: We query tasks with due_date in range, without filtering by parent_task_id
      const { data: tasks, error: tasksError } = await supabase
        .from('production_tasks')
        .select(`
          *,
          production_card:production_cards(
            id, order_id, current_stage, priority, due_date,
            order:orders(id, order_number, property_address)
          )
        `)
        .gte('due_date', startDate.toISOString())
        .lte('due_date', endDate.toISOString())
        .in('status', ['pending', 'in_progress'])

      if (tasksError) throw tasksError

      // Build calendar items
      const items: CalendarItem[] = []

      // Add card items
      cards?.forEach((card) => {
        if (card.due_date) {
          items.push({
            id: `card-${card.id}`,
            title: card.order?.property_address || `Order #${card.order?.order_number}`,
            dueDate: card.due_date,
            type: 'card',
            priority: card.priority,
            stage: card.current_stage,
            orderNumber: card.order?.order_number || undefined,
            propertyAddress: card.order?.property_address || undefined,
            cardId: card.id,
          })
        }
      })

      // Add task items
      tasks?.forEach((task) => {
        if (task.due_date && task.production_card) {
          items.push({
            id: `task-${task.id}`,
            title: task.title,
            dueDate: task.due_date,
            type: 'task',
            priority: task.production_card.priority || 'normal',
            stage: task.stage,
            orderNumber: task.production_card.order?.order_number || undefined,
            propertyAddress: task.production_card.order?.property_address || undefined,
            cardId: task.production_card_id,
            assignedTo: task.assigned_to || undefined,
          })
        }
      })

      return {
        items,
        cards: cards as ProductionCardWithOrder[],
        startDate: startISO,
        endDate: endISO,
      } as CalendarData
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  })
}

// ============================================================================
// WORKLOAD CHART
// ============================================================================

export function useWorkloadData(period: WorkloadPeriod, selectedDate: Date) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-workload', period, selectedDate.toISOString()],
    queryFn: async () => {
      // Validate input date
      if (!(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
        throw new Error('Invalid selectedDate: must be a valid Date object')
      }

      // Calculate date range based on period
      let startDate: Date
      let endDate: Date

      switch (period) {
        case 'day':
          startDate = new Date(selectedDate)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(selectedDate)
          endDate.setHours(23, 59, 59, 999)
          break
        case 'week':
          // Start of week (Sunday)
          startDate = new Date(selectedDate)
          startDate.setDate(startDate.getDate() - startDate.getDay())
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + 6)
          endDate.setHours(23, 59, 59, 999)
          break
        case 'month':
          startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
          endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
          break
      }

      // Fetch all production resources with user info
      const { data: resources, error: resourcesError } = await supabase
        .from('production_resources')
        .select(`
          *,
          user:profiles!production_resources_user_id_fkey(id, name, email)
        `)
        .eq('is_available', true)

      if (resourcesError) throw resourcesError

      // Fetch all tasks in the date range (including subtasks for accurate workload)
      const { data: tasks, error: tasksError } = await supabase
        .from('production_tasks')
        .select('id, assigned_to, estimated_minutes, status, due_date')
        .gte('due_date', startDate.toISOString())
        .lte('due_date', endDate.toISOString())
        .in('status', ['pending', 'in_progress'])

      if (tasksError) throw tasksError

      // Calculate capacity multiplier based on period
      const getCapacityMultiplier = (period: WorkloadPeriod): { daily: number; weekly: number } => {
        switch (period) {
          case 'day':
            return { daily: 1, weekly: WEEK_TO_DAY_RATIO } // 1 day, ~20% of week
          case 'week':
            return { daily: BUSINESS_DAYS_PER_WEEK, weekly: 1 } // 5 business days, 1 week
          case 'month':
            return { daily: BUSINESS_DAYS_PER_MONTH, weekly: WEEKS_PER_MONTH } // ~22 business days, ~4.33 weeks
        }
      }

      const multiplier = getCapacityMultiplier(period)

      // Aggregate workload per resource
      const workloadByUser: Record<string, { taskCount: number; estimatedMinutes: number }> = {}

      tasks?.forEach((task) => {
        if (task.assigned_to) {
          if (!workloadByUser[task.assigned_to]) {
            workloadByUser[task.assigned_to] = { taskCount: 0, estimatedMinutes: 0 }
          }
          workloadByUser[task.assigned_to].taskCount++
          workloadByUser[task.assigned_to].estimatedMinutes += task.estimated_minutes || 30 // Default 30 min if not set
        }
      })

      // Build resource workload data
      const resourceWorkloads: ResourceWorkload[] = resources?.map((resource) => {
        const workload = workloadByUser[resource.user_id] || { taskCount: 0, estimatedMinutes: 0 }
        const estimatedHours = workload.estimatedMinutes / 60

        // Calculate capacity for this period
        const maxTasks = resource.max_daily_tasks * multiplier.daily
        const maxHours = resource.max_weekly_hours * multiplier.weekly

        // Calculate capacity used (using whichever metric is higher)
        const taskCapacityUsed = maxTasks > 0 ? (workload.taskCount / maxTasks) * 100 : 0
        const hourCapacityUsed = maxHours > 0 ? (estimatedHours / maxHours) * 100 : 0
        const capacityUsedPercent = Math.max(taskCapacityUsed, hourCapacityUsed)

        return {
          resourceId: resource.id,
          userId: resource.user_id,
          userName: resource.user?.name || resource.user?.email || 'Unknown',
          userEmail: resource.user?.email || '',
          roles: resource.roles,
          taskCount: workload.taskCount,
          estimatedHours,
          maxDailyTasks: resource.max_daily_tasks,
          maxWeeklyHours: resource.max_weekly_hours,
          capacityUsedPercent,
          isOverloaded: capacityUsedPercent > 100,
        }
      }) || []

      // Sort by capacity used (descending)
      resourceWorkloads.sort((a, b) => b.capacityUsedPercent - a.capacityUsedPercent)

      return {
        resources: resourceWorkloads,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      } as WorkloadData
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  })
}

// ============================================================================
// SLA CONFIGURATION
// ============================================================================

export function useProductionSLAConfig() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-sla-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_sla_config')
        .select('*')
        .order('stage')

      if (error) {
        // If table doesn't exist yet, return defaults
        if (error.code === '42P01') {
          return Object.entries(DEFAULT_SLA_CONFIG).map(([stage, config]) => ({
            id: stage,
            tenant_id: '',
            stage,
            sla_days: config.sla_days,
            reference_point: config.reference_point,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })) as ProductionSLAConfig[]
        }
        throw error
      }

      // If no config exists, return defaults
      if (!data || data.length === 0) {
        return Object.entries(DEFAULT_SLA_CONFIG).map(([stage, config]) => ({
          id: stage,
          tenant_id: '',
          stage,
          sla_days: config.sla_days,
          reference_point: config.reference_point,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as ProductionSLAConfig[]
      }

      return data as ProductionSLAConfig[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useUpdateSLAConfig() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (configs: SLAConfigInput[]) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) {
        throw new Error('User has no tenant_id assigned')
      }

      // Validate all configs using Zod schema
      const validatedConfigs = configs.map(config => {
        const result = SLAConfigInputSchema.safeParse(config)
        if (!result.success) {
          throw new Error(`Invalid SLA config: ${result.error.issues.map(i => i.message).join(', ')}`)
        }
        return result.data
      })

      // Upsert each validated config
      for (const config of validatedConfigs) {
        const { error } = await supabase
          .from('production_sla_config')
          .upsert({
            tenant_id: profile.tenant_id,
            stage: config.stage,
            sla_days: config.sla_days,
            reference_point: config.reference_point,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'tenant_id,stage'
          })

        if (error) throw error
      }

      return configs
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-sla-config'] })
      toast({
        title: 'SLA Configuration Saved',
        description: 'Task due date settings have been updated.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save SLA configuration.',
      })
    },
  })
}

export function useInitializeSLADefaults() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) {
        throw new Error('User has no tenant_id assigned')
      }

      // Call the database function to initialize defaults
      const { error } = await supabase.rpc('initialize_production_sla_defaults', {
        p_tenant_id: profile.tenant_id
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-sla-config'] })
      toast({
        title: 'SLA Defaults Initialized',
        description: 'Default SLA configuration has been set up.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to initialize SLA defaults.',
      })
    },
  })
}
