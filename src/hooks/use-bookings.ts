import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Booking, BookingStatus, BookingType } from '@/lib/types';
import { useToast } from './use-toast';

interface BookingFilters {
  resourceId?: string;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  orderId?: string;
  territoryId?: string;
}

/**
 * Get list of bookings with optional filters
 */
export function useBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.resourceId) params.append('resourceId', filters.resourceId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.orderId) params.append('orderId', filters.orderId);
      if (filters?.territoryId) params.append('territoryId', filters.territoryId);

      const response = await fetch(`/api/field-services/bookings?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch bookings');
      }
      const data = await response.json();
      return data.bookings as Booking[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get a single booking by ID
 */
export function useBooking(id: string | null) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: async () => {
      const response = await fetch(`/api/field-services/bookings/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch booking');
      }
      const data = await response.json();
      return data.booking as Booking;
    },
    enabled: !!id,
  });
}

/**
 * Get bookings for a specific resource
 */
export function useResourceBookings(resourceId: string | null, dateRange?: { start: string; end: string }) {
  return useBookings({
    resourceId: resourceId || undefined,
    startDate: dateRange?.start,
    endDate: dateRange?.end,
  });
}

/**
 * Get bookings for a specific date range
 */
export function useDateRangeBookings(startDate: string, endDate: string) {
  return useBookings({
    startDate,
    endDate,
  });
}

/**
 * Get today's bookings
 */
export function useTodayBookings() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useBookings({
    startDate: today.toISOString(),
    endDate: tomorrow.toISOString(),
  });
}

/**
 * Create a new booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (booking: Partial<Booking>) => {
      const response = await fetch('/api/field-services/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });

      const hasConflicts = data.conflicts && data.conflicts.length > 0;
      toast({
        title: hasConflicts ? 'Booking Created with Conflicts' : 'Booking Created',
        description: data.message,
        variant: hasConflicts ? 'destructive' : 'default',
      });
    },
    onError: (error: any) => {
      console.error('Create booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create booking.',
      });
    },
  });
}

/**
 * Update a booking
 */
export function useUpdateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Booking> & { id: string }) => {
      const response = await fetch(`/api/field-services/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update booking');
      }

      const data = await response.json();
      return data.booking as Booking;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', data.id] });
      toast({
        title: 'Booking Updated',
        description: 'Booking has been updated successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Update booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update booking.',
      });
    },
  });
}

/**
 * Cancel a booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const params = new URLSearchParams();
      if (reason) params.append('reason', reason);

      const response = await fetch(`/api/field-services/bookings/${id}?${params}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel booking');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Booking Cancelled',
        description: 'Booking has been cancelled successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Cancel booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to cancel booking.',
      });
    },
  });
}

/**
 * Start a booking (mark as in progress)
 */
export function useStartBooking() {
  const { mutateAsync: updateBooking } = useUpdateBooking();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateBooking({
        id,
        status: 'in_progress',
        actualStart: new Date().toISOString(),
      });
    },
  });
}

/**
 * Complete a booking
 */
export function useCompleteBooking() {
  const { mutateAsync: updateBooking } = useUpdateBooking();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      completionNotes?: string;
      actualMileage?: number;
      customerRating?: number;
      customerFeedback?: string;
    }) => {
      const { id, ...data } = params;
      return updateBooking({
        id,
        status: 'completed',
        actualEnd: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        ...data,
      });
    },
  });
}

/**
 * Auto-assign a resource to a booking
 */
export function useAutoAssign() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      propertyZip: string;
      scheduledStart: string;
      scheduledEnd: string;
      requiredSkills?: string[];
      orderType?: string;
    }) => {
      const response = await fetch('/api/field-services/bookings/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to auto-assign');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      if (data.resourceId) {
        toast({
          title: 'Resource Assigned',
          description: data.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'No Resource Available',
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      console.error('Auto-assign error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to auto-assign resource.',
      });
    },
  });
}

/**
 * Reschedule a booking
 */
export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutateAsync: createBooking } = useCreateBooking();
  const { mutateAsync: updateBooking } = useUpdateBooking();

  return useMutation({
    mutationFn: async (params: {
      originalBookingId: string;
      newScheduledStart: string;
      newScheduledEnd: string;
      rescheduleReason: string;
    }) => {
      const { originalBookingId, newScheduledStart, newScheduledEnd, rescheduleReason } = params;

      // Get original booking
      const response = await fetch(`/api/field-services/bookings/${originalBookingId}`);
      const { booking: original } = await response.json();

      // Create new booking
      const newBooking = await createBooking({
        ...original,
        scheduledStart: newScheduledStart,
        scheduledEnd: newScheduledEnd,
        originalBookingId,
        rescheduleReason,
        rescheduleCount: (original.rescheduleCount || 0) + 1,
        status: 'scheduled',
      });

      // Update original to mark as rescheduled
      await updateBooking({
        id: originalBookingId,
        status: 'rescheduled',
        rescheduledBookingId: newBooking.booking.id,
      });

      return newBooking.booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Booking Rescheduled',
        description: 'New booking has been created.',
      });
    },
    onError: (error: any) => {
      console.error('Reschedule error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to reschedule booking.',
      });
    },
  });
}
