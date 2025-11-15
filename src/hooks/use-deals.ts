import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Deal } from '@/lib/types'
import { useToast } from './use-toast'
import { transformDeal } from '@/lib/supabase/transforms'

export function useDeals(clientId?: string) {
  const supabase = createClient()

  const { data: deals = [], isLoading, error } = useQuery({
    queryKey: clientId ? ['deals', 'client', clientId] : ['deals'],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          assignee:profiles!deals_assigned_to_fkey(*),
          creator:profiles!deals_created_by_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []).map(transformDeal)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  return { deals, isLoading, error }
}

export function useActiveDeals() {
  const supabase = createClient()

  const { data: deals = [], isLoading, error } = useQuery({
    queryKey: ['deals', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          assignee:profiles!deals_assigned_to_fkey(*),
          creator:profiles!deals_created_by_fkey(*)
        `)
        .not('stage', 'in', '(won,lost)')
        .order('expected_close_date')

      if (error) throw error
      return (data || []).map(transformDeal)
    },
    staleTime: 1000 * 60, // 1 minute
  })

  return { deals, isLoading, error }
}

export function useDeal(id: string) {
  const supabase = createClient()

  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deals', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          assignee:profiles!deals_assigned_to_fkey(*),
          creator:profiles!deals_created_by_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return transformDeal(data)
    },
    enabled: !!id,
  })

  return { deal, isLoading, error }
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (deal: any) => {
      const { data, error } = await supabase
        .from('deals')
        .insert(deal)
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          assignee:profiles!deals_assigned_to_fkey(*),
          creator:profiles!deals_created_by_fkey(*)
        `)
        .single()
      
      if (error) throw error
      return transformDeal(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      if (data.clientId) {
        queryClient.invalidateQueries({ queryKey: ['deals', 'client', data.clientId] })
      }
      toast({
        title: "Deal Created",
        description: `${data.title} has been added to the pipeline.`,
      })
    },
    onError: (error: any) => {
      console.error('Create deal error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create deal.",
      })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          assignee:profiles!deals_assigned_to_fkey(*),
          creator:profiles!deals_created_by_fkey(*)
        `)
        .single()
      
      if (error) throw error
      return transformDeal(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['deals', data.id] })
      if (data.clientId) {
        queryClient.invalidateQueries({ queryKey: ['deals', 'client', data.clientId] })
      }
      queryClient.invalidateQueries({ queryKey: ['activities'] }) // Refresh activities if stage changed
      toast({
        title: "Deal Updated",
        description: `${data.title} has been updated.`,
      })
    },
    onError: (error: any) => {
      console.error('Update deal error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update deal.",
      })
    },
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      toast({
        title: "Deal Deleted",
        description: "The deal has been removed.",
      })
    },
    onError: (error: any) => {
      console.error('Delete deal error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete deal.",
      })
    },
  })
}

