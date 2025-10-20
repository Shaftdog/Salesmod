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
      // Use explicit FK name to avoid ambiguity with contact_companies table
      let { data, error } = await supabase
        .from('contacts')
        .select('*, clients!contacts_client_id_fkey(*), party_roles(*)')
        .order('is_primary', { ascending: false })
        .order('last_name')
      
      if (clientId) {
        const queryWithFilter = supabase
          .from('contacts')
          .select('*, clients!contacts_client_id_fkey(*), party_roles(*)')
          .eq('client_id', clientId)
          .order('is_primary', { ascending: false })
          .order('last_name');
        
        const result = await queryWithFilter;
        data = result.data;
        error = result.error;
      }
      
      // Fallback if party_roles doesn't exist yet
      if (error) {
        console.warn('Falling back to contacts without party_roles:', error.message)
        let fallbackQuery = supabase
          .from('contacts')
          .select('*, clients!contacts_client_id_fkey(*)')
          .order('is_primary', { ascending: false })
          .order('last_name')
        
        if (clientId) {
          fallbackQuery = fallbackQuery.eq('client_id', clientId)
        }
        
        const fallbackResult = await fallbackQuery
        data = fallbackResult.data
        error = fallbackResult.error
        
        if (error) throw error
      }
      
      // Normalize clients FK to client for compatibility
      const normalizedData = (data || []).map(contact => ({
        ...contact,
        client: contact.clients || null,
        clients: undefined,
      }));
      
      return normalizedData.map(transformContact)
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
      let { data, error } = await supabase
        .from('contacts')
        .select('*, clients!contacts_client_id_fkey(*), party_roles(*)')
        .eq('id', id)
        .single()
      
      // Fallback if party_roles column doesn't exist
      if (error) {
        console.warn('Falling back to contact without party_roles:', error.message)
        const fallbackResult = await supabase
          .from('contacts')
          .select('*, clients!contacts_client_id_fkey(*)')
          .eq('id', id)
          .single()
        
        data = fallbackResult.data
        error = fallbackResult.error
        
        if (error) throw error
      }
      
      // Normalize clients FK to client
      const normalizedContact = {
        ...data,
        client: data?.clients || null,
      };
      delete normalizedContact.clients;
      
      return transformContact(normalizedContact)
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
        .select('*, clients!contacts_client_id_fkey(*), party_roles(*)')
        .single()
      
      if (error) throw error
      
      // Normalize
      const normalized = {
        ...data,
        client: data?.clients || null,
      };
      delete normalized.clients;
      
      return transformContact(normalized)
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
        .select('*, clients!contacts_client_id_fkey(*), party_roles(*)')
        .single()
      
      if (error) throw error
      
      // Normalize
      const normalized = {
        ...data,
        client: data?.clients || null,
      };
      delete normalized.clients;
      
      return transformContact(normalized)
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

