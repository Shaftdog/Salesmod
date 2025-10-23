import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import {
  FieldMapping,
  DuplicateStrategy,
  MigrationTotals,
} from '@/lib/migrations/types';
import { applyTransform, generateHash, normalizeCompanyName, transformExtractDomain, splitUSAddress } from '@/lib/migrations/transforms';
import { normalizeAddressKey, extractUnit } from '@/lib/addresses';
import { normalizeUnit, shouldCreateUnit } from '@/lib/units';
import { validateAddressWithGoogle } from '@/lib/address-validation';
import { mapPartyRole, isJunkRole } from '@/lib/roles/mapPartyRole';

const BATCH_SIZE = 500;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/migrations/run
 * Execute the migration with actual data import
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fileData,
      fileHash,
      mappings,
      entity,
      source,
      duplicateStrategy = 'update',
      options = { autoLinkProperties: true },
    } = body as {
      fileData: string;
      fileHash: string;
      mappings: FieldMapping[];
      entity: 'contacts' | 'clients' | 'orders';
      source: string;
      duplicateStrategy: DuplicateStrategy;
      options?: { autoLinkProperties?: boolean };
    };

    if (!fileData || !mappings || !entity) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const fileSizeBytes = new Blob([fileData]).size;
    if (fileSizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Generate idempotency key WITHOUT timestamp for duplicate prevention
    const mappingHash = generateHash(JSON.stringify(mappings));
    const baseIdempotencyKey = `${user.id}_${mappingHash}_${fileHash}`;

    // Check for existing job with same base idempotency key
    const { data: existingJob } = await supabase
      .from('migration_jobs')
      .select('id, status, base_idempotency_key')
      .eq('base_idempotency_key', baseIdempotencyKey)
      .maybeSingle();

    // If there's an existing job that's still processing, return it
    if (existingJob && (existingJob.status === 'processing' || existingJob.status === 'pending')) {
      return NextResponse.json({
        jobId: existingJob.id,
        message: 'Job already in progress',
      });
    }

    // Create unique idempotency key with timestamp for this specific job
    const timestamp = Date.now();
    const uniqueIdempotencyKey = `${baseIdempotencyKey}_${timestamp}`;

    // Create migration job with both keys
    const { data: job, error: jobError } = await supabase
      .from('migration_jobs')
      .insert({
        user_id: user.id,
        source,
        entity,
        mode: 'csv',
        status: 'pending',
        mapping: mappings,
        idempotency_key: uniqueIdempotencyKey,
        base_idempotency_key: baseIdempotencyKey,
        totals: { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Error creating migration job:', jobError);
      return NextResponse.json({ 
        error: jobError?.message || 'Failed to create migration job',
        details: jobError?.details || null,
        hint: jobError?.hint || null
      }, { status: 500 });
    }

    // Start processing in background (no await)
    processMigration(job.id, fileData, mappings, entity, source, duplicateStrategy, user.id, options).catch(
      (error) => {
        console.error('❌ Migration processing error (caught in main):', error);
        console.error('Error stack:', error.stack);
      }
    );
    
    console.log('✅ Migration job created and background processing started:', {
      jobId: job.id,
      entity,
      fileDataLength: fileData?.length,
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error: any) {
    console.error('Error starting migration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start migration' },
      { status: 500 }
    );
  }
}

/**
 * Process migration in background
 * Uses service role client to bypass RLS for bulk operations
 */
async function processMigration(
  jobId: string,
  fileData: string,
  mappings: FieldMapping[],
  entity: 'contacts' | 'clients' | 'orders',
  source: string,
  duplicateStrategy: DuplicateStrategy,
  userId: string,
  options: { autoLinkProperties?: boolean } = { autoLinkProperties: true }
) {
  // Use service role client to bypass RLS for bulk imports
  const supabase = createServiceRoleClient();

  try {
    const startTime = Date.now();
    const autoLinkProperties = options.autoLinkProperties ?? true;
    
    console.log('🚀 Migration Processing - Starting:', {
      jobId,
      fileDataLength: fileData?.length,
      fileDataPreview: fileData?.substring(0, 200),
      entity,
      mappingsCount: mappings?.length,
      autoLinkProperties,
    });

    // Initialize metrics
    const metrics = {
      job_id: jobId,
      source,
      totals: {
        read: 0,
        created: 0,
        updated: 0,
        deduped: 0,
        skipped_no_external_id: 0,
      },
      address_validation: {
        verified: 0,
        partial: 0,
        failed: 0,
        unavailable: 0,
      },
      properties: {
        upserts: 0,
        link_attempted: 0,
        linked: 0,
        unlinked: 0,
      },
      link_rate: 0,
      duration_ms: 0,
    };

    // Update job to processing
    await supabase
      .from('migration_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', jobId);

    // Parse CSV
    const parseResult = Papa.parse<Record<string, any>>(fileData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    const rows = parseResult.data;
    
    console.log('🚀 Migration Processing - Parsed CSV:', {
      totalRows: rows.length,
      firstRow: rows[0],
    });
    
    // Initialize totals and metrics
    const totals: MigrationTotals = {
      total: rows.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };
    
    metrics.totals.read = rows.length;

    // Build mapping lookup
    const mappingLookup = new Map<string, FieldMapping>();
    mappings.forEach((m) => {
      if (m.targetField && m.targetField !== '') {
        mappingLookup.set(m.sourceColumn, m);
      }
    });

    console.log('🔧 Starting row processing loop...', {
      totalRows: rows.length,
      mappingsCount: mappingLookup.size,
    });

    // Process in batches
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      console.log(`📦 Processing batch starting at row ${i + 1}...`);
      // Check if job was cancelled before processing next batch
      const { data: jobStatus } = await supabase
        .from('migration_jobs')
        .select('status')
        .eq('id', jobId)
        .single();

      if (jobStatus?.status === 'cancelled') {
        console.log(`Migration ${jobId} was cancelled. Stopping gracefully.`);
        // Update final totals and exit
        await supabase
          .from('migration_jobs')
          .update({ 
            totals,
            finished_at: new Date().toISOString()
          })
          .eq('id', jobId);
        return;
      }

      const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));

      for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
        const rowIndex = i + batchIndex;
        const row = batch[batchIndex];

        try {
          console.log(`📝 Processing row ${rowIndex + 1}/${rows.length}:`, row);
          
          const result = await processRow(
            supabase,
            row,
            mappingLookup,
            entity,
            source,
            duplicateStrategy,
            userId,
            autoLinkProperties,
            metrics
          );

          console.log(`✅ Row ${rowIndex + 1} processed:`, result.type);

          if (result.type === 'inserted') totals.inserted++;
          else if (result.type === 'updated') totals.updated++;
          else if (result.type === 'skipped') totals.skipped++;
        } catch (error: any) {
          console.error(`❌ Error processing row ${rowIndex + 1}:`, error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            row: row,
          });
          
          totals.errors++;

          // Log error with context
          await supabase.from('migration_errors').insert({
            job_id: jobId,
            row_index: rowIndex + 2, // +2 for header and 1-based index
            raw_data: row,
            error_message: error.message || 'Unknown error',
            field: error.field || null,
            matched_on: error.matched_on || null, // Include duplicate match context
          });
        }
      }

      // Update totals after each batch
      await supabase
        .from('migration_jobs')
        .update({ totals })
        .eq('id', jobId);
    }

    // Calculate final metrics
    metrics.totals.created = totals.inserted;
    metrics.totals.updated = totals.updated;
    metrics.totals.deduped = totals.skipped;
    metrics.totals.skipped_no_external_id = totals.skipped;
    metrics.link_rate = metrics.properties.link_attempted > 0 
      ? metrics.properties.linked / metrics.properties.link_attempted 
      : 0;
    metrics.duration_ms = Date.now() - startTime;

    // Mark job as completed
    await supabase
      .from('migration_jobs')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        totals,
        metrics,
      })
      .eq('id', jobId);
  } catch (error: any) {
    console.error('Migration processing failed:', error);

    // Mark job as failed
    await supabase
      .from('migration_jobs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_message: error.message || 'Migration failed',
      })
      .eq('id', jobId);
  }
}

