/**
 * Campaign API - Test Send
 * POST /api/campaigns/test-send
 * Sends a test email to the logged-in user
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiContext,
  canManageCampaigns,
  handleApiError,
  successResponse,
} from '@/lib/api-utils';
import { replaceMergeTokens, getSampleMergeData } from '@/lib/campaigns/merge-tokens';

export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    await canManageCampaigns(context);

    const { supabase, orgId, user } = context;
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      );
    }

    // Get campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('org_id', orgId)
      .single();

    if (error || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Use sample merge data
    const sampleData = getSampleMergeData();

    // Replace tokens
    const subject = replaceMergeTokens(campaign.email_subject, sampleData);
    const body_text = replaceMergeTokens(campaign.email_body, sampleData);

    // TODO: Send email via your email service
    // For now, just log and return success
    console.log('[Test Send]', {
      to: user.email,
      subject: `[TEST] ${subject}`,
      body: `
⚠️ This is a test email from campaign: ${campaign.name}

---

${body_text}

---

This test used sample data:
${JSON.stringify(sampleData, null, 2)}
      `,
    });

    // In production, you would call your email service here:
    // await sendEmail({
    //   to: user.email,
    //   subject: `[TEST] ${subject}`,
    //   body: ...
    // });

    return successResponse(
      { sent: true },
      `Test email would be sent to ${user.email}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
