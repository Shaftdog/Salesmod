import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createWebinar,
  listWebinars,
  CreateWebinarInput,
} from '@/lib/marketing/webinar-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const orgId = profile.id;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const campaignId = searchParams.get('campaignId') || undefined;
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const webinars = await listWebinars(orgId, {
      status,
      campaignId,
      upcoming,
      limit,
      offset,
    });

    return NextResponse.json({ webinars });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/webinars:', error);
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const orgId = profile.id;

    const body: CreateWebinarInput = await request.json();

    if (!body.title || !body.scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields: title, scheduledAt' },
        { status: 400 }
      );
    }

    const webinar = await createWebinar(orgId, user.id, body);

    if (!webinar) {
      return NextResponse.json(
        { error: 'Failed to create webinar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ webinar }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/marketing/webinars:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
