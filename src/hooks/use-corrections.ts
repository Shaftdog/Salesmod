import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './use-toast'
import type {
  CorrectionRequest,
  CorrectionRequestWithRelations,
  ResourceWorkHistory,
  ResourceWorkHistoryWithRelations,
  CorrectionFilters,
  WorkHistoryFilters,
  CreateCorrectionInput,
  CreateRevisionInput,
  CompleteCorrectionInput,
  ApproveCorrectionInput,
  RejectCorrectionInput,
} from '@/types/corrections'

// ==================== CORRECTION QUERIES ====================

export function useCorrections(filters?: CorrectionFilters) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['corrections', filters],
    queryFn: async () => {
      let query = supabase
        .from('correction_requests')
        .select(`
          *,
          source_task:production_tasks!correction_requests_source_task_id_fkey(
            id,
            title,
            stage
          ),
          production_card:production_cards!correction_requests_production_card_id_fkey(
            id,
            order_id,
            current_stage,
            order:orders(
              order_number,
              property_address
            )
          ),
          case:cases(
            id,
            case_number,
            subject
          ),
          assigned_profile:profiles!correction_requests_assigned_to_fkey(
            id,
            full_name,
            avatar_url
          ),
          reviewer_profile:profiles!correction_requests_reviewer_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          requested_by_profile:profiles!correction_requests_requested_by_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
        query = query.in('status', statuses)
      }
      if (filters?.request_type) {
        query = query.eq('request_type', filters.request_type)
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters?.reviewer_id) {
        query = query.eq('reviewer_id', filters.reviewer_id)
      }
      if (filters?.production_card_id) {
        query = query.eq('production_card_id', filters.production_card_id)
      }
      if (filters?.case_id) {
        query = query.eq('case_id', filters.case_id)
      }
      if (filters?.severity) {
        const severities = Array.isArray(filters.severity) ? filters.severity : [filters.severity]
        query = query.in('severity', severities)
      }
      if (filters?.category) {
        const categories = Array.isArray(filters.category) ? filters.category : [filters.category]
        query = query.in('category', categories)
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as CorrectionRequestWithRelations[]
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useCorrection(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['corrections', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('correction_requests')
        .select(`
          *,
          source_task:production_tasks!correction_requests_source_task_id_fkey(
            id,
            title,
            stage
          ),
          production_card:production_cards!correction_requests_production_card_id_fkey(
            id,
            order_id,
            current_stage,
            order:orders(
              order_number,
              property_address
            )
          ),
          case:cases(
            id,
            case_number,
            subject
          ),
          assigned_profile:profiles!correction_requests_assigned_to_fkey(
            id,
            full_name,
            avatar_url
          ),
          reviewer_profile:profiles!correction_requests_reviewer_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          requested_by_profile:profiles!correction_requests_requested_by_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as CorrectionRequestWithRelations
    },
    enabled: !!id,
  })
}

export function useCorrectionsByCard(cardId: string) {
  return useCorrections({ production_card_id: cardId })
}

export function useCorrectionsByUser(userId: string) {
  return useCorrections({ assigned_to: userId })
}

