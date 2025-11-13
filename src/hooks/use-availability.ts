import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResourceAvailability, AvailabilityType } from '@/lib/types';
import { useToast } from './use-toast';

interface AvailabilityFilters {
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  availabilityType?: AvailabilityType;
}

/**
 * Get list of availability entries with optional filters
 */
export function useAvailability(filters?: AvailabilityFilters) {
  return useQuery({
    queryKey: ['availability', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.resourceId) params.append('resourceId', filters.resourceId);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.availabilityType) params.append('availabilityType', filters.availabilityType);

      const response = await fetch(`/api/field-services/availability?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch availability');
      }
      const data = await response.json();
      return data.availability as ResourceAvailability[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get a single availability entry by ID
 */
export function useAvailabilityEntry(id: string | null) {
  return useQuery({
    queryKey: ['availability', id],
    queryFn: async () => {
      const response = await fetch(`/api/field-services/availability/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch availability');
      }
      const data = await response.json();
      return data.availability as ResourceAvailability;
    },
    enabled: !!id,
  });
}

/**
 * Get availability for a specific resource
 */
export function useResourceAvailability(resourceId: string | null, dateRange?: { from: string; to: string }) {
  return useAvailability({
    resourceId: resourceId || undefined,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  });
}

/**
 * Get time-off requests
 */
export function useTimeOffRequests(resourceId?: string) {
  return useAvailability({
    resourceId,
    availabilityType: 'time_off',
  });
}

/**
 * Get pending time-off requests (not approved)
 */
export function usePendingTimeOffRequests() {
  const { data: allTimeOff = [] } = useTimeOffRequests();
  return allTimeOff.filter(entry => !entry.isApproved);
}

/**
 * Get blocked time entries
 */
export function useBlockedTime(resourceId?: string) {
  return useAvailability({
    resourceId,
    availabilityType: 'blocked',
  });
}

/**
 * Create new availability entry
 */
export function useCreateAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (availability: Partial<ResourceAvailability>) => {
      const response = await fetch('/api/field-services/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availability),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create availability');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast({
        title: 'Availability Created',
        description: 'Availability entry has been added.',
      });
    },
    onError: (error: any) => {
      console.error('Create availability error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create availability.',
      });
    },
  });
}

/**
 * Update availability entry
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ResourceAvailability> & { id: string }) => {
      const response = await fetch(`/api/field-services/availability/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update availability');
      }

      const data = await response.json();
      return data.availability as ResourceAvailability;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['availability', data.id] });
      toast({
        title: 'Availability Updated',
        description: 'Availability entry has been updated.',
      });
    },
    onError: (error: any) => {
      console.error('Update availability error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update availability.',
      });
    },
  });
}

/**
 * Delete availability entry
 */
export function useDeleteAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/field-services/availability/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete availability');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast({
        title: 'Availability Deleted',
        description: 'Availability entry has been removed.',
      });
    },
    onError: (error: any) => {
      console.error('Delete availability error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete availability.',
      });
    },
  });
}

/**
 * Request time off
 */
export function useRequestTimeOff() {
  const { mutateAsync: createAvailability } = useCreateAvailability();

  return useMutation({
    mutationFn: async (params: {
      resourceId: string;
      dateFrom: string;
      dateTo: string;
      reason: string;
      notes?: string;
    }) => {
      return createAvailability({
        resourceId: params.resourceId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        availabilityType: 'time_off',
        reason: params.reason,
        notes: params.notes,
        isApproved: false, // Requires approval
      });
    },
  });
}

/**
 * Approve time-off request
 */
export function useApproveTimeOff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutateAsync: updateAvailability } = useUpdateAvailability();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      approvedBy: string;
    }) => {
      return updateAvailability({
        id: params.id,
        isApproved: true,
        approvedBy: params.approvedBy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast({
        title: 'Time Off Approved',
        description: 'Time-off request has been approved.',
      });
    },
    onError: (error: any) => {
      console.error('Approve time off error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to approve time off.',
      });
    },
  });
}

/**
 * Block time on calendar
 */
export function useBlockTime() {
  const { mutateAsync: createAvailability } = useCreateAvailability();

  return useMutation({
    mutationFn: async (params: {
      resourceId: string;
      dateFrom: string;
      dateTo: string;
      timeFrom?: string;
      timeTo?: string;
      reason: string;
      notes?: string;
    }) => {
      return createAvailability({
        resourceId: params.resourceId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        timeFrom: params.timeFrom,
        timeTo: params.timeTo,
        availabilityType: 'blocked',
        reason: params.reason,
        notes: params.notes,
        isApproved: true,
      });
    },
  });
}

/**
 * Set recurring availability
 */
export function useSetRecurringAvailability() {
  const { mutateAsync: createAvailability } = useCreateAvailability();

  return useMutation({
    mutationFn: async (params: {
      resourceId: string;
      dateFrom: string;
      dateTo: string;
      timeFrom: string;
      timeTo: string;
      recurrencePattern: any;
      notes?: string;
    }) => {
      return createAvailability({
        resourceId: params.resourceId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        timeFrom: params.timeFrom,
        timeTo: params.timeTo,
        availabilityType: 'available',
        isRecurring: true,
        recurrencePattern: params.recurrencePattern,
        notes: params.notes,
        isApproved: true,
      });
    },
  });
}
