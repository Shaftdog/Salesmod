/**
 * React Query hooks for AI-generated drafts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface AiDraft {
  id: string
  clientId: string
  draftType: string
  subject?: string
  content: string
  contextSnapshot?: any
  status: 'pending' | 'approved' | 'edited' | 'rejected' | 'sent'
  tokensUsed: number
  createdBy: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  sentAt?: string
}

function transformDraft(data: any): AiDraft {
  return {
    id: data.id,
    clientId: data.client_id,
    draftType: data.draft_type,
    subject: data.subject,
    content: data.content,
    contextSnapshot: data.context_snapshot,
    status: data.status,
    tokensUsed: data.tokens_used,
    createdBy: data.created_by,
    approvedBy: data.approved_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    approvedAt: data.approved_at,
    sentAt: data.sent_at,
  }
}

/**
 * Fetch all drafts for a client
 */
export function useAiDrafts(clientId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['ai-drafts', clientId],
    queryFn: async () => {
      let query = supabase
        .from('ai_drafts')
        .select('*')
        .order('created_at', { ascending: false })

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query

      if (error) throw error
      return data?.map(transformDraft) || []
    },
    enabled: !!clientId,
  })
}

/**
 * Fetch a single draft by ID
 */
export function useAiDraft(draftId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['ai-drafts', draftId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_drafts')
        .select('*')
        .eq('id', draftId)
        .single()

      if (error) throw error
      return transformDraft(data)
    },
    enabled: !!draftId,
  })
}

/**
 * Generate a new AI draft
 */
export function useGenerateDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientId,
      draftType,
      contextHints,
      tone,
    }: {
      clientId: string
      draftType: string
      contextHints?: string
      tone?: string
    }) => {
      const response = await fetch('/api/ai/drafts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          draftType,
          contextHints,
          tone,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate draft')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', variables.clientId] })
      queryClient.invalidateQueries({ queryKey: ['ai-drafts'] })
    },
  })
}

/**
 * Update draft content
 */
export function useEditDraft() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      draftId,
      content,
      subject,
    }: {
      draftId: string
      content: string
      subject?: string
    }) => {
      const { data, error } = await supabase
        .from('ai_drafts')
        .update({
          content,
          subject,
          status: 'edited',
        })
        .eq('id', draftId)
        .select()
        .single()

      if (error) throw error
      return transformDraft(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', data.clientId] })
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', data.id] })
    },
  })
}

/**
 * Approve a draft
 */
export function useApproveDraft() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draftId: string) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('ai_drafts')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', draftId)
        .select()
        .single()

      if (error) throw error
      return transformDraft(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', data.clientId] })
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', data.id] })
    },
  })
}

/**
 * Reject a draft
 */
export function useRejectDraft() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draftId: string) => {
      const { data, error } = await supabase
        .from('ai_drafts')
        .update({
          status: 'rejected',
        })
        .eq('id', draftId)
        .select()
        .single()

      if (error) throw error
      return transformDraft(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', data.clientId] })
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', data.id] })
    },
  })
}

/**
 * Delete a draft
 */
export function useDeleteDraft() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draftId: string) => {
      const { error } = await supabase
        .from('ai_drafts')
        .delete()
        .eq('id', draftId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts'] })
    },
  })
}

/**
 * Mark draft as sent
 */
export function useMarkDraftAsSent() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draftId: string) => {
      const { data, error } = await supabase
        .from('ai_drafts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', draftId)
        .select()
        .single()

      if (error) throw error
      return transformDraft(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', data.clientId] })
      queryClient.invalidateQueries({ queryKey: ['ai-drafts', data.id] })
    },
  })
}

