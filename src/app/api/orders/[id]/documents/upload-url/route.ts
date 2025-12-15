/**
 * Generate Signed Upload URL for Direct-to-Storage Uploads
 * POST /api/orders/[id]/documents/upload-url
 *
 * This endpoint generates a signed URL that allows the client to upload
 * directly to Supabase Storage, bypassing the Vercel serverless function
 * payload limit (~4.5MB).
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedContext,
  successResponse,
  NotFoundError,
  BadRequestError,
} from '@/lib/errors/api-errors';

const BUCKET_NAME = 'order-documents';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { orgId, tenantId } = await getAuthenticatedContext(supabase);
    const { id: orderId } = await params;

    // Verify order exists and belongs to tenant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderError || !order) {
      throw new NotFoundError('Order');
    }

    // Parse request body
    const body = await request.json();
    const { fileName, fileSize, mimeType, documentType } = body;

    if (!fileName || !fileSize || !mimeType) {
      throw new BadRequestError('fileName, fileSize, and mimeType are required');
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestError(`File exceeds maximum size of 50MB`);
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestError(`File type "${mimeType}" is not allowed`);
    }

    // Generate unique file path: tenant_id/order_id/timestamp_filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${tenantId}/${orderId}/${timestamp}_${sanitizedFileName}`;

    // Create signed upload URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(filePath);

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError);
      throw new BadRequestError('Failed to create upload URL');
    }

    return successResponse({
      signedUrl: signedUrlData.signedUrl,
      token: signedUrlData.token,
      path: signedUrlData.path,
      filePath,
      // Include metadata for the confirm step
      metadata: {
        orderId,
        tenantId,
        orgId,
        fileName,
        fileSize,
        mimeType,
        documentType: documentType || 'other',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
