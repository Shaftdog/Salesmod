import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getWebinar,
  updateWebinar,
  deleteWebinar,
  getWebinarStats,
  UpdateWebinarInput,
} from '@/lib/marketing/webinar-service';

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

    const webinar = await getWebinar(params.id);

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    // Get stats
    const stats = await getWebinarStats(params.id);

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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateWebinarInput = await request.json();

    const webinar = await updateWebinar(params.id, body);

    if (!webinar) {
      return NextResponse.json(
        { error: 'Failed to update webinar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ webinar });
  } catch (error: any) {
    console.error('Error in PATCH /api/marketing/webinars/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await deleteWebinar(params.id);

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
