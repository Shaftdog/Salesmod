/**
 * P1.1: Documents Library - CRUD Service
 * Core operations for document management
 */

import { createClient } from '@/lib/supabase/server';
import {
  Document,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentListOptions,
  DocumentStats,
  DocumentCategory,
  DocumentSourceType,
  ExtractionStatus,
  mapRowToDocument,
  isExtractableMimeType,
  documentCategories,
  documentSourceTypes,
  extractionStatuses,
} from './types';

const BUCKET_NAME = 'order-documents';

/**
 * Create a new document record
 */
export async function createDocument(
  tenantId: string,
  userId: string,
  input: CreateDocumentInput
): Promise<Document> {
  const supabase = await createClient();

  const extractionStatus = isExtractableMimeType(input.mimeType)
    ? 'pending'
    : 'skipped';

  const { data, error } = await supabase
    .from('documents')
    .insert({
      tenant_id: tenantId,
      file_name: input.fileName,
      file_path: input.filePath,
      file_size: input.fileSize,
      mime_type: input.mimeType,
      title: input.title || input.fileName,
      description: input.description || null,
      category: input.category || 'other',
      tags: input.tags || [],
      source_type: input.sourceType,
      order_document_id: input.orderDocumentId || null,
      gmail_message_id: input.gmailMessageId || null,
      gmail_attachment_id: input.gmailAttachmentId || null,
      uploaded_by: userId,
      extraction_status: extractionStatus,
    })
    .select()
    .single();

  if (error) {
    console.error('[Documents] Failed to create document:', error);
    throw error;
  }

  // Queue for extraction if applicable
  if (extractionStatus === 'pending') {
    try {
      await supabase.rpc('queue_document_extraction', {
        p_document_id: data.id,
        p_priority: 0,
      });
    } catch (queueError) {
      console.error('[Documents] Failed to queue for extraction:', queueError);
      // Don't fail the create, extraction can be retried later
    }
  }

  return mapRowToDocument(data);
}

/**
 * Get document by ID
 */
export async function getDocument(documentId: string): Promise<Document | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[Documents] Failed to get document:', error);
    throw error;
  }

  return mapRowToDocument(data);
}

/**
 * Update document metadata
 */
export async function updateDocument(
  documentId: string,
  input: UpdateDocumentInput
): Promise<Document> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.tags !== undefined) updateData.tags = input.tags;

  const { data, error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    console.error('[Documents] Failed to update document:', error);
    throw error;
  }

  return mapRowToDocument(data);
}

/**
 * Delete document and associated storage file
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = await createClient();

  // Get document to find file path
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[Documents] Failed to fetch document for delete:', fetchError);
    throw fetchError;
  }

  if (doc?.file_path) {
    // Delete from storage (don't fail if storage delete fails)
    try {
      await supabase.storage.from(BUCKET_NAME).remove([doc.file_path]);
    } catch (storageError) {
      console.error('[Documents] Failed to delete from storage:', storageError);
    }
  }

  // Delete from database (cascades to extraction_queue)
  const { error } = await supabase.from('documents').delete().eq('id', documentId);

  if (error) {
    console.error('[Documents] Failed to delete document:', error);
    throw error;
  }

  // Also delete from embeddings_index
  await supabase
    .from('embeddings_index')
    .delete()
    .eq('source', 'document')
    .eq('source_id', documentId);
}

/**
 * List documents with filtering
 */
export async function listDocuments(
  tenantId: string,
  options: DocumentListOptions = {}
): Promise<{ documents: Document[]; total: number }> {
  const supabase = await createClient();

  const orderBy = options.orderBy || 'created_at';
  const orderDirection = options.orderDirection || 'desc';
  const limit = options.limit || 20;
  const offset = options.offset || 0;

  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order(orderBy, { ascending: orderDirection === 'asc' });

  if (options.category) {
    query = query.eq('category', options.category);
  }
  if (options.sourceType) {
    query = query.eq('source_type', options.sourceType);
  }
  if (options.isIndexed !== undefined) {
    query = query.eq('is_indexed', options.isIndexed);
  }
  if (options.extractionStatus) {
    query = query.eq('extraction_status', options.extractionStatus);
  }
  if (options.tags && options.tags.length > 0) {
    query = query.overlaps('tags', options.tags);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Documents] Failed to list documents:', error);
    throw error;
  }

  return {
    documents: (data || []).map(mapRowToDocument),
    total: count || 0,
  };
}

