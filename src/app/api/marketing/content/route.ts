import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createContent, listContent } from '@/lib/marketing/content-service';
import { CreateContentInput } from '@/lib/types/marketing';

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
    const contentType = searchParams.get('contentType') || undefined;
    const campaignId = searchParams.get('campaignId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const content = await listContent(orgId, { status, contentType, campaignId, limit, offset });

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/content:', error);
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

    const body: CreateContentInput = await request.json();

    if (!body.title || !body.contentType || !body.body) {
      return NextResponse.json(
        { error: 'Missing required fields: title, contentType, body' },
        { status: 400 }
      );
    }

    const content = await createContent(orgId, user.id, body);

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to create content' },
        { status: 500 }
      );
    }

    return NextResponse.json({ content }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/marketing/content:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
