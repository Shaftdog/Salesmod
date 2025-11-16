import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getNewsletter,
  updateNewsletter,
  listNewsletterIssues,
  createNewsletterIssue,
} from '@/lib/marketing/newsletter-service';
import { verifyOrgAccess } from '@/lib/api/helpers';
import { updateNewsletterSchema } from '@/lib/validation/marketing';
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

    const searchParams = request.nextUrl.searchParams;
    const includeIssues = searchParams.get('includeIssues') === 'true';

    const { id } = await params;

    const newsletter = await getNewsletter(id);

    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // SECURITY: Verify org ownership to prevent IDOR vulnerability
    if (!await verifyOrgAccess(newsletter.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (includeIssues) {
      const issues = await listNewsletterIssues(id);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // First, fetch the newsletter to verify ownership
    const existingNewsletter = await getNewsletter(id);

    if (!existingNewsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // SECURITY: Verify org ownership to prevent IDOR vulnerability
    if (!await verifyOrgAccess(existingNewsletter.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // SECURITY: Validate input with Zod schema
    const validated = updateNewsletterSchema.parse(body);

    const newsletter = await updateNewsletter(id, validated);

    if (!newsletter) {
      return NextResponse.json(
        { error: 'Failed to update newsletter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ newsletter });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in PATCH /api/marketing/newsletters/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
