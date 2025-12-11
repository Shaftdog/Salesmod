/**
 * React Query hooks for order document management
 * Uses direct-to-storage uploads for large files (bypasses Vercel 4.5MB limit)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

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
  onProgress?: (progress: number) => void;
}

interface SignedUrlResponse {
  signedUrl: string;
  token: string;
  path: string;
  filePath: string;
  metadata: {
    orderId: string;
    tenantId: string;
    orgId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    documentType: string;
  };
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

// Get signed upload URL
async function getSignedUploadUrl(
  orderId: string,
  file: File,
  documentType: string
): Promise<SignedUrlResponse> {
  const response = await fetch(`/api/orders/${orderId}/documents/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      documentType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get upload URL');
  }

  const result = await response.json();
  return result.data;
}

// Upload file directly to Supabase Storage
async function uploadToStorage(
  signedUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// Confirm upload and record in database
async function confirmUpload(
  orderId: string,
  filePath: string,
  file: File,
  documentType: string
): Promise<OrderDocument> {
  const response = await fetch(`/api/orders/${orderId}/documents/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      documentType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to confirm upload');
  }

  const result = await response.json();
  return result.data;
}

// Upload documents using direct-to-storage approach
async function uploadDocuments({
  orderId,
  files,
  documentType,
  onProgress,
}: UploadDocumentParams): Promise<OrderDocument[]> {
  const uploadedDocuments: OrderDocument[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Calculate base progress for this file
    const fileBaseProgress = (i / totalFiles) * 100;
    const fileProgressWeight = 100 / totalFiles;

    // Step 1: Get signed upload URL
    const signedUrlData = await getSignedUploadUrl(orderId, file, documentType);

    // Step 2: Upload directly to Supabase Storage
    await uploadToStorage(signedUrlData.signedUrl, file, (fileProgress) => {
      if (onProgress) {
        // Weight the upload at 90% of the file's progress, save 10% for confirm
        const overallProgress = fileBaseProgress + (fileProgress * 0.9 * fileProgressWeight) / 100;
        onProgress(Math.round(overallProgress));
      }
    });

    // Step 3: Confirm upload and record in database
    const document = await confirmUpload(orderId, signedUrlData.filePath, file, documentType);
    uploadedDocuments.push(document);

    // Report file complete
    if (onProgress) {
      const overallProgress = ((i + 1) / totalFiles) * 100;
      onProgress(Math.round(overallProgress));
    }
  }

  return uploadedDocuments;
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

// Hook to upload documents with progress tracking
export function useUploadDocuments() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (params: Omit<UploadDocumentParams, 'onProgress'>) =>
      uploadDocuments({
        ...params,
        onProgress: setUploadProgress,
      }),
    onSuccess: (_, variables) => {
      // Invalidate the documents query to refetch
      queryClient.invalidateQueries({ queryKey: ['order-documents', variables.orderId] });
      setUploadProgress(0);
    },
    onError: () => {
      setUploadProgress(0);
    },
  });

  const reset = useCallback(() => {
    setUploadProgress(0);
    mutation.reset();
  }, [mutation]);

  return {
    ...mutation,
    uploadProgress,
    reset,
  };
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
