/**
 * Individual Product API Routes
 * GET    /api/products/[id] - Get single product
 * PUT    /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  UpdateProductSchema,
  ProductIdSchema,
  type UpdateProductInput,
} from '@/lib/validations/products';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedOrgId,
  successResponse,
  notFoundResponse,
} from '@/lib/errors/api-errors';
import type { Product } from '@/types/products';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// =============================================
// GET /api/products/[id] - Get single product
// =============================================

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const params = await context.params;

    // Validate product ID
    const { id } = ProductIdSchema.parse({ id: params.id });

    // Fetch product
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !product) {
      return notFoundResponse('Product not found');
    }

    return successResponse<Product>(product);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// PUT /api/products/[id] - Update product
// =============================================

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const params = await context.params;

    // Validate product ID
    const { id } = ProductIdSchema.parse({ id: params.id });

    // Validate request body
    const body = await validateRequestBody<UpdateProductInput>(
      request,
      UpdateProductSchema
    );

    // Check if product exists and belongs to org
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name, org_id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !existingProduct) {
      return notFoundResponse('Product not found');
    }

    // If name is being updated, check for duplicates
    if (body.name && body.name !== existingProduct.name) {
      const { data: duplicateProduct } = await supabase
        .from('products')
        .select('id, name')
        .eq('org_id', orgId)
        .eq('name', body.name)
        .neq('id', id)
        .single();

      if (duplicateProduct) {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: `Product with name "${body.name}" already exists`,
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data (only include fields that were provided)
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.base_price !== undefined) updateData.base_price = body.base_price;
    if (body.requires_sf_calculation !== undefined) {
      updateData.requires_sf_calculation = body.requires_sf_calculation;
    }
    if (body.sf_threshold !== undefined) updateData.sf_threshold = body.sf_threshold;
    if (body.price_per_sf !== undefined) updateData.price_per_sf = body.price_per_sf;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    // Update product
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating product:', updateError);
      throw updateError;
    }

    return successResponse<Product>(
      product,
      'Product updated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// DELETE /api/products/[id] - Delete product
// =============================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const params = await context.params;

    // Validate product ID
    const { id } = ProductIdSchema.parse({ id: params.id });

    // Check if product exists and belongs to org
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !existingProduct) {
      return notFoundResponse('Product not found');
    }

    // TODO: Check if product is referenced in any orders
    // For now, we'll allow deletion. Consider implementing soft delete
    // or checking for dependencies before deletion.

    // Delete product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (deleteError) {
      console.error('Error deleting product:', deleteError);
      throw deleteError;
    }

    return successResponse<{ id: string }>(
      { id },
      'Product deleted successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
