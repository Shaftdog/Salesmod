import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DatabaseField } from '@/lib/migrations/types';

/**
 * GET /api/migrations/targets?entity=contacts|clients|orders
 * Returns available database columns + types for field mapping UI
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const entity = searchParams.get('entity') as 'contacts' | 'clients' | 'orders' | null;

    if (!entity || !['contacts', 'clients', 'orders'].includes(entity)) {
      return NextResponse.json({ error: 'Invalid entity parameter' }, { status: 400 });
    }

    const fields = getDatabaseFields(entity);

    return NextResponse.json({ fields });
  } catch (error: any) {
    console.error('Error fetching migration targets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch targets' },
      { status: 500 }
    );
  }
}

function getDatabaseFields(entity: 'contacts' | 'clients' | 'orders'): DatabaseField[] {
  switch (entity) {
    case 'contacts':
      return [
        { name: 'first_name', type: 'text', required: true, description: 'Contact first name' },
        { name: 'last_name', type: 'text', required: true, description: 'Contact last name' },
        { name: 'email', type: 'email', required: false, description: 'Email address' },
        { name: 'phone', type: 'phone', required: false, description: 'Phone number' },
        { name: 'mobile', type: 'phone', required: false, description: 'Mobile number' },
        { name: 'title', type: 'text', required: false, description: 'Job title' },
        { name: 'department', type: 'text', required: false, description: 'Department' },
        { name: 'notes', type: 'text', required: false, description: 'Notes' },
        { name: 'is_primary', type: 'boolean', required: false, description: 'Primary contact' },
        { name: '_client_name', type: 'text', required: false, description: 'Company name (for linking)' },
        { name: '_client_domain', type: 'text', required: false, description: 'Company domain (for linking)' },
      ];

    case 'clients':
      return [
        { name: 'company_name', type: 'text', required: true, description: 'Company name' },
        { name: 'email', type: 'email', required: true, description: 'Company email' },
        { name: 'phone', type: 'phone', required: true, description: 'Phone number' },
        { name: 'address', type: 'text', required: true, description: 'Company address' },
        { name: 'billing_address', type: 'text', required: false, description: 'Billing address' },
        { name: 'domain', type: 'text', required: false, description: 'Email domain' },
        { name: 'payment_terms', type: 'number', required: false, description: 'Payment terms (days)' },
        { name: 'preferred_turnaround', type: 'number', required: false, description: 'Turnaround time (days)' },
        { name: 'special_requirements', type: 'text', required: false, description: 'Special requirements' },
        { name: 'primary_contact', type: 'text', required: true, description: 'Primary contact name' },
      ];

    case 'orders':
      return [
        { name: 'external_id', type: 'text', required: false, description: 'External system ID' },
        { name: 'order_number', type: 'text', required: false, description: 'Order number (auto-generated if empty)' },
        { name: 'property_address', type: 'text', required: true, description: 'Property address' },
        { name: 'property_city', type: 'text', required: true, description: 'City' },
        { name: 'property_state', type: 'text', required: true, description: 'State' },
        { name: 'property_zip', type: 'text', required: true, description: 'ZIP code' },
        { name: 'property_type', type: 'select', required: true, description: 'Property type (single_family, condo, etc.)' },
        { name: 'order_type', type: 'select', required: true, description: 'Order type (purchase, refinance, etc.)' },
        { name: 'status', type: 'select', required: true, description: 'Order status' },
        { name: 'priority', type: 'select', required: true, description: 'Priority level' },
        { name: 'borrower_name', type: 'text', required: true, description: 'Borrower name' },
        { name: 'borrower_email', type: 'email', required: false, description: 'Borrower email' },
        { name: 'borrower_phone', type: 'phone', required: false, description: 'Borrower phone' },
        { name: 'lender_name', type: 'text', required: false, description: 'Lender name' },
        { name: 'loan_officer', type: 'text', required: false, description: 'Loan officer' },
        { name: 'loan_officer_email', type: 'email', required: false, description: 'Loan officer email' },
        { name: 'loan_officer_phone', type: 'phone', required: false, description: 'Loan officer phone' },
        { name: 'loan_number', type: 'text', required: false, description: 'Loan number' },
        { name: 'loan_type', type: 'text', required: false, description: 'Loan type' },
        { name: 'loan_amount', type: 'number', required: false, description: 'Loan amount' },
        { name: 'fee_amount', type: 'number', required: true, description: 'Fee amount' },
        { name: 'tech_fee', type: 'number', required: false, description: 'Tech fee' },
        { name: 'total_amount', type: 'number', required: true, description: 'Total amount' },
        { name: 'due_date', type: 'date', required: true, description: 'Due date' },
        { name: 'ordered_date', type: 'date', required: true, description: 'Order date' },
        { name: 'completed_date', type: 'date', required: false, description: 'Completion date' },
        { name: 'delivered_date', type: 'date', required: false, description: 'Delivery date' },
        { name: 'special_instructions', type: 'text', required: false, description: 'Special instructions' },
        { name: 'access_instructions', type: 'text', required: false, description: 'Property access instructions' },
        { name: 'property_contact_name', type: 'text', required: false, description: 'Property contact name' },
        { name: 'property_contact_phone', type: 'phone', required: false, description: 'Property contact phone' },
        { name: 'property_contact_email', type: 'email', required: false, description: 'Property contact email' },
      ];

    default:
      return [];
  }
}


