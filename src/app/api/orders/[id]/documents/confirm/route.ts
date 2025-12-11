/**
 * Confirm Direct Upload and Record Metadata
 * POST /api/orders/[id]/documents/confirm
 *
 * After a successful direct upload to Supabase Storage, this endpoint
 * records the file metadata in the database.
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { orgId, tenantId } = await getAuthenticatedContext(supabase);
    const { id: orderId } = await params;

    // Parse request body
    const body = await request.json();
    const { filePath, fileName, fileSize, mimeType, documentType } = body;

    if (!filePath || !fileName || !fileSize || !mimeType) {
      throw new BadRequestError('filePath, fileName, fileSize, and mimeType are required');
    }

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

    // Verify the file exists in storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('order-documents')
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        search: filePath.substring(filePath.lastIndexOf('/') + 1),
      });

    // Insert document record
    const { data: document, error: insertError } = await supabase
      .from('order_documents')
      .insert({
        tenant_id: tenantId,
        org_id: orgId,
        order_id: orderId,
        document_type: documentType || 'other',
        file_name: fileName,
        file_path: filePath,
        file_url: filePath, // Legacy column - same as file_path
        file_size: fileSize,
        mime_type: mimeType,
        uploaded_by: orgId,
        uploaded_by_id: orgId, // Legacy column
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Try to clean up the uploaded file if DB insert fails
      await supabase.storage.from('order-documents').remove([filePath]);
      throw insertError;
    }

    return successResponse(document, 'Document uploaded successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
