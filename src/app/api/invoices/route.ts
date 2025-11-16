/**
 * Invoice CRUD API Routes
 * GET  /api/invoices - List invoices with filters and pagination
 * POST /api/invoices - Create new invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CreateInvoiceSchema,
  InvoiceListQuerySchema,
  type CreateInvoiceInput,
  type InvoiceListQueryInput,
} from '@/lib/validations/invoicing';
import {
  handleApiError,
  validateRequestBody,
  validateQueryParams,
  getAuthenticatedOrgId,
  successResponse,
  createdResponse,
} from '@/lib/errors/api-errors';
import type { Invoice, InvoiceWithDetails } from '@/types/invoicing';

// =============================================
// GET /api/invoices - List invoices
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const query = validateQueryParams<InvoiceListQueryInput>(url, InvoiceListQuerySchema);

    // Build the base query
    let supabaseQuery = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, company_name, email, payment_terms),
        line_items:invoice_line_items(
          *,
          order:orders(id, order_number, property_address, status)
        ),
        payments(*)
      `, { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.client_id) {
      supabaseQuery = supabaseQuery.eq('client_id', query.client_id);
    }

    if (query.status) {
      if (Array.isArray(query.status)) {
        supabaseQuery = supabaseQuery.in('status', query.status);
      } else {
        supabaseQuery = supabaseQuery.eq('status', query.status);
      }
    }

    if (query.payment_method) {
      if (Array.isArray(query.payment_method)) {
        supabaseQuery = supabaseQuery.in('payment_method', query.payment_method);
      } else {
        supabaseQuery = supabaseQuery.eq('payment_method', query.payment_method);
      }
    }

    if (query.date_from) {
      supabaseQuery = supabaseQuery.gte('invoice_date', query.date_from);
    }

    if (query.date_to) {
      supabaseQuery = supabaseQuery.lte('invoice_date', query.date_to);
    }

    if (query.overdue_only) {
      supabaseQuery = supabaseQuery
        .in('status', ['sent', 'viewed', 'partially_paid', 'overdue'])
        .lt('due_date', new Date().toISOString().split('T')[0]);
    }

    if (query.search) {
      // Search in invoice number or client name (using text search)
      // Escape special characters to prevent SQL injection
      const escapedSearch = query.search.replace(/[%_\\]/g, '\\$&');
      supabaseQuery = supabaseQuery.or(
        `invoice_number.ilike.%${escapedSearch}%,client.company_name.ilike.%${escapedSearch}%`
      );
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(query.sort_by || 'created_at', {
      ascending: query.sort_order === 'asc',
    });

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    supabaseQuery = supabaseQuery.range(from, to);

    // Execute query
    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return successResponse<InvoiceWithDetails[]>(
      data || [],
      undefined,
      {
        page,
        limit,
        total: count || 0,
        totalPages,
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/invoices - Create invoice
// =============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const orgId = await getAuthenticatedOrgId(supabase);

    // Validate request body
    const body = await validateRequestBody<CreateInvoiceInput>(
      request,
      CreateInvoiceSchema
    );

    // Verify client exists and belongs to org
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, payment_terms')
      .eq('id', body.client_id)
      .eq('org_id', orgId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate due date if not provided (use client's payment terms)
    let dueDate = body.due_date;
    if (!dueDate) {
      const invoiceDate = body.invoice_date
        ? new Date(body.invoice_date)
        : new Date();
      const paymentTerms = client.payment_terms || 30;
      const dueDateObj = new Date(invoiceDate);
      dueDateObj.setDate(dueDateObj.getDate() + paymentTerms);
      dueDate = dueDateObj.toISOString();
    }

    // Create invoice (invoice number will be auto-generated by trigger)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        org_id: orgId,
        client_id: body.client_id,
        payment_method: body.payment_method,
        invoice_date: body.invoice_date || new Date().toISOString(),
        due_date: dueDate,
        tax_rate: body.tax_rate || 0,
        discount_amount: body.discount_amount || 0,
        notes: body.notes,
        terms_and_conditions: body.terms_and_conditions,
        footer_text: body.footer_text,
        stripe_customer_id: body.stripe_customer_id,
        cod_collected_by: body.cod_collected_by,
        cod_collection_method: body.cod_collection_method,
        cod_notes: body.cod_notes,
        created_by: orgId,
        updated_by: orgId,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw invoiceError;
    }

    // Create line items
    const lineItemsToInsert = body.line_items.map((item, index) => ({
      invoice_id: invoice.id,
      order_id: item.order_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 0,
      line_order: item.line_order ?? index,
    }));

    const { data: lineItems, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsToInsert)
      .select();

    if (lineItemsError) {
      console.error('Error creating line items:', lineItemsError);
      // Rollback: delete the invoice
      await supabase.from('invoices').delete().eq('id', invoice.id);
      throw lineItemsError;
    }

    // Fetch complete invoice with relations
    // (Triggers will have calculated totals)
    const { data: completeInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, company_name, email, payment_terms),
        line_items:invoice_line_items(
          *,
          order:orders(id, order_number, property_address, status)
        ),
        payments(*)
      `)
      .eq('id', invoice.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete invoice:', fetchError);
      throw fetchError;
    }

    return createdResponse<InvoiceWithDetails>(
      completeInvoice,
      'Invoice created successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
