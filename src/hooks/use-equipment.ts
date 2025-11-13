import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Equipment, EquipmentAssignment, EquipmentStatus, EquipmentCondition } from '@/lib/types';
import { useToast } from './use-toast';

interface EquipmentFilters {
  equipmentType?: string;
  status?: EquipmentStatus;
  condition?: EquipmentCondition;
  available?: boolean;
}

/**
 * Get list of equipment with optional filters
 */
export function useEquipment(filters?: EquipmentFilters) {
  return useQuery({
    queryKey: ['equipment', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.equipmentType) params.append('equipmentType', filters.equipmentType);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.condition) params.append('condition', filters.condition);
      if (filters?.available !== undefined) params.append('available', String(filters.available));

      const response = await fetch(`/api/field-services/equipment?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch equipment');
      }
      const data = await response.json();
      return data.equipment as Equipment[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get a single equipment item by ID
 */
export function useEquipmentItem(id: string | null) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: async () => {
      const response = await fetch(`/api/field-services/equipment/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch equipment');
      }
      const data = await response.json();
      return data.equipment as Equipment;
    },
    enabled: !!id,
  });
}

/**
 * Get available equipment only
 */
export function useAvailableEquipment(equipmentType?: string) {
  return useEquipment({
    available: true,
    equipmentType,
  });
}

/**
 * Get equipment by type
 */
export function useEquipmentByType(equipmentType: string) {
  return useEquipment({ equipmentType });
}

/**
 * Get equipment needing maintenance
 */
export function useMaintenanceDueEquipment() {
  const { data: allEquipment = [] } = useEquipment();

  const maintenanceDue = allEquipment.filter((item) => {
    if (!item.nextMaintenanceDate) return false;
    const dueDate = new Date(item.nextMaintenanceDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 30; // Due within 30 days
  });

  return maintenanceDue;
}

/**
 * Create new equipment
 */
export function useCreateEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (equipment: Partial<Equipment>) => {
      const response = await fetch('/api/field-services/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create equipment');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: 'Equipment Created',
        description: 'Equipment item has been added to the catalog.',
      });
    },
    onError: (error: any) => {
      console.error('Create equipment error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create equipment.',
      });
    },
  });
}

/**
 * Update equipment
 */
export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Equipment> & { id: string }) => {
      const response = await fetch(`/api/field-services/equipment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update equipment');
      }

      const data = await response.json();
      return data.equipment as Equipment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', data.id] });
      toast({
        title: 'Equipment Updated',
        description: 'Equipment details have been updated.',
      });
    },
    onError: (error: any) => {
      console.error('Update equipment error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update equipment.',
      });
    },
  });
}

/**
 * Retire equipment (soft delete)
 */
export function useRetireEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/field-services/equipment/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to retire equipment');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: 'Equipment Retired',
        description: 'Equipment has been marked as retired.',
      });
    },
    onError: (error: any) => {
      console.error('Retire equipment error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to retire equipment.',
      });
    },
  });
}

/**
 * Get assignment history for equipment
 */
export function useEquipmentAssignments(equipmentId: string | null, activeOnly = false) {
  return useQuery({
    queryKey: ['equipment-assignments', equipmentId, activeOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeOnly) params.append('activeOnly', 'true');

      const response = await fetch(
        `/api/field-services/equipment/${equipmentId}/assignments?${params}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch assignments');
      }

      const data = await response.json();
      return data.assignments as EquipmentAssignment[];
    },
    enabled: !!equipmentId,
  });
}

/**
 * Check out equipment to a resource
 */
export function useCheckOutEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      equipmentId: string;
      resourceId: string;
      conditionAtCheckout?: string;
      notes?: string;
    }) => {
      const { equipmentId, ...body } = params;

      const response = await fetch(
        `/api/field-services/equipment/${equipmentId}/assignments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check out equipment');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      toast({
        title: 'Equipment Checked Out',
        description: data.message,
      });
    },
    onError: (error: any) => {
      console.error('Check-out error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to check out equipment.',
      });
    },
  });
}

/**
 * Check in equipment (return)
 */
export function useCheckInEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      equipmentId: string;
      assignmentId: string;
      conditionAtReturn?: string;
      notes?: string;
    }) => {
      const { equipmentId, ...body } = params;

      const response = await fetch(
        `/api/field-services/equipment/${equipmentId}/assignments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check in equipment');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      toast({
        title: 'Equipment Checked In',
        description: data.message,
      });
    },
    onError: (error: any) => {
      console.error('Check-in error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to check in equipment.',
      });
    },
  });
}

/**
 * Update equipment maintenance
 */
export function useUpdateMaintenance() {
  const { mutateAsync: updateEquipment } = useUpdateEquipment();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      lastMaintenanceDate: string;
      nextMaintenanceDate?: string;
      notes?: string;
    }) => {
      return updateEquipment({
        id: params.id,
        lastMaintenanceDate: params.lastMaintenanceDate,
        nextMaintenanceDate: params.nextMaintenanceDate,
        notes: params.notes,
        status: 'available', // Return to available after maintenance
      });
    },
  });
}
