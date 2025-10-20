import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { normalizeAddressKey, extractUnit } from '@/lib/addresses';
import { BackfillResult } from '@/lib/types';
import { validateAddressWithGoogle } from '@/lib/address-validation';

/**
 * POST /api/admin/properties/backfill
 * Backfill existing orders to link them to properties
 * Uses service role client for deterministic, idempotent bulk operations
 * 
 * Body: {
 *   orgId?: string,
 *   pageSize?: number = 1000,
 *   start?: number = 0,
 *   dryRun?: boolean = false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Use regular client for authentication
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      orgId = user.id, // Default to current user's org
      pageSize = 1000,
      start = 0,
      dryRun = false
    } = body;

    // Verify user owns the org (or is admin)
    if (orgId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use service role client for deterministic bulk operations
    // This ensures RLS doesn't silently drop writes during backfill
    const supabase = createServiceRoleClient();

    const result: BackfillResult = {
      scanned: 0,
      propertiesCreated: 0,
      ordersLinked: 0,
      skipped: 0,
      warnings: []
    };

    // Query orders missing property_id but with complete address
    const { data: orders, error: queryError } = await supabase
      .from('orders')
      .select('id, created_by, property_address, property_city, property_state, property_zip, property_type, property_id')
      .eq('created_by', orgId)
      .is('property_id', null)
      .not('property_address', 'is', null)
      .not('property_city', 'is', null)
      .not('property_state', 'is', null)
      .not('property_zip', 'is', null)
      .range(start, start + pageSize - 1);

    if (queryError) {
      console.error('Backfill query error:', queryError);
      return NextResponse.json({ error: 'Failed to query orders' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        message: 'No orders found to backfill',
        result
      });
    }

    result.scanned = orders.length;

    // Process each order
    for (const order of orders) {
      try {
        // Extract unit from address
        const { street: streetNoUnit, unit } = extractUnit(order.property_address);
        
        // Compute building-level address hash
        let addrHash = normalizeAddressKey(
          streetNoUnit,
          order.property_city,
          order.property_state,
          order.property_zip
        );

        if (dryRun) {
          // In dry run, just count what would be processed
          result.ordersLinked++;
          if (unit) {
            result.warnings.push({
              type: 'unit_extracted',
              message: `Would extract unit "${unit}" from "${order.property_address}"`,
              data: { orderId: order.id, unit }
            });
          }
          continue;
        }

        // Validate address if we have all required fields
        let validationResult = null;
        let standardizedAddress = {
          street: streetNoUnit,
          city: order.property_city,
          state: String(order.property_state).toUpperCase(),
          zip: String(order.property_zip).slice(0, 5)
        };
        
        if (streetNoUnit && order.property_city && order.property_state && order.property_zip) {
          try {
            const apiKey = process.env.GOOGLE_MAPS_API_KEY;
            if (apiKey) {
              validationResult = await validateAddressWithGoogle(
                streetNoUnit,
                order.property_city,
                order.property_state,
                order.property_zip,
                apiKey
              );
              
              // Use standardized address if validation succeeded
              if (validationResult.isValid && validationResult.standardized) {
                standardizedAddress = {
                  street: validationResult.standardized.street,
                  city: validationResult.standardized.city,
                  state: validationResult.standardized.state,
                  zip: validationResult.standardized.zip
                };
                
                // Recalculate hash with standardized address
                addrHash = normalizeAddressKey(
                  standardizedAddress.street,
                  standardizedAddress.city,
                  standardizedAddress.state,
                  standardizedAddress.zip
                );
              }
            }
          } catch (validationError) {
            console.warn('Address validation failed during backfill:', validationError);
            // Continue with original address if validation fails
          }
        }

        const propertyData: any = {
          org_id: order.created_by, // Use created_by as org_id
          address_line1: standardizedAddress.street,
          city: standardizedAddress.city,
          state: standardizedAddress.state,
          postal_code: standardizedAddress.zip,
          property_type: order.property_type || 'single_family',
          addr_hash: addrHash
        };

        // Add validation metadata if available
        if (validationResult) {
          propertyData.validation_status = validationResult.isValid ? 'verified' : 'partial';
          propertyData.verified_at = new Date().toISOString();
          propertyData.verification_source = 'google';
          
          if (validationResult.standardized) {
            propertyData.zip4 = validationResult.standardized.zip4;
            propertyData.county = validationResult.standardized.county;
            propertyData.latitude = validationResult.standardized.latitude;
            propertyData.longitude = validationResult.standardized.longitude;
          }
          
          if (validationResult.metadata) {
            propertyData.dpv_code = validationResult.metadata.dpvCode;
          }
        }

        // Upsert property by (org_id, addr_hash)
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .upsert(propertyData, { onConflict: 'org_id,addr_hash' })
          .select()
          .single();

        if (propertyError) {
          console.error('Property upsert error:', propertyError);
          result.warnings.push({
            type: 'property_upsert_failed',
            message: `Failed to upsert property for order ${order.id}`,
            data: { orderId: order.id, error: propertyError.message }
          });
          result.skipped++;
          continue;
        }

        if (!property) {
          result.skipped++;
          continue;
        }

        // Update order with property_id
        const updateData: any = { property_id: property.id };
        
        // Store unit in props if extracted
        if (unit) {
          updateData.props = {
            unit: unit
          };
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', order.id);

        if (updateError) {
          console.error('Order update error:', updateError);
          result.warnings.push({
            type: 'order_update_failed',
            message: `Failed to link order ${order.id} to property`,
            data: { orderId: order.id, propertyId: property.id, error: updateError.message }
          });
          result.skipped++;
          continue;
        }

        // Recompute USPAP cache for this order
        try {
          const { data: prior } = await supabase.rpc('property_prior_work_count', { 
            _property_id: property.id 
          });
          
          await supabase
            .from('orders')
            .update({
              props: {
                ...(updateData.props || {}),
                uspap: {
                  prior_work_3y: prior ?? 0,
                  as_of: new Date().toISOString()
                }
              }
            })
            .eq('id', order.id);
        } catch (uspapError) {
          console.warn('USPAP cache update failed for order', order.id, uspapError);
          result.warnings.push({
            type: 'uspap_cache_failed',
            message: `Failed to update USPAP cache for order ${order.id}`,
            data: { orderId: order.id, propertyId: property.id }
          });
        }

        result.ordersLinked++;
        
        // Track if this was a new property (not just linked)
        if (property.created_at === property.updated_at) {
          result.propertiesCreated++;
        }

      } catch (error: any) {
        console.error('Error processing order', order.id, error);
        result.warnings.push({
          type: 'processing_error',
          message: `Error processing order ${order.id}`,
          data: { orderId: order.id, error: error.message }
        });
        result.skipped++;
      }
    }

    return NextResponse.json({
      message: dryRun ? 'Dry run completed' : 'Backfill completed',
      result
    });

  } catch (error: any) {
    console.error('Backfill error:', error);
    return NextResponse.json(
      { error: error.message || 'Backfill failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/properties/backfill
 * Get backfill status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Use regular client for authentication
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || user.id;

    // Use service role client for consistent query behavior
    const supabase = createServiceRoleClient();

    // Get statistics
    const { count: totalOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', orgId);

    const { count: linkedOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', orgId)
      .not('property_id', 'is', null);

    const { count: unlinkedOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', orgId)
      .is('property_id', null)
      .not('property_address', 'is', null)
      .not('property_city', 'is', null)
      .not('property_state', 'is', null)
      .not('property_zip', 'is', null);

    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    return NextResponse.json({
      orgId,
      statistics: {
        totalOrders: totalOrdersCount || 0,
        linkedOrders: linkedOrdersCount || 0,
        unlinkedOrders: unlinkedOrdersCount || 0,
        totalProperties: propertiesCount || 0
      }
    });

  } catch (error: any) {
    console.error('Backfill status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get backfill status' },
      { status: 500 }
    );
  }
}
