/**
 * Single Document API Routes
 * GET    /api/documents/[id] - Get document details
 * PATCH  /api/documents/[id] - Update document metadata
 * DELETE /api/documents/[id] - Delete document
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
import {
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentUrl,
} from '@/lib/documents/document-service';
import { documentCategories } from '@/lib/documents/types';
import { z } from 'zod';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Schema for updating a document
const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(documentCategories as unknown as [string, ...string[]]).optional(),
  tags: z.array(z.string()).optional(),
});

// =============================================
// GET /api/documents/[id] - Get document
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    await getAuthenticatedContext(supabase);

    const { id } = await params;

    const document = await getDocument(id);
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Check if download URL is requested
    const { searchParams } = new URL(request.url);
    if (searchParams.get('includeUrl') === 'true') {
      const url = await getDocumentUrl(id);
      return successResponse({ ...document, url });
    }

    return successResponse(document);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// PATCH /api/documents/[id] - Update document
// =============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    await getAuthenticatedContext(supabase);

    const { id } = await params;
    const body = await request.json();

    // Check document exists
    const existing = await getDocument(id);
    if (!existing) {
      throw new NotFoundError('Document not found');
    }

    // Validate input
    const parseResult = updateDocumentSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestError(
        `Validation failed: ${parseResult.error.errors.map((e) => e.message).join(', ')}`
      );
    }

    const updated = await updateDocument(id, {
      ...parseResult.data,
      category: parseResult.data.category as typeof documentCategories[number] | undefined,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// DELETE /api/documents/[id] - Delete document
// =============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    await getAuthenticatedContext(supabase);

    const { id } = await params;

    // Check document exists
    const existing = await getDocument(id);
    if (!existing) {
      throw new NotFoundError('Document not found');
    }

    await deleteDocument(id);

    return successResponse({ success: true, message: 'Document deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
