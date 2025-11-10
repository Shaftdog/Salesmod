import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { BookableResource, ResourceType, EmploymentType } from '@/lib/types';
import { useToast } from './use-toast';

interface ResourceFilters {
  resourceType?: ResourceType;
  isBookable?: boolean;
  employmentType?: EmploymentType;
  territoryId?: string;
  skillId?: string;
}

/**
 * Get list of bookable resources with optional filters
 */
export function useResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.resourceType) params.append('resourceType', filters.resourceType);
      if (filters?.isBookable !== undefined) params.append('isBookable', String(filters.isBookable));
      if (filters?.employmentType) params.append('employmentType', filters.employmentType);
      if (filters?.territoryId) params.append('territoryId', filters.territoryId);
      if (filters?.skillId) params.append('skillId', filters.skillId);

      const response = await fetch(`/api/field-services/resources?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch resources');
      }
      const data = await response.json();
      return data.resources as BookableResource[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Get a single resource by ID with full details
 */
export function useResource(id: string | null) {
  return useQuery({
    queryKey: ['resources', id],
    queryFn: async () => {
      const response = await fetch(`/api/field-services/resources/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch resource');
      }
      const data = await response.json();
      return data.resource as BookableResource;
    },
    enabled: !!id,
  });
}

/**
 * Get only appraiser resources (filtered helper)
 */
export function useAppraisers(filters?: Omit<ResourceFilters, 'resourceType'>) {
  return useResources({
    ...filters,
    resourceType: 'appraiser',
  });
}

/**
 * Get available resources for a specific territory and skill
 */
export function useAvailableResources(territoryId?: string, skillId?: string) {
  return useResources({
    resourceType: 'appraiser',
    isBookable: true,
    territoryId,
    skillId,
  });
}

/**
 * Create or update a bookable resource
 */
export function useSaveResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (resource: Partial<BookableResource> & { id: string }) => {
      const response = await fetch('/api/field-services/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save resource');
      }

      const data = await response.json();
      return data.resource as BookableResource;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', data.id] });
      toast({
        title: 'Resource Saved',
        description: 'Resource has been saved successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Save resource error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to save resource.',
      });
    },
  });
}

/**
 * Update specific fields of a resource
 */
export function useUpdateResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BookableResource> & { id: string }) => {
      const response = await fetch(`/api/field-services/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update resource');
      }

      const data = await response.json();
      return data.resource as BookableResource;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', data.id] });
      toast({
        title: 'Resource Updated',
        description: 'Resource has been updated successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Update resource error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update resource.',
      });
    },
  });
}

/**
 * Delete a resource (soft delete)
 */
export function useDeleteResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/field-services/resources/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete resource');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({
        title: 'Resource Deleted',
        description: 'Resource has been removed successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Delete resource error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete resource.',
      });
    },
  });
}

/**
 * Toggle resource bookable status
 */
export function useToggleResourceBookable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isBookable }: { id: string; isBookable: boolean }) => {
      const response = await fetch(`/api/field-services/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBookable }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update resource');
      }

      const data = await response.json();
      return data.resource as BookableResource;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', data.id] });
      toast({
        title: data.isBookable ? 'Resource Enabled' : 'Resource Disabled',
        description: `Resource is now ${data.isBookable ? 'bookable' : 'unavailable'}.`,
      });
    },
    onError: (error: any) => {
      console.error('Toggle resource error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update resource status.',
      });
    },
  });
}
