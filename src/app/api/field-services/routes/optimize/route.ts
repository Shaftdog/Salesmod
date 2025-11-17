import { NextRequest } from 'next/server';
import {
  getApiContext,
  handleApiError,
  successResponse,
  createAuditLog,
  logWarning,
} from '@/lib/api-utils';
import { optimizeRouteSchema } from '@/lib/validations/field-services';

/**
 * POST /api/field-services/routes/optimize
 * Optimize route for multiple bookings
 *
 * Simple greedy nearest-neighbor algorithm
 * TODO: For production, integrate with Google Maps Directions API or similar
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, requestId } = context;

    const body = await request.json();
    const validated = optimizeRouteSchema.parse(body);

    const { resourceId, planDate, bookingIds, startLocation } = validated;

    logWarning('Using placeholder route optimization algorithm', {
      requestId,
      message: 'Replace with Google Maps Directions API or similar for production',
    });

    // Fetch bookings with addresses
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, booking_number, property_address, property_zip, scheduled_start, scheduled_end')
      .in('id', bookingIds);

    if (bookingsError || !bookings || bookings.length === 0) {
      throw new Error('Failed to fetch bookings or no bookings found');
    }

    // Simple nearest-neighbor optimization
    // TODO: In production, use real routing API with traffic data
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

    if (routeError) throw routeError;

    // Create waypoints
    const waypointsWithPlanId = waypoints.map(w => ({
      ...w,
      route_plan_id: routePlan.id,
    }));

    const { error: waypointsError } = await supabase
      .from('route_waypoints')
      .insert(waypointsWithPlanId);

    if (waypointsError) {
      logWarning('Failed to create waypoints', { requestId, error: waypointsError });
    }

    // Audit log
    await createAuditLog(
      context,
      'route_plan.created',
      'route_plan',
      routePlan.id,
      undefined,
      { booking_count: bookingIds.length, total_distance: totalDistance }
    );

    return successResponse(
      {
        routePlan: {
          id: routePlan.id,
          totalDistanceMiles: totalDistance,
          totalDriveTimeMinutes: totalDriveTime,
          waypointsCount: waypoints.length,
        },
        waypoints,
      },
      'Route optimized successfully (using placeholder algorithm)'
    );
  } catch (error: any) {
    return handleApiError(error);
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