/**
 * Process a single row
 */
async function processRow(
  supabase: any,
  row: Record<string, any>,
  mappingLookup: Map<string, FieldMapping>,
  entity: 'contacts' | 'clients' | 'orders',
  source: string,
  duplicateStrategy: DuplicateStrategy,
  userId: string,
  autoLinkProperties: boolean,
  metrics: any
): Promise<{ type: 'inserted' | 'updated' | 'skipped' }> {
  const transformedRow: Record<string, any> = {};
  const propsData: Record<string, any> = {};

  // Apply mappings and transforms
  for (const [sourceCol, mapping] of mappingLookup.entries()) {
    const value = row[sourceCol];
    const targetField = mapping.targetField;

    const transformedValue = applyTransform(
      value,
      mapping.transform || 'none',
      mapping.transformParams,
      row // Pass full row for composite transforms
    );

    if (targetField.startsWith('props.')) {
      // Custom field - goes into props
      const propName = targetField.substring(6);
      propsData[propName] = transformedValue;
    } else if (targetField.startsWith('_')) {
      // Special field (e.g., _client_name) - used for lookup, not stored directly
      transformedRow[targetField] = transformedValue;
    } else {
      transformedRow[targetField] = transformedValue;
    }
  }

  // Add props if any custom fields exist
  if (Object.keys(propsData).length > 0) {
    transformedRow.props = propsData;
  }

  // Entity-specific processing
  switch (entity) {
    case 'contacts':
      return await processContact(supabase, transformedRow, duplicateStrategy, userId);
    case 'clients':
      return await processClient(supabase, transformedRow, source, duplicateStrategy, userId);
    case 'orders':
      return await processOrder(supabase, transformedRow, source, duplicateStrategy, userId, autoLinkProperties, metrics);
    default:
      throw new Error(`Unsupported entity: ${entity}`);
  }
}

