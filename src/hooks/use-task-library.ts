/**
 * React Query Hooks for Task Library
 *
 * Provides hooks for managing the reusable Task Library system
 * that allows tasks to be managed independently and linked to templates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';
import type {
  LibraryTask,
  LibraryTaskWithSubtasks,
  LibrarySubtask,
  TemplateLibraryTask,
  CreateLibraryTaskInput,
  UpdateLibraryTaskInput,
  CreateLibrarySubtaskInput,
  UpdateLibrarySubtaskInput,
  LibraryTaskFilters,
  LibraryTasksByStage,
  ProductionStage,
  PRODUCTION_STAGES,
} from '@/types/task-library';

// ============================================================================
// Query Keys
// ============================================================================

export const taskLibraryKeys = {
  all: ['task-library'] as const,
  lists: () => [...taskLibraryKeys.all, 'list'] as const,
  list: (filters?: LibraryTaskFilters) => [...taskLibraryKeys.lists(), filters] as const,
  byStage: () => [...taskLibraryKeys.all, 'by-stage'] as const,
  details: () => [...taskLibraryKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskLibraryKeys.details(), id] as const,
  subtasks: (taskId: string) => [...taskLibraryKeys.all, 'subtasks', taskId] as const,
  templateTasks: (templateId: string) => [...taskLibraryKeys.all, 'template', templateId] as const,
};

// ============================================================================
// List Hooks
// ============================================================================

/**
 * Fetch all library tasks with optional filters
 */
export function useTaskLibrary(filters?: LibraryTaskFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: taskLibraryKeys.list(filters),
    queryFn: async (): Promise<LibraryTaskWithSubtasks[]> => {
      let query = supabase
        .from('task_library')
        .select(`
          *,
          subtasks:task_library_subtasks(*)
        `)
        .order('stage')
        .order('sort_order');

      // Apply filters
      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Sort subtasks by sort_order
      return (data || []).map(task => ({
        ...task,
        subtasks: (task.subtasks || []).sort((a: LibrarySubtask, b: LibrarySubtask) => a.sort_order - b.sort_order),
      })) as LibraryTaskWithSubtasks[];
    },
  });
}

/**
 * Fetch library tasks grouped by stage
 */
export function useTaskLibraryByStage(activeOnly: boolean = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: [...taskLibraryKeys.byStage(), { activeOnly }],
    queryFn: async (): Promise<LibraryTasksByStage> => {
      let query = supabase
        .from('task_library')
        .select(`
          *,
          subtasks:task_library_subtasks(*)
        `)
        .order('stage')
        .order('sort_order');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Group by stage
      const stages: ProductionStage[] = [
        'INTAKE', 'SCHEDULING', 'SCHEDULED', 'INSPECTED',
        'FINALIZATION', 'READY_FOR_DELIVERY', 'DELIVERED',
        'CORRECTION', 'REVISION', 'WORKFILE'
      ];

      const grouped = stages.reduce((acc, stage) => {
        acc[stage] = (data || [])
          .filter((task: LibraryTask) => task.stage === stage)
          .map((task: any) => ({
            ...task,
            subtasks: (task.subtasks || []).sort((a: LibrarySubtask, b: LibrarySubtask) => a.sort_order - b.sort_order),
          }));
        return acc;
      }, {} as LibraryTasksByStage);

      return grouped;
    },
  });
}

// ============================================================================
// Detail Hooks
// ============================================================================

/**
 * Fetch a single library task with subtasks
 */
