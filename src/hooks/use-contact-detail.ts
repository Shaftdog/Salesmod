import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface ContactWithCompany {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  title: string | null;
  department: string | null;
  notes: string | null;
  is_primary: boolean;
  client_id: string | null;
  props: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    company_name: string;
    email: string;
    phone: string;
    domain?: string | null;
  } | null;
  activityCount: number;
}

export interface CompanyHistory {
  company_id: string;
  company_name: string;
  title: string | null;
  role: string;
  start_date: string;
  end_date: string | null;
  reason_for_leaving: string | null;
  is_primary: boolean;
}

/**
 * Hook to fetch detailed contact information with company and activity count
 */
export function useContactDetail(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['contact-detail', id],
    queryFn: async () => {
      // Fetch contact with explicit FK to avoid ambiguity
      let { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select(`
          *,
          clients!contacts_client_id_fkey(
            id,
            company_name,
            email,
            phone
          ),
          party_roles(*)
        `)
        .eq('id', id)
        .single();

      // Fallback if party_roles doesn't exist yet
      if (contactError) {
        const fallbackResult = await supabase
          .from('contacts')
          .select(`
            *,
            clients!contacts_client_id_fkey(
              id,
              company_name,
              email,
              phone
            )
          `)
          .eq('id', id)
          .single();
        
        contact = fallbackResult.data;
        contactError = fallbackResult.error;
        
        if (contactError) throw contactError;
      }

      // Normalize the clients FK result to 'client' for compatibility
      const normalizedContact = {
        ...contact,
        client: contact?.clients || null,
      };
      delete normalizedContact.clients;

      // Get activity count
      const { count: activityCount } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', id);

      return {
        ...normalizedContact,
        activityCount: activityCount || 0,
      } as ContactWithCompany;
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to fetch contact's company history
 */
export function useContactHistory(contactId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['contact-history', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_companies')
        .select(`
          company_id,
          title,
          role,
          start_date,
          end_date,
          reason_for_leaving,
          is_primary,
          company:clients(
            id,
            company_name
          )
        `)
        .eq('contact_id', contactId)
        .order('start_date', { ascending: false });

      // If table doesn't exist yet (404), return empty array
      if (error && error.code === 'PGRST204') {
        return [] as CompanyHistory[];
      }

      if (error) throw error;

      return (data || []).map((item: any) => ({
        company_id: item.company_id,
        company_name: item.company?.company_name || 'Unknown Company',
        title: item.title,
        role: item.role,
        start_date: item.start_date,
        end_date: item.end_date,
        reason_for_leaving: item.reason_for_leaving,
        is_primary: item.is_primary,
      })) as CompanyHistory[];
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: false, // Don't retry if table doesn't exist
  });
}

