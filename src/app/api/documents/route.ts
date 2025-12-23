/**
 * Documents Library API Routes
 * GET  /api/documents - List documents with filtering
 * POST /api/documents - Create a document record (after upload)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedContext,
  successResponse,
  createdResponse,
  BadRequestError,
} from '@/lib/errors/api-errors';
import {
  createDocument,
  listDocuments,
  getDocumentStats,
} from '@/lib/documents/document-service';
import { documentCategories, documentSourceTypes } from '@/lib/documents/types';
import { z } from 'zod';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Schema for creating a document
const createDocumentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  filePath: z.string().min(1, 'File path is required'),
  fileSize: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(documentCategories as unknown as [string, ...string[]]).optional(),
  tags: z.array(z.string()).optional(),
  sourceType: z.enum(documentSourceTypes as unknown as [string, ...string[]]),
  orderDocumentId: z.string().uuid().optional(),
  gmailMessageId: z.string().uuid().optional(),
  gmailAttachmentId: z.string().optional(),
});

// =============================================
// GET /api/documents - List documents
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { tenantId } = await getAuthenticatedContext(supabase);

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const options = {
      category: searchParams.get('category') as
        | (typeof documentCategories)[number]
        | undefined,
      sourceType: searchParams.get('sourceType') as
        | (typeof documentSourceTypes)[number]
        | undefined,
      isIndexed:
        searchParams.get('isIndexed') === 'true'
          ? true
          : searchParams.get('isIndexed') === 'false'
            ? false
            : undefined,
      extractionStatus: searchParams.get('extractionStatus') as
        | 'pending'
        | 'processing'
        | 'completed'
        | 'failed'
        | 'skipped'
        | undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
      orderBy: (searchParams.get('orderBy') as 'created_at' | 'updated_at') || 'created_at',
      orderDirection: (searchParams.get('orderDirection') as 'asc' | 'desc') || 'desc',
    };

    // Check if stats are requested
    if (searchParams.get('stats') === 'true') {
      const stats = await getDocumentStats(tenantId);
      return successResponse(stats);
    }

    const result = await listDocuments(tenantId, options);

    return successResponse(result.documents, undefined, {
      total: result.total,
      limit: options.limit,
      page: Math.floor(options.offset / options.limit) + 1,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/documents - Create document record
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { orgId, tenantId } = await getAuthenticatedContext(supabase);

    const body = await request.json();

    // Validate input
    const parseResult = createDocumentSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestError(
        `Validation failed: ${parseResult.error.errors.map((e) => e.message).join(', ')}`
      );
    }

    const input = parseResult.data;

    // Validate category if provided
    if (input.category && !documentCategories.includes(input.category as typeof documentCategories[number])) {
      throw new BadRequestError(
        `Invalid category. Must be one of: ${documentCategories.join(', ')}`
      );
    }

    // Validate sourceType
    if (!documentSourceTypes.includes(input.sourceType as typeof documentSourceTypes[number])) {
      throw new BadRequestError(
        `Invalid sourceType. Must be one of: ${documentSourceTypes.join(', ')}`
      );
    }

    const document = await createDocument(tenantId, orgId, {
      ...input,
      category: input.category as typeof documentCategories[number],
      sourceType: input.sourceType as typeof documentSourceTypes[number],
    });

    return createdResponse(document);
  } catch (error) {
    return handleApiError(error);
  }
}
