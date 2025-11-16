import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createNewsletterIssue,
  listNewsletterIssues,
} from '@/lib/marketing/newsletter-service';
import { CreateNewsletterIssueInput } from '@/lib/types/marketing';

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

    const issues = await listNewsletterIssues(params.id);

    return NextResponse.json({ issues });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/newsletters/[id]/issues:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateNewsletterIssueInput = await request.json();

    if (!body.subject) {
      return NextResponse.json(
        { error: 'Missing required field: subject' },
        { status: 400 }
      );
    }

    // Ensure newsletterId matches the URL param
    body.newsletterId = params.id;

    const issue = await createNewsletterIssue(user.id, body);

    if (!issue) {
      return NextResponse.json(
        { error: 'Failed to create newsletter issue' },
        { status: 500 }
      );
    }

    return NextResponse.json({ issue }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/marketing/newsletters/[id]/issues:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
