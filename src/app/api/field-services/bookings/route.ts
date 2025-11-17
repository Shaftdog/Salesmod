import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformBooking } from '@/lib/supabase/transforms';
import { getApiContext, handleApiError, requireAdmin, ApiError } from '@/lib/api-utils';
import { createBookingSchema } from '@/lib/validations/field-services';

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
    const context = await getApiContext(request);
    const { supabase, orgId } = context;

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
      .eq('org_id', orgId);

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
    return handleApiError(error);
  }
}

/**
 * POST /api/field-services/bookings
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId, userId } = context;

    // Check if user is admin
    await requireAdmin(context);

    // Parse and validate request body
    const body = await request.json();
    const validated = createBookingSchema.parse(body);

    // HIGH-5: Verify resource belongs to org
    const { data: resource, error: resourceError } = await supabase
      .from('bookable_resources')
      .select('id')
      .eq('id', validated.resourceId)
      .eq('org_id', orgId)
      .single();

    if (resourceError || !resource) {
      throw new ApiError('Resource not found or not accessible', 403, 'RESOURCE_NOT_FOUND');
    }

    // Check for conflicts before creating
    const conflicts = await checkBookingConflicts(supabase, {
      resourceId: validated.resourceId,
      scheduledStart: validated.scheduledStart,
      scheduledEnd: validated.scheduledEnd,
    });

    // Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        org_id: orgId,
        order_id: validated.orderId,
        resource_id: validated.resourceId,
        territory_id: validated.territoryId,
        booking_type: validated.bookingType,
        scheduled_start: validated.scheduledStart,
        scheduled_end: validated.scheduledEnd,
        duration_minutes: validated.durationMinutes,
        property_address: validated.propertyAddress,
        property_city: validated.propertyCity,
        property_state: validated.propertyState,
        property_zip: validated.propertyZip,
        latitude: validated.latitude,
        longitude: validated.longitude,
        access_instructions: validated.accessInstructions,
        special_instructions: validated.specialInstructions,
        contact_name: validated.contactName,
        contact_phone: validated.contactPhone,
        contact_email: validated.contactEmail,
        estimated_travel_time_minutes: validated.estimatedTravelTimeMinutes,
        estimated_mileage: validated.estimatedMileage,
        assigned_by: userId,
        assigned_at: new Date().toISOString(),
        auto_assigned: validated.autoAssigned,
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
    return handleApiError(error);
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
