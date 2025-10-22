import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/properties/[propertyId]/units/[unitId]/prior-work
 * Get USPAP 3-year prior work for a specific unit
 * Returns count and detailed list of completed orders
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: propertyId, unitId } = await params;

    // Verify unit exists and belongs to property
    const { data: unit, error: unitError } = await supabase
      .from('property_units')
      .select('id, unit_identifier')
      .eq('id', unitId)
      .eq('property_id', propertyId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      );
    }

    // Get prior work count via RPC
    const { data: priorWorkCount, error: countError } = await supabase
      .rpc('property_unit_prior_work_count', { _property_unit_id: unitId });

    if (countError) {
      console.error('Error getting prior work count:', countError);
      return NextResponse.json(
        { error: 'Failed to get prior work count' },
        { status: 500 }
      );
    }

    // Get detailed prior work orders
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        completed_date,
        fee_amount,
        assigned_to,
        profiles:assigned_to (
          name,
          email
        )
      `)
      .eq('property_unit_id', unitId)
      .not('completed_date', 'is', null)
      .gte('completed_date', threeYearsAgo.toISOString())
      .order('completed_date', { ascending: false });

    if (ordersError) {
      console.error('Error fetching prior work orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch prior work orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      unitId,
      unitIdentifier: unit.unit_identifier,
      propertyId,
      priorWorkCount: priorWorkCount || 0,
      orders: orders || [],
      asOf: new Date().toISOString(),
      lookbackPeriod: '3 years',
      lookbackStartDate: threeYearsAgo.toISOString()
    });
  } catch (error) {
    console.error('Error in GET /api/properties/[propertyId]/units/[unitId]/prior-work:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


