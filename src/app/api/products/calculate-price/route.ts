/**
 * Product Price Calculation API Route
 * POST /api/products/calculate-price - Calculate product price based on square footage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CalculatePriceSchema,
  type CalculatePriceInput,
} from '@/lib/validations/products';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedOrgId,
  successResponse,
  notFoundResponse,
} from '@/lib/errors/api-errors';
import type { CalculatePriceResponse, ProductPriceBreakdown } from '@/types/products';

// =============================================
// POST /api/products/calculate-price
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Validate request body
    const body = await validateRequestBody<CalculatePriceInput>(
      request,
      CalculatePriceSchema
    );

    const { product_id, square_footage } = body;

    // Verify product exists and belongs to org
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('org_id', orgId)
      .single();

    if (productError || !product) {
      return notFoundResponse('Product not found');
    }

    // Check if product is active
    if (!product.is_active) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Cannot calculate price for inactive product',
        },
        { status: 400 }
      );
    }

    // Use the database function to calculate price
    const { data: breakdown, error: calcError } = await supabase
      .rpc('get_product_price_breakdown', {
        p_product_id: product_id,
        p_square_footage: square_footage,
      })
      .single<{
        product_id: string;
        product_name: string;
        base_price: number;
        square_footage: number;
        sf_threshold: number;
        additional_sqft: number;
        price_per_sf: number;
        additional_charge: number;
        total_price: number;
        calculation_applied: boolean;
      }>();

    if (calcError) {
      console.error('Error calculating price:', calcError);
      throw calcError;
    }

    if (!breakdown) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to calculate product price',
        },
        { status: 500 }
      );
    }

    // Format the response
    const response: CalculatePriceResponse = {
      product_id: breakdown.product_id,
      product_name: breakdown.product_name,
      total_price: breakdown.total_price,
      breakdown: {
        product_id: breakdown.product_id,
        product_name: breakdown.product_name,
        base_price: breakdown.base_price,
        square_footage: breakdown.square_footage,
        sf_threshold: breakdown.sf_threshold,
        additional_sqft: breakdown.additional_sqft,
        price_per_sf: breakdown.price_per_sf,
        additional_charge: breakdown.additional_charge,
        total_price: breakdown.total_price,
        calculation_applied: breakdown.calculation_applied,
      },
    };

    return successResponse<CalculatePriceResponse>(
      response,
      'Price calculated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
