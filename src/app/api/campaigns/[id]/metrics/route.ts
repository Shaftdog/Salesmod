/**
 * Campaign API - Get Metrics
 * GET /api/campaigns/:id/metrics
 * Returns comprehensive metrics for a campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiContext,
  canManageCampaigns,
  handleApiError,
  successResponse,
} from '@/lib/api-utils';
import { getCampaignMetrics } from '@/lib/campaigns/metrics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { supabase, orgId } = context;
    const { id } = await params;

    // Verify campaign exists
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Calculate metrics
    const metrics = await getCampaignMetrics(id, orgId);

    return successResponse(metrics);
  } catch (error) {
    return handleApiError(error);
  }
}
