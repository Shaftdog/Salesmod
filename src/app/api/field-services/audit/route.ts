import { NextRequest } from 'next/server';
import {
  getApiContext,
  handleApiError,
  requireAdmin,
  successResponse,
  getPaginationParams,
  buildPaginatedResponse,
  applyFilters,
} from '@/lib/api-utils';
import { getAuditLogsSchema } from '@/lib/validations/field-services';

/**
 * GET /api/field-services/audit
 * Get audit logs (admin only)
 *
 * Phase 8: Advanced Features & Polish
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;

    // Check admin role
    await requireAdmin(context);

    const { searchParams } = new URL(request.url);
    const validated = getAuditLogsSchema.parse({
      userId: searchParams.get('userId') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      action: searchParams.get('action') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const pagination = getPaginationParams(request);

    // Count total
    let countQuery = supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    countQuery = applyFilters(countQuery, {
      user_id: validated.userId,
      entity_type: validated.entityType,
      action: validated.action,
    });

    const { count } = await countQuery;

    // Fetch data
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    query = applyFilters(query, {
      user_id: validated.userId,
      entity_type: validated.entityType,
      action: validated.action,
    });

    const { data: logs, error } = await query;

    if (error) throw error;

    return successResponse(
      buildPaginatedResponse(logs, count || 0, pagination)
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
