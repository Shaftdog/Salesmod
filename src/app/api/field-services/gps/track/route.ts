import { NextRequest } from 'next/server';
import {
  getApiContext,
  handleApiError,
  createdResponse,
  applyRateLimit,
  successResponse,
  getPaginationParams,
  buildPaginatedResponse,
  applyFilters,
  ApiError,
} from '@/lib/api-utils';
import { trackGpsSchema } from '@/lib/validations/field-services';

/**
 * POST /api/field-services/gps/track
 * Record GPS location for resource
 *
 * RATE LIMITED: 300 requests per minute per user
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, requestId } = context;

    // CRITICAL: Apply rate limiting (GPS tracking is high-frequency)
    await applyRateLimit(request, context, { maxRequests: 300, windowMs: 60000 });

    const body = await request.json();
    const validated = trackGpsSchema.parse(body);

    const trackingData = {
      resource_id: validated.resourceId,
      booking_id: validated.bookingId,
      coordinates: validated.coordinates,
      speed: validated.speed,
      heading: validated.heading,
      altitude: validated.altitude,
      battery_level: validated.batteryLevel,
      is_online: validated.isOnline,
    };

    const { data: tracking, error } = await supabase
      .from('gps_tracking')
      .insert(trackingData)
      .select()
      .single();

    if (error) throw error;

    return createdResponse({ tracking }, 'Location recorded');
  } catch (error: any) {
    return handleApiError(error);
  }
}

/**
 * GET /api/field-services/gps/track
 * Get GPS tracking history
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, requestId } = context;

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const bookingId = searchParams.get('bookingId');
    const since = searchParams.get('since');

    if (!resourceId) {
      throw new ApiError('resourceId required', 400, 'MISSING_RESOURCE_ID', requestId);
    }

    const pagination = getPaginationParams(request);

    // Count total
    let countQuery = supabase
      .from('gps_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('resource_id', resourceId);

    countQuery = applyFilters(countQuery, { booking_id: bookingId });
    if (since) countQuery = countQuery.gte('timestamp', since);

    const { count } = await countQuery;

    // Fetch data
    let query = supabase
      .from('gps_tracking')
      .select('*')
      .eq('resource_id', resourceId)
      .order('timestamp', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    query = applyFilters(query, { booking_id: bookingId });
    if (since) query = query.gte('timestamp', since);

    const { data: tracking, error } = await query;

    if (error) throw error;

    return successResponse(
      buildPaginatedResponse(tracking, count || 0, pagination)
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
