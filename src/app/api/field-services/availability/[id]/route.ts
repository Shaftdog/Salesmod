import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformResourceAvailability } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/availability/[id]
 * Get availability entry details
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

    const { data: availability, error } = await supabase
      .from('resource_availability')
      .select(`
        *,
        resource:bookable_resources!resource_availability_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url, phone)
        ),
        approved_by_profile:profiles!resource_availability_approved_by_fkey(
          id, name, email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Availability entry not found' }, { status: 404 });
      }
      console.error('Availability query error:', error);
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }

    return NextResponse.json({
      availability: transformResourceAvailability(availability)
    });

  } catch (error: any) {
    console.error('Availability get error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/field-services/availability/[id]
 * Update availability entry
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

    if (body.startDatetime !== undefined) updateData.start_datetime = body.startDatetime;
    if (body.endDatetime !== undefined) updateData.end_datetime = body.endDatetime;
    if (body.availabilityType !== undefined) updateData.availability_type = body.availabilityType;
    if (body.isAvailable !== undefined) updateData.is_available = body.isAvailable;
    if (body.isRecurring !== undefined) updateData.is_recurring = body.isRecurring;
    if (body.recurrenceRule !== undefined) updateData.recurrence_rule = body.recurrenceRule;
    if (body.recurrenceEndDate !== undefined) updateData.recurrence_end_date = body.recurrenceEndDate;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isAllDay !== undefined) updateData.is_all_day = body.isAllDay;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.approvedBy !== undefined) {
      updateData.approved_by = body.approvedBy;
      updateData.approved_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // If updating dates, check for overlaps
    if (updateData.start_datetime || updateData.end_datetime) {
      // Get current entry
      const { data: current } = await supabase
        .from('resource_availability')
        .select('resource_id, start_datetime, end_datetime')
        .eq('id', id)
        .single();

      if (current) {
        const newStartDatetime = updateData.start_datetime || current.start_datetime;
        const newEndDatetime = updateData.end_datetime || current.end_datetime;

        // Check for overlaps (excluding this entry)
        const { data: overlaps } = await supabase
          .from('resource_availability')
          .select('id, start_datetime, end_datetime')
          .eq('resource_id', current.resource_id)
          .neq('id', id)
          .lt('start_datetime', newEndDatetime)
          .gt('end_datetime', newStartDatetime);

        if (overlaps && overlaps.length > 0) {
          return NextResponse.json(
            {
              error: 'Overlapping availability entry exists',
              overlaps,
            },
            { status: 400 }
          );
        }
      }
    }

    const { data: availability, error } = await supabase
      .from('resource_availability')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        resource:bookable_resources!resource_availability_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url)
        )
      `)
      .single();

    if (error) {
      console.error('Availability update error:', error);
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
    }

    return NextResponse.json({
      availability: transformResourceAvailability(availability),
      message: 'Availability updated successfully'
    });

  } catch (error: any) {
    console.error('Availability update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update availability' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/field-services/availability/[id]
 * Delete availability entry
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
      .from('resource_availability')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Availability delete error:', error);
      return NextResponse.json({ error: 'Failed to delete availability' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Availability entry deleted successfully' });

  } catch (error: any) {
    console.error('Availability delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete availability' },
      { status: 500 }
    );
  }
}
