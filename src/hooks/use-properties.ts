import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Property, PropertyFilters, BackfillResult } from '@/lib/types';

/**
 * Hook to fetch properties with search and pagination
 */
export function useProperties(filters: PropertyFilters = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.city) params.append('city', filters.city);
      if (filters.state) params.append('state', filters.state);
      if (filters.zip) params.append('zip', filters.zip);
      if (filters.propertyType) params.append('propertyType', filters.propertyType);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/properties?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single property with related orders
 */
export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Property not found');
        }
        throw new Error('Failed to fetch property');
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch dynamic USPAP count for a property
 */
export function usePropertyPriorWork(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['property-prior-work', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('property_prior_work_count', {
        _property_id: id
      });

      if (error) {
        throw new Error('Failed to fetch prior work count');
      }

      return data || 0;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to trigger property backfill
 */
export function useBackfillProperties() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      orgId?: string;
      pageSize?: number;
      start?: number;
      dryRun?: boolean;
    }) => {
      const response = await fetch('/api/admin/properties/backfill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Backfill failed');
      }

      return response.json() as Promise<{ result: BackfillResult }>;
    },
    onSuccess: () => {
      // Invalidate properties queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property'] });
    },
  });
}

/**
 * Hook to create/update a property
 */
export function useUpsertProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyData: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      propertyType?: string;
      apn?: string;
      latitude?: number;
      longitude?: number;
      gla?: number;
      lotSize?: number;
      yearBuilt?: number;
      props?: any;
    }) => {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        throw new Error('Failed to upsert property');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate properties queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

/**
 * Hook to update a property
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<Property>) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update property');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate specific property and properties list
      queryClient.invalidateQueries({ queryKey: ['property', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

/**
 * Hook to delete a property
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete property');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate properties queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

/**
 * Hook to refresh USPAP cache for a property
 */
export function useRefreshUSPAPCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      const supabase = createClient();
      
      // Get fresh prior work count
      const { data: priorWork } = await supabase.rpc('property_prior_work_count', {
        _property_id: propertyId
      });

      // Get all orders for this property and update their USPAP cache
      const { data: orders } = await supabase
        .from('orders')
        .select('id, props')
        .eq('property_id', propertyId);

      if (orders && orders.length > 0) {
        // Update each order's USPAP cache
        const updates = orders.map(order => {
          const updatedProps = {
            ...(order.props || {}),
            uspap: {
              prior_work_3y: priorWork || 0,
              as_of: new Date().toISOString()
            }
          };
          
          return supabase
            .from('orders')
            .update({ props: updatedProps })
            .eq('id', order.id);
        });

        await Promise.all(updates);
      }

      return { priorWork: priorWork || 0 };
    },
    onSuccess: (_, propertyId) => {
      // Invalidate property and related queries
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-prior-work', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

/**
 * Hook to get backfill status and statistics
 */
export function useBackfillStatus(orgId?: string) {
  return useQuery({
    queryKey: ['backfill-status', orgId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (orgId) params.append('orgId', orgId);

      const response = await fetch(`/api/admin/properties/backfill?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch backfill status');
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
