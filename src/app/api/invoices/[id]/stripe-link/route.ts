/**
 * Generate Stripe Payment Link API Route
 * POST /api/invoices/[id]/stripe-link - Generate Stripe payment link for invoice
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import {
  GenerateStripeLinkSchema,
  type GenerateStripeLinkInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateRequestBody,
  getAuthenticatedOrgId,
  successResponse,
  BadRequestError,
  verifyResourceOwnership,
} from '@/lib/errors/api-errors';

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// =============================================
// POST /api/invoices/[id]/stripe-link
// =============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);
    const { id } = await params;

    // Validate request body
    const body = await validateRequestBody<GenerateStripeLinkInput>(
      request,
      GenerateStripeLinkSchema
    );

    // Verify invoice exists and belongs to org
    await verifyResourceOwnership(supabase, 'invoices', id, orgId);

    // Fetch invoice with details
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, company_name, email),
        line_items:invoice_line_items(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Validate invoice
    if (invoice.payment_method !== 'stripe_link') {
      throw new BadRequestError(
        'Invoice payment method must be "stripe_link" to generate Stripe payment link'
      );
    }

    if (['paid', 'cancelled', 'void'].includes(invoice.status)) {
      throw new BadRequestError(
        `Cannot generate payment link for ${invoice.status} invoice`
      );
    }

    if (invoice.amount_due <= 0) {
      throw new BadRequestError('Invoice has no outstanding balance');
    }

    // Get or create Stripe customer
    let stripeCustomerId = invoice.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: invoice.client.email,
        name: invoice.client.company_name,
        metadata: {
          org_id: orgId,
          client_id: invoice.client_id,
        },
      });

      stripeCustomerId = customer.id;

      // Update invoice with customer ID
      await supabase
        .from('invoices')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', id);
    }

    // Create Stripe invoice with idempotency key
    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      auto_advance: true,
      collection_method: 'send_invoice',
      days_until_due: Math.ceil(
        (new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      description: body.description || `Invoice ${invoice.invoice_number}`,
      metadata: {
        org_id: orgId,
        invoice_id: id,
        invoice_number: invoice.invoice_number,
        ...body.metadata,
      },
    }, {
      idempotencyKey: `invoice_create_${id}_${Date.now()}`,
    });

    // Add line items to Stripe invoice
    for (const lineItem of invoice.line_items) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        invoice: stripeInvoice.id,
        description: lineItem.description,
        quantity: lineItem.quantity,
        unit_amount: Math.round(lineItem.unit_price * 100), // Convert to cents
        tax_rates: lineItem.tax_rate > 0 ? undefined : undefined, // TODO: Create tax rates in Stripe
      }, {
        idempotencyKey: `invoice_item_${lineItem.id}_${Date.now()}`,
      });
    }

    // Apply discount if any
    if (invoice.discount_amount > 0) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        invoice: stripeInvoice.id,
        description: 'Discount',
        amount: -Math.round(invoice.discount_amount * 100), // Negative for discount
      }, {
        idempotencyKey: `invoice_discount_${id}_${Date.now()}`,
      });
    }

    // Finalize invoice to generate payment link
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(
      stripeInvoice.id,
      undefined,
      {
        idempotencyKey: `invoice_finalize_${id}_${Date.now()}`,
      }
    );

    // Update our invoice with Stripe data
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        stripe_invoice_id: finalizedInvoice.id,
        stripe_payment_link_url: finalizedInvoice.hosted_invoice_url,
        stripe_payment_intent_id: finalizedInvoice.payment_intent as string,
        stripe_metadata: {
          stripe_invoice_id: finalizedInvoice.id,
          stripe_customer_id: stripeCustomerId,
        },
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
        sent_at: new Date().toISOString(),
        updated_by: orgId,
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(id, company_name, email),
        line_items:invoice_line_items(*),
        payments(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating invoice with Stripe data:', updateError);
      throw updateError;
    }

    return successResponse(
      {
        invoice: updatedInvoice,
        stripe_invoice_url: finalizedInvoice.hosted_invoice_url,
        stripe_invoice_id: finalizedInvoice.id,
      },
      'Stripe payment link generated successfully'
    );
  } catch (error) {
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error:', error);
      throw new BadRequestError(
        `Stripe error: ${error.message}`,
        { type: error.type, code: error.code }
      );
    }

    return handleApiError(error);
  }
}
