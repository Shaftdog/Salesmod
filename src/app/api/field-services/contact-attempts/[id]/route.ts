import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getApiContext, handleApiError, ApiError, requireAdmin } from '@/lib/api-utils';
import { z } from 'zod';

/**
 * Validation schema for updating contact attempts
 */
const updateContactAttemptSchema = z.object({
  outcome: z.enum([
    'connected',
    'no_answer',
    'voicemail',
    'wrong_number',
    'busy',
    'email_sent',
    'email_bounced',
    'sms_sent',
    'sms_failed',
    'scheduled',
    'declined',
    'callback_requested',
  ]).optional(),
  callbackRequestedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/field-services/contact-attempts/[id]
 * Get a single contact attempt by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;
    const { id } = await params;

    const { data: attempt, error } = await supabase
      .from('contact_attempts')
      .select(`
        *,
        order:orders!order_id (*),
        booking:bookings!booking_id (*),
        property:properties!property_id (*),
        attemptedByProfile:profiles!attempted_by (id, name, email, avatar_url)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !attempt) {
      throw new ApiError('Contact attempt not found', 404, 'CONTACT_ATTEMPT_NOT_FOUND');
    }

    return NextResponse.json({ contactAttempt: attempt });

  } catch (error: any) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/field-services/contact-attempts/[id]
 * Update a contact attempt
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validated = updateContactAttemptSchema.parse(body);

    // Verify the contact attempt exists and belongs to this org
    const { data: existing, error: fetchError } = await supabase
      .from('contact_attempts')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !existing) {
      throw new ApiError('Contact attempt not found', 404, 'CONTACT_ATTEMPT_NOT_FOUND');
    }

    // Update the contact attempt
    const { data: attempt, error: updateError } = await supabase
      .from('contact_attempts')
      .update({
        outcome: validated.outcome,
        callback_requested_at: validated.callbackRequestedAt,
        notes: validated.notes,
        duration_seconds: validated.durationSeconds,
        metadata: validated.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select(`
        *,
        order:orders!order_id (*),
        booking:bookings!booking_id (*),
        property:properties!property_id (*),
        attemptedByProfile:profiles!attempted_by (id, name, email, avatar_url)
      `)
      .single();

    if (updateError) {
      console.error('Contact attempt update error:', updateError);
      return NextResponse.json({ error: 'Failed to update contact attempt' }, { status: 500 });
    }

    return NextResponse.json({
      contactAttempt: attempt,
      message: 'Contact attempt updated successfully',
    });

  } catch (error: any) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/field-services/contact-attempts/[id]
 * Delete a contact attempt (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;
    const { id } = await params;

    // Require admin permissions
    await requireAdmin(context);

    // Verify the contact attempt exists and belongs to this org
    const { data: existing, error: fetchError } = await supabase
      .from('contact_attempts')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !existing) {
      throw new ApiError('Contact attempt not found', 404, 'CONTACT_ATTEMPT_NOT_FOUND');
    }

    // Delete the contact attempt
    const { error: deleteError } = await supabase
      .from('contact_attempts')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (deleteError) {
      console.error('Contact attempt delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete contact attempt' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Contact attempt deleted successfully',
    });

  } catch (error: any) {
    return handleApiError(error);
  }
}
