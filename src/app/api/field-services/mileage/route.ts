import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformMileageLog } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/mileage
 * List mileage logs with filters
 *
 * Query params:
 * - resourceId: Filter by resource
 * - dateFrom: Start date
 * - dateTo: End date
 * - purpose: business, personal, commute
 * - isReimbursed: true/false
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
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const purpose = searchParams.get('purpose');
    const isReimbursed = searchParams.get('isReimbursed');

    let query = supabase
      .from('mileage_logs')
      .select(`
        *,
        resource:bookable_resources!mileage_logs_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url)
        ),
        booking:bookings!mileage_logs_booking_id_fkey(
          id,
          booking_number,
          property_address
        ),
        vehicle:equipment_catalog!mileage_logs_vehicle_id_fkey(
          id,
          make,
          model,
          equipment_type
        )
      `)
      .order('log_date', { ascending: false });

    if (resourceId) query = query.eq('resource_id', resourceId);
    if (dateFrom) query = query.gte('log_date', dateFrom);
    if (dateTo) query = query.lte('log_date', dateTo);
    if (purpose) query = query.eq('purpose', purpose);
    if (isReimbursed) query = query.eq('is_reimbursed', isReimbursed === 'true');

    const { data: logs, error } = await query;

    if (error) {
      console.error('Mileage logs error:', error);
      return NextResponse.json({ error: 'Failed to fetch mileage logs' }, { status: 500 });
    }

    return NextResponse.json({
      mileageLogs: logs.map(transformMileageLog)
    });
  } catch (error: any) {
    console.error('Mileage API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/field-services/mileage
 * Create mileage log
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get current mileage rate if not provided
    let ratePerMile = body.ratePerMile;
    if (!ratePerMile) {
      const { data } = await supabase.rpc('get_current_mileage_rate');
      ratePerMile = data || 0.67;
    }

    // Calculate distance if coordinates provided
    let distanceMiles = body.distanceMiles;
    if (!distanceMiles && body.startCoordinates && body.endCoordinates) {
      const { data: distance } = await supabase.rpc('calculate_distance', {
        lat1: body.startCoordinates.lat,
        lon1: body.startCoordinates.lng,
        lat2: body.endCoordinates.lat,
        lon2: body.endCoordinates.lng,
      });
      distanceMiles = distance;
    }

    const logData = {
      org_id: body.orgId,
      resource_id: body.resourceId,
      booking_id: body.bookingId,
      route_plan_id: body.routePlanId,
      log_date: body.logDate,
      start_time: body.startTime,
      end_time: body.endTime,
      start_location: body.startLocation,
      end_location: body.endLocation,
      start_coordinates: body.startCoordinates,
      end_coordinates: body.endCoordinates,
      distance_miles: distanceMiles,
      distance_km: distanceMiles ? distanceMiles * 1.60934 : null,
      purpose: body.purpose || 'business',
      is_billable: body.isBillable !== undefined ? body.isBillable : true,
      vehicle_id: body.vehicleId,
      odometer_start: body.odometerStart,
      odometer_end: body.odometerEnd,
      rate_per_mile: ratePerMile,
      notes: body.notes,
    };

    const { data: log, error } = await supabase
      .from('mileage_logs')
      .insert(logData)
      .select(`
        *,
        resource:bookable_resources!mileage_logs_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url)
        ),
        booking:bookings!mileage_logs_booking_id_fkey(
          id,
          booking_number,
          property_address
        ),
        vehicle:equipment_catalog!mileage_logs_vehicle_id_fkey(
          id,
          make,
          model,
          equipment_type
        )
      `)
      .single();

    if (error) {
      console.error('Create mileage log error:', error);
      return NextResponse.json({ error: 'Failed to create mileage log' }, { status: 500 });
    }

    return NextResponse.json({
      mileageLog: transformMileageLog(log),
      message: 'Mileage log created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Mileage creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
