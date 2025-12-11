/**
 * React Query hooks for order document management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface OrderDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploaded_by: string;
  uploader?: { full_name: string } | null;
  url?: string | null;
}

interface UploadDocumentParams {
  orderId: string;
  files: File[];
  documentType: string;
}

// Fetch documents for an order
async function fetchOrderDocuments(orderId: string): Promise<OrderDocument[]> {
  const response = await fetch(`/api/orders/${orderId}/documents`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch documents');
  }
  const result = await response.json();
  return result.data || [];
}

// Upload documents
async function uploadDocuments({ orderId, files, documentType }: UploadDocumentParams): Promise<OrderDocument[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('document_type', documentType);

  const response = await fetch(`/api/orders/${orderId}/documents`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload documents');
  }

  const result = await response.json();
  return result.data || [];
}

// Delete a document
async function deleteDocument(orderId: string, documentId: string): Promise<void> {
  const response = await fetch(`/api/orders/${orderId}/documents?documentId=${documentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete document');
  }
}

// Hook to fetch order documents
export function useOrderDocuments(orderId: string) {
  return useQuery({
    queryKey: ['order-documents', orderId],
    queryFn: () => fetchOrderDocuments(orderId),
    enabled: !!orderId,
  });
}

// Hook to upload documents
export function useUploadDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocuments,
    onSuccess: (_, variables) => {
      // Invalidate the documents query to refetch
      queryClient.invalidateQueries({ queryKey: ['order-documents', variables.orderId] });
    },
  });
}

// Hook to delete a document
export function useDeleteDocument(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(orderId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-documents', orderId] });
    },
  });
}
