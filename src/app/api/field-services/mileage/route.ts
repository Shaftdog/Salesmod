import { NextRequest } from 'next/server';
import { transformMileageLog } from '@/lib/supabase/transforms';
import {
  getApiContext,
  handleApiError,
  getPaginationParams,
  buildPaginatedResponse,
  applyDateRange,
  applyFilters,
  applySorting,
  successResponse,
  createdResponse,
  createAuditLog,
} from '@/lib/api-utils';
import { createMileageLogSchema } from '@/lib/validations/field-services';

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
 * - page, limit: Pagination
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId, requestId } = context;

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const purpose = searchParams.get('purpose');
    const isReimbursed = searchParams.get('isReimbursed');

    const pagination = getPaginationParams(request);

    // Count total
    let countQuery = supabase
      .from('mileage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    countQuery = applyFilters(countQuery, {
      resource_id: resourceId,
      purpose: purpose,
      is_reimbursed: isReimbursed === 'true' ? true : isReimbursed === 'false' ? false : undefined,
    });
    countQuery = applyDateRange(countQuery, 'log_date', dateFrom || undefined, dateTo || undefined);

    const { count } = await countQuery;

    // Fetch data
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
      .eq('org_id', orgId)
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    query = applyFilters(query, {
      resource_id: resourceId,
      purpose: purpose,
      is_reimbursed: isReimbursed === 'true' ? true : isReimbursed === 'false' ? false : undefined,
    });
    query = applyDateRange(query, 'log_date', dateFrom || undefined, dateTo || undefined);
    query = applySorting(query, 'log_date', 'desc');

    const { data: logs, error } = await query;

    if (error) throw error;

    return successResponse(
      buildPaginatedResponse(
        logs.map(transformMileageLog),
        count || 0,
        pagination
      )
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}

/**
 * POST /api/field-services/mileage
 * Create mileage log
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId, requestId } = context;

    const body = await request.json();
    const validated = createMileageLogSchema.parse(body);

    // Get current mileage rate if not provided
    let ratePerMile = validated.ratePerMile;
    if (!ratePerMile) {
      const { data } = await supabase.rpc('get_current_mileage_rate');
      ratePerMile = data || 0.67;
    }

    // Calculate distance if coordinates provided
    let distanceMiles = validated.distanceMiles;
    if (!distanceMiles && validated.startCoordinates && validated.endCoordinates) {
      const { data: distance } = await supabase.rpc('calculate_distance', {
        lat1: validated.startCoordinates.lat,
        lon1: validated.startCoordinates.lng,
        lat2: validated.endCoordinates.lat,
        lon2: validated.endCoordinates.lng,
      });
      distanceMiles = distance;
    }

    const logData = {
      org_id: orgId,
      resource_id: validated.resourceId,
      booking_id: validated.bookingId,
      route_plan_id: validated.routePlanId,
      log_date: validated.logDate,
      start_time: validated.startTime,
      end_time: validated.endTime,
      start_location: validated.startLocation,
      end_location: validated.endLocation,
      start_coordinates: validated.startCoordinates,
      end_coordinates: validated.endCoordinates,
      distance_miles: distanceMiles,
      distance_km: distanceMiles ? distanceMiles * 1.60934 : null,
      purpose: validated.purpose,
      is_billable: validated.isBillable,
      vehicle_id: validated.vehicleId,
      odometer_start: validated.odometerStart,
      odometer_end: validated.odometerEnd,
      rate_per_mile: ratePerMile,
      notes: validated.notes,
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

    if (error) throw error;

    // Audit log
    await createAuditLog(
      context,
      'mileage_log.created',
      'mileage_log',
      log.id,
      undefined,
      { distance_miles: distanceMiles, purpose: validated.purpose }
    );

    return createdResponse(
      { mileageLog: transformMileageLog(log) },
      'Mileage log created successfully'
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
