/**
 * Document Search API Routes
 * POST /api/documents/search - Semantic search across documents
 * GET  /api/documents/search - Text-based search (simpler)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedContext,
  successResponse,
  BadRequestError,
} from '@/lib/errors/api-errors';
import {
  searchDocuments,
  textSearchDocuments,
  getDocumentContext,
  getAllDocumentTags,
} from '@/lib/documents/document-retriever';
import { documentCategories, documentSourceTypes } from '@/lib/documents/types';
import { z } from 'zod';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Schema for semantic search
const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  category: z.enum(documentCategories as unknown as [string, ...string[]]).optional(),
  sourceType: z.enum(documentSourceTypes as unknown as [string, ...string[]]).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.6),
});

// =============================================
// GET /api/documents/search - Text search
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { tenantId } = await getAuthenticatedContext(supabase);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // If no query, return all tags for filtering UI
    if (!query) {
      const tags = await getAllDocumentTags(tenantId);
      return successResponse({ tags });
    }

    const options = {
      category: searchParams.get('category') || undefined,
      limit: parseInt(searchParams.get('limit') || '20', 10),
    };

    const results = await textSearchDocuments(tenantId, query, options);

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/documents/search - Semantic search
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { orgId, tenantId } = await getAuthenticatedContext(supabase);

    const body = await request.json();

    // Validate input
    const parseResult = searchSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestError(
        `Validation failed: ${parseResult.error.errors.map((e) => e.message).join(', ')}`
      );
    }

    const { query, category, sourceType, tags, limit, threshold } = parseResult.data;

    // Check if context mode is requested (for AI chat integration)
    if (body.mode === 'context') {
      const maxTokens = body.maxTokens || 2000;
      const context = await getDocumentContext(orgId, query, maxTokens);
      return successResponse({ context });
    }

    // Perform semantic search
    const results = await searchDocuments(orgId, {
      query,
      category: category as (typeof documentCategories)[number] | undefined,
      sourceType: sourceType as (typeof documentSourceTypes)[number] | undefined,
      tags,
      limit,
      threshold,
    });

    return successResponse(results, `Found ${results.length} matching documents`);
  } catch (error) {
    return handleApiError(error);
  }
}
