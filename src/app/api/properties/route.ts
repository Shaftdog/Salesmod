import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PropertyFilters } from '@/lib/types';

/**
 * GET /api/properties
 * List and search properties with pagination
 * 
 * Query params:
 * - search: string (full-text search)
 * - city: string
 * - state: string  
 * - zip: string
 * - propertyType: string
 * - page: number (default: 1)
 * - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const filters: PropertyFilters = {
      search: searchParams.get('search') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      zip: searchParams.get('zip') || undefined,
      propertyType: searchParams.get('propertyType') as any || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    };

    // Build query - filter by tenant_id for multi-tenant isolation
    let query = supabase
      .from('properties')
      .select(`
        id,
        org_id,
        tenant_id,
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
      .eq('tenant_id', profile.tenant_id);

    // Apply filters
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    
    if (filters.state) {
      query = query.eq('state', filters.state.toUpperCase());
    }
    
    if (filters.zip) {
      query = query.like('postal_code', `${filters.zip}%`);
    }
    
    if (filters.propertyType) {
      query = query.eq('property_type', filters.propertyType);
    }

    // Full-text search
    if (filters.search) {
      query = query.textSearch('search', filters.search);
    }

    // Get total count for pagination (filtered by tenant_id)
    const countQuery = supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id);
    
    const { count } = await countQuery;

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: properties, error } = await query;

    if (error) {
      console.error('Properties query error:', error);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    // Get prior work counts for each property
    const propertiesWithCounts = await Promise.all(
      (properties || []).map(async (property) => {
        try {
          const { data: priorWork } = await supabase.rpc('property_prior_work_count', {
            _property_id: property.id
          });
          
          return {
            ...property,
            priorWork3y: priorWork || 0
          };
        } catch (error) {
          console.warn('Failed to get prior work count for property', property.id, error);
          return {
            ...property,
            priorWork3y: 0
          };
        }
      })
    );

    return NextResponse.json({
      properties: propertiesWithCounts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error: any) {
    console.error('Properties list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/properties/upsert
 * Upsert property by (org_id, addr_hash)
 * Used for manual property creation/updates
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'US',
      propertyType = 'single_family',
      apn,
      latitude,
      longitude,
      gla,
      lotSize,
      yearBuilt,
      props = {}
    } = body;

    // Validate required fields
    if (!addressLine1 || !city || !state || !postalCode) {
      return NextResponse.json(
        { error: 'Missing required fields: addressLine1, city, state, postalCode' },
        { status: 400 }
      );
    }

    // Validate state format
    if (!/^[A-Z]{2}$/.test(state.toUpperCase())) {
      return NextResponse.json(
        { error: 'State must be a 2-letter code' },
        { status: 400 }
      );
    }

    // Validate postal code format
    if (!/^[0-9]{5}(-[0-9]{4})?$/.test(postalCode)) {
      return NextResponse.json(
        { error: 'Postal code must be 5 or 9 digits' },
        { status: 400 }
      );
    }

    // Validate lat/lng bounds
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
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

    // Create normalized address hash
    const { normalizeAddressKey } = await import('@/lib/addresses');
    const addrHash = normalizeAddressKey(addressLine1, city, state, postalCode);

    // Upsert property
    const { data: property, error: upsertError } = await supabase
      .from('properties')
      .upsert({
        org_id: user.id,
        tenant_id: profile.tenant_id,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        state: state.toUpperCase(),
        postal_code: postalCode,
        country,
        property_type: propertyType,
        apn,
        latitude,
        longitude,
        gla,
        lot_size: lotSize,
        year_built: yearBuilt,
        addr_hash: addrHash,
        props
      }, { onConflict: 'org_id,addr_hash' })
      .select()
      .single();

    if (upsertError) {
      console.error('Property upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to upsert property' }, { status: 500 });
    }

    return NextResponse.json({
      property,
      message: 'Property upserted successfully'
    });

  } catch (error: any) {
    console.error('Property upsert error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upsert property' },
      { status: 500 }
    );
  }
}