/**
 * Process contact row with client association
 */
async function processContact(
  supabase: any,
  row: Record<string, any>,
  duplicateStrategy: DuplicateStrategy,
  userId: string
): Promise<{ type: 'inserted' | 'updated' | 'skipped' }> {
  // Resolve client_id (optional - contacts can exist without company)
  let clientId = null;

  if (row._client_domain || row._client_name) {
    clientId = await resolveClientId(supabase, row._client_domain, row._client_name);
  } else if (row.email) {
    // Extract domain from email
    const domain = transformExtractDomain(row.email);
    if (domain) {
      clientId = await resolveClientId(supabase, domain, null);
    }
  }

  // Remove special fields
  delete row._client_domain;
  delete row._client_name;

  // Handle role mapping
  if (row._role) {
    const roleCode = mapPartyRole(row._role);
    row.primary_role_code = roleCode;
    
    // Store original label in props
    if (!row.props) row.props = {};
    row.props.source_role_label = row._role;
    
    // Flag junk records for exclusion
    if (isJunkRole(roleCode)) {
      row.primary_role_code = 'unknown';
      row.props.exclude = true;
      row.props.exclude_reason = `Junk role: ${row._role}`;
    }
    
    delete row._role; // Remove special field
  }
  
  // FALLBACK: Auto-map invalid role codes for contacts (same as clients)
  if (row.primary_role_code && typeof row.primary_role_code === 'string') {
    if (row.primary_role_code.includes(' ') || /[A-Z]/.test(row.primary_role_code)) {
      console.log(`🔄 Auto-mapping invalid contact role: "${row.primary_role_code}"`);
      const mapped = mapPartyRole(row.primary_role_code);
      
      if (!row.props) row.props = {};
      row.props.original_role = row.primary_role_code;
      row.primary_role_code = mapped;
      
      console.log(`  → Mapped to: "${mapped}"`);
    }
  }
  
  // Set to null if empty to avoid foreign key constraint errors
  if (!row.primary_role_code || row.primary_role_code === '') {
    row.primary_role_code = null;
  }

  // If no client resolved, try to get or create "Unassigned Contacts" client
  if (!clientId) {
    const { data: unassignedClient } = await supabase
      .from('clients')
      .select('id')
      .eq('company_name', '[Unassigned Contacts]')
      .maybeSingle();

    if (unassignedClient) {
      clientId = unassignedClient.id;
    } else {
      // Create the unassigned client placeholder
      const { data: newUnassigned, error: createError } = await supabase
        .from('clients')
        .insert({
          company_name: '[Unassigned Contacts]',
          primary_contact: 'System',
          email: 'unassigned-contacts@system.local',
          phone: '000-000-0000',
          address: 'N/A',
          billing_address: 'N/A',
        })
        .select('id')
        .maybeSingle();

      if (!createError && newUnassigned) {
        clientId = newUnassigned.id;
      }
    }

    // Store that this contact needs manual company assignment
    if (!row.props) row.props = {};
    row.props.needs_company_assignment = true;
    row.props.unassigned_reason = 'No company information available during import';
  }

  row.client_id = clientId;

  // Check for duplicate using functional index on lower(email)
  if (row.email) {
    const emailLower = String(row.email).toLowerCase();
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', emailLower)
      .maybeSingle();

    if (existing) {
      if (duplicateStrategy === 'skip') {
        return { type: 'skipped' };
      } else if (duplicateStrategy === 'update') {
        await supabase.from('contacts').update(row).eq('id', existing.id);
        return { type: 'updated' };
      }
      // 'create' strategy falls through to insert
    }
  }
  
  // Ensure email is stored in lowercase for index compatibility
  if (row.email) {
    row.email = String(row.email).toLowerCase();
  }

  const { data: insertedContact, error: insertError } = await supabase
    .from('contacts')
    .insert(row)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Contact insert failed:', insertError);
    throw new Error(`Failed to insert contact: ${insertError.message}`);
  }

  console.log('✅ Contact inserted successfully:', insertedContact?.id);
  return { type: 'inserted' };
}

