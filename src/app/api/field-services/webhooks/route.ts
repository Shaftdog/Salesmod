import { NextRequest } from 'next/server';
import {
  getApiContext,
  handleApiError,
  successResponse,
  createdResponse,
  getPaginationParams,
  buildPaginatedResponse,
  createAuditLog,
} from '@/lib/api-utils';
import { createWebhookSchema } from '@/lib/validations/field-services';

/**
 * GET /api/field-services/webhooks
 * List webhooks
 *
 * POST /api/field-services/webhooks
 * Create webhook
 *
 * Phase 7: Integration & API Development
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;

    const pagination = getPaginationParams(request);

    // Count total
    const { count } = await supabase
      .from('webhooks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Fetch data
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;

    return successResponse(
      buildPaginatedResponse(webhooks, count || 0, pagination)
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId, userId } = context;

    const body = await request.json();
    const validated = createWebhookSchema.parse(body);

    // CRITICAL-3: Encrypt webhook secret key
    let encryptedSecret = validated.secretKey;

    if (validated.secretKey) {
      // Try to use database encryption function
      const { data: encryptResult, error: encryptError } = await supabase
        .rpc('encrypt_sensitive_data', { data: validated.secretKey });

      if (encryptError || !encryptResult) {
        console.warn('Database encryption not available, using hash fallback');
        // Fallback: Hash the secret (one-way, but better than plaintext)
        const crypto = await import('crypto');
        encryptedSecret = crypto.createHash('sha256').update(validated.secretKey).digest('hex');
      } else {
        encryptedSecret = encryptResult;
      }
    }

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert({
        org_id: orgId,
        webhook_name: validated.name,
        target_url: validated.targetUrl,
        event_types: validated.eventTypes,
        is_active: validated.isActive,
        secret_key: encryptedSecret,
        auth_header_name: validated.authHeaderName,
        auth_header_value: validated.authHeaderValue,
        retry_count: validated.retryCount,
        timeout_seconds: validated.timeoutSeconds,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await createAuditLog(
      context,
      'webhook.created',
      'webhook',
      webhook.id,
      undefined,
      { name: validated.name, event_types: validated.eventTypes },
      'info'
    );

    return createdResponse({ webhook }, 'Webhook created successfully');
  } catch (error: any) {
    return handleApiError(error);
  }
}
