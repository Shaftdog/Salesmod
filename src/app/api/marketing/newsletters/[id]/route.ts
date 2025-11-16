import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getNewsletter,
  updateNewsletter,
  listNewsletterIssues,
  createNewsletterIssue,
} from '@/lib/marketing/newsletter-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeIssues = searchParams.get('includeIssues') === 'true';

    const newsletter = await getNewsletter(params.id);

    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    if (includeIssues) {
      const issues = await listNewsletterIssues(params.id);
      return NextResponse.json({ newsletter, issues });
    }

    return NextResponse.json({ newsletter });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/newsletters/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const newsletter = await updateNewsletter(params.id, body);

    if (!newsletter) {
      return NextResponse.json(
        { error: 'Failed to update newsletter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ newsletter });
  } catch (error: any) {
    console.error('Error in PATCH /api/marketing/newsletters/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
