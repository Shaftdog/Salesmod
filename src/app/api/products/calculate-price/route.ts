/**
 * API Route: Calculate Product Price
 * POST /api/products/calculate-price
 *
 * Calculates the final price for a product based on square footage.
 * Uses the database function calculate_product_price() for consistent pricing logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { CalculatePriceSchema } from '@/lib/validations/products';
import type { CalculatePriceResponse, ProductPriceBreakdown } from '@/types/products';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = CalculatePriceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { product_id, square_footage } = validation.data;

    // Call the database function to calculate the price
    const { data, error } = await supabase.rpc('calculate_product_price', {
      p_product_id: product_id,
      p_square_footage: square_footage,
    });

    if (error) {
      console.error('Price calculation error:', error);

      // Handle specific error cases
      if (error.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'Product not found or you do not have access to it' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to calculate price', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // The database function returns an array with one result
    const result = data[0];

    // Transform database response to match our API response type
    const breakdown: ProductPriceBreakdown = {
      product_id: result.product_id,
      product_name: result.product_name,
      base_price: parseFloat(result.base_price),
      square_footage: result.square_footage,
      sf_threshold: result.sf_threshold,
      additional_sqft: result.additional_sqft,
      price_per_sf: parseFloat(result.price_per_sf),
      additional_charge: parseFloat(result.additional_charge),
      total_price: parseFloat(result.total_price),
      calculation_applied: result.calculation_applied,
    };

    const response: CalculatePriceResponse = {
      product_id: breakdown.product_id,
      product_name: breakdown.product_name,
      total_price: breakdown.total_price,
      breakdown,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Calculate price API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
