import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find invoices that have line items referencing this order
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .select('invoice_id')
      .eq('order_id', orderId);

    if (lineItemsError) {
      console.error('Error fetching invoice line items:', lineItemsError);
      return NextResponse.json(
        { error: 'Failed to fetch invoice line items' },
        { status: 500 }
      );
    }

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json([]);
    }

    // Get unique invoice IDs
    const invoiceIds = [...new Set(lineItems.map(item => item.invoice_id))];

    // Fetch full invoice details
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, company_name, email, phone),
        line_items:invoice_line_items(
          id,
          description,
          quantity,
          unit_price,
          amount,
          order_id,
          line_order
        )
      `)
      .in('id', invoiceIds)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json(invoices || []);
  } catch (error) {
    console.error('Error in GET /api/orders/[id]/invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
