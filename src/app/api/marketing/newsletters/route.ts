import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNewsletter, listNewsletters } from '@/lib/marketing/newsletter-service';
import { CreateNewsletterInput } from '@/lib/types/marketing';
import { createNewsletterSchema } from '@/lib/validation/marketing';
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
    const activeOnly = searchParams.get('active') !== 'false';

    const newsletters = await listNewsletters(orgId, activeOnly);

    return NextResponse.json({ newsletters });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/newsletters:', error);
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
    const validated = createNewsletterSchema.parse(body);

    const newsletter = await createNewsletter(orgId, user.id, validated as CreateNewsletterInput);

    if (!newsletter) {
      return NextResponse.json(
        { error: 'Failed to create newsletter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ newsletter }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/marketing/newsletters:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
