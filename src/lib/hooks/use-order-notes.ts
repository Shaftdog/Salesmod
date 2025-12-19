/**
 * React Query hooks for order note management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type NoteType = 'general' | 'phone' | 'email' | 'meeting' | 'issue';

export interface OrderNote {
  id: string;
  order_id: string;
  note: string;
  note_type: NoteType;
  is_internal: boolean;
  created_by_id: string;
  created_at: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CreateNoteParams {
  note: string;
  note_type?: NoteType;
  is_internal?: boolean;
}

// Fetch notes for an order
async function fetchOrderNotes(orderId: string): Promise<OrderNote[]> {
  const response = await fetch(`/api/orders/${orderId}/notes`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch notes');
  }
  const result = await response.json();
  return result.data || [];
}

// Create a new note
async function createNote(orderId: string, params: CreateNoteParams): Promise<OrderNote> {
  const response = await fetch(`/api/orders/${orderId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create note');
  }

  const result = await response.json();
  return result.data;
}

// Delete a note
async function deleteNote(orderId: string, noteId: string): Promise<void> {
  const response = await fetch(`/api/orders/${orderId}/notes?noteId=${noteId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete note');
  }
}

/**
 * Hook to fetch order notes
 */
export function useOrderNotes(orderId: string) {
  return useQuery({
    queryKey: ['order-notes', orderId],
    queryFn: () => fetchOrderNotes(orderId),
    enabled: !!orderId,
  });
}

/**
 * Hook to create a note
 */
export function useCreateNote(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateNoteParams) => createNote(orderId, params),
    onSuccess: () => {
      // Invalidate the notes query to refetch
      queryClient.invalidateQueries({ queryKey: ['order-notes', orderId] });
    },
  });
}

/**
 * Hook to delete a note
 */
export function useDeleteNote(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => deleteNote(orderId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-notes', orderId] });
    },
  });
}
