/**
 * Campaign API - List & Create
 * GET /api/campaigns - List all campaigns
 * POST /api/campaigns - Create new campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiContext,
  canManageCampaigns,
  handleApiError,
  successResponse,
  createdResponse,
  getPaginationParams,
  buildPaginatedResponse,
} from '@/lib/api-utils';
import type { CreateCampaignRequest } from '@/lib/campaigns/types';
import { extractAndValidateTokens } from '@/lib/campaigns/merge-tokens';

// =====================================================
// GET - List Campaigns
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { supabase, orgId } = context;
    const pagination = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: campaigns, error, count } = await query;

    if (error) throw error;

    return successResponse(
      buildPaginatedResponse(campaigns || [], count || 0, pagination)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// =====================================================
// POST - Create Campaign
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { supabase, orgId, userId } = context;
    const body: CreateCampaignRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.target_segment || !body.email_subject || !body.email_body) {
      return NextResponse.json(
        { error: 'Missing required fields: name, target_segment, email_subject, email_body' },
        { status: 400 }
      );
    }

    // Extract and validate merge tokens
    const subjectTokens = extractAndValidateTokens(body.email_subject);
    const bodyTokens = extractAndValidateTokens(body.email_body);

    if (!subjectTokens.valid) {
      return NextResponse.json(
        {
          error: 'Invalid merge tokens in subject',
          invalid_tokens: subjectTokens.invalid,
        },
        { status: 400 }
      );
    }

    if (!bodyTokens.valid) {
      return NextResponse.json(
        {
          error: 'Invalid merge tokens in body',
          invalid_tokens: bodyTokens.invalid,
        },
        { status: 400 }
      );
    }

    // Combine all used tokens
    const allTokens = [...new Set([...subjectTokens.tokens, ...bodyTokens.tokens])];

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        org_id: orgId,
        name: body.name,
        description: body.description || null,
        channel: 'email',
        status: 'draft',
        target_segment: body.target_segment,
        email_subject: body.email_subject,
        email_body: body.email_body,
        email_template_id: body.email_template_id || null,
        used_merge_tokens: allTokens,
        send_rate_per_hour: body.send_rate_per_hour || 75,
        start_at: body.start_at || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return createdResponse(campaign, 'Campaign created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
