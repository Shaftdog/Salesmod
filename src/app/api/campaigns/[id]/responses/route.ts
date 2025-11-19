/**
 * Get campaign responses
 * GET /api/campaigns/:id/responses
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiContext,
  canManageCampaigns,
  handleApiError,
  successResponse,
} from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { supabase, orgId } = context;
    const { id } = await params;

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Fetch responses
    const { data: responses, error } = await supabase
      .from('campaign_responses')
      .select('*')
      .eq('campaign_id', id)
      .eq('org_id', orgId)
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching responses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    return successResponse({ responses: responses || [] });
  } catch (error: any) {
    return handleApiError(error);
  }
}
