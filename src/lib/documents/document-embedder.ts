/**
 * P1.1: Documents Library - Embedding Service
 * Generates embeddings for documents and adds them to the RAG index
 */

import { createClient } from '@/lib/supabase/server';
import { indexContent } from '@/lib/agent/rag';
import { Document, mapRowToDocument } from './types';
import { markDocumentIndexed } from './document-service';

/**
 * Generate embeddings for a document and add to RAG index
 */
export async function embedDocument(documentId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error || !doc) {
    console.error('[Embedder] Document not found:', documentId);
    return false;
  }

  // Need extracted text to embed
  if (!doc.extracted_text || doc.extraction_status !== 'completed') {
    console.log(
      `[Embedder] Document ${documentId} has no extracted text, skipping embedding`
    );
    return false;
  }

  // Skip if already indexed
  if (doc.is_indexed) {
    console.log(`[Embedder] Document ${documentId} already indexed`);
    return true;
  }

  try {
    // Get tenant's org_id for embedding
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('owner_id')
      .eq('id', doc.tenant_id)
      .single();

    // If tenant doesn't have an owner_id, try to get org_id from profiles
    let orgId = tenantData?.owner_id;
    if (!orgId) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', doc.tenant_id)
        .limit(1)
        .single();

      orgId = profileData?.id;
    }

    if (!orgId) {
      console.error('[Embedder] Could not determine org_id for tenant:', doc.tenant_id);
      return false;
    }

    // Prepare content for embedding
    // Include title and description for better context
    const contentParts = [];
    if (doc.title) {
      contentParts.push(`Title: ${doc.title}`);
    }
    if (doc.description) {
      contentParts.push(`Description: ${doc.description}`);
    }
    contentParts.push(doc.extracted_text);

    const embeddingContent = contentParts.join('\n\n');

    // Use existing RAG indexContent function
    await indexContent(
      orgId,
      'document',
      documentId,
      doc.title || doc.file_name,
      embeddingContent,
      {
        documentId: doc.id,
        tenantId: doc.tenant_id,
        fileName: doc.file_name,
        category: doc.category,
        sourceType: doc.source_type,
        tags: doc.tags,
        mimeType: doc.mime_type,
        fileSize: doc.file_size,
        orderDocumentId: doc.order_document_id,
        gmailMessageId: doc.gmail_message_id,
      }
    );

    // Mark as indexed
    await markDocumentIndexed(documentId);

    console.log(`[Embedder] Successfully embedded document ${documentId}`);
    return true;
  } catch (err) {
    console.error(`[Embedder] Failed to embed document ${documentId}:`, err);
    return false;
  }
}

/**
 * Embed multiple documents (batch operation)
 */
export async function embedDocuments(
  documentIds: string[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const docId of documentIds) {
    const result = await embedDocument(docId);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Get documents pending embedding for a tenant
 */
export async function getDocumentsPendingEmbedding(
  tenantId: string,
  limit: number = 10
): Promise<Document[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_documents_pending_embedding', {
    p_tenant_id: tenantId,
    p_limit: limit,
  });

  if (error) {
    console.error('[Embedder] Failed to get pending documents:', error);
    return [];
  }

  return (data || []).map(mapRowToDocument);
}

/**
 * Re-index all documents for a tenant
 * This will re-embed all completed documents
 */
export async function reindexTenantDocuments(tenantId: string): Promise<{
  total: number;
  indexed: number;
  failed: number;
}> {
  const supabase = await createClient();

  // First, reset is_indexed flag for all documents
  const { error: resetError } = await supabase
    .from('documents')
    .update({ is_indexed: false, indexed_at: null })
    .eq('tenant_id', tenantId)
    .eq('extraction_status', 'completed');

  if (resetError) {
    console.error('[Embedder] Failed to reset indexed status:', resetError);
    throw resetError;
  }

  // Get all documents that need embedding
  const { data: docs, error: fetchError } = await supabase
    .from('documents')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('extraction_status', 'completed')
    .not('extracted_text', 'is', null);

  if (fetchError) {
    console.error('[Embedder] Failed to fetch documents:', fetchError);
    throw fetchError;
  }

  const total = docs?.length || 0;
  let indexed = 0;
  let failed = 0;

  for (const doc of docs || []) {
    const success = await embedDocument(doc.id);
    if (success) {
      indexed++;
    } else {
      failed++;
    }
  }

  console.log(
    `[Embedder] Reindex complete for tenant ${tenantId}: ${indexed}/${total} indexed, ${failed} failed`
  );

  return { total, indexed, failed };
}

/**
 * Process pending embeddings for all tenants
 * This can be called from a cron job
 */
export async function processPendingEmbeddings(
  batchSize: number = 20
): Promise<{ processed: number; failed: number }> {
  const supabase = await createClient();

  // Get documents pending embedding across all tenants
  const { data: pendingDocs, error } = await supabase
    .from('documents')
    .select('id, tenant_id')
    .eq('extraction_status', 'completed')
    .eq('is_indexed', false)
    .not('extracted_text', 'is', null)
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (error) {
    console.error('[Embedder] Failed to get pending documents:', error);
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const doc of pendingDocs || []) {
    const success = await embedDocument(doc.id);
    if (success) {
      processed++;
    } else {
      failed++;
    }
  }

  if (processed > 0 || failed > 0) {
    console.log(
      `[Embedder] Processed batch: ${processed} indexed, ${failed} failed`
    );
  }

  return { processed, failed };
}

/**
 * Remove document from embedding index
 */
export async function removeDocumentEmbedding(documentId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('embeddings_index')
    .delete()
    .eq('source', 'document')
    .eq('source_id', documentId);

  if (error) {
    console.error('[Embedder] Failed to remove embedding:', error);
    throw error;
  }

  // Update document to mark as not indexed
  await supabase
    .from('documents')
    .update({ is_indexed: false, indexed_at: null })
    .eq('id', documentId);
}

/**
 * Get embedding stats for a tenant
 */
export async function getEmbeddingStats(tenantId: string): Promise<{
  totalDocuments: number;
  indexed: number;
  pendingExtraction: number;
  pendingEmbedding: number;
  failed: number;
}> {
  const supabase = await createClient();

  const { data: docs, error } = await supabase
    .from('documents')
    .select('extraction_status, is_indexed')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[Embedder] Failed to get stats:', error);
    throw error;
  }

  const stats = {
    totalDocuments: docs?.length || 0,
    indexed: 0,
    pendingExtraction: 0,
    pendingEmbedding: 0,
    failed: 0,
  };

  for (const doc of docs || []) {
    if (doc.is_indexed) {
      stats.indexed++;
    } else if (doc.extraction_status === 'completed') {
      stats.pendingEmbedding++;
    } else if (doc.extraction_status === 'pending') {
      stats.pendingExtraction++;
    } else if (doc.extraction_status === 'failed') {
      stats.failed++;
    }
  }

  return stats;
}
