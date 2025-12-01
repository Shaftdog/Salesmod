import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Case, CaseComment } from '@/lib/types'
import { useToast } from './use-toast'
import { transformCase, transformCaseComment } from '@/lib/supabase/transforms'

export function useCases(filters?: { clientId?: string; orderId?: string; status?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['cases', filters],
    queryFn: async () => {
      let query = supabase
        .from('cases')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          assignee:profiles!cases_assigned_to_fkey(*),
          creator:profiles!cases_created_by_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId)
      }
      if (filters?.orderId) {
        query = query.eq('order_id', filters.orderId)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []).map(transformCase)
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useCase(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['cases', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          assignee:profiles!cases_assigned_to_fkey(*),
          creator:profiles!cases_created_by_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return transformCase(data)
    },
    enabled: !!id,
  })
}

export function useCreateCase() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (caseData: any) => {
      // Get current user and their tenant_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) {
        throw new Error('User has no tenant_id assigned - cannot create case')
      }

      const { data, error } = await supabase
        .from('cases')
        .insert({
          ...caseData,
          tenant_id: profile.tenant_id,
        })
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          assignee:profiles!cases_assigned_to_fkey(*),
          creator:profiles!cases_created_by_fkey(*)
        `)
        .single()

      if (error) throw error
      return transformCase(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast({
        title: "Case Created",
        description: "The new case has been successfully created.",
      })
    },
    onError: (error) => {
      console.error('Create case error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create case. Please try again.",
      })
    },
  })
}

export function useUpdateCase() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('cases')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          contact:contacts(*),
          order:orders(*),
          assignee:profiles!cases_assigned_to_fkey(*),
          creator:profiles!cases_created_by_fkey(*)
        `)
        .single()

      if (error) throw error
      return transformCase(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: ['cases', variables.id] })
      toast({
        title: "Case Updated",
        description: "The case has been successfully updated.",
      })
    },
    onError: (error) => {
      console.error('Update case error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update case. Please try again.",
      })
    },
  })
}

export function useDeleteCase() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast({
        title: "Case Deleted",
        description: "The case has been successfully deleted.",
      })
    },
    onError: (error) => {
      console.error('Delete case error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete case. Please try again.",
      })
    },
  })
}

// ==================== CASE COMMENTS ====================

export function useCaseComments(caseId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['case-comments', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_comments')
        .select(`
          *,
          creator:profiles!case_comments_created_by_fkey(*)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data || []).map(transformCaseComment)
    },
    enabled: !!caseId,
  })
}

export function useCreateCaseComment() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (comment: any) => {
      const { data, error } = await supabase
        .from('case_comments')
        .insert(comment)
        .select(`
          *,
          creator:profiles!case_comments_created_by_fkey(*)
        `)
        .single()

      if (error) throw error
      return transformCaseComment(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['case-comments', variables.case_id] })
    },
    onError: (error) => {
      console.error('Create case comment error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add comment. Please try again.",
      })
    },
  })
}

export function useDeleteCaseComment() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, caseId }: { id: string; caseId: string }) => {
      const { error } = await supabase
        .from('case_comments')
        .delete()
        .eq('id', id)

      if (error) throw error
      return caseId
    },
    onSuccess: (caseId) => {
      queryClient.invalidateQueries({ queryKey: ['case-comments', caseId] })
    },
    onError: (error) => {
      console.error('Delete case comment error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete comment. Please try again.",
      })
    },
  })
}



