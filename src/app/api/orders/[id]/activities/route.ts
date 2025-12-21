/**
 * Order Activities API Routes
 * GET  /api/orders/[id]/activities - Get order activity timeline
 * POST /api/orders/[id]/activities - Log a custom activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedContext,
  successResponse,
  NotFoundError,
  BadRequestError,
} from '@/lib/errors/api-errors';
import { sanitizeText } from '@/lib/utils/sanitize';
import { z } from 'zod';

// Maximum allowed pagination limit to prevent memory exhaustion
const MAX_LIMIT = 100;

export const dynamic = 'force-dynamic';

// Schema for creating custom activities
const createActivitySchema = z.object({
  activity_type: z.enum([
    'note_added',
    'note_updated',
    'revision_requested',
    'correction_requested',
    'custom',
  ]),
  description: z.string().min(1).max(500),
  metadata: z.record(z.unknown()).optional(),
});

// =============================================
// GET /api/orders/[id]/activities - Get timeline
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { tenantId } = await getAuthenticatedContext(supabase);
    const { id: orderId } = await params;

    // Get query params for pagination with limit cap
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), MAX_LIMIT);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // Verify order exists and belongs to tenant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderError || !order) {
      throw new NotFoundError('Order');
    }

    // Fetch activities with pagination
    const { data: activities, error, count } = await supabase
      .from('order_activities')
      .select(`
        id,
        activity_type,
        description,
        metadata,
        performed_by,
        performed_by_name,
        is_system,
        created_at
      `, { count: 'exact' })
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }

    return successResponse({
      activities: activities || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/orders/[id]/activities - Log activity
// =============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { orgId, tenantId } = await getAuthenticatedContext(supabase);
    const { id: orderId } = await params;

    // Get user profile for the name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', orgId)
      .single();

    // Parse and validate body
    const body = await request.json();
    const { activity_type, description, metadata } = createActivitySchema.parse(body);

    // Verify order exists and belongs to tenant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderError || !order) {
      throw new NotFoundError('Order');
    }

    // Insert the activity with sanitized description
    const { data: activity, error: insertError } = await supabase
      .from('order_activities')
      .insert({
        tenant_id: tenantId,
        order_id: orderId,
        activity_type,
        description: sanitizeText(description),
        metadata: metadata || {},
        performed_by: orgId,
        performed_by_name: profile?.name || 'Unknown',
        is_system: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting activity:', insertError);
      throw insertError;
    }

    return successResponse(activity, 'Activity logged successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
