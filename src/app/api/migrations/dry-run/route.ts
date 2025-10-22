import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import { 
  DryRunResult, 
  FieldMapping, 
  DuplicateStrategy,
  ValidationError,
  DuplicateMatch 
} from '@/lib/migrations/types';
import { applyTransform, isValidEmail, isValidPhone, normalizeCompanyName, splitUSAddress } from '@/lib/migrations/transforms';

const MAX_ERRORS_INLINE = 25;

/**
 * POST /api/migrations/dry-run
 * Validate data and detect duplicates without actually importing
 */
export async function POST(request: NextRequest) {
  try {
    // Use regular client for authentication
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database queries (bypass RLS)
    const supabase = createServiceRoleClient();

    const body = await request.json();
    const { 
      fileData, 
      mappings, 
      entity, 
      duplicateStrategy = 'update' 
    } = body as { 
      fileData: string;
      mappings: FieldMapping[];
      entity: 'contacts' | 'clients' | 'orders';
      duplicateStrategy: DuplicateStrategy;
    };

    // Validate required parameters
    if (!fileData) {
      return NextResponse.json({ error: 'File data is required' }, { status: 400 });
    }
    
    if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
      return NextResponse.json({ error: 'Field mappings are required' }, { status: 400 });
    }
    
    if (!entity) {
      return NextResponse.json({ error: 'Entity type is required' }, { status: 400 });
    }
    
    if (!['contacts', 'clients', 'orders'].includes(entity)) {
      return NextResponse.json({ error: `Invalid entity type: ${entity}. Must be contacts, clients, or orders` }, { status: 400 });
    }

    // Debug logging
    console.log('🔍 Dry Run API - Received data:', {
      fileDataLength: fileData?.length,
      fileDataPreview: fileData?.substring(0, 200),
      mappingsCount: mappings?.length,
      entity,
    });

    // Parse CSV data
    const parseResult = Papa.parse<Record<string, any>>(fileData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      const parseErrors = parseResult.errors.map(e => e.message).join('; ');
      return NextResponse.json({ error: `CSV parsing failed: ${parseErrors}` }, { status: 400 });
    }

    const rows = parseResult.data;
    
    console.log('🔍 Dry Run API - Parsed CSV:', {
      totalRows: rows.length,
      firstRow: rows[0],
      headers: parseResult.meta?.fields,
    });
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or contains no valid data' }, { status: 400 });
    }
    
    const errors: ValidationError[] = [];
    const duplicates: DuplicateMatch[] = [];

    let wouldInsert = 0;
    let wouldUpdate = 0;
    let wouldSkip = 0;

    // Build mapping lookup
    const mappingLookup = new Map<string, FieldMapping>();
    mappings.forEach(m => {
      if (m.targetField && m.targetField !== '') {
        mappingLookup.set(m.sourceColumn, m);
      }
    });

    // Validate each row
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const transformedRow: Record<string, any> = {};
      const rowErrors: ValidationError[] = [];

      // Apply mappings and transforms
      for (const [sourceCol, mapping] of mappingLookup.entries()) {
        const value = row[sourceCol];
        const targetField = mapping.targetField;

        try {
          const transformedValue = applyTransform(
            value,
            mapping.transform || 'none',
            mapping.transformParams,
            row // Pass full row for composite transforms
          );

          if (targetField.startsWith('props.')) {
            // Custom field - will go into props
            const propName = targetField.substring(6);
            transformedRow[targetField] = transformedValue;
          } else {
            transformedRow[targetField] = transformedValue;
          }

          // Validate required fields
          if (mapping.required && (transformedValue === null || transformedValue === '' || transformedValue === undefined)) {
            rowErrors.push({
              rowIndex: rowIndex + 2, // +2 for 1-based index and header row
              field: targetField,
              message: `Required field '${targetField}' is missing or empty`,
              value: value,
            });
          }

          // Validate field types
          if (transformedValue !== null && transformedValue !== '') {
            const fieldValidationError = validateFieldType(targetField, transformedValue, entity);
            if (fieldValidationError) {
              rowErrors.push({
                rowIndex: rowIndex + 2,
                field: targetField,
                message: fieldValidationError,
                value: transformedValue,
              });
            }
          }
        } catch (error: any) {
          rowErrors.push({
            rowIndex: rowIndex + 2,
            field: targetField,
            message: `Transform error: ${error.message}`,
            value: value,
          });
        }
      }

      // Handle address parsing for orders
      if (entity === 'orders' && transformedRow['props.original_address'] && !transformedRow.property_address) {
        try {
          const addressParts = splitUSAddress(transformedRow['props.original_address']);
          transformedRow.property_address = addressParts.street;
          transformedRow.property_city = addressParts.city;
          transformedRow.property_state = addressParts.state;
          transformedRow.property_zip = addressParts.zip;
          
          // Check for parsing issues
          if (!addressParts.state || !addressParts.zip) {
            rowErrors.push({
              rowIndex: rowIndex + 2,
              field: 'property_address',
              message: `Address parsing incomplete: missing state (${addressParts.state}) or zip (${addressParts.zip})`,
              value: transformedRow['props.original_address'],
            });
          }
        } catch (error: any) {
          rowErrors.push({
            rowIndex: rowIndex + 2,
            field: 'property_address',
            message: `Address parsing failed: ${error.message}`,
            value: transformedRow['props.original_address'],
          });
        }
      }

      errors.push(...rowErrors);

      // Skip duplicate detection if there are validation errors for this row
      if (rowErrors.length === 0) {
        // Check for duplicates
        const duplicate = await checkForDuplicate(
          supabase,
          entity,
          transformedRow,
          user.id
        );

        if (duplicate) {
          duplicates.push({
            rowIndex: rowIndex + 2,
            matchedId: duplicate.id,
            matchedOn: duplicate.matchedOn,
            existingData: duplicate.existingData,
            newData: transformedRow,
          });

          if (duplicateStrategy === 'update') {
            wouldUpdate++;
          } else if (duplicateStrategy === 'skip') {
            wouldSkip++;
          } else {
            wouldInsert++; // create strategy
          }
        } else {
          wouldInsert++;
        }
      }
    }

    const result: DryRunResult = {
      total: rows.length,
      wouldInsert,
      wouldUpdate,
      wouldSkip,
      errors: errors.slice(0, MAX_ERRORS_INLINE), // Return first 25 inline
      duplicates: duplicates.slice(0, MAX_ERRORS_INLINE),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error during dry-run:', error);
    return NextResponse.json(
      { error: error.message || 'Dry-run failed' },
      { status: 500 }
    );
  }
}

