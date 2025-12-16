/**
 * Public Invoice Payment API Route
 * POST /api/invoices/view/[token]/pay - Generate payment link for public invoice view
 *
 * This endpoint creates a Stripe Checkout Session for invoice payment
 * without requiring authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role client for public access (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Stripe
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
  });
}

export async function POST(
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
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_due,
        status,
        stripe_payment_link,
        client:clients(
          id,
          company_name,
          email
        ),
        line_items:invoice_line_items(
          id,
          description,
          quantity,
          unit_price,
          amount
        ),
        org:profiles(
          id,
          company_name
        )
      `)
      .eq('view_token', token)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Validate invoice can be paid
    if (['paid', 'cancelled', 'void'].includes(invoice.status)) {
      return NextResponse.json(
        { error: 'This invoice cannot be paid' },
        { status: 400 }
      );
    }

    if (invoice.amount_due <= 0) {
      return NextResponse.json(
        { error: 'Invoice has no outstanding balance' },
        { status: 400 }
      );
    }

    // Extract client from joined data (Supabase returns as single object for .single())
    const client = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client;

    // If there's already a Stripe payment link, return it
    if (invoice.stripe_payment_link) {
      return NextResponse.json({
        payment_url: invoice.stripe_payment_link,
        existing: true,
      });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
    }

    const stripe = getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: client?.email || undefined,
      line_items: invoice.line_items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.description,
          },
          unit_amount: Math.round(item.unit_price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        view_token: token,
      },
      success_url: `${baseUrl}/invoices/view/${token}?payment=success`,
      cancel_url: `${baseUrl}/invoices/view/${token}?payment=cancelled`,
    });

    // Store the checkout session URL
    await supabase
      .from('invoices')
      .update({
        stripe_payment_link: session.url,
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    return NextResponse.json({
      payment_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Payment link generation error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Payment error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate payment link' },
      { status: 500 }
    );
  }
}
