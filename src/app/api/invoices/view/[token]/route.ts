/**
 * Public Invoice View API Route
 * GET /api/invoices/view/[token] - Get invoice by view token (no auth required)
 *
 * This endpoint is used for public invoice viewing when clients click
 * the view link in their email. It automatically marks the invoice as viewed
 * and logs the view with IP address and user agent for tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client for public access (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Parse user agent string to extract device type, browser, and OS
 */
function parseUserAgent(userAgent: string | null): {
  deviceType: string;
  browser: string;
  os: string;
} {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  const ua = userAgent.toLowerCase();

  // Device type
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  }

  // Browser
  let browser = 'unknown';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('msie') || ua.includes('trident')) browser = 'IE';

  // OS
  let os = 'unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { deviceType, browser, os };
}

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

    // Check if this is an email-specific token (starts with "e_")
    const isEmailToken = token.startsWith('e_');
    let emailTokenRecord: {
      id: string;
      invoice_id: string;
      recipient_email: string;
      recipient_name: string | null;
      recipient_role: string | null;
    } | null = null;
    let invoiceId: string | null = null;

    if (isEmailToken) {
      // Look up the email token to get invoice_id and recipient info
      const { data: emailToken, error: emailTokenError } = await supabase
        .from('invoice_email_tokens')
        .select('id, invoice_id, recipient_email, recipient_name, recipient_role')
        .eq('token', token)
        .single();

      if (emailTokenError || !emailToken) {
        console.error('Email token lookup error:', emailTokenError);
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }

      emailTokenRecord = emailToken;
      invoiceId = emailToken.invoice_id;
    }

    // Find the invoice by view token or by ID (if using email token)
    // Note: Use !invoices_org_id_fkey to specify the FK relationship
    const invoiceQuery = supabase
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
      `);

    // Query by invoice ID if we have it from email token, otherwise by view_token
    const { data: invoice, error: fetchError } = invoiceId
      ? await invoiceQuery.eq('id', invoiceId).single()
      : await invoiceQuery.eq('view_token', token).single();

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

    // Extract tracking info from request
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const userAgent = request.headers.get('user-agent');
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    // Get tenant_id from invoice (we need to query it)
    const { data: invoiceTenant } = await supabase
      .from('invoices')
      .select('tenant_id')
      .eq('id', invoice.id)
      .single();

    // Log the view to invoice_views table (with email token if available)
    const { error: viewError } = await supabase
      .from('invoice_views')
      .insert({
        invoice_id: invoice.id,
        tenant_id: invoiceTenant?.tenant_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        browser: browser,
        os: os,
        is_internal: false, // Public view
        email_token_id: emailTokenRecord?.id || null,
      });

    if (viewError) {
      console.error('Error logging invoice view:', viewError);
      // Don't fail the request, just log the error
    }

    // If this is an email token view, update the email token's view tracking
    if (emailTokenRecord) {
      // Get current view count to increment
      const { data: currentToken } = await supabase
        .from('invoice_email_tokens')
        .select('view_count, first_viewed_at')
        .eq('id', emailTokenRecord.id)
        .single();

      await supabase
        .from('invoice_email_tokens')
        .update({
          view_count: (currentToken?.view_count || 0) + 1,
          first_viewed_at: currentToken?.first_viewed_at || new Date().toISOString(),
        })
        .eq('id', emailTokenRecord.id);
    }

    // Update view tracking and status on the invoice
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
