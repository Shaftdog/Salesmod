import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

export function useOptimizeRoute() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      resourceId: string;
      planDate: string;
      bookingIds: string[];
      startLocation?: string;
    }) => {
      const response = await fetch('/api/field-services/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to optimize route');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['route-plans'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });

      toast({
        title: 'Route Optimized',
        description: `${data.waypointsCount} stops, ${Math.round(data.routePlan.totalDistanceMiles)} miles, ${Math.round(data.routePlan.totalDriveTimeMinutes)} min`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Optimization Failed',
        description: error.message,
      });
    },
  });
}

export function useTrackGPS() {
  return useMutation({
    mutationFn: async (params: {
      resourceId: string;
      coordinates: { lat: number; lng: number; accuracy?: number };
      bookingId?: string;
      speed?: number;
      heading?: number;
      altitude?: number;
      batteryLevel?: number;
    }) => {
      const response = await fetch('/api/field-services/gps/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error('Failed to track GPS');
      return await response.json();
    },
  });
}
