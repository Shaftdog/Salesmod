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
import { PRODUCTION_STAGES } from '@/types/production'

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
  const supabase = createClient()

  return useQuery({
    queryKey: ['production-tasks', 'my-tasks-today'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { tasks: [], total: 0, overdue_count: 0, due_today_count: 0, upcoming_count: 0 }

      const today = new Date()
      today.setHours(23, 59, 59, 999)

      const { data: tasks, error } = await supabase
        .from('production_tasks')
        .select(`
          *,
          production_card:production_cards(
            id, order_id, current_stage,
            order:orders(id, order_number)
          ),
          assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
        `)
        .eq('assigned_to', user.id)
        .is('parent_task_id', null)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true, nullsFirst: false })

      if (error) throw error

      const taskList = tasks as ProductionTaskWithRelations[]
      const now = new Date()

      // Calculate counts
      const overdue = taskList.filter(t => t.due_date && new Date(t.due_date) < now)
      const dueToday = taskList.filter(t => {
        if (!t.due_date) return false
        const dueDate = new Date(t.due_date)
        return dueDate.toDateString() === now.toDateString()
      })
      const upcoming = taskList.filter(t => {
        if (!t.due_date) return false
        const dueDate = new Date(t.due_date)
        return dueDate > now && dueDate.toDateString() !== now.toDateString()
      })

      return {
        tasks: taskList,
        total: taskList.length,
        overdue_count: overdue.length,
        due_today_count: dueToday.length,
        upcoming_count: upcoming.length,
      }
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

      // Create new time entry
      const { data, error } = await supabase
        .from('production_time_entries')
        .insert({
          task_id: taskId,
          user_id: user.id,
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

      const { data, error } = await supabase
        .from('production_resources')
        .insert({
          org_id: user.id,
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
  }
  return colors[stage]
}
