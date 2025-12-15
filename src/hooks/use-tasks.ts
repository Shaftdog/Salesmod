import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'
import { useToast } from './use-toast'
import { transformTask } from '@/lib/supabase/transforms'

export function useTasks(filters?: { clientId?: string; orderId?: string; dealId?: string; assignedTo?: string; status?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          deal:deals(*),
          assignee:profiles!tasks_assigned_to_fkey(*),
          creator:profiles!tasks_created_by_fkey(*)
        `)
        .order('due_date', { ascending: true, nullsFirst: false })
      
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId)
      }
      if (filters?.orderId) {
        query = query.eq('order_id', filters.orderId)
      }
      if (filters?.dealId) {
        query = query.eq('deal_id', filters.dealId)
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return (data || []).map(transformTask)
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useMyTasks() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks', 'my-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          deal:deals(*),
          assignee:profiles!tasks_assigned_to_fkey(*),
          creator:profiles!tasks_created_by_fkey(*)
        `)
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true, nullsFirst: false })
      
      if (error) throw error
      return (data || []).map(transformTask)
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useTask(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          deal:deals(*),
          assignee:profiles!tasks_assigned_to_fkey(*),
          creator:profiles!tasks_created_by_fkey(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return transformTask(data)
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (task: any) => {
      // Get current user and their tenant_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) {
        throw new Error('User has no tenant_id assigned - cannot create task')
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          tenant_id: profile.tenant_id,
        })
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          deal:deals(*),
          assignee:profiles!tasks_assigned_to_fkey(*),
          creator:profiles!tasks_created_by_fkey(*)
        `)
        .single()

      if (error) throw error
      return transformTask(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Task Created",
        description: `Task assigned to ${data.assignee?.name || 'user'}.`,
      })
    },
    onError: (error: any) => {
      console.error('Create task error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create task.",
      })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          deal:deals(*),
          assignee:profiles!tasks_assigned_to_fkey(*),
          creator:profiles!tasks_created_by_fkey(*)
        `)
        .single()
      
      if (error) throw error
      return transformTask(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', data.id] })
      toast({
        title: "Task Updated",
        description: "The task has been updated.",
      })
    },
    onError: (error: any) => {
      console.error('Update task error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update task.",
      })
    },
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          deal:deals(*),
          assignee:profiles!tasks_assigned_to_fkey(*),
          creator:profiles!tasks_created_by_fkey(*)
        `)
        .single()
      
      if (error) throw error
      return transformTask(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Task Completed",
        description: "Great job! Task marked as complete.",
      })
    },
    onError: (error: any) => {
      console.error('Complete task error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to complete task.",
      })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Task Deleted",
        description: "The task has been removed.",
      })
    },
    onError: (error: any) => {
      console.error('Delete task error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete task.",
      })
    },
  })
}

export function usePipelineStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_by_stage')
        .select('*')
      
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

