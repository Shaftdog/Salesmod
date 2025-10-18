import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import {
  FieldMapping,
  DuplicateStrategy,
  MigrationTotals,
} from '@/lib/migrations/types';
import { applyTransform, generateHash, normalizeCompanyName, transformExtractDomain } from '@/lib/migrations/transforms';

const BATCH_SIZE = 500;

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
    } = body as {
      fileData: string;
      fileHash: string;
      mappings: FieldMapping[];
      entity: 'contacts' | 'clients' | 'orders';
      source: string;
      duplicateStrategy: DuplicateStrategy;
    };

    if (!fileData || !mappings || !entity) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Generate idempotency key
    const mappingHash = generateHash(JSON.stringify(mappings));
    const idempotencyKey = `${mappingHash}_${fileHash}`;

    // Check for existing job with same idempotency key
    const { data: existingJob } = await supabase
      .from('migration_jobs')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .eq('user_id', user.id)
      .single();

    if (existingJob && existingJob.status !== 'failed') {
      return NextResponse.json({
        jobId: existingJob.id,
        message: 'Job already exists or is in progress',
      });
    }

    // Create migration job
    const { data: job, error: jobError } = await supabase
      .from('migration_jobs')
      .insert({
        user_id: user.id,
        source,
        entity,
        mode: 'csv',
        status: 'pending',
        mapping: mappings,
        idempotency_key: idempotencyKey,
        totals: { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Error creating migration job:', jobError);
      return NextResponse.json({ error: 'Failed to create migration job' }, { status: 500 });
    }

    // Start processing in background (no await)
    processMigration(job.id, fileData, mappings, entity, source, duplicateStrategy, user.id).catch(
      (error) => {
        console.error('Migration processing error:', error);
      }
    );

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
 */
async function processMigration(
  jobId: string,
  fileData: string,
  mappings: FieldMapping[],
  entity: 'contacts' | 'clients' | 'orders',
  source: string,
  duplicateStrategy: DuplicateStrategy,
  userId: string
) {
  const supabase = await createClient();

  try {
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
    const totals: MigrationTotals = {
      total: rows.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    // Build mapping lookup
    const mappingLookup = new Map<string, FieldMapping>();
    mappings.forEach((m) => {
      if (m.targetField && m.targetField !== '') {
        mappingLookup.set(m.sourceColumn, m);
      }
    });

    // Process in batches
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));

      for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
        const rowIndex = i + batchIndex;
        const row = batch[batchIndex];

        try {
          const result = await processRow(
            supabase,
            row,
            mappingLookup,
            entity,
            source,
            duplicateStrategy,
            userId
          );

          if (result.type === 'inserted') totals.inserted++;
          else if (result.type === 'updated') totals.updated++;
          else if (result.type === 'skipped') totals.skipped++;
        } catch (error: any) {
          totals.errors++;

          // Log error
          await supabase.from('migration_errors').insert({
            job_id: jobId,
            row_index: rowIndex + 2, // +2 for header and 1-based index
            raw_data: row,
            error_message: error.message || 'Unknown error',
            field: error.field || null,
          });
        }
      }

      // Update totals after each batch
      await supabase
        .from('migration_jobs')
        .update({ totals })
        .eq('id', jobId);
    }

    // Mark job as completed
    await supabase
      .from('migration_jobs')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        totals,
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
  userId: string
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
      mapping.transformParams
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
      return await processClient(supabase, transformedRow, source, duplicateStrategy);
    case 'orders':
      return await processOrder(supabase, transformedRow, source, duplicateStrategy, userId);
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
  // Resolve client_id
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

  if (!clientId) {
    throw new Error('Unable to resolve client for contact');
  }

  row.client_id = clientId;

  // Check for duplicate
  if (row.email) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .ilike('email', row.email)
      .single();

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

  await supabase.from('contacts').insert(row);
  return { type: 'inserted' };
}

/**
 * Process client row
 */
async function processClient(
  supabase: any,
  row: Record<string, any>,
  source: string,
  duplicateStrategy: DuplicateStrategy
): Promise<{ type: 'inserted' | 'updated' | 'skipped' }> {
  // Set source if provided
  if (source && !row.source) {
    row.props = { ...(row.props || {}), import_source: source };
  }

  // Check for duplicate by domain
  if (row.domain) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .ilike('domain', row.domain)
      .single();

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

  await supabase.from('clients').insert(row);
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
  userId: string
): Promise<{ type: 'inserted' | 'updated' | 'skipped' }> {
  // Set source
  if (source) {
    row.source = source;
  }

  // Set created_by
  row.created_by = userId;

  // Generate order_number if not provided
  if (!row.order_number) {
    const timestamp = Date.now();
    row.order_number = `ORD-${timestamp}`;
  }

  // Set total_amount if not provided
  if (!row.total_amount && row.fee_amount) {
    row.total_amount = row.fee_amount + (row.tech_fee || 0);
  }

  // For now, associate with first available client (in production, you'd need better logic)
  if (!row.client_id) {
    const { data: firstClient } = await supabase
      .from('clients')
      .select('id')
      .limit(1)
      .single();

    if (firstClient) {
      row.client_id = firstClient.id;
    } else {
      throw new Error('No clients available to associate order with');
    }
  }

  // Check for duplicate by external_id
  if (row.external_id) {
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('external_id', row.external_id)
      .single();

    if (existing) {
      if (duplicateStrategy === 'skip') {
        return { type: 'skipped' };
      } else if (duplicateStrategy === 'update') {
        await supabase.from('orders').update(row).eq('id', existing.id);
        return { type: 'updated' };
      }
    }
  }

  // Check by order_number
  if (row.order_number) {
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', row.order_number)
      .single();

    if (existing) {
      if (duplicateStrategy === 'skip') {
        return { type: 'skipped' };
      } else if (duplicateStrategy === 'update') {
        await supabase.from('orders').update(row).eq('id', existing.id);
        return { type: 'updated' };
      }
    }
  }

  await supabase.from('orders').insert(row);
  return { type: 'inserted' };
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