/**
 * Process client row
 */
async function processClient(
  supabase: any,
  row: Record<string, any>,
  source: string,
  duplicateStrategy: DuplicateStrategy,
  userId: string
): Promise<{ type: 'inserted' | 'updated' | 'skipped' }> {
  // Handle composite address fields (Street, City, State, Zip → single address field)
  if (row['address.street'] || row['address.city'] || row['address.state'] || row['address.zip']) {
    const parts = [
      row['address.street'],
      row['address.city'],
      row['address.state'],
      row['address.zip']
    ].filter(p => p && p.trim() !== '');
    
    row.address = parts.join(', ') || 'N/A';
    
    // Clean up the component fields
    delete row['address.street'];
    delete row['address.city'];
    delete row['address.state'];
    delete row['address.zip'];
  }
  
  // Handle billing address components if present
  if (row['billing_address.street'] || row['billing_address.city']) {
    const parts = [
      row['billing_address.street'],
      row['billing_address.city'],
      row['billing_address.state'],
      row['billing_address.zip']
    ].filter(p => p && p.trim() !== '');
    
    row.billing_address = parts.join(', ') || row.address || 'N/A';
    
    delete row['billing_address.street'];
    delete row['billing_address.city'];
    delete row['billing_address.state'];
    delete row['billing_address.zip'];
  }
  
  // Set required fields with defaults if not provided
  if (!row.primary_contact || row.primary_contact.trim() === '') {
    row.primary_contact = row.company_name || 'Unknown Contact';
  }
  
  if (!row.email || row.email.trim() === '') {
    row.email = `${(row.domain || 'noemail').toLowerCase()}@imported.local`;
  }
  
  if (!row.phone || row.phone.trim() === '') {
    row.phone = '000-000-0000';
  }
  
  if (!row.address || row.address.trim() === '') {
    row.address = 'N/A';
  }
  
  if (!row.billing_address || row.billing_address.trim() === '') {
    row.billing_address = row.address || 'N/A';
  }
  
  // Set source if provided
  if (source && !row.source) {
    row.props = { ...(row.props || {}), import_source: source };
  }

  // Ensure domain is stored in lowercase for index compatibility
  if (row.domain) {
    row.domain = String(row.domain).toLowerCase();
  }

  // Handle role mapping
  if (row._role) {
    const roleCode = mapPartyRole(row._role);
    row.primary_role_code = roleCode;
    
    // Store original label in props
    if (!row.props) row.props = {};
    row.props.source_role_label = row._role;
    
    // Flag junk records for exclusion
    if (isJunkRole(roleCode)) {
      row.primary_role_code = 'unknown';
      row.props.exclude = true;
      row.props.exclude_reason = `Junk role: ${row._role}`;
    }
    
    delete row._role; // Remove special field
  }
  
  // FALLBACK: If primary_role_code looks like an unmapped category value (has spaces/capitals),
  // try to map it using mapPartyRole. This handles cases where old field mappings
  // mapped Category directly to primary_role_code before the preset was fixed.
  if (row.primary_role_code && typeof row.primary_role_code === 'string') {
    if (row.primary_role_code.includes(' ') || /[A-Z]/.test(row.primary_role_code)) {
      console.log(`🔄 Auto-mapping invalid role code: "${row.primary_role_code}"`);
      const mapped = mapPartyRole(row.primary_role_code);
      
      if (!row.props) row.props = {};
      row.props.original_category = row.primary_role_code;
      row.primary_role_code = mapped;
      
      console.log(`  → Mapped to: "${mapped}"`);
    }
  }
  
  // Set to null if empty to avoid foreign key constraint errors
  if (!row.primary_role_code || row.primary_role_code === '') {
    row.primary_role_code = null;
  }

  // Check for duplicate by domain using functional index
  if (row.domain) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('domain', row.domain)
      .maybeSingle();

    if (existing) {
      if (duplicateStrategy === 'skip') {
        return { type: 'skipped' };
      } else if (duplicateStrategy === 'update') {
        await supabase.from('clients').update(row).eq('id', existing.id);
        return { type: 'updated' };
      }
    }
  }

  // Fallback: check by normalized company name
  if (row.company_name) {
    const normalized = normalizeCompanyName(row.company_name);
    const { data: clients } = await supabase.from('clients').select('id, company_name');

    if (clients) {
      for (const client of clients) {
        if (normalizeCompanyName(client.company_name) === normalized) {
          if (duplicateStrategy === 'skip') {
            return { type: 'skipped' };
          } else if (duplicateStrategy === 'update') {
            await supabase.from('clients').update(row).eq('id', client.id);
            return { type: 'updated' };
          }
          break;
        }
      }
    }
  }

  const { data: insertedClient, error: insertError } = await supabase
    .from('clients')
    .insert(row)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Client insert failed:', insertError);
    throw new Error(`Failed to insert client: ${insertError.message}`);
  }

  console.log('✅ Client inserted successfully:', insertedClient?.id);
  return { type: 'inserted' };
}

