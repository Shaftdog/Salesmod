import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TimeEntry, TimeEntryType } from '@/lib/types';
import { useToast } from './use-toast';

interface TimeEntryFilters {
  resourceId?: string;
  bookingId?: string;
  dateFrom?: string;
  dateTo?: string;
  entryType?: TimeEntryType;
}

/**
 * Get list of time entries with optional filters
 */
export function useTimeEntries(filters?: TimeEntryFilters) {
  return useQuery({
    queryKey: ['time-entries', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.resourceId) params.append('resourceId', filters.resourceId);
      if (filters?.bookingId) params.append('bookingId', filters.bookingId);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.entryType) params.append('entryType', filters.entryType);

      const response = await fetch(`/api/field-services/time-entries?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch time entries');
      }
      const data = await response.json();
      return data.timeEntries as TimeEntry[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get a single time entry by ID
 */
export function useTimeEntry(id: string | null) {
  return useQuery({
    queryKey: ['time-entries', id],
    queryFn: async () => {
      const response = await fetch(`/api/field-services/time-entries/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch time entry');
      }
      const data = await response.json();
      return data.timeEntry as TimeEntry;
    },
    enabled: !!id,
  });
}

/**
 * Get time entries for a specific resource
 */
export function useResourceTimeEntries(resourceId: string | null, dateRange?: { from: string; to: string }) {
  return useTimeEntries({
    resourceId: resourceId || undefined,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  });
}

/**
 * Get time entries for a specific booking
 */
export function useBookingTimeEntries(bookingId: string | null) {
  return useTimeEntries({
    bookingId: bookingId || undefined,
  });
}

/**
 * Get today's time entries for a resource
 */
export function useTodayTimeEntries(resourceId: string) {
  const today = new Date().toISOString().split('T')[0];

  return useTimeEntries({
    resourceId,
    dateFrom: today,
    dateTo: today,
  });
}

/**
 * Create new time entry
 */
export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (timeEntry: Partial<TimeEntry>) => {
      const response = await fetch('/api/field-services/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timeEntry),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create time entry');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({
        title: 'Time Entry Created',
        description: 'Time entry has been added.',
      });
    },
    onError: (error: any) => {
      console.error('Create time entry error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create time entry.',
      });
    },
  });
}

/**
 * Update time entry
 */
export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimeEntry> & { id: string }) => {
      const response = await fetch(`/api/field-services/time-entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update time entry');
      }

      const data = await response.json();
      return data.timeEntry as TimeEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries', data.id] });
      toast({
        title: 'Time Entry Updated',
        description: 'Time entry has been updated.',
      });
    },
    onError: (error: any) => {
      console.error('Update time entry error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update time entry.',
      });
    },
  });
}

/**
 * Delete time entry
 */
export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/field-services/time-entries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete time entry');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({
        title: 'Time Entry Deleted',
        description: 'Time entry has been removed.',
      });
    },
    onError: (error: any) => {
      console.error('Delete time entry error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete time entry.',
      });
    },
  });
}

/**
 * Get clock status for a resource
 */
export function useClockStatus(resourceId: string | null) {
  return useQuery({
    queryKey: ['clock-status', resourceId],
    queryFn: async () => {
      const response = await fetch(
        `/api/field-services/time-entries/clock?resourceId=${resourceId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get clock status');
      }

      return await response.json();
    },
    enabled: !!resourceId,
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Clock in
 */
export function useClockIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      resourceId: string;
      bookingId?: string;
      entryType?: TimeEntryType;
      location?: string;
      notes?: string;
    }) => {
      const response = await fetch('/api/field-services/time-entries/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'in',
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clock in');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['clock-status'] });
      toast({
        title: 'Clocked In',
        description: data.message,
      });
    },
    onError: (error: any) => {
      console.error('Clock in error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to clock in.',
      });
    },
  });
}

/**
 * Clock out
 */
export function useClockOut() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      resourceId: string;
      breakMinutes?: number;
      location?: string;
      notes?: string;
    }) => {
      const response = await fetch('/api/field-services/time-entries/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'out',
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clock out');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['clock-status'] });
      toast({
        title: 'Clocked Out',
        description: `${data.message} - ${data.duration} minutes`,
      });
    },
    onError: (error: any) => {
      console.error('Clock out error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to clock out.',
      });
    },
  });
}

/**
 * Calculate total hours for a date range
 */
export function useTotalHours(resourceId: string, dateFrom: string, dateTo: string) {
  const { data: entries = [] } = useTimeEntries({ resourceId, dateFrom, dateTo });

  const totalMinutes = entries.reduce((sum, entry) => {
    return sum + (entry.durationMinutes || 0);
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return {
    totalMinutes,
    totalHours,
    remainingMinutes,
    formattedTotal: `${totalHours}h ${remainingMinutes}m`,
  };
}

/**
 * Calculate billable vs non-billable hours
 */
export function useBillableHours(resourceId: string, dateFrom: string, dateTo: string) {
  const { data: entries = [] } = useTimeEntries({ resourceId, dateFrom, dateTo });

  const billableMinutes = entries
    .filter(e => e.isBillable)
    .reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);

  const nonBillableMinutes = entries
    .filter(e => !e.isBillable)
    .reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);

  return {
    billableMinutes,
    nonBillableMinutes,
    billableHours: Math.floor(billableMinutes / 60),
    nonBillableHours: Math.floor(nonBillableMinutes / 60),
    billablePercent: entries.length > 0 ? (billableMinutes / (billableMinutes + nonBillableMinutes)) * 100 : 0,
  };
}
