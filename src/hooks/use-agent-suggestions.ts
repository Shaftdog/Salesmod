/**
 * React Query hooks for AI-generated suggestions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface AgentSuggestion {
  id: string
  clientId: string
  type: string
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  reasoning: string
  actionData?: any
  status: 'pending' | 'accepted' | 'dismissed' | 'snoozed'
  createdBy?: string
  resolvedBy?: string
  createdAt: string
  resolvedAt?: string
  snoozedUntil?: string
}

function transformSuggestion(data: any): AgentSuggestion {
  return {
    id: data.id,
    clientId: data.client_id,
    type: data.suggestion_type,
    priority: data.priority,
    title: data.title,
    description: data.description,
    reasoning: data.reasoning,
    actionData: data.action_data,
    status: data.status,
    createdBy: data.created_by,
    resolvedBy: data.resolved_by,
    createdAt: data.created_at,
    resolvedAt: data.resolved_at,
    snoozedUntil: data.snoozed_until,
  }
}

/**
 * Fetch all pending suggestions
 */
export function useAgentSuggestions(clientId?: string, status?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['agent-suggestions', clientId, status],
    queryFn: async () => {
      let query = supabase
        .from('agent_suggestions')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      if (status) {
        query = query.eq('status', status)
      } else {
        // By default, only show pending and snoozed suggestions
        query = query.in('status', ['pending', 'snoozed'])
      }

      const { data, error } = await query

      if (error) throw error
      return data?.map(transformSuggestion) || []
    },
  })
}

/**
 * Fetch a single suggestion by ID
 */
export function useAgentSuggestion(suggestionId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['agent-suggestions', suggestionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single()

      if (error) throw error
      return transformSuggestion(data)
    },
    enabled: !!suggestionId,
  })
}

/**
 * Generate suggestions for a client
 */
export function useGenerateSuggestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await fetch('/api/ai/suggestions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate suggestions')
      }

      return response.json()
    },
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['agent-suggestions', clientId] })
      queryClient.invalidateQueries({ queryKey: ['agent-suggestions'] })
    },
  })
}

/**
 * Accept a suggestion
 */
export function useAcceptSuggestion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data, error } = await supabase
        .from('agent_suggestions')
        .update({
          status: 'accepted',
        })
        .eq('id', suggestionId)
        .select()
        .single()

      if (error) throw error
      return transformSuggestion(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-suggestions', data.clientId] })
      queryClient.invalidateQueries({ queryKey: ['agent-suggestions'] })
    },
  })
}

/**
 * Dismiss a suggestion
 */
export function useDismissSuggestion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      suggestionId,
      reason,
    }: {
      suggestionId: string
      reason?: string
    }) => {
      const { data, error } = await supabase
        .from('agent_suggestions')
        .update({
          status: 'dismissed',
        })
        .eq('id', suggestionId)
        .select()
        .single()

      if (error) throw error

      // Optionally log feedback if reason provided
      if (reason) {
        await supabase.from('ai_feedback').insert({
          suggestion_id: suggestionId,
          feedback_text: reason,
          helpful: false,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
      }

      return transformSuggestion(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-suggestions', data.clientId] })
      queryClient.invalidateQueries({ queryKey: ['agent-suggestions'] })
    },
  })
}

/**
 * Snooze a suggestion
 */
export function useSnoozeSuggestion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      suggestionId,
      snoozeUntil,
    }: {
      suggestionId: string
      snoozeUntil: Date
    }) => {
      const { data, error } = await supabase
        .from('agent_suggestions')
        .update({
          status: 'snoozed',
          snoozed_until: snoozeUntil.toISOString(),
        })
        .eq('id', suggestionId)
        .select()
        .single()

      if (error) throw error
      return transformSuggestion(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-suggestions', data.clientId] })
      queryClient.invalidateQueries({ queryKey: ['agent-suggestions'] })
    },
  })
}

/**
 * Get priority suggestions (dashboard widget)
 */
export function usePrioritySuggestions(limit: number = 5) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['agent-suggestions', 'priority', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_suggestions')
        .select(`
          *,
          client:clients(id, name, company)
        `)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      
      return data?.map((item: any) => ({
        ...transformSuggestion(item),
        client: item.client,
      })) || []
    },
  })
}

