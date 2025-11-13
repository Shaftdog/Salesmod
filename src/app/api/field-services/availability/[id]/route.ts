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

    if (body.dateFrom !== undefined) updateData.date_from = body.dateFrom;
    if (body.dateTo !== undefined) updateData.date_to = body.dateTo;
    if (body.availabilityType !== undefined) updateData.availability_type = body.availabilityType;
    if (body.timeFrom !== undefined) updateData.time_from = body.timeFrom;
    if (body.timeTo !== undefined) updateData.time_to = body.timeTo;
    if (body.isRecurring !== undefined) updateData.is_recurring = body.isRecurring;
    if (body.recurrencePattern !== undefined) updateData.recurrence_pattern = body.recurrencePattern;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isApproved !== undefined) updateData.is_approved = body.isApproved;
    if (body.approvedBy !== undefined) updateData.approved_by = body.approvedBy;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // If updating dates, check for overlaps
    if (updateData.date_from || updateData.date_to) {
      // Get current entry
      const { data: current } = await supabase
        .from('resource_availability')
        .select('resource_id, date_from, date_to')
        .eq('id', id)
        .single();

      if (current) {
        const newDateFrom = updateData.date_from || current.date_from;
        const newDateTo = updateData.date_to || current.date_to;

        // Check for overlaps (excluding this entry)
        const { data: overlaps } = await supabase
          .from('resource_availability')
          .select('id, date_from, date_to')
          .eq('resource_id', current.resource_id)
          .neq('id', id)
          .lt('date_from', newDateTo)
          .gt('date_to', newDateFrom);

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
