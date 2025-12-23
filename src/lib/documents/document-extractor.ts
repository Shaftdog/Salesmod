/**
 * P1.1: Documents Library - Text Extraction Service
 * Handles PDF, DOCX, and plain text extraction
 */

import { createClient } from '@/lib/supabase/server';
import { ExtractionQueueItem, mapRowToDocument } from './types';
import { updateDocumentExtraction } from './document-service';

const BUCKET_NAME = 'order-documents';

// Max file size for inline extraction (5MB)
const MAX_INLINE_EXTRACTION_SIZE = 5 * 1024 * 1024;

/**
 * Extract text from a document
 */
export async function extractDocumentText(
  documentId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error || !doc) {
    console.error('[Extractor] Document not found:', documentId);
    return null;
  }

  // Skip if already extracted or not extractable
  if (doc.extraction_status === 'completed') {
    return doc.extracted_text;
  }
  if (doc.extraction_status === 'skipped') {
    return null;
  }

  try {
    // Update status to processing
    await supabase
      .from('documents')
      .update({
        extraction_status: 'processing',
        extraction_attempted_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(doc.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Extract based on mime type
    let extractedText: string | null = null;

    switch (doc.mime_type) {
      case 'text/plain':
      case 'text/csv':
      case 'text/markdown':
        extractedText = await fileData.text();
        break;

      case 'application/pdf':
        extractedText = await extractPdfText(fileData);
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        extractedText = await extractDocxText(fileData);
        break;

      case 'application/msword':
        // Old .doc format - try basic extraction
        extractedText = await extractLegacyDocText(fileData);
        break;

      case 'application/rtf':
        extractedText = await extractRtfText(fileData);
        break;

      default:
        console.log(`[Extractor] Unsupported mime type: ${doc.mime_type}`);
        extractedText = null;
    }

    // Clean up extracted text
    if (extractedText) {
      extractedText = cleanExtractedText(extractedText);
    }

    // Update document with extracted text
    await updateDocumentExtraction(
      documentId,
      extractedText,
      extractedText ? 'completed' : 'failed',
      extractedText ? undefined : 'No text could be extracted'
    );

    return extractedText;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Extractor] Extraction failed for ${documentId}:`, err);

    // Update with error
    await updateDocumentExtraction(documentId, null, 'failed', errorMessage);

    return null;
  }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractPdfText(blob: Blob): Promise<string> {
  try {
    // Dynamic import to keep bundle size down
    const { PDFParse } = await import('pdf-parse');
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const parser = new PDFParse({ data });
    const textResult = await parser.getText();

    return textResult.text || '';
  } catch (err) {
    console.error('[Extractor] PDF extraction error:', err);
    throw new Error(
      `PDF extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractDocxText(blob: Blob): Promise<string> {
  try {
    const mammoth = (await import('mammoth')).default;
    const buffer = Buffer.from(await blob.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });

    if (result.messages && result.messages.length > 0) {
      // Log any warnings from mammoth
      for (const msg of result.messages) {
        console.log(`[Extractor] Mammoth ${msg.type}: ${msg.message}`);
      }
    }

    return result.value || '';
  } catch (err) {
    console.error('[Extractor] DOCX extraction error:', err);
    throw new Error(
      `DOCX extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract text from legacy .doc format
 * This is a best-effort extraction since .doc is binary
 */
async function extractLegacyDocText(blob: Blob): Promise<string | null> {
  try {
    // Try mammoth first - it has some .doc support
    const mammoth = (await import('mammoth')).default;
    const buffer = Buffer.from(await blob.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return result.value || null;
  } catch {
    console.log('[Extractor] Legacy .doc extraction failed, format not supported');
    return null;
  }
}

/**
 * Extract text from RTF format
 */
async function extractRtfText(blob: Blob): Promise<string | null> {
  try {
    const text = await blob.text();
    // Basic RTF stripping - remove RTF control codes
    // This is a simplified approach; a full RTF parser would be better
    const stripped = text
      .replace(/\\[a-z]+\d*\s?/gi, '') // Remove control words
      .replace(/[{}]/g, '') // Remove braces
      .replace(/\\\\/g, '\\') // Unescape backslashes
      .trim();
    return stripped || null;
  } catch {
    console.log('[Extractor] RTF extraction failed');
    return null;
  }
}

/**
 * Clean up extracted text
 */
function cleanExtractedText(text: string): string {
  return (
    text
      // Normalize whitespace
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive newlines (more than 2 in a row)
      .replace(/\n{3,}/g, '\n\n')
      // Remove excessive spaces
      .replace(/ {2,}/g, ' ')
      // Trim lines
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Final trim
      .trim()
  );
}

/**
 * Process extraction queue (for cron/background job)
 */
export async function processExtractionQueue(
  batchSize: number = 5
): Promise<{ processed: number; failed: number }> {
  const supabase = await createClient();
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < batchSize; i++) {
    // Claim next item from queue
    const { data: claimed, error: claimError } = await supabase.rpc(
      'claim_next_extraction'
    );

    if (claimError) {
      console.error('[Extractor] Failed to claim from queue:', claimError);
      break;
    }

    if (!claimed || claimed.length === 0) {
      // No more items in queue
      break;
    }

    const item = claimed[0] as ExtractionQueueItem;

    try {
      const extractedText = await extractDocumentText(item.documentId);

      // Mark queue item as complete
      await supabase.rpc('complete_extraction', {
        p_queue_id: item.queueId,
        p_extracted_text: extractedText,
        p_success: !!extractedText,
        p_error_message: extractedText ? null : 'Extraction returned no text',
      });

      if (extractedText) {
        processed++;
      } else {
        failed++;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Mark as failed in queue
      await supabase.rpc('complete_extraction', {
        p_queue_id: item.queueId,
        p_extracted_text: null,
        p_success: false,
        p_error_message: errorMessage,
      });

      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Get extraction queue status
 */
export async function getExtractionQueueStatus(tenantId: string): Promise<{
  queued: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('document_extraction_queue')
    .select('status')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[Extractor] Failed to get queue status:', error);
    throw error;
  }

  const status = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  for (const item of data || []) {
    if (item.status in status) {
      status[item.status as keyof typeof status]++;
    }
  }

  return status;
}

/**
 * Re-queue failed extractions for a tenant
 */
export async function reQueueFailedExtractions(tenantId: string): Promise<number> {
  const supabase = await createClient();

  // Get failed documents
  const { data: failedDocs, error } = await supabase
    .from('documents')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('extraction_status', 'failed');

  if (error) {
    console.error('[Extractor] Failed to get failed documents:', error);
    throw error;
  }

  let reQueued = 0;
  for (const doc of failedDocs || []) {
    try {
      // Reset extraction status
      await supabase
        .from('documents')
        .update({
          extraction_status: 'pending',
          extraction_error: null,
        })
        .eq('id', doc.id);

      // Re-queue
      await supabase.rpc('queue_document_extraction', {
        p_document_id: doc.id,
        p_priority: -1, // Lower priority for retries
      });

      reQueued++;
    } catch (queueError) {
      console.error(`[Extractor] Failed to re-queue ${doc.id}:`, queueError);
    }
  }

  return reQueued;
}

/**
 * Extract text from a document synchronously (for small files)
 * Use this for immediate extraction during upload of small files
 */
export async function extractTextSync(
  filePath: string,
  mimeType: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (downloadError || !fileData) {
    console.error('[Extractor] Failed to download for sync extraction:', downloadError);
    return null;
  }

  // Check file size
  if (fileData.size > MAX_INLINE_EXTRACTION_SIZE) {
    console.log('[Extractor] File too large for sync extraction');
    return null;
  }

  try {
    let extractedText: string | null = null;

    switch (mimeType) {
      case 'text/plain':
      case 'text/csv':
      case 'text/markdown':
        extractedText = await fileData.text();
        break;

      case 'application/pdf':
        extractedText = await extractPdfText(fileData);
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        extractedText = await extractDocxText(fileData);
        break;

      default:
        return null;
    }

    return extractedText ? cleanExtractedText(extractedText) : null;
  } catch (err) {
    console.error('[Extractor] Sync extraction failed:', err);
    return null;
  }
}
