import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformBooking } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/bookings
 * List all bookings with filters
 *
 * Query params:
 * - resourceId: Filter by resource
 * - status: Filter by status
 * - startDate: Filter bookings after this date
 * - endDate: Filter bookings before this date
 * - orderId: Filter by order
 * - territoryId: Filter by territory
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
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const orderId = searchParams.get('orderId');
    const territoryId = searchParams.get('territoryId');

    let query = supabase
      .from('bookings')
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
      .eq('org_id', user.id);

    // Apply filters
    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('scheduled_start', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_start', endDate);
    }

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    if (territoryId) {
      query = query.eq('territory_id', territoryId);
    }

    const { data: bookings, error } = await query.order('scheduled_start', { ascending: true });

    if (error) {
      console.error('Bookings query error:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    const transformedBookings = (bookings || []).map(transformBooking);

    return NextResponse.json({ bookings: transformedBookings });

  } catch (error: any) {
    console.error('Bookings list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/field-services/bookings
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      orderId,
      resourceId,
      territoryId,
      bookingType = 'inspection',
      scheduledStart,
      scheduledEnd,
      durationMinutes,
      propertyAddress,
      propertyCity,
      propertyState,
      propertyZip,
      latitude,
      longitude,
      accessInstructions,
      specialInstructions,
      contactName,
      contactPhone,
      contactEmail,
      estimatedTravelTimeMinutes,
      estimatedMileage,
      autoAssigned = false,
    } = body;

    // Validate required fields
    if (!resourceId || !scheduledStart || !scheduledEnd || !propertyAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: resourceId, scheduledStart, scheduledEnd, propertyAddress' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      return NextResponse.json(
        { error: 'scheduledEnd must be after scheduledStart' },
        { status: 400 }
      );
    }

    // Check for conflicts before creating
    const conflicts = await checkBookingConflicts(supabase, {
      resourceId,
      scheduledStart,
      scheduledEnd,
    });

    // Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        org_id: user.id,
        order_id: orderId,
        resource_id: resourceId,
        territory_id: territoryId,
        booking_type: bookingType,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        duration_minutes: durationMinutes,
        property_address: propertyAddress,
        property_city: propertyCity,
        property_state: propertyState,
        property_zip: propertyZip,
        latitude,
        longitude,
        access_instructions: accessInstructions,
        special_instructions: specialInstructions,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        estimated_travel_time_minutes: estimatedTravelTimeMinutes,
        estimated_mileage: estimatedMileage,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
        auto_assigned: autoAssigned,
        status: conflicts.length > 0 ? 'requested' : 'scheduled',
      })
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

    if (insertError) {
      console.error('Booking insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    const transformedBooking = transformBooking(booking);

    return NextResponse.json({
      booking: transformedBooking,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      message: conflicts.length > 0
        ? 'Booking created with conflicts detected'
        : 'Booking created successfully'
    });

  } catch (error: any) {
    console.error('Booking create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check for booking conflicts
 */
async function checkBookingConflicts(
  supabase: any,
  params: {
    resourceId: string;
    scheduledStart: string;
    scheduledEnd: string;
    excludeBookingId?: string;
  }
) {
  const { resourceId, scheduledStart, scheduledEnd, excludeBookingId } = params;

  // Query overlapping bookings
  let query = supabase
    .from('bookings')
    .select('id, booking_number, scheduled_start, scheduled_end, status')
    .eq('resource_id', resourceId)
    .not('status', 'in', '("cancelled","rescheduled")')
    .lt('scheduled_start', scheduledEnd)
    .gt('scheduled_end', scheduledStart);

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId);
  }

  const { data: overlapping } = await query;

  const conflicts = [];

  if (overlapping && overlapping.length > 0) {
    for (const booking of overlapping) {
      conflicts.push({
        type: 'time_overlap',
        severity: 'error',
        conflictingBooking: booking,
        message: `Overlaps with booking ${booking.booking_number}`,
      });
    }
  }

  // Check daily capacity
  const dayStart = new Date(scheduledStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data: resource } = await supabase
    .from('bookable_resources')
    .select('max_daily_appointments')
    .eq('id', resourceId)
    .single();

  if (resource) {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('resource_id', resourceId)
      .gte('scheduled_start', dayStart.toISOString())
      .lt('scheduled_start', dayEnd.toISOString())
      .not('status', 'in', '("cancelled","rescheduled")');

    if (count && count >= resource.max_daily_appointments) {
      conflicts.push({
        type: 'capacity_exceeded',
        severity: 'warning',
        message: `Resource has ${count} bookings, max is ${resource.max_daily_appointments}`,
      });
    }
  }

  return conflicts;
}
