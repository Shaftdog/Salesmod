/**
 * Product CRUD API Routes
 * GET  /api/products - List products with filters and pagination
 * POST /api/products - Create new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CreateProductSchema,
  ProductListParamsSchema,
  type CreateProductInput,
  type ProductListParamsInput,
} from '@/lib/validations/products';
import {
  handleApiError,
  validateRequestBody,
  validateQueryParams,
  getAuthenticatedOrgId,
  successResponse,
  createdResponse,
} from '@/lib/errors/api-errors';
import type { Product, ProductListResponse } from '@/types/products';

// =============================================
// GET /api/products - List products
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const query = validateQueryParams<ProductListParamsInput>(url, ProductListParamsSchema);

    // Build the base query
    let supabaseQuery = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.category) {
      if (Array.isArray(query.category)) {
        supabaseQuery = supabaseQuery.in('category', query.category);
      } else {
        supabaseQuery = supabaseQuery.eq('category', query.category);
      }
    }

    if (query.is_active !== undefined) {
      supabaseQuery = supabaseQuery.eq('is_active', query.is_active);
    }

    if (query.search) {
      // Sanitize search input to prevent SQL injection - escape special LIKE characters
      const sanitizedSearch = query.search.replace(/[%_]/g, '\\$&');
      const searchPattern = `%${sanitizedSearch}%`;
      supabaseQuery = supabaseQuery.or(
        `name.ilike.${searchPattern},description.ilike.${searchPattern},sku.ilike.${searchPattern}`
      );
    }

    // Apply sorting
    const sortBy = query.sort_by || 'sort_order';
    const sortOrder = query.sort_order || 'asc';
    supabaseQuery = supabaseQuery.order(sortBy, {
      ascending: sortOrder === 'asc',
    });

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    supabaseQuery = supabaseQuery.range(from, to);

    // Execute query
    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    // Calculate pagination metadata
    const total_pages = count ? Math.ceil(count / limit) : 0;

    // Return response matching ProductListResponse type
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/products - Create product
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await validateRequestBody<CreateProductInput>(
      request,
      CreateProductSchema
    );

    // Check if product with same name already exists for this org
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('name', body.name)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: `Product with name "${body.name}" already exists`,
        },
        { status: 409 }
      );
    }

    // Prepare product data
    const productData = {
      org_id: orgId,
      name: body.name,
      description: body.description || null,
      sku: body.sku || null,
      category: body.category,
      base_price: body.base_price,
      requires_sf_calculation: body.requires_sf_calculation ?? false,
      sf_threshold: body.sf_threshold ?? 3000,
      price_per_sf: body.price_per_sf ?? 0.10,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
      created_by: user.id,
    };

    // Create product
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating product:', insertError);
      throw insertError;
    }

    return createdResponse<Product>(
      product,
      'Product created successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
