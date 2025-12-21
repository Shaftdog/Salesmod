/**
 * Order Notes API Routes
 * GET    /api/orders/[id]/notes - List notes
 * POST   /api/orders/[id]/notes - Create note
 * DELETE /api/orders/[id]/notes?noteId=xxx - Delete a note
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  handleApiError,
  getAuthenticatedContext,
  successResponse,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@/lib/errors/api-errors';
import { sanitizeText } from '@/lib/utils/sanitize';
import { withRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter';
import { logNoteAdded } from '@/lib/services/order-activities';

export const dynamic = 'force-dynamic';

// =============================================
// GET /api/orders/[id]/notes - List notes
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { tenantId } = await getAuthenticatedContext(supabase);
    const { id: orderId } = await params;

    // Fetch notes for this order with creator info
    const { data: notes, error } = await supabase
      .from('order_notes')
      .select(`
        id,
        order_id,
        note,
        note_type,
        is_internal,
        created_at,
        created_by_id,
        creator:profiles(id, name, email)
      `)
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }

    return successResponse(notes || []);
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// POST /api/orders/[id]/notes - Create note
// =============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { orgId: userId, tenantId } = await getAuthenticatedContext(supabase);
    const { id: orderId } = await params;

    // Rate limit: 20 requests per minute for write operations
    withRateLimit(userId, {
      ...RateLimitPresets.write,
      endpoint: 'orders/notes/POST',
    });

    // Get user profile for the name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

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

    // Parse request body
    const body = await request.json();
    const { note, note_type = 'general', is_internal = false } = body;

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      throw new BadRequestError('Note content is required');
    }

    // Validate maximum length to prevent XSS and storage abuse
    if (note.trim().length > 10000) {
      throw new BadRequestError('Note content exceeds maximum length of 10,000 characters');
    }

    // Validate note_type
    const validNoteTypes = ['general', 'phone', 'email', 'meeting', 'issue'];
    if (!validNoteTypes.includes(note_type)) {
      throw new BadRequestError(`Invalid note type. Must be one of: ${validNoteTypes.join(', ')}`);
    }

    // Insert note record with sanitized content
    const { data: newNote, error: insertError } = await supabase
      .from('order_notes')
      .insert({
        tenant_id: tenantId,
        order_id: orderId,
        note: sanitizeText(note.trim()),
        note_type,
        is_internal,
        created_by_id: userId,
      })
      .select(`
        id,
        order_id,
        note,
        note_type,
        is_internal,
        created_at,
        created_by_id,
        creator:profiles(id, name, email)
      `)
      .single();

    if (insertError) {
      console.error('Error creating note:', insertError);
      throw insertError;
    }

    // Log activity for the note creation
    await logNoteAdded(
      supabase,
      orderId,
      tenantId,
      note_type,
      userId,
      profile?.name || 'Unknown'
    );

    return successResponse(newNote, 'Note created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================================
// DELETE /api/orders/[id]/notes?noteId=xxx
// =============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { orgId: userId, tenantId } = await getAuthenticatedContext(supabase);
    const { id: orderId } = await params;

    // Rate limit: 20 requests per minute for write operations
    withRateLimit(userId, {
      ...RateLimitPresets.write,
      endpoint: 'orders/notes/DELETE',
    });

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      throw new BadRequestError('noteId is required');
    }

    // Fetch note to verify ownership and check authorization
    const { data: note, error: fetchError } = await supabase
      .from('order_notes')
      .select('id, created_by_id, order_id, tenant_id')
      .eq('id', noteId)
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !note) {
      throw new NotFoundError('Note');
    }

    // Get user's role for authorization check
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const userRole = userProfile?.role || 'user';

    // Authorization: user must be the creator OR have admin/owner role
    const isCreator = note.created_by_id === userId;
    const isAdmin = userRole === 'admin' || userRole === 'owner';

    if (!isCreator && !isAdmin) {
      throw new ForbiddenError('You do not have permission to delete this note');
    }

    // Atomic delete with select to verify what was deleted
    const { data: deletedNote, error: deleteError } = await supabase
      .from('order_notes')
      .delete()
      .eq('id', noteId)
      .eq('tenant_id', tenantId) // Extra safety check
      .select('id')
      .single();

    if (deleteError) {
      console.error('Error deleting note:', deleteError);
      throw deleteError;
    }

    if (!deletedNote) {
      throw new NotFoundError('Note');
    }

    return successResponse({ id: noteId }, 'Note deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
