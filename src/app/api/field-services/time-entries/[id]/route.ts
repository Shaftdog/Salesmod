import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformTimeEntry } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/time-entries/[id]
 * Get time entry details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: timeEntry, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        resource:bookable_resources!time_entries_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url, phone)
        ),
        booking:bookings!time_entries_booking_id_fkey(
          id,
          booking_number,
          property_address,
          scheduled_start,
          scheduled_end,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
      }
      console.error('Time entry query error:', error);
      return NextResponse.json({ error: 'Failed to fetch time entry' }, { status: 500 });
    }

    return NextResponse.json({
      timeEntry: transformTimeEntry(timeEntry)
    });

  } catch (error: any) {
    console.error('Time entry get error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch time entry' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/field-services/time-entries/[id]
 * Update time entry (clock out, edit)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Convert camelCase to snake_case
    const updateData: any = {};

    if (body.entryDate !== undefined) updateData.entry_date = body.entryDate;
    if (body.entryType !== undefined) updateData.entry_type = body.entryType;
    if (body.startTime !== undefined) updateData.start_time = body.startTime;
    if (body.endTime !== undefined) updateData.end_time = body.endTime;
    if (body.durationMinutes !== undefined) updateData.duration_minutes = body.durationMinutes;
    if (body.isBillable !== undefined) updateData.is_billable = body.isBillable;
    if (body.hourlyRate !== undefined) updateData.hourly_rate = body.hourlyRate;
    if (body.breakMinutes !== undefined) updateData.break_minutes = body.breakMinutes;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.location !== undefined) updateData.location = body.location;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Auto-calculate duration if updating times
    if ((updateData.start_time || updateData.end_time) && !updateData.duration_minutes) {
      // Get current entry to use existing values
      const { data: current } = await supabase
        .from('time_entries')
        .select('entry_date, start_time, end_time, break_minutes')
        .eq('id', id)
        .single();

      if (current) {
        const startTime = updateData.start_time || current.start_time;
        const endTime = updateData.end_time || current.end_time;
        const breakMinutes = updateData.break_minutes ?? current.break_minutes ?? 0;

        if (startTime && endTime) {
          const entryDate = updateData.entry_date || current.entry_date;
          const start = new Date(`${entryDate}T${startTime}`);
          const end = new Date(`${entryDate}T${endTime}`);
          const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
          updateData.duration_minutes = duration - breakMinutes;
        }
      }
    }

    const { data: timeEntry, error } = await supabase
      .from('time_entries')
      .update(updateData)
      .eq('id', id)
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
      console.error('Time entry update error:', error);
      return NextResponse.json({ error: 'Failed to update time entry' }, { status: 500 });
    }

    return NextResponse.json({
      timeEntry: transformTimeEntry(timeEntry),
      message: 'Time entry updated successfully'
    });

  } catch (error: any) {
    console.error('Time entry update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update time entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/field-services/time-entries/[id]
 * Delete time entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Time entry delete error:', error);
      return NextResponse.json({ error: 'Failed to delete time entry' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Time entry deleted successfully' });

  } catch (error: any) {
    console.error('Time entry delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete time entry' },
      { status: 500 }
    );
  }
}
