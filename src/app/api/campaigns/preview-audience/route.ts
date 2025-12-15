/**
 * Campaign API - Preview Audience
 * POST /api/campaigns/preview-audience
 * Returns count and sample of recipients for a target segment
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiContext,
  canManageCampaigns,
  handleApiError,
  successResponse,
} from '@/lib/api-utils';
import { resolveTargetSegment } from '@/lib/campaigns/audience-resolver';
import type { PreviewAudienceRequest } from '@/lib/campaigns/types';

export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { orgId } = context;
    const body: PreviewAudienceRequest = await request.json();

    if (!body.target_segment) {
      return NextResponse.json(
        { error: 'target_segment is required' },
        { status: 400 }
      );
    }

    // Resolve full audience
    const recipients = await resolveTargetSegment(body.target_segment, orgId);

    // Return count and first 5 as sample
    const sample = recipients.slice(0, 5);

    return successResponse({
      count: recipients.length,
      sample,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
