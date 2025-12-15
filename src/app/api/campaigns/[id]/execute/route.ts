/**
 * Execute a specific campaign
 * POST /api/campaigns/:id/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiContext,
  canManageCampaigns,
  handleApiError,
  successResponse,
} from '@/lib/api-utils';
import { triggerCampaignExecution } from '@/lib/campaigns/job-executor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { id } = await params;

    console.log(`🚀 Manually executing campaign ${id}`);

    const result = await triggerCampaignExecution(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Campaign not found or not ready for execution' },
        { status: 400 }
      );
    }

    return successResponse({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
