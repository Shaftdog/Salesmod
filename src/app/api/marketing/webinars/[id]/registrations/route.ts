import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getWebinarRegistrations,
  registerForWebinar,
  markAttendance,
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

    const registrations = await getWebinarRegistrations(params.id);

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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.contactId) {
      return NextResponse.json(
        { error: 'Missing required field: contactId' },
        { status: 400 }
      );
    }

    const registration = await registerForWebinar(
      params.id,
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
    console.error('Error in POST /api/marketing/webinars/[id]/registrations:', error);

    // Check for unique constraint violation
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return NextResponse.json(
        { error: 'Contact is already registered for this webinar' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
