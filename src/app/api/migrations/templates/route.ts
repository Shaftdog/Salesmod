import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';

/**
 * GET /api/migrations/templates?entity=contacts|orders|clients
 * Download CSV templates with example data
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

    const template = getTemplate(entity);
    const csv = Papa.unparse(template.data);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${template.filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}

function getTemplate(entity: 'contacts' | 'clients' | 'orders') {
  switch (entity) {
    case 'contacts':
      return {
        filename: 'contacts_template.csv',
        data: [
          {
            email: 'john.doe@example.com',
            firstname: 'John',
            lastname: 'Doe',
            phone: '555-123-4567',
            mobilephone: '555-987-6543',
            jobtitle: 'Senior Manager',
            company: 'Example Corp',
            company_domain: 'example.com',
            department: 'Sales',
            notes: 'Primary contact for new orders',
          },
          {
            email: 'jane.smith@acme.com',
            firstname: 'Jane',
            lastname: 'Smith',
            phone: '555-234-5678',
            mobilephone: '555-876-5432',
            jobtitle: 'Director',
            company: 'Acme Inc',
            company_domain: 'acme.com',
            department: 'Operations',
            notes: 'Handles all urgent requests',
          },
        ],
      };

    case 'clients':
      return {
        filename: 'clients_template.csv',
        data: [
          {
            name: 'Example Corp',
            domain: 'example.com',
            phone: '555-100-2000',
            address: '123 Main St, Suite 100',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
            website: 'https://example.com',
            industry: 'Real Estate',
          },
          {
            name: 'Acme Inc',
            domain: 'acme.com',
            phone: '555-200-3000',
            address: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90001',
            website: 'https://acme.com',
            industry: 'Financial Services',
          },
        ],
      };

    case 'orders':
      return {
        filename: 'orders_template.csv',
        data: [
          {
            gid: 'asana_12345',
            name: '123 Main Street Property Appraisal',
            due_on: '2025-10-25',
            created_at: '2025-10-17',
            completed_at: '',
            'custom_fields.Status': 'new',
            'custom_fields.Priority': 'normal',
            'custom_fields.Service_Type': 'purchase',
            'custom_fields.Fee': '450.00',
            'custom_fields.Property_Address': '123 Main Street',
            'custom_fields.City': 'San Francisco',
            'custom_fields.State': 'CA',
            'custom_fields.Zip': '94102',
            'custom_fields.Property_Type': 'single_family',
            'custom_fields.Borrower_Name': 'John Doe',
            'custom_fields.Borrower_Email': 'john.doe@email.com',
            'custom_fields.Borrower_Phone': '555-111-2222',
            'custom_fields.Lender': 'First National Bank',
            'custom_fields.Loan_Officer': 'Jane Smith',
            'custom_fields.Loan_Number': 'LN-2025-001',
            notes: 'Rush order - client needs by end of week',
          },
          {
            gid: 'asana_12346',
            name: '456 Oak Avenue Refinance',
            due_on: '2025-10-30',
            created_at: '2025-10-18',
            completed_at: '',
            'custom_fields.Status': 'assigned',
            'custom_fields.Priority': 'high',
            'custom_fields.Service_Type': 'refinance',
            'custom_fields.Fee': '350.00',
            'custom_fields.Property_Address': '456 Oak Avenue',
            'custom_fields.City': 'Los Angeles',
            'custom_fields.State': 'CA',
            'custom_fields.Zip': '90001',
            'custom_fields.Property_Type': 'condo',
            'custom_fields.Borrower_Name': 'Jane Smith',
            'custom_fields.Borrower_Email': 'jane.smith@email.com',
            'custom_fields.Borrower_Phone': '555-333-4444',
            'custom_fields.Lender': 'Community Credit Union',
            'custom_fields.Loan_Officer': 'Bob Johnson',
            'custom_fields.Loan_Number': 'LN-2025-002',
            notes: 'Standard refinance appraisal',
          },
        ],
      };

    default:
      return {
        filename: 'template.csv',
        data: [],
      };
  }
}


