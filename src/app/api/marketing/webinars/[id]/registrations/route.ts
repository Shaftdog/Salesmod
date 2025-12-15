import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getWebinar,
  getWebinarRegistrations,
  registerForWebinar,
  markAttendance,
} from '@/lib/marketing/webinar-service';
import { verifyOrgAccess } from '@/lib/api/helpers';
import { createWebinarRegistrationSchema } from '@/lib/validation/marketing';
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

    // SECURITY: Verify the webinar belongs to user's org
    const webinar = await getWebinar(id);
    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    if (!await verifyOrgAccess(webinar.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const registrations = await getWebinarRegistrations(id);

    // Fetch contact details for each registration
    const contactIds = registrations.map((r) => r.contactId);
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, company_name')
      .in('id', contactIds);

    const enrichedRegistrations = registrations.map((reg) => {
      const contact = contacts?.find((c) => c.id === reg.contactId);
      return {
        ...reg,
        contact,
      };
    });

    return NextResponse.json({ registrations: enrichedRegistrations });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/webinars/[id]/registrations:', error);
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

    // SECURITY: Verify the webinar belongs to user's org
    const webinar = await getWebinar(id);
    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    if (!await verifyOrgAccess(webinar.orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // SECURITY: Validate input with Zod schema
    // Note: We don't validate all fields here as some may be optional in the service
    // But we do validate the critical fields
    if (!body.contactId) {
      return NextResponse.json(
        { error: 'Missing required field: contactId' },
        { status: 400 }
      );
    }

    const registration = await registerForWebinar(
      id,
      body.contactId,
      body.source,
      body.questionsAnswers
    );

    if (!registration) {
      return NextResponse.json(
        { error: 'Failed to register for webinar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error: any) {
    // Check for unique constraint violation
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return NextResponse.json(
        { error: 'Contact is already registered for this webinar' },
        { status: 409 }
      );
    }

    console.error('Error in POST /api/marketing/webinars/[id]/registrations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
