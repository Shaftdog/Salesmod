/**
 * Order Documents Ingestion API
 * POST /api/documents/ingest/orders - Ingest order documents into library
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedContext,
  successResponse,
} from '@/lib/errors/api-errors';
import {
  ingestOrderDocuments,
  ingestNewOrderDocuments,
  getIngestionStatus,
} from '@/lib/documents/document-ingester';

export const maxDuration = 300; // 5 minutes for bulk ingestion
export const dynamic = 'force-dynamic';

// =============================================
// GET /api/documents/ingest/orders - Get ingestion status
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { tenantId } = await getAuthenticatedContext(supabase);

    const status = await getIngestionStatus(tenantId);

    return successResponse(status);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/documents/ingest/orders - Ingest order documents
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { tenantId } = await getAuthenticatedContext(supabase);

    const body = await request.json().catch(() => ({}));

    // Check if incremental mode is requested (only new documents)
    const isIncremental = body.incremental === true;
    const sinceDays = body.sinceDays || 7;

    let result;
    if (isIncremental) {
      result = await ingestNewOrderDocuments(tenantId, sinceDays);
    } else {
      result = await ingestOrderDocuments(tenantId);
    }

    return successResponse(result, 'Order documents ingestion complete');
  } catch (error) {
    return handleApiError(error);
  }
}
