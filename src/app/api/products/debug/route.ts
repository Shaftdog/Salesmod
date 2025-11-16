/**
 * Debug endpoint for products
 * GET /api/products/debug - Check products setup
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: authError?.message || 'Not authenticated',
      });
    }

    // Get user's profile/org
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', user.id)
      .single();

    // Count products for this org
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', user.id);

    // Get sample products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, org_id')
      .eq('org_id', user.id)
      .limit(5);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      products: {
        count: count || 0,
        countError: countError?.message,
        sample: products,
        productsError: productsError?.message,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
