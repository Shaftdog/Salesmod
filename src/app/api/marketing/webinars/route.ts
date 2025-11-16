import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createWebinar,
  listWebinars,
  CreateWebinarInput,
} from '@/lib/marketing/webinar-service';
import { createWebinarSchema } from '@/lib/validation/marketing';
import { z } from 'zod';

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

    const body = await request.json();

    // SECURITY: Validate input with Zod schema
    const validated = createWebinarSchema.parse(body);

    const webinar = await createWebinar(orgId, user.id, validated as CreateWebinarInput);

    if (!webinar) {
      return NextResponse.json(
        { error: 'Failed to create webinar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ webinar }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/marketing/webinars:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
