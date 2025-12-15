/**
 * Campaign API - Individual Campaign Operations
 * GET /api/campaigns/:id - Get campaign details
 * PATCH /api/campaigns/:id - Update campaign
 * DELETE /api/campaigns/:id - Delete campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiContext,
  canManageCampaigns,
  handleApiError,
  successResponse,
  noContentResponse,
} from '@/lib/api-utils';
import type { UpdateCampaignRequest } from '@/lib/campaigns/types';
import { extractAndValidateTokens } from '@/lib/campaigns/merge-tokens';

// =====================================================
// GET - Get Campaign Details
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { supabase, orgId } = context;
    const { id } = await params;

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return successResponse(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

// =====================================================
// PATCH - Update Campaign
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { supabase, orgId } = context;
    const { id } = await params;
    const body: UpdateCampaignRequest = await request.json();

    // Check campaign exists and belongs to org
    const { data: existing, error: fetchError } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Prevent editing active/completed campaigns
    if (existing.status === 'active' || existing.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot edit active or completed campaigns' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.target_segment) updates.target_segment = body.target_segment;
    if (body.send_rate_per_hour) updates.send_rate_per_hour = body.send_rate_per_hour;
    if (body.start_at !== undefined) updates.start_at = body.start_at;
    if (body.status) updates.status = body.status;

    // Handle email content updates with token validation
    if (body.email_subject || body.email_body) {
      const subjectToCheck = body.email_subject || '';
      const bodyToCheck = body.email_body || '';

      const subjectTokens = extractAndValidateTokens(subjectToCheck);
      const bodyTokens = extractAndValidateTokens(bodyToCheck);

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

      if (body.email_subject) updates.email_subject = body.email_subject;
      if (body.email_body) updates.email_body = body.email_body;

      // Update used_merge_tokens
      const allTokens = [...new Set([...subjectTokens.tokens, ...bodyTokens.tokens])];
      updates.used_merge_tokens = allTokens;
    }

    // Update campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;

    return successResponse(campaign, 'Campaign updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// =====================================================
// DELETE - Delete Campaign
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { supabase, orgId } = context;
    const { id } = await params;

    // Check campaign exists and is not active
    const { data: existing, error: fetchError } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active campaigns. Please pause it first.' },
        { status: 400 }
      );
    }

    // Delete campaign (cascades to responses and status)
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;

    return noContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
