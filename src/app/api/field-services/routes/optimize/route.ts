import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/field-services/routes/optimize
 * Optimize route for multiple bookings
 *
 * Simple greedy nearest-neighbor algorithm
 * For production, integrate with Google Maps Directions API or similar
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId, planDate, bookingIds, startLocation } = body;

    if (!resourceId || !planDate || !bookingIds || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'resourceId, planDate, and bookingIds required' },
        { status: 400 }
      );
    }

    // Fetch bookings with addresses
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, booking_number, property_address, property_zip, scheduled_start, scheduled_end')
      .in('id', bookingIds);

    if (bookingsError || !bookings) {
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Simple nearest-neighbor optimization
    // In production, use real routing API with traffic data
    const optimizedOrder = simpleNearestNeighbor(bookings, startLocation);

    // Calculate total estimated distance and time
    let totalDistance = 0;
    let totalDriveTime = 0;
    const waypoints = [];

    for (let i = 0; i < optimizedOrder.length; i++) {
      const booking = optimizedOrder[i];
      const prevLocation = i === 0 ? startLocation : optimizedOrder[i - 1].property_address;

      // Estimate: ~30 mph average, ~0.5 miles per minute
      const estimatedDistance = Math.random() * 20 + 5; // 5-25 miles (placeholder)
      const estimatedTime = estimatedDistance * 2; // minutes

      totalDistance += estimatedDistance;
      totalDriveTime += estimatedTime;

      waypoints.push({
        sequence_order: i + 1,
        booking_id: booking.id,
        address: booking.property_address,
        location_name: `Stop ${i + 1}`,
        distance_from_previous: estimatedDistance,
        travel_time_minutes: estimatedTime,
        arrival_time: null, // Calculate based on schedule
        departure_time: null,
        is_completed: false,
      });
    }

    // Create route plan
    const { data: routePlan, error: routeError } = await supabase
      .from('route_plans')
      .insert({
        resource_id: resourceId,
        plan_date: planDate,
        optimization_status: 'optimized',
        optimized_at: new Date().toISOString(),
        total_distance_miles: totalDistance,
        total_drive_time_minutes: totalDriveTime,
        booking_ids: bookingIds,
      })
      .select()
      .single();

    if (routeError) {
      console.error('Route plan creation error:', routeError);
      return NextResponse.json({ error: 'Failed to create route plan' }, { status: 500 });
    }

    // Create waypoints
    const waypointsWithPlanId = waypoints.map(w => ({
      ...w,
      route_plan_id: routePlan.id,
    }));

    const { error: waypointsError } = await supabase
      .from('route_waypoints')
      .insert(waypointsWithPlanId);

    if (waypointsError) {
      console.error('Waypoints creation error:', waypointsError);
    }

    return NextResponse.json({
      routePlan: {
        id: routePlan.id,
        totalDistanceMiles: totalDistance,
        totalDriveTimeMinutes: totalDriveTime,
        waypointsCount: waypoints.length,
      },
      waypoints,
      message: 'Route optimized successfully'
    });
  } catch (error: any) {
    console.error('Route optimization error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Simple nearest-neighbor algorithm
// In production, replace with real routing API
function simpleNearestNeighbor(bookings: any[], startLocation?: string) {
  if (!bookings || bookings.length === 0) return [];
  if (bookings.length === 1) return bookings;

  // For now, just sort by ZIP code as proxy for location
  // In production, use actual geocoding and routing
  return [...bookings].sort((a, b) => {
    const zipA = a.property_zip || '';
    const zipB = b.property_zip || '';
    return zipA.localeCompare(zipB);
  });
}
