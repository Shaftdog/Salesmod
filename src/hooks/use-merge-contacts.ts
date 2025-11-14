import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import type { DuplicateContact, ContactMergeResult } from '@/lib/contacts-merge';

/**
 * Hook to find potential duplicate contacts
 */
export function useDuplicateContacts(limit: number = 50) {
  return useQuery<{ duplicates: DuplicateContact[]; count: number }>({
    queryKey: ['contacts', 'duplicates', limit],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/merge?limit=${limit}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to find duplicate contacts');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to merge two contacts
 */
export function useMergeContacts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    ContactMergeResult,
    Error,
    { winnerId: string; loserId: string }
  >({
    mutationFn: async ({ winnerId, loserId }) => {
      const response = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winnerId, loserId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to merge contacts');
      }

      const data = await response.json();
      return data.result;
    },
    onSuccess: (data) => {
      // Invalidate all contact-related queries
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });

      toast({
        title: 'Contacts merged successfully',
        description: `Merged ${Object.values(data.counts).reduce((a, b) => a + b, 0)} related records`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Merge failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