/**
 * Process order row
 */
async function processOrder(
  supabase: any,
  row: Record<string, any>,
  source: string,
  duplicateStrategy: DuplicateStrategy,
  userId: string,
  autoLinkProperties: boolean,
  metrics: any
): Promise<{ type: 'inserted' | 'updated' | 'skipped' }> {
  // Set source
  if (source) {
    row.source = source;
  }

  // Set created_by and org_id (for tenant isolation)
  row.created_by = userId;
  row.org_id = userId; // org_id matches created_by for tenant boundary
  
  // Set defaults for optional fields
  if (!row.borrower_name || row.borrower_name.trim() === '') {
    row.borrower_name = 'Unknown Borrower';
  }
  
  // Normalize and set defaults for enum fields (must be lowercase)
  if (!row.property_type || row.property_type.trim() === '') {
    row.property_type = 'single_family';
  } else {
    row.property_type = String(row.property_type).toLowerCase().trim();
  }
  
  if (!row.order_type || row.order_type.trim() === '') {
    row.order_type = 'purchase';
  } else {
    row.order_type = String(row.order_type).toLowerCase().trim();
  }
  
  if (!row.status || row.status.trim() === '') {
    row.status = 'new';
  } else {
    row.status = String(row.status).toLowerCase().trim();
  }
  
  if (!row.priority || row.priority.trim() === '') {
    row.priority = 'normal';
  } else {
    row.priority = String(row.priority).toLowerCase().trim();
  }
  
  if (!row.fee_amount) {
    row.fee_amount = 0;
  }
  
  if (!row.ordered_date) {
    row.ordered_date = new Date().toISOString();
  }
  
  if (!row.due_date) {
    // Default to 14 days from order date
    const dueDate = new Date(row.ordered_date);
    dueDate.setDate(dueDate.getDate() + 14);
    row.due_date = dueDate.toISOString();
  }

  // Two-phase property upsert: Property → Order
  let propertyId: string | null = null;
  
  // Preserve any city/state/zip that came from direct CSV mappings
  const csvMappedCity = row.property_city?.trim();
  const csvMappedState = row.property_state?.trim();
  const csvMappedZip = row.property_zip?.trim();
  const csvMappedAddress = row.property_address?.trim();
  
  // Handle address parsing and property creation (only if auto-linking is enabled)
  if (autoLinkProperties) {
    // Check both row.props.original_address AND row['props.original_address'] (field mapping format)
    const originalAddress = row.props?.original_address || row['props.original_address'];
    
    if (originalAddress && !row.property_address) {
    try {
      console.log('🏠 Parsing address:', originalAddress);
      
      const addressParts = splitUSAddress(originalAddress);
      const { street, city, state, zip } = addressParts;
      
      console.log('🏠 Parsed address parts:', { street, city, state, zip });
      
      // Extract unit from street address
      const { street: streetNoUnit, unit, unitType } = extractUnit(street);
      
      // Set order snapshot address - prefer CSV-mapped values over parsed values
      row.property_address = csvMappedAddress || streetNoUnit;
      row.property_city = csvMappedCity || city;
      row.property_state = (csvMappedState || state).toUpperCase();
      row.property_zip = csvMappedZip || zip;
      
      // Move original address to props if it was in row level
      if (row['props.original_address']) {
        if (!row.props) row.props = {};
        row.props.original_address = row['props.original_address'];
        delete row['props.original_address'];
      }
      
      // Set default property_type if not provided
      if (!row.property_type) {
        row.property_type = 'single_family';
      }
      
      // Store unit in props if extracted (for backward compatibility)
      if (unit) {
        if (!row.props) row.props = {};
        row.props.unit = unit;
      }
      
      // Upsert property (building-level, no unit in identity)
      if (streetNoUnit && city && state && zip) {
        metrics.properties.link_attempted++;
        propertyId = await upsertPropertyForOrder(supabase, userId, {
          street: streetNoUnit,
          city,
          state: state.toUpperCase(),
          zip,
          type: row.property_type
        }, metrics);
        
        if (propertyId) {
          metrics.properties.linked++;
          metrics.properties.upserts++;
        } else {
          metrics.properties.unlinked++;
        }
      }
      
      // Create property_unit if unit extracted and should be created
      if (propertyId && unit && shouldCreateUnit(row.property_type, unit, row.props)) {
        try {
          const unitNorm = normalizeUnit(unit);
          if (unitNorm) {
            // Upsert property_unit (idempotent via unique index)
            const { data: propertyUnit, error: unitError } = await supabase
              .from('property_units')
              .upsert(
                {
                  property_id: propertyId,
                  unit_identifier: unit.trim(),
                  unit_norm: unitNorm,
                  unit_type: unitType || (row.property_type === 'condo' ? 'condo' : null),
                  props: {
                    imported_from: source,
                    imported_at: new Date().toISOString()
                  }
                },
                {
                  onConflict: 'property_id,unit_norm',
                  ignoreDuplicates: false
                }
              )
              .select('id')
              .single();

            if (!unitError && propertyUnit) {
              row.property_unit_id = propertyUnit.id;
              
              // Cache USPAP counts for both unit and building
              const { data: unitPriorWork } = await supabase
                .rpc('property_unit_prior_work_count', { _property_unit_id: propertyUnit.id });
              
              const { data: buildingPriorWork } = await supabase
                .rpc('property_building_prior_work_count', { _property_id: propertyId });
              
              if (!row.props.uspap) row.props.uspap = {};
              row.props.uspap.unit_prior_work_3y = unitPriorWork || 0;
              row.props.uspap.building_prior_work_3y = buildingPriorWork || 0;
              row.props.uspap.as_of = new Date().toISOString();
            }
          }
        } catch (unitCreateError) {
          console.warn('Failed to create property_unit:', unitCreateError);
          // Continue with import - unit creation failure shouldn't block the order
        }
      }
    } catch (error) {
      console.warn('Address parsing failed:', error);
      // Continue with import - address parsing failure shouldn't block the row
    }
    }
  }
  
  // NEW: Handle case where CSV provides address components directly (no original_address)
  // If we have CSV-mapped address components but didn't parse from original_address, use them
  if (!row.property_address && csvMappedAddress) {
    row.property_address = csvMappedAddress;
  }
  if (!row.property_city && csvMappedCity) {
    row.property_city = csvMappedCity;
  }
  if (!row.property_state && csvMappedState) {
    row.property_state = csvMappedState.toUpperCase();
  }
  if (!row.property_zip && csvMappedZip) {
    row.property_zip = csvMappedZip;
  }
  
  // Try to link property if we have all required address components from CSV
  if (autoLinkProperties && !propertyId && csvMappedAddress && csvMappedCity && csvMappedState && csvMappedZip) {
    metrics.properties.link_attempted++;
    propertyId = await upsertPropertyForOrder(supabase, userId, {
      street: csvMappedAddress,
      city: csvMappedCity,
      state: csvMappedState.toUpperCase(),
      zip: csvMappedZip,
      type: row.property_type || 'single_family'
    }, metrics);
    
    if (propertyId) {
      metrics.properties.linked++;
      metrics.properties.upserts++;
    } else {
      metrics.properties.unlinked++;
    }
  }
  
  // CRITICAL: Ensure address fields are never NULL (database constraint)
  // Use empty string as fallback to avoid NOT NULL constraint errors
  if (!row.property_address || row.property_address.trim() === '') {
    row.property_address = 'Unknown Address';
  }
  if (!row.property_city || row.property_city.trim() === '') {
    row.property_city = 'Unknown';
  }
  if (!row.property_state || row.property_state.trim() === '') {
    row.property_state = 'XX';
  }
  if (!row.property_zip || row.property_zip.trim() === '') {
    row.property_zip = '00000';
  }
  
  // Set property_id if we successfully created/linked a property
  if (propertyId) {
    row.property_id = propertyId;
  }

  // Derived status logic for Asana imports (no explicit STATUS column)
  if (source === 'asana' && !row.status) {
    const now = new Date();
    const completedAt = row.completed_date ? new Date(row.completed_date) : null;
    const inspectionDate = row.props?.inspection_date ? new Date(row.props.inspection_date) : null;
    const dueDate = row.due_date ? new Date(row.due_date) : null;
    
    if (completedAt) {
      row.status = 'completed';
    } else if (inspectionDate && inspectionDate < now) {
      row.status = 'in_progress';
    } else if (inspectionDate && inspectionDate >= now) {
      row.status = 'scheduled';
    } else if (dueDate) {
      row.status = 'assigned';
    } else {
      row.status = 'new';
    }
  }

  // Generate order_number if not provided
  if (!row.order_number) {
    const timestamp = Date.now();
    row.order_number = `ORD-${timestamp}`;
  }

  // Set total_amount if not provided
  if (!row.total_amount && row.fee_amount) {
    row.total_amount = row.fee_amount + (row.tech_fee || 0);
  }

  // Resolve client_id - REQUIRED for orders
  if (!row.client_id) {
    // Try Asana client resolution (in order of preference)
    if (row._client_name) {
      row.client_id = await resolveClientId(supabase, null, row._client_name);
    }
    
    if (!row.client_id && row._amc_client) {
      row.client_id = await resolveClientId(supabase, null, row._amc_client);
    }
    
    if (!row.client_id && row._lender_client) {
      row.client_id = await resolveClientId(supabase, null, row._lender_client);
    }
    
    // Clean up special fields
    delete row._client_name;
    delete row._amc_client;
    delete row._lender_client;
    
    // Try to infer from borrower email domain
    if (!row.client_id && row.borrower_email) {
      const domain = transformExtractDomain(row.borrower_email);
      if (domain) {
        const { data: clientByDomain } = await supabase
          .from('clients')
          .select('id')
          .eq('domain', domain)
          .maybeSingle();
        
        if (clientByDomain) {
          row.client_id = clientByDomain.id;
        }
      }
    }

    // Still no client? Try to get or create "Unassigned Orders" client
    if (!row.client_id) {
      const { data: unassignedClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_name', '[Unassigned Orders]')
        .maybeSingle();

      if (unassignedClient) {
        row.client_id = unassignedClient.id;
      } else {
        // Create the unassigned client
        const { data: newUnassigned, error: createError } = await supabase
          .from('clients')
          .insert({
            company_name: '[Unassigned Orders]',
            primary_contact: 'System',
            email: 'unassigned@system.local',
            phone: '000-000-0000',
            address: 'N/A',
            billing_address: 'N/A',
          })
          .select('id')
          .single();

        if (createError || !newUnassigned) {
          throw new Error('Unable to associate order with client. Please provide client information in mapping.');
        }
        
        row.client_id = newUnassigned.id;
      }

      // Log that this order needs manual client assignment
      if (!row.props) row.props = {};
      row.props.needs_client_assignment = true;
      row.props.unassigned_reason = 'No client information provided in import';
    }
  }

  // GUARD: Require external_id for idempotent imports
  // The unique constraint ignores NULL external_id by design (partial index)
  // Without external_id, we can't prevent duplicates on re-import
  if (!row.external_id || row.external_id.trim() === '') {
    console.warn('Order missing external_id, generating from order_number:', row.order_number);
    
    // Option 1: Use order_number as external_id if available
    if (row.order_number && row.order_number.trim() !== '') {
      row.external_id = `order-${row.order_number}`;
      console.log(`Generated external_id: ${row.external_id}`);
    } 
    // Option 2: Skip if no stable identifier available
    else {
      console.error('Order has no external_id or order_number - cannot ensure idempotency, skipping');
      throw new Error('Order requires either external_id or order_number for idempotent imports');
    }
  }

  // Ensure source is set (required for unique constraint with COALESCE)
  if (!row.source || row.source.trim() === '') {
    row.source = source || 'unknown';
  }

  // Check for duplicate by (org_id, source, external_id)
  if (row.external_id) {
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('org_id', userId)
      .eq('source', row.source)
      .eq('external_id', row.external_id)
      .maybeSingle();

    if (existing) {
      if (duplicateStrategy === 'skip') {
        return { type: 'skipped' };
      } else if (duplicateStrategy === 'update') {
        await supabase.from('orders').update(row).eq('id', existing.id);
        return { type: 'updated' };
      }
    }
  }

  // Check by order_number (only if external_id check didn't find a match)
  if (row.order_number) {
    const { data: existing, error: lookupError } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', row.order_number)
      .maybeSingle();

    if (!lookupError && existing) {
      console.log(`📋 Found duplicate order by order_number: ${row.order_number}`);
      
      if (duplicateStrategy === 'skip') {
        return { type: 'skipped' };
      } else if (duplicateStrategy === 'update') {
        const { error: updateError } = await supabase
          .from('orders')
          .update(row)
          .eq('id', existing.id);
        
        if (updateError) {
          throw new Error(`Failed to update order: ${updateError.message}`);
        }
        return { type: 'updated' };
      }
      // 'create' strategy falls through to insert new order anyway
    }
  }

  const { data: insertedOrder, error: insertError } = await supabase
    .from('orders')
    .insert(row)
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ Order insert failed:', insertError);
    throw new Error(`Failed to insert order: ${insertError.message}`);
  }
  
  console.log('✅ Order inserted successfully:', insertedOrder?.id);
  
  // USPAP cache: Update order with prior work count if property was linked
  if (propertyId) {
    try {
      const { data: prior } = await supabase.rpc('property_prior_work_count', { 
        _property_id: propertyId 
      });
      
      // Update the order with USPAP cache
      await supabase
        .from('orders')
        .update({
          props: {
            ...(row.props || {}),
            uspap: {
              prior_work_3y: prior ?? 0,
              as_of: new Date().toISOString()
            }
          }
        })
        .eq('external_id', row.external_id);
    } catch (error) {
      console.warn('USPAP cache update failed:', error);
      // Don't fail the import for USPAP cache issues
    }
  }
  
  return { type: 'inserted' };
}

