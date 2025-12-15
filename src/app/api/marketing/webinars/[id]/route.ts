import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getWebinar,
  updateWebinar,
  deleteWebinar,
  getWebinarStats,
  UpdateWebinarInput,
} from '@/lib/marketing/webinar-service';
import { verifyOrgAccess } from '@/lib/api/helpers';
import { updateWebinarSchema } from '@/lib/validation/marketing';
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

    const webinar = await getWebinar(id);

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    // SECURITY: Verify org ownership to prevent IDOR vulnerability
    if (!await verifyOrgAccess(webinar.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get stats
    const stats = await getWebinarStats(id);

    return NextResponse.json({ webinar, stats });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/webinars/[id]:', error);
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

    // First, fetch the webinar to verify ownership
    const existingWebinar = await getWebinar(id);

    if (!existingWebinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    // SECURITY: Verify org ownership to prevent IDOR vulnerability
    if (!await verifyOrgAccess(existingWebinar.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // SECURITY: Validate input with Zod schema
    const validated = updateWebinarSchema.parse(body);

    const webinar = await updateWebinar(id, validated as UpdateWebinarInput);

    if (!webinar) {
      return NextResponse.json(
        { error: 'Failed to update webinar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ webinar });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in PATCH /api/marketing/webinars/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // First, fetch the webinar to verify ownership
    const webinar = await getWebinar(id);

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    // SECURITY: Verify org ownership to prevent IDOR vulnerability
    if (!await verifyOrgAccess(webinar.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await deleteWebinar(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete webinar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/marketing/webinars/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