export function useMyCorrectionsToReview() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['corrections', 'my-reviews'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('correction_requests')
        .select(`
          *,
          source_task:production_tasks!correction_requests_source_task_id_fkey(
            id,
            title,
            stage
          ),
          production_card:production_cards!correction_requests_production_card_id_fkey(
            id,
            order_id,
            current_stage,
            order:orders(
              order_number,
              property_address
            )
          ),
          assigned_profile:profiles!correction_requests_assigned_to_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('reviewer_id', user.id)
        .eq('status', 'review')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as CorrectionRequestWithRelations[]
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

// ==================== CORRECTION MUTATIONS ====================

export function useCreateCorrection() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: CreateCorrectionInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Call the database function to create correction
      // Note: Function uses auth.uid() internally, no p_user_id needed
      const { data, error } = await supabase.rpc('create_correction_request', {
        p_card_id: input.production_card_id,
        p_source_task_id: input.source_task_id || null,
        p_description: input.description,
        p_severity: input.severity || null,
        p_category: input.category || null,
        p_ai_summary: input.ai_summary || null,
      })

      if (error) throw error
      return data as CorrectionRequest
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['corrections'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      toast({
        title: "Correction Created",
        description: "The correction request has been submitted.",
      })
    },
    onError: (error) => {
      console.error('Create correction error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create correction. Please try again.",
      })
    },
  })
}

export function useCreateRevisionFromCase() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: CreateRevisionInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Call the database function to create revision
      // Note: Function uses auth.uid() internally, no p_user_id needed
      const { data, error } = await supabase.rpc('create_revision_from_case', {
        p_case_id: input.case_id,
        p_description: input.description,
        p_severity: input.severity || null,
        p_category: input.category || null,
        p_ai_summary: input.ai_summary || null,
      })

      if (error) throw error
      return data as CorrectionRequest
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['corrections'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast({
        title: "Revision Created",
        description: "The revision request has been submitted.",
      })
    },
    onError: (error: any) => {
      console.error('Create revision error:', error)

      // Extract meaningful error message from Supabase error
      let errorMessage = "Failed to create revision. Please try again."
      if (error?.message?.includes('No production card')) {
        errorMessage = "This order doesn't have a production card. Please add it to production first."
      } else if (error?.message?.includes('Case not found')) {
        errorMessage = "Case not found."
      } else if (error?.message?.includes('no linked order')) {
        errorMessage = "This case is not linked to an order."
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    },
  })
}

export function useCompleteCorrection() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: CompleteCorrectionInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('complete_correction', {
        p_correction_id: input.correction_id,
        p_resolution_notes: input.resolution_notes,
        p_user_id: user.id,
      })

      if (error) throw error
      return data as CorrectionRequest
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['corrections'] })
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      toast({
        title: "Correction Completed",
        description: "The correction has been submitted for review.",
      })
    },
    onError: (error) => {
      console.error('Complete correction error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete correction. Please try again.",
      })
    },
  })
}

export function useApproveCorrection() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: ApproveCorrectionInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('approve_correction', {
        p_correction_id: input.correction_id,
        p_notes: input.notes || null,
        p_user_id: user.id,
      })

      if (error) throw error
      return data as CorrectionRequest
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['corrections'] })
      queryClient.invalidateQueries({ queryKey: ['production-cards'] })
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      toast({
        title: "Correction Approved",
        description: "The correction has been approved and the card is returning to production.",
      })
    },
    onError: (error) => {
      console.error('Approve correction error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve correction. Please try again.",
      })
    },
  })
}

export function useRejectCorrection() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: RejectCorrectionInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('reject_correction', {
        p_correction_id: input.correction_id,
        p_notes: input.notes,
        p_create_new: input.create_new_correction || false,
        p_user_id: user.id,
      })

      if (error) throw error
      return data as CorrectionRequest
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['corrections'] })
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] })
      toast({
        title: variables.create_new_correction ? "New Correction Created" : "Correction Rejected",
        description: variables.create_new_correction
          ? "A new correction cycle has been started."
          : "The correction has been rejected.",
      })
    },
    onError: (error) => {
      console.error('Reject correction error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process correction. Please try again.",
      })
    },
  })
}

export function useUpdateCorrection() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CorrectionRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('correction_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CorrectionRequest
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['corrections'] })
      queryClient.invalidateQueries({ queryKey: ['corrections', variables.id] })
      toast({
        title: "Correction Updated",
        description: "The correction has been updated.",
      })
    },
    onError: (error) => {
      console.error('Update correction error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update correction. Please try again.",
      })
    },
  })
}

// ==================== WORK HISTORY QUERIES ====================

export function useResourceWorkHistory(filters?: WorkHistoryFilters) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['work-history', filters],
    queryFn: async () => {
      let query = supabase
        .from('resource_work_history')
        .select(`
          *,
          correction_request:correction_requests(*),
          production_task:production_tasks(
            id,
            title,
            stage
          ),
          production_card:production_cards(
            id,
            order:orders(
              order_number
            )
          ),
          resource:production_resources(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters?.resource_id) {
        query = query.eq('resource_id', filters.resource_id)
      }
      if (filters?.event_type) {
        const types = Array.isArray(filters.event_type) ? filters.event_type : [filters.event_type]
        query = query.in('event_type', types)
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as ResourceWorkHistoryWithRelations[]
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useMyWorkHistory() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['work-history', 'my-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('resource_work_history')
        .select(`
          *,
          correction_request:correction_requests(
            id,
            description,
            severity,
            status
          ),
          production_card:production_cards(
            id,
            order:orders(
              order_number,
              property_address
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data || []) as ResourceWorkHistoryWithRelations[]
    },
    staleTime: 1000 * 60,
  })
}

// ==================== CORRECTION STATS ====================

export function useCorrectionStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['correction-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get counts by status
      const { data: statusCounts, error: statusError } = await supabase
        .from('correction_requests')
        .select('status')

      if (statusError) throw statusError

      // Get my pending corrections
      const { count: myPending, error: pendingError } = await supabase
        .from('correction_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress'])

      if (pendingError) throw pendingError

      // Get my pending reviews
      const { count: myReviews, error: reviewError } = await supabase
        .from('correction_requests')
        .select('*', { count: 'exact', head: true })
        .eq('reviewer_id', user.id)
        .eq('status', 'review')

      if (reviewError) throw reviewError

      const counts = (statusCounts || []).reduce((acc, { status }) => {
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        total: statusCounts?.length || 0,
        pending: counts.pending || 0,
        in_progress: counts.in_progress || 0,
        review: counts.review || 0,
        approved: counts.approved || 0,
        rejected: counts.rejected || 0,
        myPending: myPending || 0,
        myReviews: myReviews || 0,
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}
