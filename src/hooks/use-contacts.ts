import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Contact } from '@/lib/types'
import { useToast } from './use-toast'
import { transformContact } from '@/lib/supabase/transforms'

export function useContacts(clientId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: clientId ? ['contacts', 'client', clientId] : ['contacts'],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*, client:clients(*)')
        .order('is_primary', { ascending: false })
        .order('last_name')
      
      if (clientId) {
        query = query.eq('client_id', clientId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return (data || []).map(transformContact)
    },
    enabled: !clientId || !!clientId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useContact(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, client:clients(*)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return transformContact(data)
    },
    enabled: !!id,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (contact: any) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select('*, client:clients(*)')
        .single()
      
      if (error) throw error
      return transformContact(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contacts', 'client', data.clientId] })
      toast({
        title: "Contact Added",
        description: `${data.firstName} ${data.lastName} has been added.`,
      })
    },
    onError: (error: any) => {
      console.error('Create contact error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create contact.",
      })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select('*, client:clients(*)')
        .single()
      
      if (error) throw error
      return transformContact(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contacts', 'client', data.clientId] })
      queryClient.invalidateQueries({ queryKey: ['contacts', data.id] })
      toast({
        title: "Contact Updated",
        description: `${data.firstName} ${data.lastName} has been updated.`,
      })
    },
    onError: (error: any) => {
      console.error('Update contact error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update contact.",
      })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast({
        title: "Contact Deleted",
        description: "The contact has been removed.",
      })
    },
    onError: (error: any) => {
      console.error('Delete contact error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete contact.",
      })
    },
  })
}

