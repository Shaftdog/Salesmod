import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getApiContext, handleApiError, getPaginationParams, buildPaginatedResponse, ApiError } from '@/lib/api-utils';
import { z } from 'zod';

/**
 * Validation schema for creating contact attempts
 */
const createContactAttemptSchema = z.object({
  orderId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  attemptType: z.enum(['phone_call', 'sms', 'email', 'voicemail']),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  outcome: z.enum([
    'connected',
    'no_answer',
    'voicemail',
    'wrong_number',
    'busy',
    'email_sent',
    'email_bounced',
    'sms_sent',
    'sms_failed',
    'scheduled',
    'declined',
    'callback_requested',
  ]),
  callbackRequestedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/field-services/contact-attempts
 * List all contact attempts with filters
 *
 * Query params:
 * - orderId: Filter by order
 * - bookingId: Filter by booking
 * - propertyId: Filter by property
 * - attemptType: Filter by attempt type
 * - outcome: Filter by outcome
 * - startDate: Filter attempts after this date
 * - endDate: Filter attempts before this date
 * - attemptedBy: Filter by user who made the attempt
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const bookingId = searchParams.get('bookingId');
    const propertyId = searchParams.get('propertyId');
    const attemptType = searchParams.get('attemptType');
    const outcome = searchParams.get('outcome');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const attemptedBy = searchParams.get('attemptedBy');

    // Get pagination params
    const pagination = getPaginationParams(request);

    // Build base query
    let query = supabase
      .from('contact_attempts')
      .select(`
        *,
        order:orders!order_id (*),
        booking:bookings!booking_id (*),
        property:properties!property_id (*),
        attemptedByProfile:profiles!attempted_by (id, name, email, avatar_url)
      `, { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    if (attemptType) {
      query = query.eq('attempt_type', attemptType);
    }

    if (outcome) {
      query = query.eq('outcome', outcome);
    }

    if (startDate) {
      query = query.gte('attempted_at', startDate);
    }

    if (endDate) {
      query = query.lte('attempted_at', endDate);
    }

    if (attemptedBy) {
      query = query.eq('attempted_by', attemptedBy);
    }

    // Apply pagination and ordering
    const { data: attempts, error, count } = await query
      .order('attempted_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      console.error('Contact attempts query error:', error);
      return NextResponse.json({ error: 'Failed to fetch contact attempts' }, { status: 500 });
    }

    const response = buildPaginatedResponse(attempts || [], count || 0, pagination);

    return NextResponse.json(response);

  } catch (error: any) {
    return handleApiError(error);
  }
}

/**
 * POST /api/field-services/contact-attempts
 * Create a new contact attempt
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId, userId } = context;

    // Parse and validate request body
    const body = await request.json();
    const validated = createContactAttemptSchema.parse(body);

    // Validate that at least one of order/booking/property ID is provided
    if (!validated.orderId && !validated.bookingId && !validated.propertyId) {
      throw new ApiError(
        'At least one of orderId, bookingId, or propertyId must be provided',
        400,
        'MISSING_ENTITY_REFERENCE'
      );
    }

    // If orderId is provided, verify it belongs to this org
    if (validated.orderId) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('id', validated.orderId)
        .eq('org_id', orgId)
        .single();

      if (orderError || !order) {
        throw new ApiError('Order not found or not accessible', 403, 'ORDER_NOT_FOUND');
      }
    }

    // If bookingId is provided, verify it belongs to this org
    if (validated.bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('id', validated.bookingId)
        .eq('org_id', orgId)
        .single();

      if (bookingError || !booking) {
        throw new ApiError('Booking not found or not accessible', 403, 'BOOKING_NOT_FOUND');
      }
    }

    // Insert contact attempt
    const { data: attempt, error: insertError } = await supabase
      .from('contact_attempts')
      .insert({
        org_id: orgId,
        order_id: validated.orderId,
        booking_id: validated.bookingId,
        property_id: validated.propertyId,
        attempt_type: validated.attemptType,
        contact_name: validated.contactName,
        contact_phone: validated.contactPhone,
        contact_email: validated.contactEmail,
        outcome: validated.outcome,
        callback_requested_at: validated.callbackRequestedAt,
        notes: validated.notes,
        duration_seconds: validated.durationSeconds,
        metadata: validated.metadata || {},
        attempted_by: userId,
        attempted_at: new Date().toISOString(),
      })
      .select(`
        *,
        order:orders!order_id (*),
        booking:bookings!booking_id (*),
        property:properties!property_id (*),
        attemptedByProfile:profiles!attempted_by (id, name, email, avatar_url)
      `)
      .single();

    if (insertError) {
      console.error('Contact attempt insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create contact attempt' }, { status: 500 });
    }

    return NextResponse.json({
      contactAttempt: attempt,
      message: 'Contact attempt created successfully',
    }, { status: 201 });

  } catch (error: any) {
    return handleApiError(error);
  }
}
