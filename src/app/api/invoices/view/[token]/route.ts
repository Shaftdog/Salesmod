/**
 * Public Invoice View API Route
 * GET /api/invoices/view/[token] - Get invoice by view token (no auth required)
 *
 * This endpoint is used for public invoice viewing when clients click
 * the view link in their email. It automatically marks the invoice as viewed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client for public access (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Create service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the invoice by view token
    // Note: Use !invoices_org_id_fkey to specify the FK relationship
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        status,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        amount_paid,
        amount_due,
        payment_method,
        notes,
        terms_and_conditions,
        view_count,
        first_viewed_at,
        stripe_payment_link,
        payer_name,
        payer_company,
        payer_email,
        payer_phone,
        payer_address,
        client:clients(
          id,
          company_name,
          email,
          phone,
          address
        ),
        line_items:invoice_line_items(
          id,
          description,
          quantity,
          unit_price,
          amount,
          tax_rate,
          tax_amount
        ),
        org:profiles!invoices_org_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('view_token', token)
      .single();

    if (fetchError || !invoice) {
      console.error('Invoice lookup error:', fetchError);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice is in a viewable state
    if (['cancelled', 'void'].includes(invoice.status)) {
      return NextResponse.json(
        { error: 'This invoice is no longer available' },
        { status: 410 }
      );
    }

    // Update view tracking and status
    const isFirstView = !invoice.first_viewed_at;
    const shouldUpdateStatus = invoice.status === 'sent';

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        view_count: (invoice.view_count || 0) + 1,
        first_viewed_at: invoice.first_viewed_at || new Date().toISOString(),
        last_viewed_at: new Date().toISOString(),
        viewed_at: invoice.first_viewed_at ? undefined : new Date().toISOString(),
        status: shouldUpdateStatus ? 'viewed' : invoice.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    if (updateError) {
      console.error('Error updating view tracking:', updateError);
      // Don't fail the request, just log the error
    }

    // Return invoice data for display
    return NextResponse.json({
      invoice: {
        ...invoice,
        status: shouldUpdateStatus ? 'viewed' : invoice.status,
        view_count: (invoice.view_count || 0) + 1,
        is_first_view: isFirstView,
      },
    });
  } catch (error) {
    console.error('Public invoice view error:', error);
    return NextResponse.json(
      { error: 'Failed to load invoice' },
      { status: 500 }
    );
  }
}
