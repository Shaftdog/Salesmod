/**
 * React Query hooks for Resource Tasks Kanban Board
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import type {
  ResourceTaskKanbanData,
  ResourceTaskColumn,
  ResourceTaskDropInput,
} from '@/types/production';

// ============================================================================
// RESOURCE TASKS KANBAN
// ============================================================================

/**
 * Fetch resource tasks grouped by kanban columns
 */
export function useResourceTasksKanban(assignedTo?: string) {
  return useQuery({
    queryKey: ['resource-tasks-kanban', assignedTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (assignedTo) {
        params.set('assigned_to', assignedTo);
      }

      const url = `/api/production/resource-tasks${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch resource tasks');
      }

      return response.json() as Promise<ResourceTaskKanbanData>;
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 1 minute
  });
}

/**
 * Move a task to a new kanban column
 */
export function useMoveResourceTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: ResourceTaskDropInput) => {
      const response = await fetch(`/api/production/resource-tasks/${input.task_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_column: input.target_column,
          issue_description: input.issue_description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move task');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['resource-tasks-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['production-cards'] });
      queryClient.invalidateQueries({ queryKey: ['production-board'] });

      toast({
        title: 'Task Moved',
        description: data.message || 'Task has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to move task.',
      });
    },
  });
}

/**
 * Get column label for display
 */
export function getColumnLabel(column: ResourceTaskColumn): string {
  const labels: Record<ResourceTaskColumn, string> = {
    NOT_STARTED: 'Not Started',
    NEXT_DAY: 'Next Day',
    TOMORROW: 'Tomorrow',
    TODAY: 'Today',
    OVERDUE: 'Overdue',
    STARTED: 'Started',
    ISSUES: 'Issues',
    IMPEDED: 'Impeded',
    CORRECTION: 'Correction',
    COMPLETED: 'Completed',
  };
  return labels[column];
}

/**
 * Check if a column allows drops
 */
export function isDroppableColumn(column: ResourceTaskColumn): boolean {
  // OVERDUE is read-only - tasks become overdue automatically
  return column !== 'OVERDUE';
}
