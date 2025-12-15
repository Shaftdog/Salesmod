import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ServiceTerritory, TerritoryType } from '@/lib/types';
import { useToast } from './use-toast';

interface TerritoryFilters {
  territoryType?: TerritoryType;
  isActive?: boolean;
}

/**
 * Get list of service territories
 */
export function useTerritories(filters?: TerritoryFilters) {
  return useQuery({
    queryKey: ['territories', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.territoryType) params.append('territoryType', filters.territoryType);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

      const response = await fetch(`/api/field-services/territories?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch territories');
      }
      const data = await response.json();
      return data.territories as ServiceTerritory[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get a single territory by ID
 */
export function useTerritory(id: string | null) {
  return useQuery({
    queryKey: ['territories', id],
    queryFn: async () => {
      const response = await fetch(`/api/field-services/territories/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch territory');
      }
      const data = await response.json();
      return data.territory as ServiceTerritory;
    },
    enabled: !!id,
  });
}

/**
 * Get only primary territories
 */
export function usePrimaryTerritories() {
  return useTerritories({
    territoryType: 'primary',
    isActive: true,
  });
}

/**
 * Create a new service territory
 */
export function useCreateTerritory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (territory: Partial<ServiceTerritory>) => {
      const response = await fetch('/api/field-services/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(territory),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create territory');
      }

      const data = await response.json();
      return data.territory as ServiceTerritory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      toast({
        title: 'Territory Created',
        description: 'New service territory has been created successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Create territory error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create territory.',
      });
    },
  });
}

/**
 * Update a service territory
 */
export function useUpdateTerritory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceTerritory> & { id: string }) => {
      const response = await fetch(`/api/field-services/territories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update territory');
      }

      const data = await response.json();
      return data.territory as ServiceTerritory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      queryClient.invalidateQueries({ queryKey: ['territories', data.id] });
      toast({
        title: 'Territory Updated',
        description: 'Territory has been updated successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Update territory error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update territory.',
      });
    },
  });
}

/**
 * Delete a territory
 */
export function useDeleteTerritory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/field-services/territories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete territory');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      toast({
        title: 'Territory Deleted',
        description: 'Territory has been removed successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Delete territory error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete territory.',
      });
    },
  });
}

/**
 * Find territory by ZIP code (client-side helper)
 */
export function useFindTerritoryByZip(zipCode: string | null) {
  const { data: territories } = useTerritories({ isActive: true });

  return useQuery({
    queryKey: ['territory-by-zip', zipCode],
    queryFn: () => {
      if (!territories || !zipCode) return null;

      const zip5 = zipCode.substring(0, 5);

      // Find territory that includes this zip code
      const territory = territories.find((t) =>
        t.zipCodes?.includes(zip5)
      );

      return territory || null;
    },
    enabled: !!territories && !!zipCode,
    staleTime: 1000 * 60 * 5,
  });
}
