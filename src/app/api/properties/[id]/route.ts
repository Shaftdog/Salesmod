import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/properties/[id]
 * Get property detail with related orders and USPAP count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = (await params).id;

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        org_id,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        property_type,
        apn,
        latitude,
        longitude,
        gla,
        lot_size,
        year_built,
        addr_hash,
        props,
        created_at,
        updated_at
      `)
      .eq('id', propertyId)
      .eq('org_id', user.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Get USPAP prior work count
    const { data: priorWork } = await supabase.rpc('property_prior_work_count', {
      _property_id: propertyId
    });

    // Get related orders (last 20, paginated)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        completed_date,
        fee_amount,
        total_amount,
        props
      `)
      .eq('property_id', propertyId)
      .order('completed_date', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (ordersError) {
      console.error('Orders query error:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch related orders' }, { status: 500 });
    }

    // Get total count of related orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('property_id', propertyId);

    return NextResponse.json({
      property: {
        ...property,
        priorWork3y: priorWork || 0
      },
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: totalOrders || 0,
        totalPages: Math.ceil((totalOrders || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('Property detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/properties/[id]
 * Update property details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = (await params).id;
    const body = await request.json();

    // Verify property belongs to user's org
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('org_id', user.id)
      .single();

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Update property
    const { data: property, error: updateError } = await supabase
      .from('properties')
      .update({
        address_line1: body.addressLine1,
        address_line2: body.addressLine2,
        city: body.city,
        state: body.state?.toUpperCase(),
        postal_code: body.postalCode,
        country: body.country,
        property_type: body.propertyType,
        apn: body.apn,
        latitude: body.latitude,
        longitude: body.longitude,
        gla: body.gla,
        lot_size: body.lotSize,
        year_built: body.yearBuilt,
        props: body.props
      })
      .eq('id', propertyId)
      .select()
      .single();

    if (updateError) {
      console.error('Property update error:', updateError);
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
    }

    return NextResponse.json({
      property,
      message: 'Property updated successfully'
    });

  } catch (error: any) {
    console.error('Property update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update property' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/properties/[id]
 * Delete property (only if no orders are linked)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = (await params).id;

    // Verify property belongs to user's org
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('org_id', user.id)
      .single();

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check if property has linked orders
    const { data: linkedOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('property_id', propertyId)
      .limit(1);

    if (linkedOrders && linkedOrders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete property with linked orders' },
        { status: 400 }
      );
    }

    // Delete property
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (deleteError) {
      console.error('Property delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Property deleted successfully'
    });

  } catch (error: any) {
    console.error('Property delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete property' },
      { status: 500 }
    );
  }
}
