import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

interface TransferContactParams {
  contactId: string;
  newCompanyId: string;
  reason?: string;
}

/**
 * Hook to transfer a contact to a new company
 * Uses the database function for atomic transfer with history preservation
 */
export function useTransferContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ contactId, newCompanyId, reason }: TransferContactParams) => {
      // Call the database function for atomic transfer
      const { data, error } = await supabase.rpc('transfer_contact_company', {
        p_contact_id: contactId,
        p_new_company_id: newCompanyId,
        p_reason: reason || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-detail', variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-history', variables.contactId] });
      
      // Invalidate old and new company queries
      if (data.old_company_id) {
        queryClient.invalidateQueries({ queryKey: ['contacts', 'client', data.old_company_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['contacts', 'client', variables.newCompanyId] });

      toast({
        title: 'Contact Transferred',
        description: 'Contact has been successfully moved to the new company.',
      });
    },
    onError: (error: any) => {
      console.error('Transfer error:', error);
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Failed to transfer contact',
        variant: 'destructive',
      });
    },
  });
}


