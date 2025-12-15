import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformServiceTerritory } from '@/lib/supabase/transforms';
import { getApiContext, handleApiError, requireAdmin } from '@/lib/api-utils';
import { createTerritorySchema } from '@/lib/validations/field-services';

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
    const context = await getApiContext(request);
    const { supabase, orgId } = context;

    const { searchParams } = new URL(request.url);
    const territoryType = searchParams.get('territoryType');
    const isActive = searchParams.get('isActive');

    let query = supabase
      .from('service_territories')
      .select('*')
      .eq('org_id', orgId);

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
    return handleApiError(error);
  }
}

/**
 * POST /api/field-services/territories
 * Create a new service territory
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;

    // Check if user is admin
    await requireAdmin(context);

    // Parse and validate request body
    const body = await request.json();
    const validated = createTerritorySchema.parse(body);

    const { data: territory, error: insertError } = await supabase
      .from('service_territories')
      .insert({
        org_id: orgId,
        name: validated.name,
        description: validated.description,
        territory_type: validated.territoryType,
        zip_codes: validated.zipCodes,
        counties: validated.counties,
        cities: validated.cities,
        radius_miles: validated.radiusMiles,
        center_lat: validated.centerLat,
        center_lng: validated.centerLng,
        boundary_polygon: validated.boundaryPolygon,
        base_travel_time_minutes: validated.baseTravelTimeMinutes,
        mileage_rate: validated.mileageRate,
        travel_fee: validated.travelFee,
        is_active: validated.isActive,
        color_hex: validated.colorHex,
        metadata: validated.metadata
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
    return handleApiError(error);
  }
}
