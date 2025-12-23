/**
 * P1.1: Documents Library - Ingestion Service
 * Auto-ingests documents from order_documents and Gmail attachments
 */

import { createClient } from '@/lib/supabase/server';
import {
  IngestResult,
  CreateDocumentInput,
  mapOrderDocTypeToCategory,
} from './types';
import {
  createDocument,
  documentExistsForOrderDocument,
  documentExistsForGmailAttachment,
} from './document-service';

const BUCKET_NAME = 'order-documents';

/**
 * Ingest all order documents for a tenant
 * Creates document library entries for any order_documents without linked documents
 */
export async function ingestOrderDocuments(tenantId: string): Promise<IngestResult> {
  const supabase = await createClient();

  // Get all order_documents for this tenant
  const { data: orderDocs, error } = await supabase
    .from('order_documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Ingester] Failed to fetch order documents:', error);
    throw error;
  }

  const result: IngestResult = {
    ingested: 0,
    skipped: 0,
    errors: [],
  };

  for (const orderDoc of orderDocs || []) {
    try {
      // Check if already ingested
      const exists = await documentExistsForOrderDocument(orderDoc.id);
      if (exists) {
        result.skipped++;
        continue;
      }

      // Create document record
      await createDocument(tenantId, orderDoc.uploaded_by || orderDoc.org_id, {
        fileName: orderDoc.file_name,
        filePath: orderDoc.file_path,
        fileSize: orderDoc.file_size,
        mimeType: orderDoc.mime_type,
        sourceType: 'order_document',
        orderDocumentId: orderDoc.id,
        category: mapOrderDocTypeToCategory(orderDoc.document_type),
        title: `${orderDoc.document_type}: ${orderDoc.file_name}`,
      });

      result.ingested++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Ingester] Failed to ingest order document ${orderDoc.id}:`, err);
      result.errors.push({ id: orderDoc.id, error: errorMessage });
    }
  }

  console.log(
    `[Ingester] Order documents: ${result.ingested} ingested, ${result.skipped} skipped, ${result.errors.length} errors`
  );

  return result;
}

/**
 * Ingest new order documents (only those not already in library)
 * More efficient than full ingest for ongoing sync
 */
export async function ingestNewOrderDocuments(
  tenantId: string,
  sinceDays: number = 7
): Promise<IngestResult> {
  const supabase = await createClient();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - sinceDays);

  // Get recent order_documents
  const { data: orderDocs, error } = await supabase
    .from('order_documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', sinceDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Ingester] Failed to fetch recent order documents:', error);
    throw error;
  }

  const result: IngestResult = {
    ingested: 0,
    skipped: 0,
    errors: [],
  };

  for (const orderDoc of orderDocs || []) {
    try {
      const exists = await documentExistsForOrderDocument(orderDoc.id);
      if (exists) {
        result.skipped++;
        continue;
      }

      await createDocument(tenantId, orderDoc.uploaded_by || orderDoc.org_id, {
        fileName: orderDoc.file_name,
        filePath: orderDoc.file_path,
        fileSize: orderDoc.file_size,
        mimeType: orderDoc.mime_type,
        sourceType: 'order_document',
        orderDocumentId: orderDoc.id,
        category: mapOrderDocTypeToCategory(orderDoc.document_type),
        title: `${orderDoc.document_type}: ${orderDoc.file_name}`,
      });

      result.ingested++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push({ id: orderDoc.id, error: errorMessage });
    }
  }

  return result;
}

/**
 * Ingest attachments from a specific Gmail message
 * Downloads attachments from Gmail and creates document records
 */
export async function ingestGmailAttachments(
  orgId: string,
  tenantId: string,
  gmailMessageDbId: string
): Promise<IngestResult> {
  const supabase = await createClient();

  // Get the gmail_message record
  const { data: gmailMsg, error } = await supabase
    .from('gmail_messages')
    .select('id, gmail_message_id, attachments, from_email, subject')
    .eq('id', gmailMessageDbId)
    .single();

  if (error || !gmailMsg) {
    console.error('[Ingester] Gmail message not found:', gmailMessageDbId);
    throw new Error('Gmail message not found');
  }

  if (!gmailMsg.attachments || !Array.isArray(gmailMsg.attachments)) {
    return { ingested: 0, skipped: 0, errors: [] };
  }

  const attachments = gmailMsg.attachments as Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;

  const result: IngestResult = {
    ingested: 0,
    skipped: 0,
    errors: [],
  };

  // Import Gmail service dynamically to avoid circular dependency
  const { GmailService } = await import('@/lib/gmail/gmail-service');

  let gmailService: InstanceType<typeof GmailService>;
  try {
    gmailService = await GmailService.create(orgId);
  } catch (err) {
    console.error('[Ingester] Failed to create Gmail service:', err);
    throw new Error('Gmail not connected');
  }

  for (const attachment of attachments) {
    try {
      // Check if already ingested
      const exists = await documentExistsForGmailAttachment(
        gmailMsg.id,
        attachment.attachmentId
      );
      if (exists) {
        result.skipped++;
        continue;
      }

      // Download attachment from Gmail
      const attachmentData = await gmailService.getAttachment(
        gmailMsg.gmail_message_id,
        attachment.attachmentId
      );

      if (!attachmentData) {
        throw new Error('Failed to download attachment from Gmail');
      }

      // Upload to Supabase Storage
      const timestamp = Date.now();
      const sanitizedFileName = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${tenantId}/attachments/${timestamp}_${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, attachmentData, {
          contentType: attachment.mimeType,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Create document record
      await createDocument(tenantId, orgId, {
        fileName: attachment.filename,
        filePath,
        fileSize: attachment.size,
        mimeType: attachment.mimeType,
        sourceType: 'gmail_attachment',
        gmailMessageId: gmailMsg.id,
        gmailAttachmentId: attachment.attachmentId,
        category: 'email_attachment',
        title: `${attachment.filename} (from ${gmailMsg.from_email})`,
        description: `Attachment from email: ${gmailMsg.subject || '(no subject)'}`,
      });

      result.ingested++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        `[Ingester] Failed to ingest attachment ${attachment.filename}:`,
        err
      );
      result.errors.push({ id: attachment.attachmentId, error: errorMessage });
    }
  }

  console.log(
    `[Ingester] Gmail attachments from ${gmailMessageDbId}: ${result.ingested} ingested, ${result.skipped} skipped, ${result.errors.length} errors`
  );

  return result;
}

/**
 * Ingest all Gmail attachments for a tenant (bulk operation)
 * Finds all gmail_messages with attachments and ingests them
 */
export async function ingestAllGmailAttachments(
  orgId: string,
  tenantId: string,
  sinceDays: number = 30
): Promise<IngestResult> {
  const supabase = await createClient();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - sinceDays);

  // Get gmail messages with attachments
  const { data: messages, error } = await supabase
    .from('gmail_messages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('has_attachments', true)
    .gte('created_at', sinceDate.toISOString());

  if (error) {
    console.error('[Ingester] Failed to fetch Gmail messages:', error);
    throw error;
  }

  const totalResult: IngestResult = {
    ingested: 0,
    skipped: 0,
    errors: [],
  };

  for (const msg of messages || []) {
    try {
      const result = await ingestGmailAttachments(orgId, tenantId, msg.id);
      totalResult.ingested += result.ingested;
      totalResult.skipped += result.skipped;
      totalResult.errors.push(...result.errors);
    } catch (err) {
      console.error(`[Ingester] Failed to process message ${msg.id}:`, err);
      totalResult.errors.push({
        id: msg.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  console.log(
    `[Ingester] All Gmail attachments: ${totalResult.ingested} ingested, ${totalResult.skipped} skipped, ${totalResult.errors.length} errors`
  );

  return totalResult;
}

/**
 * Ingest a manually uploaded file
 * Used when a user uploads a file directly to the document library
 */
export async function ingestManualUpload(
  tenantId: string,
  userId: string,
  input: CreateDocumentInput
): Promise<string> {
  // Validate source type
  if (input.sourceType !== 'manual_upload') {
    input.sourceType = 'manual_upload';
  }

  const document = await createDocument(tenantId, userId, input);
  return document.id;
}

/**
 * Get ingestion status summary for a tenant
 */
export async function getIngestionStatus(tenantId: string): Promise<{
  orderDocuments: { total: number; ingested: number; pending: number };
  gmailAttachments: { messagesWithAttachments: number; ingested: number };
}> {
  const supabase = await createClient();

  // Count order documents
  const { count: totalOrderDocs } = await supabase
    .from('order_documents')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: ingestedOrderDocs } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('source_type', 'order_document');

  // Count gmail messages with attachments
  const { count: gmailWithAttachments } = await supabase
    .from('gmail_messages')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('has_attachments', true);

  const { count: ingestedGmailAttachments } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('source_type', 'gmail_attachment');

  return {
    orderDocuments: {
      total: totalOrderDocs || 0,
      ingested: ingestedOrderDocs || 0,
      pending: (totalOrderDocs || 0) - (ingestedOrderDocs || 0),
    },
    gmailAttachments: {
      messagesWithAttachments: gmailWithAttachments || 0,
      ingested: ingestedGmailAttachments || 0,
    },
  };
}
