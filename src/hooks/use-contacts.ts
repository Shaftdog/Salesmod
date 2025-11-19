import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Contact } from '@/lib/types'
import { useToast } from './use-toast'
import { transformContact } from '@/lib/supabase/transforms'

// Query configuration constants
const CONTACTS_STALE_TIME_MS = 2 * 60 * 1000 // 2 minutes

/**
 * Hook to fetch contacts for the current organization
 *
 * Retrieves contacts with their associated client and party role data.
 * Results are ordered by primary status and last name.
 *
 * @param clientId - Optional client ID to filter contacts by specific client
 * @returns Query result containing contacts array, loading state, and error
 *
 * @example
 * ```tsx
 * // Get all contacts
 * const { data: contacts, isLoading } = useContacts()
 *
 * // Get contacts for specific client
 * const { data: clientContacts } = useContacts('client-123')
 * ```
 */
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
      
      // Only fallback if party_roles column doesn't exist (error code 42703)
      // Don't silently hide other real errors
      if (error) {
        // Check if this is a "column does not exist" error
        const isColumnError = error.code === '42703' || error.message?.includes('party_roles')

        if (isColumnError) {
          console.warn('party_roles column not found, falling back to query without it')
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
        }

        // Throw any remaining errors (either from fallback or non-column errors)
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
    staleTime: CONTACTS_STALE_TIME_MS,
  })
}

/**
 * Hook to fetch a single contact by ID
 *
 * Retrieves a specific contact with their associated client and party role data.
 *
 * @param id - The contact ID to fetch
 * @returns Query result containing the contact object, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: contact, isLoading } = useContact('contact-123')
 * ```
 */
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
      
      // Only fallback if party_roles column doesn't exist (error code 42703)
      if (error) {
        const isColumnError = error.code === '42703' || error.message?.includes('party_roles')

        if (isColumnError) {
          console.warn('party_roles column not found, falling back to query without it')
          const fallbackResult = await supabase
            .from('contacts')
            .select('*, clients!contacts_client_id_fkey(*)')
            .eq('id', id)
            .single()

          data = fallbackResult.data
          error = fallbackResult.error
        }

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

/**
 * Hook to create a new contact
 *
 * Creates a new contact in the database and automatically sets the org_id
 * from the current user's profile. Invalidates relevant queries on success.
 *
 * @returns Mutation object with mutate function to create contacts
 *
 * @example
 * ```tsx
 * const createContact = useCreateContact()
 *
 * createContact.mutate({
 *   client_id: 'client-123',
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   email: 'john@example.com'
 * })
 * ```
 */
export function useCreateContact() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const supabase = createClient()

  return useMutation({
    // Accept snake_case database format for insertion
    mutationFn: async (contact: Record<string, any>) => {
      // Get current user to set org_id
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get user's profile to get the correct org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        throw new Error('User profile not found')
      }

      // Ensure org_id is set for RLS policies
      // Use the profile's id as org_id (profiles.id is the organization identifier)
      const contactData = {
        ...contact,
        org_id: contact.org_id || profile.id,
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
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

/**
 * Hook to update an existing contact
 *
 * Updates a contact's fields in the database. Invalidates all relevant queries
 * on success to ensure UI stays in sync.
 *
 * @returns Mutation object with mutate function to update contacts
 *
 * @example
 * ```tsx
 * const updateContact = useUpdateContact()
 *
 * updateContact.mutate({
 *   id: 'contact-123',
 *   email: 'newemail@example.com',
 *   phone: '555-1234'
 * })
 * ```
 */
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

/**
 * Hook to delete a contact
 *
 * Permanently removes a contact from the database. Invalidates contact queries
 * on success.
 *
 * **Warning**: This is a destructive operation and cannot be undone.
 *
 * @returns Mutation object with mutate function to delete contacts
 *
 * @example
 * ```tsx
 * const deleteContact = useDeleteContact()
 *
 * deleteContact.mutate('contact-123')
 * ```
 */
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

