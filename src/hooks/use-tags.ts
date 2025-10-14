import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tag, ClientTag } from '@/lib/types'
import { useToast } from './use-toast'
import { transformTag, transformClientTag } from '@/lib/supabase/transforms'

export function useTags() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')
      
      if (error) throw error
      return (data || []).map(transformTag)
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useClientTags(clientId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['client-tags', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_tags')
        .select('*, tag:tags(*)')
        .eq('client_id', clientId)
      
      if (error) throw error
      return (data || []).map(transformClientTag)
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useAddTagToClient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ clientId, tagId }: { clientId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from('client_tags')
        .insert({ client_id: clientId, tag_id: tagId })
        .select('*, tag:tags(*)')
        .single()
      
      if (error) throw error
      return transformClientTag(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-tags', variables.clientId] })
      toast({
        title: "Tag Added",
        description: "Tag has been added to client.",
      })
    },
    onError: (error: any) => {
      console.error('Add tag error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to add tag.",
      })
    },
  })
}

export function useRemoveTagFromClient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ clientId, tagId }: { clientId: string; tagId: string }) => {
      const { error } = await supabase
        .from('client_tags')
        .delete()
        .eq('client_id', clientId)
        .eq('tag_id', tagId)
      
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-tags', variables.clientId] })
      toast({
        title: "Tag Removed",
        description: "Tag has been removed from client.",
      })
    },
    onError: (error: any) => {
      console.error('Remove tag error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to remove tag.",
      })
    },
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (tag: { name: string; color?: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: tag.name, color: tag.color || '#3771C8' })
        .select()
        .single()
      
      if (error) throw error
      return transformTag(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast({
        title: "Tag Created",
        description: "New tag has been created.",
      })
    },
    onError: (error: any) => {
      console.error('Create tag error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create tag.",
      })
    },
  })
}

