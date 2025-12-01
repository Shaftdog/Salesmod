import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'
import { useToast } from './use-toast'
import { transformClient } from '@/lib/supabase/transforms'

export function useClients() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, party_roles(*)')
        .order('company_name')

      if (error) throw error
      return (data || []).map(transformClient)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const createClientMutation = useMutation({
    mutationFn: async (client: any) => {
      // Get current user and their tenant_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) {
        throw new Error('User has no tenant_id assigned - cannot create client')
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...client,
          org_id: user.id,
          tenant_id: profile.tenant_id,
        })
        .select('*, party_roles(*)')
        .single()

      if (error) throw error
      return transformClient(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({
        title: "Client Created",
        description: "The new client has been successfully created.",
      })
    },
    onError: (error: any) => {
      console.error('Create client error:', error)
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      })
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || error?.details || "Failed to create client. Please try again.",
      })
    },
  })

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select('*, party_roles(*)')
        .single()
      
      if (error) throw error
      return transformClient(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({
        title: "Client Updated",
        description: "The client has been successfully updated.",
      })
    },
    onError: (error) => {
      console.error('Update client error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update client. Please try again.",
      })
    },
  })

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({
        title: "Client Deleted",
        description: "The client has been successfully deleted.",
      })
    },
    onError: (error) => {
      console.error('Delete client error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete client. Please try again.",
      })
    },
  })

  return {
    clients,
    isLoading,
    error,
    createClient: createClientMutation.mutateAsync,
    updateClient: updateClientMutation.mutateAsync,
    deleteClient: deleteClientMutation.mutateAsync,
    isCreating: createClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending,
  }
}

export function useClient(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, party_roles(*)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return transformClient(data)
    },
    enabled: !!id,
  })
}



