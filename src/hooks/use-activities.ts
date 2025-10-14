import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Activity } from '@/lib/types'
import { useToast } from './use-toast'
import { transformActivity } from '@/lib/supabase/transforms'

export function useActivities(clientId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: clientId ? ['activities', 'client', clientId] : ['activities'],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          creator:profiles!activities_created_by_fkey(*),
          assignee:profiles!activities_assigned_to_fkey(*)
        `)
        .order('created_at', { ascending: false })
      
      if (clientId) {
        query = query.eq('client_id', clientId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return (data || []).map(transformActivity)
    },
    enabled: !clientId || !!clientId,
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useActivity(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['activities', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          creator:profiles!activities_created_by_fkey(*),
          assignee:profiles!activities_assigned_to_fkey(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return transformActivity(data)
    },
    enabled: !!id,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (activity: any) => {
      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          creator:profiles!activities_created_by_fkey(*),
          assignee:profiles!activities_assigned_to_fkey(*)
        `)
        .single()
      
      if (error) throw error
      return transformActivity(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      if (data.clientId) {
        queryClient.invalidateQueries({ queryKey: ['activities', 'client', data.clientId] })
      }
      toast({
        title: "Activity Logged",
        description: `${data.activityType} activity has been recorded.`,
      })
    },
    onError: (error: any) => {
      console.error('Create activity error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to log activity.",
      })
    },
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          creator:profiles!activities_created_by_fkey(*),
          assignee:profiles!activities_assigned_to_fkey(*)
        `)
        .single()
      
      if (error) throw error
      return transformActivity(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['activities', data.id] })
      if (data.clientId) {
        queryClient.invalidateQueries({ queryKey: ['activities', 'client', data.clientId] })
      }
      toast({
        title: "Activity Updated",
        description: "The activity has been updated.",
      })
    },
    onError: (error: any) => {
      console.error('Update activity error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update activity.",
      })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast({
        title: "Activity Deleted",
        description: "The activity has been removed.",
      })
    },
    onError: (error: any) => {
      console.error('Delete activity error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete activity.",
      })
    },
  })
}

