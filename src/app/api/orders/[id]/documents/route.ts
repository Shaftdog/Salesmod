/**
 * Order Documents API Routes
 * POST   /api/orders/[id]/documents - Upload document(s)
 * GET    /api/orders/[id]/documents - List documents
 * DELETE /api/orders/[id]/documents?documentId=xxx - Delete a document
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedOrgId,
  successResponse,
  NotFoundError,
  BadRequestError,
} from '@/lib/errors/api-errors';

const BUCKET_NAME = 'order-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// =============================================
// GET /api/orders/[id]/documents - List documents
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { id: orderId } = await params;

    // Get user's tenant_id
    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', orgId)
      .single();

    if (!userTenant) {
      throw new NotFoundError('Tenant');
    }

    // Fetch documents for this order
    const { data: documents, error } = await supabase
      .from('order_documents')
      .select(`
        id,
        document_type,
        file_name,
        file_path,
        file_size,
        mime_type,
        created_at,
        uploaded_by,
        uploader:profiles!order_documents_uploaded_by_fkey(full_name)
      `)
      .eq('order_id', orderId)
      .eq('tenant_id', userTenant.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        const { data: signedUrl } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

        return {
          ...doc,
          url: signedUrl?.signedUrl || null,
        };
      })
    );

    return successResponse(documentsWithUrls);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/orders/[id]/documents - Upload document(s)
// =============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { id: orderId } = await params;

    // Get user's tenant_id
    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', orgId)
      .single();

    if (!userTenant) {
      throw new NotFoundError('Tenant');
    }

    // Verify order exists and belongs to tenant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('tenant_id', userTenant.tenant_id)
      .single();

    if (orderError || !order) {
      throw new NotFoundError('Order');
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const documentType = formData.get('document_type') as string || 'other';

    if (!files || files.length === 0) {
      throw new BadRequestError('No files provided');
    }

    const uploadedDocuments = [];

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestError(`File "${file.name}" exceeds maximum size of 10MB`);
      }

      // Validate mime type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new BadRequestError(`File type "${file.type}" is not allowed`);
      }

      // Generate unique file path: tenant_id/order_id/timestamp_filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userTenant.tenant_id}/${orderId}/${timestamp}_${sanitizedFileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new BadRequestError(`Failed to upload "${file.name}": ${uploadError.message}`);
      }

      // Insert document record
      const { data: document, error: insertError } = await supabase
        .from('order_documents')
        .insert({
          tenant_id: userTenant.tenant_id,
          org_id: orgId,
          order_id: orderId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: orgId,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        // Try to clean up the uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw insertError;
      }

      uploadedDocuments.push(document);
    }

    return successResponse(
      uploadedDocuments,
      `Successfully uploaded ${uploadedDocuments.length} document(s)`
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// DELETE /api/orders/[id]/documents?documentId=xxx
// =============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { id: orderId } = await params;

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      throw new BadRequestError('documentId is required');
    }

    // Get user's tenant_id
    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', orgId)
      .single();

    if (!userTenant) {
      throw new NotFoundError('Tenant');
    }

    // Fetch the document to get its file path
    const { data: document, error: fetchError } = await supabase
      .from('order_documents')
      .select('id, file_path')
      .eq('id', documentId)
      .eq('order_id', orderId)
      .eq('tenant_id', userTenant.tenant_id)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([document.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('order_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      throw deleteError;
    }

    return successResponse({ id: documentId }, 'Document deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
