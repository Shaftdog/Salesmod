import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformBooking } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/bookings/[id]
 * Get a single booking with full details
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

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        orders (*),
        bookable_resources:resource_id (
          *,
          profiles (id, name, email, avatar_url, phone)
        ),
        service_territories:territory_id (*),
        assigner:profiles!bookings_assigned_by_fkey (id, name, email),
        canceller:profiles!bookings_cancelled_by_fkey (id, name, email),
        original_booking:bookings!bookings_original_booking_id_fkey (
          id, booking_number, scheduled_start, status
        ),
        rescheduled_booking:bookings!bookings_rescheduled_booking_id_fkey (
          id, booking_number, scheduled_start, status
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      console.error('Booking query error:', error);
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
    }

    const transformedBooking = transformBooking(booking);

    return NextResponse.json({ booking: transformedBooking });

  } catch (error: any) {
    console.error('Booking get error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/field-services/bookings/[id]
 * Update a booking
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

    // Convert camelCase to snake_case for database
    const updateData: any = {};

    if (body.resourceId !== undefined) updateData.resource_id = body.resourceId;
    if (body.territoryId !== undefined) updateData.territory_id = body.territoryId;
    if (body.bookingType !== undefined) updateData.booking_type = body.bookingType;
    if (body.scheduledStart !== undefined) updateData.scheduled_start = body.scheduledStart;
    if (body.scheduledEnd !== undefined) updateData.scheduled_end = body.scheduledEnd;
    if (body.actualStart !== undefined) updateData.actual_start = body.actualStart;
    if (body.actualEnd !== undefined) updateData.actual_end = body.actualEnd;
    if (body.durationMinutes !== undefined) updateData.duration_minutes = body.durationMinutes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.propertyAddress !== undefined) updateData.property_address = body.propertyAddress;
    if (body.propertyCity !== undefined) updateData.property_city = body.propertyCity;
    if (body.propertyState !== undefined) updateData.property_state = body.propertyState;
    if (body.propertyZip !== undefined) updateData.property_zip = body.propertyZip;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.accessInstructions !== undefined) updateData.access_instructions = body.accessInstructions;
    if (body.specialInstructions !== undefined) updateData.special_instructions = body.specialInstructions;
    if (body.contactName !== undefined) updateData.contact_name = body.contactName;
    if (body.contactPhone !== undefined) updateData.contact_phone = body.contactPhone;
    if (body.contactEmail !== undefined) updateData.contact_email = body.contactEmail;
    if (body.estimatedTravelTimeMinutes !== undefined) updateData.estimated_travel_time_minutes = body.estimatedTravelTimeMinutes;
    if (body.actualTravelTimeMinutes !== undefined) updateData.actual_travel_time_minutes = body.actualTravelTimeMinutes;
    if (body.estimatedMileage !== undefined) updateData.estimated_mileage = body.estimatedMileage;
    if (body.actualMileage !== undefined) updateData.actual_mileage = body.actualMileage;
    if (body.completionNotes !== undefined) updateData.completion_notes = body.completionNotes;
    if (body.customerRating !== undefined) updateData.customer_rating = body.customerRating;
    if (body.customerFeedback !== undefined) updateData.customer_feedback = body.customerFeedback;

    // Handle status transitions
    if (body.status === 'completed' && !body.completedAt) {
      updateData.completed_at = new Date().toISOString();
    }
    if (body.status === 'in_progress' && !body.actualStart) {
      updateData.actual_start = new Date().toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        orders (*),
        bookable_resources:resource_id (
          *,
          profiles (id, name, email, avatar_url)
        ),
        service_territories:territory_id (*),
        assigner:profiles!bookings_assigned_by_fkey (id, name, email)
      `)
      .single();

    if (updateError) {
      console.error('Booking update error:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    const transformedBooking = transformBooking(booking);

    return NextResponse.json({
      booking: transformedBooking,
      message: 'Booking updated successfully'
    });

  } catch (error: any) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update booking' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/field-services/bookings/[id]
 * Cancel a booking
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
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'Cancelled by user';

    // Update to cancelled status instead of deleting
    const { error: cancelError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason,
      })
      .eq('id', id);

    if (cancelError) {
      console.error('Booking cancel error:', cancelError);
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Booking cancelled successfully' });

  } catch (error: any) {
    console.error('Booking delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
