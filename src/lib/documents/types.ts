/**
 * P1.1: Documents Library - Type Definitions
 */

// Document source types - matches database enum
export const documentSourceTypes = [
  'order_document',
  'gmail_attachment',
  'manual_upload',
  'generated',
] as const;
export type DocumentSourceType = (typeof documentSourceTypes)[number];

// Document categories - matches database enum
export const documentCategories = [
  'contract',
  'invoice',
  'sop',
  'bid_template',
  'email_attachment',
  'appraisal_report',
  'client_document',
  'internal',
  'other',
] as const;
export type DocumentCategory = (typeof documentCategories)[number];

// Extraction status - matches database enum
export const extractionStatuses = [
  'pending',
  'processing',
  'completed',
  'failed',
  'skipped',
] as const;
export type ExtractionStatus = (typeof extractionStatuses)[number];

// Main document interface
export interface Document {
  id: string;
  tenantId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  title: string | null;
  description: string | null;
  category: DocumentCategory;
  tags: string[];
  sourceType: DocumentSourceType;
  orderDocumentId: string | null;
  gmailMessageId: string | null;
  gmailAttachmentId: string | null;
  extractedText: string | null;
  extractionStatus: ExtractionStatus;
  extractionError: string | null;
  extractionAttemptedAt: string | null;
  isIndexed: boolean;
  indexedAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed/joined fields
  url?: string;
}

// Create document input
export interface CreateDocumentInput {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  title?: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
  sourceType: DocumentSourceType;
  orderDocumentId?: string;
  gmailMessageId?: string;
  gmailAttachmentId?: string;
}

// Update document input
export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
}

// Search/filter options
export interface DocumentListOptions {
  category?: DocumentCategory;
  sourceType?: DocumentSourceType;
  tags?: string[];
  isIndexed?: boolean;
  extractionStatus?: ExtractionStatus;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'file_name' | 'file_size';
  orderDirection?: 'asc' | 'desc';
}

// Semantic search options
export interface DocumentSearchOptions {
  query: string;
  category?: DocumentCategory;
  sourceType?: DocumentSourceType;
  tags?: string[];
  limit?: number;
  threshold?: number; // Similarity threshold (0-1)
}

// RAG search result
export interface DocumentSearchResult extends Document {
  similarity: number;
  matchedContent: string; // Excerpt that matched
}

// Extraction queue item
export interface ExtractionQueueItem {
  queueId: string;
  documentId: string;
  tenantId: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
}

// Document stats
export interface DocumentStats {
  total: number;
  byCategory: Record<DocumentCategory, number>;
  bySourceType: Record<DocumentSourceType, number>;
  byExtractionStatus: Record<ExtractionStatus, number>;
  indexed: number;
  pendingExtraction: number;
  totalSize: number;
}

// Ingest result
export interface IngestResult {
  ingested: number;
  skipped: number;
  errors: Array<{ id: string; error: string }>;
}

// Map order document type to category
export function mapOrderDocTypeToCategory(docType: string): DocumentCategory {
  const mapping: Record<string, DocumentCategory> = {
    engagement_letter: 'contract',
    order_form: 'contract',
    client_instructions: 'client_document',
    prior_appraisal: 'appraisal_report',
    purchase_contract: 'contract',
    contract_addenda: 'contract',
    invoice: 'invoice',
    appraisal_report: 'appraisal_report',
    inspection_report: 'appraisal_report',
    photos: 'other',
    comparable: 'appraisal_report',
    title_report: 'client_document',
    flood_cert: 'client_document',
    plans: 'client_document',
    building_specs: 'client_document',
    construction_budget: 'client_document',
    permits: 'client_document',
    rental_data: 'client_document',
  };
  return mapping[docType] || 'other';
}

// Check if mime type supports text extraction
export function isExtractableMimeType(mimeType: string): boolean {
  const extractableMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
  ];
  return extractableMimeTypes.includes(mimeType);
}

// Map database row to Document interface
export function mapRowToDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    fileName: row.file_name as string,
    filePath: row.file_path as string,
    fileSize: row.file_size as number,
    mimeType: row.mime_type as string,
    title: row.title as string | null,
    description: row.description as string | null,
    category: row.category as DocumentCategory,
    tags: (row.tags as string[]) || [],
    sourceType: row.source_type as DocumentSourceType,
    orderDocumentId: row.order_document_id as string | null,
    gmailMessageId: row.gmail_message_id as string | null,
    gmailAttachmentId: row.gmail_attachment_id as string | null,
    extractedText: row.extracted_text as string | null,
    extractionStatus: row.extraction_status as ExtractionStatus,
    extractionError: row.extraction_error as string | null,
    extractionAttemptedAt: row.extraction_attempted_at as string | null,
    isIndexed: row.is_indexed as boolean,
    indexedAt: row.indexed_at as string | null,
    uploadedBy: row.uploaded_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
