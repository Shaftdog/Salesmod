/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe - Handle Stripe webhook events
 *
 * Supported events:
 * - invoice.payment_succeeded - Mark invoice as paid
 * - invoice.payment_failed - Handle failed payment
 * - invoice.finalized - Invoice finalized and ready
 * - invoice.sent - Invoice sent to customer
 * - invoice.viewed - Customer viewed invoice
 * - invoice.voided - Invoice voided in Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// =============================================
// POST /api/webhooks/stripe
// =============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.sent':
        await handleInvoiceSent(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.voided':
        await handleInvoiceVoided(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// =============================================
// WEBHOOK EVENT HANDLERS
// =============================================

async function handlePaymentSucceeded(stripeInvoice: Stripe.Invoice) {
  const supabase = await createClient();

  const invoiceId = stripeInvoice.metadata.invoice_id;
  if (!invoiceId) {
    console.error('No invoice_id in Stripe invoice metadata');
    return;
  }

  // Fetch our invoice
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, org_id, amount_due')
    .eq('id', invoiceId)
    .single();

  if (fetchError || !invoice) {
    console.error('Invoice not found:', invoiceId);
    return;
  }

  // Check if payment already recorded
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', stripeInvoice.payment_intent as string)
    .maybeSingle();

  if (existingPayment) {
    console.log('Payment already recorded:', existingPayment.id);
    return;
  }

  // Record payment
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      org_id: invoice.org_id,
      amount: stripeInvoice.amount_paid / 100, // Convert from cents
      payment_method: 'stripe',
      payment_date: new Date(stripeInvoice.status_transitions.paid_at! * 1000).toISOString(),
      stripe_payment_intent_id: stripeInvoice.payment_intent as string,
      stripe_charge_id: stripeInvoice.charge as string,
      notes: 'Payment received via Stripe',
    });

  if (paymentError) {
    console.error('Error recording Stripe payment:', paymentError);
    return;
  }

  console.log(`Payment recorded for invoice ${invoiceId}`);
}

async function handlePaymentFailed(stripeInvoice: Stripe.Invoice) {
  const supabase = await createClient();

  const invoiceId = stripeInvoice.metadata.invoice_id;
  if (!invoiceId) return;

  // Update invoice with failure information
  await supabase
    .from('invoices')
    .update({
      stripe_metadata: {
        last_payment_error: stripeInvoice.last_finalization_error?.message,
        payment_failed_at: new Date().toISOString(),
      },
    })
    .eq('id', invoiceId);

  console.log(`Payment failed for invoice ${invoiceId}`);

  // TODO: Send notification to user about payment failure
}

async function handleInvoiceFinalized(stripeInvoice: Stripe.Invoice) {
  const supabase = await createClient();

  const invoiceId = stripeInvoice.metadata.invoice_id;
  if (!invoiceId) return;

  // Update invoice with finalized Stripe data
  await supabase
    .from('invoices')
    .update({
      stripe_invoice_id: stripeInvoice.id,
      stripe_payment_link_url: stripeInvoice.hosted_invoice_url,
      stripe_payment_intent_id: stripeInvoice.payment_intent as string,
    })
    .eq('id', invoiceId);

  console.log(`Invoice finalized in Stripe: ${invoiceId}`);
}

async function handleInvoiceSent(stripeInvoice: Stripe.Invoice) {
  const supabase = await createClient();

  const invoiceId = stripeInvoice.metadata.invoice_id;
  if (!invoiceId) return;

  // Update sent timestamp
  await supabase
    .from('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);

  console.log(`Invoice sent via Stripe: ${invoiceId}`);
}

async function handleInvoiceVoided(stripeInvoice: Stripe.Invoice) {
  const supabase = await createClient();

  const invoiceId = stripeInvoice.metadata.invoice_id;
  if (!invoiceId) return;

  // Void our invoice as well
  await supabase
    .from('invoices')
    .update({
      status: 'void',
      voided_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);

  console.log(`Invoice voided: ${invoiceId}`);
}
