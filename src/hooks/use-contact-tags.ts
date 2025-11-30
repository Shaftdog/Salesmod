import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ContactTag } from '@/lib/types'
import { useToast } from './use-toast'
import { transformContactTag } from '@/lib/supabase/transforms'

export function useContactTags(contactId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['contact-tags', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*, tag:tags(*)')
        .eq('contact_id', contactId)

      if (error) throw error
      return (data || []).map(transformContactTag)
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useAddTagToContact() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from('contact_tags')
        .insert({ contact_id: contactId, tag_id: tagId })
        .select('*, tag:tags(*)')
        .single()

      if (error) throw error
      return transformContactTag(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags', variables.contactId] })
      toast({
        title: "Tag Added",
        description: "Tag has been added to contact.",
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

export function useRemoveTagFromContact() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags', variables.contactId] })
      toast({
        title: "Tag Removed",
        description: "Tag has been removed from contact.",
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
