/**
 * React hooks for property units data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { PropertyUnit } from '@/lib/types';

/**
 * Fetch all units for a property
 */
export function usePropertyUnits(propertyId?: string) {
  return useQuery({
    queryKey: ['property-units', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const response = await fetch(`/api/properties/${propertyId}/units`);
      if (!response.ok) {
        throw new Error('Failed to fetch property units');
      }
      return response.json() as Promise<PropertyUnit[]>;
    },
    enabled: !!propertyId,
  });
}

/**
 * Fetch a single unit with stats
 */
export function usePropertyUnit(propertyId?: string, unitId?: string) {
  return useQuery({
    queryKey: ['property-unit', propertyId, unitId],
    queryFn: async () => {
      if (!propertyId || !unitId) return null;
      
      const response = await fetch(`/api/properties/${propertyId}/units/${unitId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property unit');
      }
      return response.json() as Promise<PropertyUnit>;
    },
    enabled: !!propertyId && !!unitId,
  });
}

/**
 * Fetch prior work (USPAP 3-year) for a specific unit
 */
export function useUnitPriorWork(propertyId?: string, unitId?: string) {
  return useQuery({
    queryKey: ['unit-prior-work', propertyId, unitId],
    queryFn: async () => {
      if (!propertyId || !unitId) return null;
      
      const response = await fetch(`/api/properties/${propertyId}/units/${unitId}/prior-work`);
      if (!response.ok) {
        throw new Error('Failed to fetch unit prior work');
      }
      return response.json() as Promise<{
        unitId: string;
        unitIdentifier: string;
        propertyId: string;
        priorWorkCount: number;
        orders: any[];
        asOf: string;
        lookbackPeriod: string;
        lookbackStartDate: string;
      }>;
    },
    enabled: !!propertyId && !!unitId,
  });
}

/**
 * Create a new property unit
 */
export function useCreatePropertyUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      propertyId,
      unitIdentifier,
      unitType,
      props,
    }: {
      propertyId: string;
      unitIdentifier: string;
      unitType?: string;
      props?: Record<string, any>;
    }) => {
      const response = await fetch(`/api/properties/${propertyId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitIdentifier, unitType, props }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create unit');
      }

      return data as PropertyUnit;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-units', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: 'Unit Created',
        description: `Unit "${variables.unitIdentifier}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Unit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update a property unit
 */
export function useUpdatePropertyUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      propertyId,
      unitId,
      unitIdentifier,
      unitType,
      props,
    }: {
      propertyId: string;
      unitId: string;
      unitIdentifier?: string;
      unitType?: string;
      props?: Record<string, any>;
    }) => {
      const response = await fetch(`/api/properties/${propertyId}/units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitIdentifier, unitType, props }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update unit');
      }

      return data as PropertyUnit;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-units', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-unit', variables.propertyId, variables.unitId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: 'Unit Updated',
        description: 'Unit has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Unit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a property unit
 */
export function useDeletePropertyUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      propertyId,
      unitId,
    }: {
      propertyId: string;
      unitId: string;
    }) => {
      const response = await fetch(`/api/properties/${propertyId}/units/${unitId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        // Provide more context for 409 (conflict) errors
        if (response.status === 409) {
          throw new Error(data.message || data.error);
        }
        throw new Error(data.error || 'Failed to delete unit');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-units', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: 'Unit Deleted',
        description: 'Unit has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Unit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Backfill property units from existing orders
 */
export function useBackfillPropertyUnits() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      pageSize = 1000,
      start = 0,
      dryRun = false,
    }: {
      pageSize?: number;
      start?: number;
      dryRun?: boolean;
    }) => {
      const response = await fetch('/api/admin/properties/backfill-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageSize, start, dryRun }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to backfill units');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-units'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      if (!data.dryRun) {
        toast({
          title: 'Backfill Complete',
          description: `Created ${data.result.unitsCreated} units and linked ${data.result.ordersLinkedToUnits} orders.`,
        });
      } else {
        toast({
          title: 'Dry Run Complete',
          description: `Would create ${data.result.unitsCreated} units and link ${data.result.ordersLinkedToUnits} orders.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Backfill Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get backfill statistics
 */
export function useBackfillUnitsStatus() {
  return useQuery({
    queryKey: ['backfill-units-status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/properties/backfill-units');
      if (!response.ok) {
        throw new Error('Failed to fetch backfill status');
      }
      return response.json() as Promise<{
        statistics: {
          ordersWithUnitInfo: number;
          ordersLinkedToUnits: number;
          unlinkedOrders: number;
          totalPropertyUnits: number;
        };
        needsBackfill: boolean;
      }>;
    },
  });
}