/**
 * Get signed URL for document download
 */
export async function getDocumentUrl(
  documentId: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = await createClient();

  const doc = await getDocument(documentId);
  if (!doc) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(doc.filePath, expiresIn);

  if (error) {
    console.error('[Documents] Failed to create signed URL:', error);
    return null;
  }

  return data?.signedUrl || null;
}

/**
 * Get document statistics for a tenant
 */
export async function getDocumentStats(tenantId: string): Promise<DocumentStats> {
  const supabase = await createClient();

  // Get all documents for aggregation
  const { data: docs, error } = await supabase
    .from('documents')
    .select('category, source_type, extraction_status, is_indexed, file_size')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[Documents] Failed to get stats:', error);
    throw error;
  }

  const stats: DocumentStats = {
    total: docs?.length || 0,
    byCategory: {} as Record<string, number>,
    bySourceType: {} as Record<string, number>,
    byExtractionStatus: {} as Record<string, number>,
    indexed: 0,
    pendingExtraction: 0,
    totalSize: 0,
  };

  // Initialize counters
  for (const cat of documentCategories) {
    stats.byCategory[cat] = 0;
  }
  for (const src of documentSourceTypes) {
    stats.bySourceType[src] = 0;
  }
  for (const status of extractionStatuses) {
    stats.byExtractionStatus[status] = 0;
  }

  // Aggregate
  for (const doc of docs || []) {
    const category = doc.category as DocumentCategory;
    const sourceType = doc.source_type as DocumentSourceType;
    const extractionStatus = doc.extraction_status as ExtractionStatus;

    if (category in stats.byCategory) {
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }
    if (sourceType in stats.bySourceType) {
      stats.bySourceType[sourceType] = (stats.bySourceType[sourceType] || 0) + 1;
    }
    if (extractionStatus in stats.byExtractionStatus) {
      stats.byExtractionStatus[extractionStatus] =
        (stats.byExtractionStatus[extractionStatus] || 0) + 1;
    }
    if (doc.is_indexed) stats.indexed++;
    if (doc.extraction_status === 'pending') stats.pendingExtraction++;
    stats.totalSize += doc.file_size || 0;
  }

  return stats;
}

/**
 * Check if a document with the given order_document_id already exists
 */
export async function documentExistsForOrderDocument(
  orderDocumentId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('order_document_id', orderDocumentId);

  if (error) {
    console.error('[Documents] Failed to check existence:', error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Check if a document with the given gmail attachment already exists
 */
export async function documentExistsForGmailAttachment(
  gmailMessageId: string,
  gmailAttachmentId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('gmail_message_id', gmailMessageId)
    .eq('gmail_attachment_id', gmailAttachmentId);

  if (error) {
    console.error('[Documents] Failed to check existence:', error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Get documents by order ID (via order_documents)
 */
export async function getDocumentsByOrderId(
  tenantId: string,
  orderId: string
): Promise<Document[]> {
  const supabase = await createClient();

  // First get order_document_ids for this order
  const { data: orderDocs, error: orderError } = await supabase
    .from('order_documents')
    .select('id')
    .eq('order_id', orderId);

  if (orderError) {
    console.error('[Documents] Failed to get order documents:', orderError);
    throw orderError;
  }

  if (!orderDocs || orderDocs.length === 0) {
    return [];
  }

  const orderDocIds = orderDocs.map((od) => od.id);

  // Get documents linked to those order_documents
  const { data: docs, error } = await supabase
    .from('documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('order_document_id', orderDocIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Documents] Failed to get documents by order:', error);
    throw error;
  }

  return (docs || []).map(mapRowToDocument);
}

/**
 * Update document extracted text
 */
export async function updateDocumentExtraction(
  documentId: string,
  extractedText: string | null,
  status: 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('documents')
    .update({
      extracted_text: extractedText,
      extraction_status: status,
      extraction_error: errorMessage || null,
      extraction_attempted_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  if (error) {
    console.error('[Documents] Failed to update extraction:', error);
    throw error;
  }
}

/**
 * Mark document as indexed
 */
export async function markDocumentIndexed(documentId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('mark_document_indexed', {
    p_document_id: documentId,
  });

  if (error) {
    console.error('[Documents] Failed to mark as indexed:', error);
    throw error;
  }
}
