import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCampaign, getCampaignAnalytics } from '@/lib/marketing/campaign-service';
import { verifyOrgAccess } from '@/lib/api/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const { id } = await params;

    // SECURITY: First verify the campaign belongs to the user's org
    const campaign = await getCampaign(id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (!await verifyOrgAccess(campaign.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const analytics = await getCampaignAnalytics(id);

    if (!analytics) {
      return NextResponse.json({ error: 'Analytics not found' }, { status: 404 });
    }

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/campaigns/[id]/analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
