/**
 * Invoice Views API Route
 * GET /api/invoices/[id]/views - Get view history for an invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    // Verify invoice belongs to user's tenant
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get view history with email token recipient info
    const { data: views, error: viewsError } = await supabase
      .from('invoice_views')
      .select(`
        id,
        viewed_at,
        ip_address,
        user_agent,
        device_type,
        browser,
        os,
        city,
        region,
        country,
        is_internal,
        viewer_user_id,
        email_token_id,
        email_token:invoice_email_tokens(
          id,
          recipient_email,
          recipient_name,
          recipient_role
        )
      `)
      .eq('invoice_id', id)
      .order('viewed_at', { ascending: false });

    if (viewsError) {
      console.error('Error fetching invoice views:', viewsError);
      return NextResponse.json(
        { error: 'Failed to fetch view history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ views: views || [] });
  } catch (error) {
    console.error('Invoice views API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