function validateFieldType(fieldName: string, value: any, entity: string): string | null {
  // Email validation
  if (fieldName.includes('email') && typeof value === 'string' && !isValidEmail(value)) {
    return `Invalid email format: ${value}`;
  }

  // Phone validation (basic)
  if ((fieldName.includes('phone') || fieldName.includes('mobile')) && typeof value === 'string') {
    const cleaned = value.replace(/[\s().-]/g, '');
    if (cleaned.length > 0 && !/^\+?[0-9]{10,15}$/.test(cleaned)) {
      return `Invalid phone format: ${value}`;
    }
  }

  // Date validation
  if (fieldName.includes('date') && typeof value === 'string') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `Invalid date format: ${value}`;
    }
  }

  // Number validation
  if ((fieldName.includes('amount') || fieldName.includes('fee') || fieldName.includes('payment_terms')) && value !== null) {
    if (typeof value !== 'number' && isNaN(Number(value))) {
      return `Invalid number format: ${value}`;
    }
  }

  // Entity-specific validations (only validate if value is provided)
  if (entity === 'orders') {
    const validStatuses = ['new', 'assigned', 'scheduled', 'in_progress', 'in_review', 'revisions', 'completed', 'delivered', 'cancelled'];
    if (fieldName === 'status' && value && String(value).trim() !== '' && !validStatuses.includes(String(value).toLowerCase())) {
      return `Invalid status. Must be one of: ${validStatuses.join(', ')}`;
    }

    const validPriorities = ['rush', 'high', 'normal', 'low'];
    if (fieldName === 'priority' && value && String(value).trim() !== '' && !validPriorities.includes(String(value).toLowerCase())) {
      return `Invalid priority. Must be one of: ${validPriorities.join(', ')}`;
    }

    const validOrderTypes = ['purchase', 'refinance', 'home_equity', 'estate', 'divorce', 'tax_appeal', 'other'];
    if (fieldName === 'order_type' && value && String(value).trim() !== '' && !validOrderTypes.includes(String(value).toLowerCase())) {
      return `Invalid order type. Must be one of: ${validOrderTypes.join(', ')}`;
    }

    const validPropertyTypes = ['single_family', 'condo', 'multi_family', 'commercial', 'land', 'manufactured'];
    if (fieldName === 'property_type' && value && String(value).trim() !== '' && !validPropertyTypes.includes(String(value).toLowerCase())) {
      return `Invalid property type. Must be one of: ${validPropertyTypes.join(', ')}`;
    }
  }

  return null;
}

async function checkForDuplicate(
  supabase: any,
  entity: 'contacts' | 'clients' | 'orders',
  row: Record<string, any>,
  userId: string
): Promise<{ id: string; matchedOn: string; existingData: Record<string, any> } | null> {
  try {
    switch (entity) {
      case 'contacts': {
        // Match by email (case-insensitive) using functional index
        if (row.email) {
          const emailLower = String(row.email).toLowerCase();
          const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('email', emailLower)
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              matchedOn: 'email',
              existingData: data,
            };
          }
        }
        return null;
      }

      case 'clients': {
        // Match by domain (primary) or normalized company name
        if (row.domain) {
          const domainLower = String(row.domain).toLowerCase();
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('domain', domainLower)
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              matchedOn: 'domain',
              existingData: data,
            };
          }
        }

        // Fallback to company name match
        if (row.company_name) {
          const normalized = normalizeCompanyName(row.company_name);
          const { data: clients, error } = await supabase
            .from('clients')
            .select('*');

          if (!error && clients) {
            for (const client of clients) {
              if (normalizeCompanyName(client.company_name) === normalized) {
                return {
                  id: client.id,
                  matchedOn: 'company_name',
                  existingData: client,
                };
              }
            }
          }
        }
        return null;
      }

      case 'orders': {
        // Match by external_id or order_number
        if (row.external_id) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('external_id', row.external_id)
            .limit(1)
            .single();

          if (!error && data) {
            return {
              id: data.id,
              matchedOn: 'external_id',
              existingData: data,
            };
          }
        }

        if (row.order_number) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', row.order_number)
            .limit(1)
            .single();

          if (!error && data) {
            return {
              id: data.id,
              matchedOn: 'order_number',
              existingData: data,
            };
          }
        }
        return null;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error checking for duplicate:', error);
    return null;
  }
}

