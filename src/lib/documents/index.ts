/**
 * P1.1: Documents Library
 * Central module for document management with RAG integration
 */

// Types
export * from './types';

// Services
export {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  getDocumentUrl,
  getDocumentStats,
  documentExistsForOrderDocument,
  documentExistsForGmailAttachment,
  getDocumentsByOrderId,
  updateDocumentExtraction,
  markDocumentIndexed,
} from './document-service';

export {
  extractDocumentText,
  processExtractionQueue,
  getExtractionQueueStatus,
  reQueueFailedExtractions,
  extractTextSync,
} from './document-extractor';

export {
  embedDocument,
  embedDocuments,
  getDocumentsPendingEmbedding,
  reindexTenantDocuments,
  processPendingEmbeddings,
  removeDocumentEmbedding,
  getEmbeddingStats,
} from './document-embedder';

export {
  searchDocuments,
  getRelatedDocuments,
  getDocumentContext,
  textSearchDocuments,
  getDocumentsByTags,
  getRecentDocuments,
  getAllDocumentTags,
} from './document-retriever';

export {
  ingestOrderDocuments,
  ingestNewOrderDocuments,
  ingestGmailAttachments,
  ingestAllGmailAttachments,
  ingestManualUpload,
  getIngestionStatus,
} from './document-ingester';
