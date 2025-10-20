import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeUnit } from '@/lib/units';

/**
 * GET /api/properties/[propertyId]/units
 * List all units for a property with order counts and prior work stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: propertyId } = params;

    // Fetch units
    const { data: units, error: unitsError } = await supabase
      .from('property_units')
      .select('*')
      .eq('property_id', propertyId)
      .order('unit_identifier', { ascending: true });

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      return NextResponse.json(
        { error: 'Failed to fetch units' },
        { status: 500 }
      );
    }

    // Fetch order counts and prior work for each unit
    const unitsWithStats = await Promise.all(
      (units || []).map(async (unit) => {
        // Get total order count
        const { count: orderCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('property_unit_id', unit.id);

        // Get prior work count via RPC
        const { data: priorWorkCount } = await supabase
          .rpc('property_unit_prior_work_count', { _property_unit_id: unit.id });

        return {
          ...unit,
          orderCount: orderCount || 0,
          priorWork3y: priorWorkCount || 0
        };
      })
    );

    return NextResponse.json(unitsWithStats);
  } catch (error) {
    console.error('Error in GET /api/properties/[propertyId]/units:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/properties/[propertyId]/units
 * Create a new unit for a property
 * Validates normalized unit for duplicates
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: propertyId } = params;
    const body = await request.json();

    const { unitIdentifier, unitType, props } = body;

    // Validate input
    if (!unitIdentifier || unitIdentifier.trim().length === 0) {
      return NextResponse.json(
        { error: 'Unit identifier is required' },
        { status: 400 }
      );
    }

    // Normalize unit for deduplication
    const unitNorm = normalizeUnit(unitIdentifier);

    if (!unitNorm) {
      return NextResponse.json(
        { error: 'Unit identifier must contain alphanumeric characters' },
        { status: 400 }
      );
    }

    // Check for existing unit with same normalized identifier
    const { data: existingUnit, error: checkError } = await supabase
      .from('property_units')
      .select('id, unit_identifier')
      .eq('property_id', propertyId)
      .eq('unit_norm', unitNorm)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing unit:', checkError);
      return NextResponse.json(
        { error: 'Failed to check for existing unit' },
        { status: 500 }
      );
    }

    if (existingUnit) {
      return NextResponse.json(
        { 
          error: 'Unit already exists',
          existingUnit: existingUnit,
          message: `A unit with identifier "${existingUnit.unit_identifier}" already exists (normalized as "${unitNorm}")`
        },
        { status: 409 }
      );
    }

    // Verify property exists and user has access (RLS will handle this)
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    // Create the unit
    const { data: newUnit, error: insertError } = await supabase
      .from('property_units')
      .insert({
        property_id: propertyId,
        unit_identifier: unitIdentifier.trim(),
        unit_norm: unitNorm,
        unit_type: unitType || null,
        props: props || {}
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating unit:', insertError);
      
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Unit with this identifier already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create unit' },
        { status: 500 }
      );
    }

    return NextResponse.json(newUnit, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/properties/[propertyId]/units:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


