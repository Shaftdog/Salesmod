import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformServiceTerritory } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/territories
 * List all service territories
 *
 * Query params:
 * - territoryType: 'primary' | 'secondary' | 'extended'
 * - isActive: boolean
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territoryType = searchParams.get('territoryType');
    const isActive = searchParams.get('isActive');

    let query = supabase
      .from('service_territories')
      .select('*')
      .eq('org_id', user.id);

    // Apply filters
    if (territoryType) {
      query = query.eq('territory_type', territoryType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    } else {
      // Default to active territories only
      query = query.eq('is_active', true);
    }

    const { data: territories, error } = await query.order('territory_type').order('name');

    if (error) {
      console.error('Territories query error:', error);
      return NextResponse.json({ error: 'Failed to fetch territories' }, { status: 500 });
    }

    const transformedTerritories = (territories || []).map(transformServiceTerritory);

    return NextResponse.json({ territories: transformedTerritories });

  } catch (error: any) {
    console.error('Territories list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch territories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/field-services/territories
 * Create a new service territory
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
      name,
      description,
      territoryType = 'primary',
      zipCodes = [],
      counties = [],
      cities = [],
      radiusMiles,
      centerLat,
      centerLng,
      boundaryPolygon,
      baseTravelTimeMinutes = 0,
      mileageRate = 0.67,
      travelFee = 0,
      isActive = true,
      colorHex = '#3b82f6',
      metadata = {}
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }

    // Validate at least one geographic definition
    if (
      (!zipCodes || zipCodes.length === 0) &&
      (!counties || counties.length === 0) &&
      (!cities || cities.length === 0) &&
      !radiusMiles &&
      !boundaryPolygon
    ) {
      return NextResponse.json({
        error: 'At least one geographic definition required (zipCodes, counties, cities, radius, or polygon)'
      }, { status: 400 });
    }

    // If using radius, validate center coordinates
    if (radiusMiles && (!centerLat || !centerLng)) {
      return NextResponse.json({
        error: 'centerLat and centerLng required when using radiusMiles'
      }, { status: 400 });
    }

    const { data: territory, error: insertError } = await supabase
      .from('service_territories')
      .insert({
        org_id: user.id,
        name,
        description,
        territory_type: territoryType,
        zip_codes: zipCodes,
        counties,
        cities,
        radius_miles: radiusMiles,
        center_lat: centerLat,
        center_lng: centerLng,
        boundary_polygon: boundaryPolygon,
        base_travel_time_minutes: baseTravelTimeMinutes,
        mileage_rate: mileageRate,
        travel_fee: travelFee,
        is_active: isActive,
        color_hex: colorHex,
        metadata
      })
      .select()
      .single();

    if (insertError) {
      console.error('Territory insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create territory' }, { status: 500 });
    }

    const transformedTerritory = transformServiceTerritory(territory);

    return NextResponse.json({
      territory: transformedTerritory,
      message: 'Territory created successfully'
    });

  } catch (error: any) {
    console.error('Territory create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create territory' },
      { status: 500 }
    );
  }
}
