/**
 * React hooks for cashflow data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CashflowTransaction,
  CashflowBoard,
  CashflowForecast,
  CreateCashflowTransactionInput,
  UpdateCashflowTransactionInput,
  MoveCashflowTransactionInput,
  CashflowListParams,
  TransactionType,
  CashflowStatus,
  BoardColumn,
} from '@/types/cashflow';

// =============================================
// QUERY HOOKS
// =============================================

/**
 * Fetch cashflow transactions list with filters
 */
export function useCashflowTransactions(params?: CashflowListParams) {
  return useQuery({
    queryKey: ['cashflow-transactions', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.transaction_type) {
        if (Array.isArray(params.transaction_type)) {
          params.transaction_type.forEach(t => searchParams.append('transaction_type', t));
        } else {
          searchParams.append('transaction_type', params.transaction_type);
        }
      }

      if (params?.status) {
        if (Array.isArray(params.status)) {
          params.status.forEach(s => searchParams.append('status', s));
        } else {
          searchParams.append('status', params.status);
        }
      }

      if (params?.board_column) {
        if (Array.isArray(params.board_column)) {
          params.board_column.forEach(c => searchParams.append('board_column', c));
        } else {
          searchParams.append('board_column', params.board_column);
        }
      }

      if (params?.category) searchParams.append('category', params.category);
      if (params?.client_id) searchParams.append('client_id', params.client_id);
      if (params?.date_from) searchParams.append('date_from', params.date_from);
      if (params?.date_to) searchParams.append('date_to', params.date_to);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.include_recurring !== undefined) {
        searchParams.append('include_recurring', params.include_recurring.toString());
      }
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params?.sort_order) searchParams.append('sort_order', params.sort_order);

      const response = await fetch(`/api/cashflow?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch cashflow transactions');
      return response.json();
    },
  });
}

/**
 * Fetch single cashflow transaction
 */
export function useCashflowTransaction(id: string | null) {
  return useQuery({
    queryKey: ['cashflow-transaction', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/cashflow/${id}`);
      if (!response.ok) throw new Error('Failed to fetch cashflow transaction');
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch cashflow board grouped by columns
 */
export function useCashflowBoard(params?: {
  transaction_type?: TransactionType;
  client_id?: string;
  category?: string;
  include_collected?: boolean;
}) {
  return useQuery({
    queryKey: ['cashflow-board', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.transaction_type) searchParams.append('transaction_type', params.transaction_type);
      if (params?.client_id) searchParams.append('client_id', params.client_id);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.include_collected !== undefined) {
        searchParams.append('include_collected', params.include_collected.toString());
      }

      const response = await fetch(`/api/cashflow/board?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch cashflow board');
      return response.json();
    },
  });
}

/**
 * Fetch cashflow forecast
 */
export function useCashflowForecast(params?: {
  weeks?: number;
  include_expenses?: boolean;
  include_income?: boolean;
  group_by?: 'week' | 'month';
}) {
  return useQuery({
    queryKey: ['cashflow-forecast', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.weeks) searchParams.append('weeks', params.weeks.toString());
      if (params?.include_expenses !== undefined) {
        searchParams.append('include_expenses', params.include_expenses.toString());
      }
      if (params?.include_income !== undefined) {
        searchParams.append('include_income', params.include_income.toString());
      }
      if (params?.group_by) searchParams.append('group_by', params.group_by);

      const response = await fetch(`/api/cashflow/forecast?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch cashflow forecast');
      return response.json();
    },
  });
}

// =============================================
// MUTATION HOOKS
// =============================================

/**
 * Create cashflow transaction (expense)
 */
export function useCreateCashflowTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCashflowTransactionInput) => {
      const response = await fetch('/api/cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create cashflow transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-board'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-forecast'] });
    },
  });
}

/**
 * Update cashflow transaction
 */
export function useUpdateCashflowTransaction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCashflowTransactionInput) => {
      const response = await fetch(`/api/cashflow/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update cashflow transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflow-transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-board'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-forecast'] });
    },
  });
}

/**
 * Delete cashflow transaction
 */
export function useDeleteCashflowTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cashflow/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete cashflow transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-board'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-forecast'] });
    },
  });
}

/**
 * Mark transaction as paid
 */
export function useMarkTransactionPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      actual_date?: string;
      notes?: string;
    }) => {
      const response = await fetch(`/api/cashflow/${params.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_date: params.actual_date,
          notes: params.notes,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark transaction as paid');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cashflow-transaction', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-board'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-forecast'] });
    },
  });
}

/**
 * Move transaction to different board column
 */
export function useMoveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MoveCashflowTransactionInput) => {
      const response = await fetch(`/api/cashflow/${data.transaction_id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move transaction');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cashflow-transaction', variables.transaction_id] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-board'] });
    },
  });
}

// =============================================
// OPTIMISTIC UPDATE HELPERS
// =============================================

/**
 * Optimistic update for board drag-and-drop
 */
export function useOptimisticBoardUpdate() {
  const queryClient = useQueryClient();

  return {
    onMutate: async (variables: MoveCashflowTransactionInput) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cashflow-board'] });

      // Snapshot previous value
      const previousBoard = queryClient.getQueryData(['cashflow-board']);

      // Optimistically update
      queryClient.setQueryData(['cashflow-board'], (old: any) => {
        if (!old?.data?.board) return old;

        const board = { ...old.data.board };
        const { transaction_id, target_column } = variables;

        // Find and move the transaction
        let transaction: any = null;
        for (const column of Object.keys(board)) {
          const index = board[column].findIndex((t: any) => t.id === transaction_id);
          if (index !== -1) {
            [transaction] = board[column].splice(index, 1);
            break;
          }
        }

        if (transaction) {
          transaction.board_column = target_column;
          board[target_column].push(transaction);
        }

        return {
          ...old,
          data: {
            ...old.data,
            board,
          },
        };
      });

      return { previousBoard };
    },
    onError: (err: any, variables: any, context: any) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['cashflow-board'], context.previousBoard);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['cashflow-board'] });
    },
  };
}
