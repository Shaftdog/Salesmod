import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCampaign, listCampaigns } from '@/lib/marketing/campaign-service';
import { CreateCampaignInput } from '@/lib/types/marketing';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org_id from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const orgId = profile.id; // In real multi-tenant, this would be different

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const goal = searchParams.get('goal') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const campaigns = await listCampaigns(orgId, { status, goal, limit, offset });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org_id from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const orgId = profile.id;

    const body: CreateCampaignInput = await request.json();

    // Validate required fields
    if (!body.name || !body.goal || !body.startDate || !body.channels?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: name, goal, startDate, channels' },
        { status: 400 }
      );
    }

    const campaign = await createCampaign(orgId, user.id, body);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/marketing/campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
