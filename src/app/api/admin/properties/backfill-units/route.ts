import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeUnit, shouldCreateUnit } from '@/lib/units';

/**
 * POST /api/admin/properties/backfill-units
 * Backfill property_units from existing orders with unit information in props
 * 
 * This endpoint:
 * 1. Finds orders with property_id AND props.unit
 * 2. Creates property_units records (idempotent via unique index)
 * 3. Links orders to property_unit_id
 * 4. Returns statistics
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { 
      pageSize = 1000, 
      start = 0,
      dryRun = false,
      orgId 
    } = body;

    // Get current user for org_id if not provided
    let targetOrgId = orgId;
    if (!targetOrgId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      targetOrgId = user.id;
    }

    // Build query for orders with property_id and unit in props
    let query = supabase
      .from('orders')
      .select(`
        id,
        property_id,
        property_type,
        property_address,
        props
      `)
      .not('property_id', 'is', null);

    // Range pagination
    if (pageSize > 0) {
      query = query.range(start, start + pageSize - 1);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    let unitsCreated = 0;
    let ordersLinkedToUnits = 0;
    let duplicatesSkipped = 0;
    let scanned = 0;
    const warnings: Array<{ type: string; message: string; data?: any }> = [];

    // Process each order
    for (const order of orders || []) {
      scanned++;
      
      // Extract unit from props
      const unitLabel = order.props?.unit;
      if (!unitLabel) continue;

      // Check if unit should be created based on property type
      if (!shouldCreateUnit(order.property_type, unitLabel, order.props)) {
        continue;
      }

      // Normalize unit
      const unitNorm = normalizeUnit(unitLabel);
      if (!unitNorm) {
        warnings.push({
          type: 'invalid_unit',
          message: `Order ${order.id}: Could not normalize unit "${unitLabel}"`,
          data: { orderId: order.id, unitLabel }
        });
        continue;
      }

      if (dryRun) {
        // Dry run: just count what would be done
        unitsCreated++;
        ordersLinkedToUnits++;
        continue;
      }

      try {
        // Upsert property_units (idempotent)
        const { data: unit, error: upsertError } = await supabase
          .from('property_units')
          .upsert(
            {
              property_id: order.property_id,
              unit_identifier: unitLabel.trim(),
              unit_norm: unitNorm,
              unit_type: order.props?.unit_type || null,
              props: {
                backfilled_from_order: order.id,
                backfilled_at: new Date().toISOString()
              }
            },
            {
              onConflict: 'property_id,unit_norm',
              ignoreDuplicates: false
            }
          )
          .select('id')
          .single();

        if (upsertError) {
          // Check if it's a duplicate (already exists)
          if (upsertError.code === '23505') {
            duplicatesSkipped++;
            
            // Still try to link the order to existing unit
            const { data: existingUnit } = await supabase
              .from('property_units')
              .select('id')
              .eq('property_id', order.property_id)
              .eq('unit_norm', unitNorm)
              .single();

            if (existingUnit) {
              // Link order to existing unit
              const { error: linkError } = await supabase
                .from('orders')
                .update({ property_unit_id: existingUnit.id })
                .eq('id', order.id);

              if (!linkError) {
                ordersLinkedToUnits++;
              }
            }
            continue;
          }

          warnings.push({
            type: 'upsert_failed',
            message: `Failed to upsert unit for order ${order.id}: ${upsertError.message}`,
            data: { orderId: order.id, error: upsertError }
          });
          continue;
        }

        if (unit) {
          unitsCreated++;

          // Link order to unit
          const { error: linkError } = await supabase
            .from('orders')
            .update({ property_unit_id: unit.id })
            .eq('id', order.id);

          if (linkError) {
            warnings.push({
              type: 'link_failed',
              message: `Failed to link order ${order.id} to unit: ${linkError.message}`,
              data: { orderId: order.id, unitId: unit.id, error: linkError }
            });
          } else {
            ordersLinkedToUnits++;
          }
        }
      } catch (error) {
        warnings.push({
          type: 'processing_error',
          message: `Error processing order ${order.id}: ${error}`,
          data: { orderId: order.id, error }
        });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      result: {
        scanned,
        unitsCreated,
        ordersLinkedToUnits,
        duplicatesSkipped,
        warnings
      },
      pagination: {
        pageSize,
        start,
        processedCount: scanned
      }
    });
  } catch (error) {
    console.error('Error in POST /api/admin/properties/backfill-units:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/properties/backfill-units
 * Get statistics about units backfill status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Count orders with property_id and unit in props
    const { count: ordersWithUnits } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .not('property_id', 'is', null)
      .filter('props->>unit', 'not.is', null);

    // Count orders linked to property_units
    const { count: ordersLinked } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .not('property_unit_id', 'is', null);

    // Count total property_units
    const { count: totalUnits } = await supabase
      .from('property_units')
      .select('*', { count: 'exact', head: true });

    const unlinkedOrders = (ordersWithUnits || 0) - (ordersLinked || 0);

    return NextResponse.json({
      statistics: {
        ordersWithUnitInfo: ordersWithUnits || 0,
        ordersLinkedToUnits: ordersLinked || 0,
        unlinkedOrders: Math.max(0, unlinkedOrders),
        totalPropertyUnits: totalUnits || 0
      },
      needsBackfill: unlinkedOrders > 0
    });
  } catch (error) {
    console.error('Error in GET /api/admin/properties/backfill-units:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


