import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getNewsletter,
  createNewsletterIssue,
  listNewsletterIssues,
} from '@/lib/marketing/newsletter-service';
import { CreateNewsletterIssueInput } from '@/lib/types/marketing';
import { verifyOrgAccess } from '@/lib/api/helpers';
import { createNewsletterIssueSchema } from '@/lib/validation/marketing';
import { z } from 'zod';

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

    const { id } = await params;

    // SECURITY: Verify the newsletter belongs to user's org
    const newsletter = await getNewsletter(id);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    if (!await verifyOrgAccess(newsletter.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const issues = await listNewsletterIssues(id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // SECURITY: Verify the newsletter belongs to user's org
    const newsletter = await getNewsletter(id);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    if (!await verifyOrgAccess(newsletter.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // SECURITY: Validate input with Zod schema
    const validated = createNewsletterIssueSchema.parse(body);

    // Ensure newsletterId matches the URL param
    const input: CreateNewsletterIssueInput = {
      ...validated,
      newsletterId: id,
    } as CreateNewsletterIssueInput;

    const issue = await createNewsletterIssue(user.id, input);

    if (!issue) {
      return NextResponse.json(
        { error: 'Failed to create newsletter issue' },
        { status: 500 }
      );
    }

    return NextResponse.json({ issue }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/marketing/newsletters/[id]/issues:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