/**
 * Upsert property for order (two-phase approach)
 * Creates building-level property and returns property_id
 */
async function upsertPropertyForOrder(
  supabase: any,
  orgId: string,
  addr: {
    street: string;
    city: string;
    state: string;
    zip: string;
    type?: string;
  },
  metrics: any
): Promise<string | null> {
  try {
    // Validate address if we have all required fields
    let validationResult = null;
    let standardizedAddress = addr;
    
    if (addr.street && addr.city && addr.state && addr.zip && addr.zip.length >= 5) {
      try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          validationResult = await validateAddressWithGoogle(
            addr.street,
            addr.city,
            addr.state,
            addr.zip,
            apiKey
          );
          
          // Use standardized address if validation succeeded
          if (validationResult.isValid && validationResult.standardized) {
            standardizedAddress = {
              street: validationResult.standardized.street,
              city: validationResult.standardized.city,
              state: validationResult.standardized.state,
              zip: validationResult.standardized.zip,
              type: addr.type
            };
          }
          
          // Track validation results
          if (validationResult.isValid) {
            metrics.address_validation.verified++;
          } else if (validationResult.isPartial) {
            metrics.address_validation.partial++;
          } else {
            metrics.address_validation.failed++;
          }
        }
      } catch (validationError) {
        console.warn('Address validation failed during import:', validationError);
        metrics.address_validation.unavailable++;
        // Continue with original address if validation fails
      }
    }

    // Use standardized address for hash calculation
    const addr_hash = normalizeAddressKey(
      standardizedAddress.street, 
      standardizedAddress.city, 
      standardizedAddress.state, 
      standardizedAddress.zip
    );
    
    const propertyData: any = {
      org_id: orgId,
      address_line1: standardizedAddress.street,
      city: standardizedAddress.city,
      state: (standardizedAddress.state || '').toUpperCase(),
      postal_code: (standardizedAddress.zip || '').slice(0, 5),
      property_type: standardizedAddress.type || 'single_family',
      addr_hash
    };

    // Add validation metadata if available
    if (validationResult) {
      propertyData.validation_status = validationResult.isValid ? 'verified' : 'partial';
      propertyData.verified_at = new Date().toISOString();
      propertyData.verification_source = 'google';
      
      if (validationResult.standardized) {
        propertyData.zip4 = validationResult.standardized.zip4;
        propertyData.county = validationResult.standardized.county;
        propertyData.latitude = validationResult.standardized.latitude;
        propertyData.longitude = validationResult.standardized.longitude;
      }
      
      if (validationResult.metadata) {
        propertyData.dpv_code = validationResult.metadata.dpvCode;
      }
    }
    
    const { data, error } = await supabase
      .from('properties')
      .upsert(propertyData, { onConflict: 'org_id,addr_hash' })
      .select()
      .single();

    if (error) {
      console.error('Property upsert error:', error);
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    console.error('Property upsert failed:', error);
    return null;
  }
}

/**
 * Resolve client_id from domain or company name
 */
async function resolveClientId(
  supabase: any,
  domain: string | null,
  companyName: string | null
): Promise<string | null> {
  // Try domain match first
  if (domain) {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .ilike('domain', domain)
      .single();

    if (client) return client.id;
  }

  // Try company name match
  if (companyName) {
    const normalized = normalizeCompanyName(companyName);
    const { data: clients } = await supabase.from('clients').select('id, company_name');

    if (clients) {
      for (const client of clients) {
        if (normalizeCompanyName(client.company_name) === normalized) {
          return client.id;
        }
      }
    }
  }

  return null;
}