export function useLibraryTask(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: taskLibraryKeys.detail(id),
    queryFn: async (): Promise<LibraryTaskWithSubtasks> => {
      const { data, error } = await supabase
        .from('task_library')
        .select(`
          *,
          subtasks:task_library_subtasks(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        subtasks: (data.subtasks || []).sort((a: LibrarySubtask, b: LibrarySubtask) => a.sort_order - b.sort_order),
      } as LibraryTaskWithSubtasks;
    },
    enabled: !!id,
  });
}

// ============================================================================
// Mutation Hooks - Library Tasks
// ============================================================================

/**
 * Create a new library task
 */
export function useCreateLibraryTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateLibraryTaskInput): Promise<LibraryTask> => {
      // Get the current user's ID for org_id and created_by
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('You must be logged in to create tasks');
      }

      const { data, error } = await supabase
        .from('task_library')
        .insert({
          ...input,
          org_id: user.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as LibraryTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.all });
      toast({
        title: 'Task Created',
        description: 'The library task has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create library task.',
      });
    },
  });
}

/**
 * Update a library task
 */
export function useUpdateLibraryTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLibraryTaskInput & { id: string }): Promise<LibraryTask> => {
      const { data, error } = await supabase
        .from('task_library')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as LibraryTask;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.all });
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.detail(variables.id) });
      toast({
        title: 'Task Updated',
        description: 'The library task has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update library task.',
      });
    },
  });
}

/**
 * Delete (soft delete) a library task
 */
export function useDeleteLibraryTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('task_library')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.all });
      toast({
        title: 'Task Deleted',
        description: 'The library task has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete library task.',
      });
    },
  });
}

// ============================================================================
// Mutation Hooks - Library Subtasks
// ============================================================================

/**
 * Create a new library subtask
 */
export function useCreateLibrarySubtask() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateLibrarySubtaskInput): Promise<LibrarySubtask> => {
      const { data, error } = await supabase
        .from('task_library_subtasks')
        .insert(input)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as LibrarySubtask;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.all });
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.detail(variables.library_task_id) });
      toast({
        title: 'Subtask Created',
        description: 'The subtask has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create subtask.',
      });
    },
  });
}

/**
 * Update a library subtask
 */
export function useUpdateLibrarySubtask() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLibrarySubtaskInput & { id: string }): Promise<LibrarySubtask> => {
      const { data, error } = await supabase
        .from('task_library_subtasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as LibrarySubtask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.all });
      toast({
        title: 'Subtask Updated',
        description: 'The subtask has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update subtask.',
      });
    },
  });
}

/**
 * Delete a library subtask
 */
export function useDeleteLibrarySubtask() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('task_library_subtasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.all });
      toast({
        title: 'Subtask Deleted',
        description: 'The subtask has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete subtask.',
      });
    },
  });
}

// ============================================================================
// Template-Library Integration Hooks
// ============================================================================

/**
 * Get library tasks linked to a template
 */
export function useTemplateLibraryTasks(templateId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: taskLibraryKeys.templateTasks(templateId),
    queryFn: async (): Promise<(TemplateLibraryTask & { library_task: LibraryTaskWithSubtasks })[]> => {
      const { data, error } = await supabase
        .from('template_library_tasks')
        .select(`
          *,
          library_task:task_library(
            *,
            subtasks:task_library_subtasks(*)
          )
        `)
        .eq('template_id', templateId)
        .order('sort_order');

      if (error) {
        throw error;
      }

      return (data || []).map((item: any) => ({
        ...item,
        library_task: {
          ...item.library_task,
          subtasks: (item.library_task?.subtasks || []).sort(
            (a: LibrarySubtask, b: LibrarySubtask) => a.sort_order - b.sort_order
          ),
        },
      }));
    },
    enabled: !!templateId,
  });
}

/**
 * Add library tasks to a template
 */
export function useAddLibraryTasksToTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      templateId,
      libraryTaskIds,
      startSortOrder = 0,
    }: {
      templateId: string;
      libraryTaskIds: string[];
      startSortOrder?: number;
    }): Promise<TemplateLibraryTask[]> => {
      const insertData = libraryTaskIds.map((taskId, index) => ({
        template_id: templateId,
        library_task_id: taskId,
        sort_order: startSortOrder + index,
      }));

      const { data, error } = await supabase
        .from('template_library_tasks')
        .insert(insertData)
        .select();

      if (error) {
        throw error;
      }

      return data as TemplateLibraryTask[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.templateTasks(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: ['production-templates'] });
      toast({
        title: 'Tasks Added',
        description: `${variables.libraryTaskIds.length} task(s) have been added to the template.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to add tasks to template.',
      });
    },
  });
}

/**
 * Remove a library task from a template
 */
export function useRemoveLibraryTaskFromTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      templateId,
      libraryTaskId,
    }: {
      templateId: string;
      libraryTaskId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('template_library_tasks')
        .delete()
        .eq('template_id', templateId)
        .eq('library_task_id', libraryTaskId);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.templateTasks(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: ['production-templates'] });
      toast({
        title: 'Task Removed',
        description: 'The task has been removed from the template.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to remove task from template.',
      });
    },
  });
}

/**
 * Reorder library tasks within a template
 */
export function useReorderTemplateLibraryTasks() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      taskOrders,
    }: {
      templateId: string;
      taskOrders: { id: string; sort_order: number }[];
    }): Promise<void> => {
      // Update each task's sort_order
      const updates = taskOrders.map(({ id, sort_order }) =>
        supabase
          .from('template_library_tasks')
          .update({ sort_order })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskLibraryKeys.templateTasks(variables.templateId) });
    },
  });
}
