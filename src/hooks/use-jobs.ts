/**
 * React hooks for Jobs management
 * Provides queries and mutations for the Jobs system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Job,
  JobTask,
  JobMetrics,
  CreateJobRequest,
  UpdateJobRequest,
  CreateTaskRequest,
  GetJobResponse,
  ListJobsResponse,
  ListJobTasksResponse,
  CreateJobResponse,
  CancelJobResponse,
} from '@/types/jobs';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const jobsKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobsKeys.all, 'list'] as const,
  list: (filters: string) => [...jobsKeys.lists(), filters] as const,
  details: () => [...jobsKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobsKeys.details(), id] as const,
  tasks: (id: string) => [...jobsKeys.detail(id), 'tasks'] as const,
  metrics: (id: string) => [...jobsKeys.detail(id), 'metrics'] as const,
};

// ============================================================================
// JOBS QUERIES
// ============================================================================

/**
 * Fetch list of jobs with optional status filter
 */
export function useJobs(status?: string, limit = 50, offset = 0) {
  const filterKey = status || 'all';

  return useQuery({
    queryKey: jobsKeys.list(filterKey),
    queryFn: async (): Promise<ListJobsResponse> => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/agent/jobs?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch jobs');
      }

      return response.json();
    },
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Fetch single job with metrics and recent tasks
 */
export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: jobsKeys.detail(id || ''),
    queryFn: async (): Promise<GetJobResponse> => {
      if (!id) throw new Error('Job ID is required');

      const response = await fetch(`/api/agent/jobs/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch job');
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 5000, // 5 seconds
  });
}

/**
 * Fetch tasks for a job
 */
export function useJobTasks(
  jobId: string | undefined,
  status?: string,
  batch?: number,
  limit = 100
) {
  return useQuery({
    queryKey: [...jobsKeys.tasks(jobId || ''), status, batch],
    queryFn: async (): Promise<ListJobTasksResponse> => {
      if (!jobId) throw new Error('Job ID is required');

      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (batch !== undefined) params.set('batch', batch.toString());
      params.set('limit', limit.toString());

      const response = await fetch(
        `/api/agent/jobs/${jobId}/tasks?${params.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch tasks');
      }

      return response.json();
    },
    enabled: !!jobId,
    staleTime: 5000,
  });
}

/**
 * Fetch active (running) jobs
 */
export function useActiveJobs() {
  return useJobs('running');
}

/**
 * Fetch pending jobs
 */
export function usePendingJobs() {
  return useJobs('pending');
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new job
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateJobRequest
    ): Promise<CreateJobResponse> => {
      const response = await fetch('/api/agent/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create job');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate jobs lists
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });

      toast.success('Job created successfully', {
        description: `${data.initial_tasks_created} tasks created`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create job', {
        description: error.message,
      });
    },
  });
}

/**
 * Update a job
 */
export function useUpdateJob(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateJobRequest): Promise<{ job: Job }> => {
      const response = await fetch(`/api/agent/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update job');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate job detail and lists
      queryClient.invalidateQueries({ queryKey: jobsKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });

      toast.success('Job updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update job', {
        description: error.message,
      });
    },
  });
}

/**
 * Pause a job
 */
export function usePauseJob(jobId: string) {
  const updateJob = useUpdateJob(jobId);

  return useMutation({
    mutationFn: async () => {
      return updateJob.mutateAsync({ status: 'paused' });
    },
  });
}

/**
 * Resume a job
 */
export function useResumeJob(jobId: string) {
  const updateJob = useUpdateJob(jobId);

  return useMutation({
    mutationFn: async () => {
      return updateJob.mutateAsync({ status: 'running' });
    },
  });
}

/**
 * Cancel a job
 */
export function useCancelJob(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<CancelJobResponse> => {
      const response = await fetch(`/api/agent/jobs/${jobId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel job');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });

      toast.success('Job cancelled', {
        description: `${data.tasks_skipped} tasks skipped`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to cancel job', {
        description: error.message,
      });
    },
  });
}

/**
 * Delete a job (soft delete via cancel)
 */
export function useDeleteJob(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await fetch(`/api/agent/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete job');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });

      toast.success('Job deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete job', {
        description: error.message,
      });
    },
  });
}

/**
 * Create tasks for a job
 */
export function useCreateJobTasks(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      tasks: CreateTaskRequest[]
    ): Promise<{ tasks: JobTask[]; count: number }> => {
      const response = await fetch(`/api/agent/jobs/${jobId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create tasks');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.tasks(jobId) });
      queryClient.invalidateQueries({ queryKey: jobsKeys.detail(jobId) });

      toast.success('Tasks created', {
        description: `${data.count} tasks added to job`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create tasks', {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Get job status color
 */
export function useJobStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-gray-500',
    running: 'bg-blue-500',
    paused: 'bg-yellow-500',
    succeeded: 'bg-green-500',
    failed: 'bg-red-500',
    cancelled: 'bg-gray-400',
  };

  return colorMap[status] || 'bg-gray-500';
}

/**
 * Get job progress percentage
 */
export function useJobProgress(job: Job | undefined): number {
  if (!job) return 0;

  if (job.cards_created === 0) return 0;

  return Math.round((job.cards_executed / job.cards_created) * 100);
}

/**
 * Calculate approval rate
 */
export function useApprovalRate(job: Job | undefined): number {
  if (!job || job.cards_created === 0) return 0;

  return Math.round((job.cards_approved / job.cards_created) * 100);
}
