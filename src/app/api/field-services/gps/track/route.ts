import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/field-services/gps/track
 * Record GPS location for resource
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const trackingData = {
      resource_id: body.resourceId,
      booking_id: body.bookingId,
      coordinates: body.coordinates,
      speed: body.speed,
      heading: body.heading,
      altitude: body.altitude,
      battery_level: body.batteryLevel,
      is_online: body.isOnline !== undefined ? body.isOnline : true,
    };

    const { data: tracking, error } = await supabase
      .from('gps_tracking')
      .insert(trackingData)
      .select()
      .single();

    if (error) {
      console.error('GPS tracking error:', error);
      return NextResponse.json({ error: 'Failed to record GPS location' }, { status: 500 });
    }

    return NextResponse.json({
      tracking,
      message: 'Location recorded'
    }, { status: 201 });
  } catch (error: any) {
    console.error('GPS tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/field-services/gps/track
 * Get GPS tracking history
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
    const bookingId = searchParams.get('bookingId');
    const since = searchParams.get('since'); // timestamp

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId required' }, { status: 400 });
    }

    let query = supabase
      .from('gps_tracking')
      .select('*')
      .eq('resource_id', resourceId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (bookingId) query = query.eq('booking_id', bookingId);
    if (since) query = query.gte('timestamp', since);

    const { data: tracking, error } = await query;

    if (error) {
      console.error('GPS fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch GPS data' }, { status: 500 });
    }

    return NextResponse.json({ tracking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
