/**
 * Gmail Attachments Ingestion API
 * POST /api/documents/ingest/gmail - Ingest all Gmail attachments
 * POST /api/documents/ingest/gmail/[messageId] - Ingest specific message attachments
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedContext,
  successResponse,
  BadRequestError,
} from '@/lib/errors/api-errors';
import { ingestAllGmailAttachments } from '@/lib/documents/document-ingester';

export const maxDuration = 300; // 5 minutes for bulk ingestion
export const dynamic = 'force-dynamic';

// =============================================
// POST /api/documents/ingest/gmail - Ingest all Gmail attachments
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { orgId, tenantId } = await getAuthenticatedContext(supabase);

    const body = await request.json().catch(() => ({}));
    const sinceDays = body.sinceDays || 30;

    if (sinceDays < 1 || sinceDays > 365) {
      throw new BadRequestError('sinceDays must be between 1 and 365');
    }

    const result = await ingestAllGmailAttachments(orgId, tenantId, sinceDays);

    return successResponse(result, 'Gmail attachments ingestion complete');
  } catch (error) {
    return handleApiError(error);
  }
}
