import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformTimeEntry } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/time-entries
 * List time entries with optional filters
 *
 * Query params:
 * - resourceId: Filter by resource
 * - bookingId: Filter by booking
 * - dateFrom: Start date (ISO string)
 * - dateTo: End date (ISO string)
 * - entryType: Filter by type (booking, travel, administrative, other)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const bookingId = searchParams.get('bookingId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const entryType = searchParams.get('entryType');

    let query = supabase
      .from('time_entries')
      .select(`
        *,
        resource:bookable_resources!time_entries_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url)
        ),
        booking:bookings!time_entries_booking_id_fkey(
          id,
          booking_number,
          property_address,
          scheduled_start,
          scheduled_end
        )
      `)
      .order('entry_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    if (dateFrom) {
      query = query.gte('entry_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('entry_date', dateTo);
    }

    if (entryType) {
      query = query.eq('entry_type', entryType);
    }

    const { data: timeEntries, error } = await query;

    if (error) {
      console.error('Time entries list error:', error);
      return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
    }

    return NextResponse.json({
      timeEntries: timeEntries.map(transformTimeEntry)
    });

  } catch (error: any) {
    console.error('Time entries API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch time entries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/field-services/time-entries
 * Create new time entry (clock in/manual entry)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.resourceId || !body.entryDate || !body.entryType) {
      return NextResponse.json(
        { error: 'Missing required fields: resourceId, entryDate, entryType' },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case
    const timeEntryData: any = {
      resource_id: body.resourceId,
      booking_id: body.bookingId,
      entry_date: body.entryDate,
      entry_type: body.entryType,
      start_time: body.startTime,
      end_time: body.endTime,
      duration_minutes: body.durationMinutes,
      is_billable: body.isBillable !== undefined ? body.isBillable : true,
      hourly_rate: body.hourlyRate,
      break_minutes: body.breakMinutes || 0,
      notes: body.notes,
      location: body.location,
    };

    // Auto-calculate duration if start and end times provided
    if (body.startTime && body.endTime && !body.durationMinutes) {
      const start = new Date(`${body.entryDate}T${body.startTime}`);
      const end = new Date(`${body.entryDate}T${body.endTime}`);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      timeEntryData.duration_minutes = duration - (body.breakMinutes || 0);
    }

    const { data: timeEntry, error } = await supabase
      .from('time_entries')
      .insert(timeEntryData)
      .select(`
        *,
        resource:bookable_resources!time_entries_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url)
        ),
        booking:bookings!time_entries_booking_id_fkey(
          id,
          booking_number,
          property_address
        )
      `)
      .single();

    if (error) {
      console.error('Time entry creation error:', error);
      return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 });
    }

    return NextResponse.json({
      timeEntry: transformTimeEntry(timeEntry),
      message: 'Time entry created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Time entry creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create time entry' },
      { status: 500 }
    );
  }
}
