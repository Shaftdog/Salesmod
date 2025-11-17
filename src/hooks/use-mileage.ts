import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MileageLog } from '@/lib/types';
import { useToast } from './use-toast';

interface MileageFilters {
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  purpose?: string;
  isReimbursed?: boolean;
}

export function useMileageLogs(filters?: MileageFilters) {
  return useQuery({
    queryKey: ['mileage-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.resourceId) params.append('resourceId', filters.resourceId);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.purpose) params.append('purpose', filters.purpose);
      if (filters?.isReimbursed !== undefined) params.append('isReimbursed', String(filters.isReimbursed));

      const response = await fetch(`/api/field-services/mileage?${params}`);
      if (!response.ok) throw new Error('Failed to fetch mileage logs');
      const data = await response.json();
      return data.mileageLogs as MileageLog[];
    },
  });
}

export function useCreateMileageLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (log: Partial<MileageLog>) => {
      const response = await fetch('/api/field-services/mileage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      if (!response.ok) throw new Error('Failed to create mileage log');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage-logs'] });
      toast({ title: 'Mileage logged', description: 'Mileage log created successfully' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });
}

export function useUpdateMileageLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MileageLog> & { id: string }) => {
      const response = await fetch(`/api/field-services/mileage/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update mileage log');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage-logs'] });
      toast({ title: 'Updated', description: 'Mileage log updated' });
    },
  });
}

export function useTotalMileage(resourceId: string, dateFrom: string, dateTo: string) {
  const { data: logs = [] } = useMileageLogs({ resourceId, dateFrom, dateTo });

  const businessMiles = logs
    .filter(l => l.purpose === 'business')
    .reduce((sum, l) => sum + (l.distanceMiles || 0), 0);

  const totalReimbursement = logs
    .filter(l => l.isBillable && !l.isReimbursed)
    .reduce((sum, l) => sum + (l.reimbursementAmount || 0), 0);

  return {
    totalMiles: logs.reduce((sum, l) => sum + (l.distanceMiles || 0), 0),
    businessMiles,
    personalMiles: logs.filter(l => l.purpose === 'personal').reduce((sum, l) => sum + (l.distanceMiles || 0), 0),
    totalReimbursement,
    unreimbursedCount: logs.filter(l => !l.isReimbursed).length,
  };
}
