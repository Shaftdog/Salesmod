import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import type { DuplicateClient, ClientMergeResult } from '@/lib/clients-merge';

/**
 * Hook to find potential duplicate clients
 */
export function useDuplicateClients(limit: number = 50) {
  return useQuery<{ duplicates: DuplicateClient[]; count: number }>({
    queryKey: ['clients', 'duplicates', limit],
    queryFn: async () => {
      const response = await fetch(`/api/clients/merge?limit=${limit}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to find duplicate clients');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to merge two clients
 */
export function useMergeClients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    ClientMergeResult,
    Error,
    { winnerId: string; loserId: string }
  >({
    mutationFn: async ({ winnerId, loserId }) => {
      const response = await fetch('/api/clients/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winnerId, loserId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to merge clients');
      }

      const data = await response.json();
      return data.result;
    },
    onSuccess: (data) => {
      // Invalidate all client-related queries
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });

      toast({
        title: 'Clients merged successfully',
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
