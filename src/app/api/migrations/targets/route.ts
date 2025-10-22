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
        { name: 'primary_role_code', type: 'text', required: false, description: 'Primary business role (e.g., loan_officer, realtor)' },
        { name: '_client_name', type: 'text', required: false, description: 'Company name (for linking)' },
        { name: '_client_domain', type: 'text', required: false, description: 'Company domain (for linking)' },
      ];

    case 'clients':
      return [
        { name: 'company_name', type: 'text', required: true, description: 'Company name' },
        { name: 'email', type: 'email', required: false, description: 'Company email' },
        { name: 'phone', type: 'phone', required: false, description: 'Phone number' },
        { name: 'address', type: 'text', required: true, description: 'Company address (full)' },
        // Multi-line address components (Address, Address 2, Address 3)
        { name: 'address.line1', type: 'composite', required: false, description: 'Address line 1 (will be combined into address field)' },
        { name: 'address.line2', type: 'composite', required: false, description: 'Address line 2 (will be combined into address field)' },
        { name: 'address.line3', type: 'composite', required: false, description: 'Address line 3 (will be combined into address field)' },
        // Component address (Street, City, State, Zip)
        { name: 'address.street', type: 'composite', required: false, description: 'Street address (will be combined into address field)' },
        { name: 'address.city', type: 'composite', required: false, description: 'City (will be combined into address field)' },
        { name: 'address.state', type: 'composite', required: false, description: 'State (will be combined into address field)' },
        { name: 'address.zip', type: 'composite', required: false, description: 'ZIP code (will be combined into address field)' },
        { name: 'billing_address', type: 'text', required: false, description: 'Billing address (full)' },
        // Multi-line billing address
        { name: 'billing_address.line1', type: 'composite', required: false, description: 'Billing address line 1 (will be combined)' },
        { name: 'billing_address.line2', type: 'composite', required: false, description: 'Billing address line 2 (will be combined)' },
        { name: 'billing_address.line3', type: 'composite', required: false, description: 'Billing address line 3 (will be combined)' },
        // Component billing address
        { name: 'billing_address.street', type: 'composite', required: false, description: 'Billing street (will be combined into billing_address field)' },
        { name: 'billing_address.city', type: 'composite', required: false, description: 'Billing city (will be combined into billing_address field)' },
        { name: 'billing_address.state', type: 'composite', required: false, description: 'Billing state (will be combined into billing_address field)' },
        { name: 'billing_address.zip', type: 'composite', required: false, description: 'Billing ZIP (will be combined into billing_address field)' },
        { name: 'domain', type: 'text', required: false, description: 'Email domain' },
        { name: 'payment_terms', type: 'number', required: false, description: 'Payment terms (days)' },
        { name: 'preferred_turnaround', type: 'number', required: false, description: 'Turnaround time (days)' },
        { name: 'special_requirements', type: 'text', required: false, description: 'Special requirements' },
        { name: 'primary_contact', type: 'text', required: false, description: 'Primary contact name' },
        { name: 'primary_role_code', type: 'text', required: false, description: 'Primary business role (e.g., mortgage_lender, investor)' },
      ];

    case 'orders':
      return [
        // Client Resolution (special fields - these get converted to client_id)
        { name: '_client_name', type: 'text', required: false, description: '⭐ Client/Company name (will auto-link to client)' },
        { name: '_amc_client', type: 'text', required: false, description: '⭐ AMC Client name (fallback, will auto-link)' },
        { name: '_lender_client', type: 'text', required: false, description: '⭐ Lender Client name (fallback, will auto-link)' },
        
        // Standard Fields
        { name: 'external_id', type: 'text', required: false, description: 'External system ID' },
        { name: 'order_number', type: 'text', required: false, description: 'Order number (auto-generated if empty)' },
        { name: 'property_address', type: 'text', required: false, description: 'Property address (optional if using props.original_address)' },
        { name: 'property_city', type: 'text', required: false, description: 'City (auto-parsed if using props.original_address)' },
        { name: 'property_state', type: 'text', required: false, description: 'State (auto-parsed if using props.original_address)' },
        { name: 'property_zip', type: 'text', required: false, description: 'ZIP code (auto-parsed if using props.original_address)' },
        { name: 'property_type', type: 'select', required: false, description: 'Property type (defaults to single_family)' },
        { name: 'order_type', type: 'select', required: false, description: 'Order type (defaults to purchase)' },
        { name: 'status', type: 'select', required: false, description: 'Order status (defaults to new)' },
        { name: 'priority', type: 'select', required: false, description: 'Priority level (defaults to normal)' },
        { name: 'borrower_name', type: 'text', required: false, description: 'Borrower name' },
        { name: 'borrower_email', type: 'email', required: false, description: 'Borrower email' },
        { name: 'borrower_phone', type: 'phone', required: false, description: 'Borrower phone' },
        { name: 'lender_name', type: 'text', required: false, description: 'Lender name' },
        { name: 'loan_officer', type: 'text', required: false, description: 'Loan officer' },
        { name: 'loan_officer_email', type: 'email', required: false, description: 'Loan officer email' },
        { name: 'loan_officer_phone', type: 'phone', required: false, description: 'Loan officer phone' },
        { name: 'loan_number', type: 'text', required: false, description: 'Loan number' },
        { name: 'loan_type', type: 'text', required: false, description: 'Loan type' },
        { name: 'loan_amount', type: 'number', required: false, description: 'Loan amount' },
        { name: 'fee_amount', type: 'number', required: false, description: 'Fee amount (defaults to 0)' },
        { name: 'tech_fee', type: 'number', required: false, description: 'Tech fee' },
        { name: 'total_amount', type: 'number', required: false, description: 'Total amount (auto-calculated from fee_amount + tech_fee)' },
        { name: 'due_date', type: 'date', required: false, description: 'Due date' },
        { name: 'ordered_date', type: 'date', required: false, description: 'Order date (defaults to today)' },
        { name: 'completed_date', type: 'date', required: false, description: 'Completion date' },
        { name: 'delivered_date', type: 'date', required: false, description: 'Delivery date' },
        { name: 'special_instructions', type: 'text', required: false, description: 'Special instructions' },
        { name: 'access_instructions', type: 'text', required: false, description: 'Property access instructions' },
        { name: 'property_contact_name', type: 'text', required: false, description: 'Property contact name' },
        { name: 'property_contact_phone', type: 'phone', required: false, description: 'Property contact phone' },
        { name: 'property_contact_email', type: 'email', required: false, description: 'Property contact email' },
        
        // Address Parsing (for single-field addresses)
        { name: 'props.original_address', type: 'text', required: false, description: '⭐ Full address (will auto-parse to property_address, city, state, zip)' },
      ];

    default:
      return [];
  }
}


