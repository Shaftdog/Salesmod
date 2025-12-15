import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeUnit } from '@/lib/units';

/**
 * GET /api/properties/[propertyId]/units/[unitId]
 * Get a single unit with stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    const { id: propertyId, unitId } = await params;

    // Verify property belongs to user's tenant
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Fetch unit
    const { data: unit, error: unitError } = await supabase
      .from('property_units')
      .select('*')
      .eq('id', unitId)
      .eq('property_id', propertyId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      );
    }

    // Get order count
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('property_unit_id', unitId);

    // Get prior work count via RPC
    const { data: priorWorkCount } = await supabase
      .rpc('property_unit_prior_work_count', { _property_unit_id: unitId });

    return NextResponse.json({
      ...unit,
      orderCount: orderCount || 0,
      priorWork3y: priorWorkCount || 0
    });
  } catch (error) {
    console.error('Error in GET /api/properties/[propertyId]/units/[unitId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/properties/[propertyId]/units/[unitId]
 * Update a unit (recalculates unit_norm)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    const { id: propertyId, unitId } = await params;

    // Verify property belongs to user's tenant
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const body = await request.json();

    const { unitIdentifier, unitType, props } = body;

    // Build update object
    const updates: Record<string, any> = {};

    if (unitIdentifier !== undefined) {
      if (!unitIdentifier || unitIdentifier.trim().length === 0) {
        return NextResponse.json(
          { error: 'Unit identifier cannot be empty' },
          { status: 400 }
        );
      }

      const unitNorm = normalizeUnit(unitIdentifier);
      if (!unitNorm) {
        return NextResponse.json(
          { error: 'Unit identifier must contain alphanumeric characters' },
          { status: 400 }
        );
      }

      // Check for duplicate normalized identifier (excluding current unit)
      const { data: existingUnit } = await supabase
        .from('property_units')
        .select('id, unit_identifier')
        .eq('property_id', propertyId)
        .eq('unit_norm', unitNorm)
        .neq('id', unitId)
        .maybeSingle();

      if (existingUnit) {
        return NextResponse.json(
          { 
            error: 'Unit identifier conflicts with existing unit',
            existingUnit: existingUnit,
            message: `A unit with identifier "${existingUnit.unit_identifier}" already exists (normalized as "${unitNorm}")`
          },
          { status: 409 }
        );
      }

      updates.unit_identifier = unitIdentifier.trim();
      updates.unit_norm = unitNorm;
    }

    if (unitType !== undefined) {
      updates.unit_type = unitType || null;
    }

    if (props !== undefined) {
      updates.props = props;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update the unit
    const { data: updatedUnit, error: updateError } = await supabase
      .from('property_units')
      .update(updates)
      .eq('id', unitId)
      .eq('property_id', propertyId)
      .select()
      .single();

    if (updateError || !updatedUnit) {
      console.error('Error updating unit:', updateError);
      
      if (updateError?.code === '23505') {
        return NextResponse.json(
          { error: 'Unit identifier conflicts with existing unit' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update unit' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUnit);
  } catch (error) {
    console.error('Error in PUT /api/properties/[propertyId]/units/[unitId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/properties/[propertyId]/units/[unitId]
 * Delete a unit (only if no linked orders)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    const { id: propertyId, unitId } = await params;

    // Verify property belongs to user's tenant
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check if unit has any linked orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('property_unit_id', unitId)
      .limit(5);

    if (ordersError) {
      console.error('Error checking orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to check for linked orders' },
        { status: 500 }
      );
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete unit with linked orders',
          linkedOrders: orders,
          message: `This unit has ${orders.length} linked order(s). Please reassign or delete the orders first.`,
          suggestion: 'You can reassign orders to another unit before deleting this unit.'
        },
        { status: 409 }
      );
    }

    // Delete the unit
    const { error: deleteError } = await supabase
      .from('property_units')
      .delete()
      .eq('id', unitId)
      .eq('property_id', propertyId);

    if (deleteError) {
      console.error('Error deleting unit:', deleteError);
      
      // Foreign key constraint violation
      if (deleteError.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete unit: it is referenced by other records' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete unit' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Unit deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/properties/[propertyId]/units/[unitId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


