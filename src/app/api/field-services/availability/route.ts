import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformResourceAvailability } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/availability
 * List availability entries with optional filters
 *
 * Query params:
 * - resourceId: Filter by resource
 * - dateFrom: Start date (ISO string)
 * - dateTo: End date (ISO string)
 * - availabilityType: Filter by type (available, time_off, blocked)
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
    const availabilityType = searchParams.get('availabilityType');

    let query = supabase
      .from('resource_availability')
      .select(`
        *,
        resource:bookable_resources!resource_availability_resource_id_fkey(
          id,
          resource_type,
          profiles(id, name, email, avatar_url)
        )
      `)
      .order('start_datetime', { ascending: true });

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    if (dateFrom) {
      query = query.gte('start_datetime', dateFrom);
    }

    if (dateTo) {
      query = query.lte('end_datetime', dateTo);
    }

    if (availabilityType) {
      query = query.eq('availability_type', availabilityType);
    }

    const { data: availability, error } = await query;

    if (error) {
      console.error('Availability list error:', error);
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }

    return NextResponse.json({
      availability: availability.map(transformResourceAvailability)
    });

  } catch (error: any) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/field-services/availability
 * Create new availability entry
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.resourceId || !body.startDatetime || !body.endDatetime) {
      return NextResponse.json(
        { error: 'Missing required fields: resourceId, startDatetime, endDatetime' },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case
    const availabilityData: any = {
      resource_id: body.resourceId,
      start_datetime: body.startDatetime,
      end_datetime: body.endDatetime,
      availability_type: body.availabilityType || 'working_hours',
      is_available: body.isAvailable !== undefined ? body.isAvailable : true,
      is_recurring: body.isRecurring || false,
      recurrence_rule: body.recurrenceRule,
      recurrence_end_date: body.recurrenceEndDate,
      reason: body.reason,
      notes: body.notes,
      is_all_day: body.isAllDay || false,
      status: body.status || 'approved',
      approved_by: body.approvedBy,
      approved_at: body.approvedAt,
      created_by: user.id,
    };

    // Check for overlapping availability entries
    const { data: overlaps } = await supabase
      .from('resource_availability')
      .select('id, start_datetime, end_datetime')
      .eq('resource_id', body.resourceId)
      .lt('start_datetime', body.endDatetime)
      .gt('end_datetime', body.startDatetime);

    if (overlaps && overlaps.length > 0) {
      return NextResponse.json(
        {
          error: 'Overlapping availability entry exists',
          overlaps,
        },
        { status: 400 }
      );
    }

    const { data: availability, error } = await supabase
      .from('resource_availability')
      .insert(availabilityData)
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
      console.error('Availability creation error:', error);
      return NextResponse.json({ error: 'Failed to create availability' }, { status: 500 });
    }

    return NextResponse.json({
      availability: transformResourceAvailability(availability),
      message: 'Availability entry created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Availability creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create availability' },
      { status: 500 }
    );
  }
}
