/**
 * Campaign API - Process Response
 * POST /api/campaigns/process-response
 * Called by Gmail poller when a reply is detected
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiContext,
  handleApiError,
  successResponse,
} from '@/lib/api-utils';
import { processResponse } from '@/lib/campaigns/process-response';

export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { orgId } = context;

    const body = await request.json();
    const { gmailMessageId, jobTaskId } = body;

    if (!gmailMessageId || !jobTaskId) {
      return NextResponse.json(
        { error: 'gmailMessageId and jobTaskId are required' },
        { status: 400 }
      );
    }

    // Process the response
    await processResponse({
      gmailMessageId,
      jobTaskId,
      orgId,
    });

    return successResponse(
      { processed: true },
      'Response processed successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
