/**
 * Campaign API - Launch Campaign
 * POST /api/campaigns/:id/launch
 * Launches a campaign by creating job and tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiContext,
  canManageCampaigns,
  handleApiError,
  successResponse,
} from '@/lib/api-utils';
import { launchCampaign } from '@/lib/campaigns/launch';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { orgId } = context;
    const { id } = params;

    // Launch campaign
    const result = await launchCampaign(id, orgId);

    return successResponse(result, 'Campaign launched successfully');
  } catch (error: any) {
    return handleApiError(error);
  }
}
