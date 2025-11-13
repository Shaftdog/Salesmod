import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformTimeEntry } from '@/lib/supabase/transforms';

/**
 * POST /api/field-services/time-entries/clock
 * Clock in/out for a resource
 *
 * Body:
 * - action: 'in' | 'out'
 * - resourceId: string
 * - bookingId?: string (for clock in)
 * - entryType?: string (for clock in)
 * - location?: string
 * - notes?: string
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, resourceId, bookingId, entryType, location, notes, breakMinutes } = body;

    if (!action || !resourceId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, resourceId' },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    if (action === 'in') {
      // CLOCK IN: Create new time entry
      const timeEntryData = {
        resource_id: resourceId,
        booking_id: bookingId,
        entry_date: currentDate,
        entry_type: entryType || 'booking',
        start_time: currentTime,
        is_billable: true,
        location,
        notes,
      };

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
        console.error('Clock in error:', error);
        return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 });
      }

      return NextResponse.json({
        timeEntry: transformTimeEntry(timeEntry),
        message: 'Clocked in successfully',
        action: 'in'
      }, { status: 201 });

    } else if (action === 'out') {
      // CLOCK OUT: Find active time entry and update end time
      const { data: activeEntries, error: findError } = await supabase
        .from('time_entries')
        .select('id, entry_date, start_time, break_minutes')
        .eq('resource_id', resourceId)
        .is('end_time', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (findError || !activeEntries || activeEntries.length === 0) {
        return NextResponse.json(
          { error: 'No active time entry found for this resource' },
          { status: 404 }
        );
      }

      const activeEntry = activeEntries[0];

      // Calculate duration
      const start = new Date(`${activeEntry.entry_date}T${activeEntry.start_time}`);
      const end = new Date(`${currentDate}T${currentTime}`);
      const totalMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      const breakMins = breakMinutes ?? activeEntry.break_minutes ?? 0;
      const durationMinutes = totalMinutes - breakMins;

      const updateData: any = {
        end_time: currentTime,
        duration_minutes: durationMinutes,
      };

      if (breakMinutes !== undefined) {
        updateData.break_minutes = breakMinutes;
      }

      if (location) {
        updateData.location = location;
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { data: timeEntry, error: updateError } = await supabase
        .from('time_entries')
        .update(updateData)
        .eq('id', activeEntry.id)
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

      if (updateError) {
        console.error('Clock out error:', updateError);
        return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 });
      }

      return NextResponse.json({
        timeEntry: transformTimeEntry(timeEntry),
        message: 'Clocked out successfully',
        action: 'out',
        duration: durationMinutes
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "in" or "out"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Clock operation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process clock operation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/field-services/time-entries/clock
 * Get current clock status for a resource
 *
 * Query params:
 * - resourceId: string (required)
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

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Missing required parameter: resourceId' },
        { status: 400 }
      );
    }

    // Find active time entry (no end time)
    const { data: activeEntries, error } = await supabase
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
      .eq('resource_id', resourceId)
      .is('end_time', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Clock status error:', error);
      return NextResponse.json({ error: 'Failed to get clock status' }, { status: 500 });
    }

    if (!activeEntries || activeEntries.length === 0) {
      return NextResponse.json({
        isClockedIn: false,
        activeEntry: null
      });
    }

    return NextResponse.json({
      isClockedIn: true,
      activeEntry: transformTimeEntry(activeEntries[0])
    });

  } catch (error: any) {
    console.error('Clock status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get clock status' },
      { status: 500 }
    );
  }
}
