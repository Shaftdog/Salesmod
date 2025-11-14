import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mergeContacts, findDuplicateContacts } from '@/lib/contacts-merge';
import { z } from 'zod';

// Validation schemas
const mergeContactsSchema = z.object({
  winnerId: z.string().uuid('Invalid winner ID format'),
  loserId: z.string().uuid('Invalid loser ID format')
}).refine(data => data.winnerId !== data.loserId, {
  message: 'Cannot merge contact with itself'
});

const limitSchema = z.number().int().min(1).max(100);

/**
 * GET /api/contacts/merge
 * Find potential duplicate contacts in the organization
 *
 * Query params:
 * - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '50');

    // Validate and clamp limit
    const limitResult = limitSchema.safeParse(rawLimit);
    const limit = limitResult.success ? limitResult.data : 50;

    const duplicates = await findDuplicateContacts(supabase, user.id, limit);

    return NextResponse.json({
      duplicates,
      count: duplicates.length
    });
  } catch (error: any) {
    console.error('Find duplicate contacts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find duplicate contacts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts/merge
 * Merge two contacts into one
 *
 * Body:
 * - winnerId: string (UUID) - Contact to keep
 * - loserId: string (UUID) - Contact to delete
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate inputs with Zod
    const validationResult = mergeContactsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { winnerId, loserId } = validationResult.data;

    // Verify both contacts exist and belong to user's org
    const { data: winner, error: winnerError } = await supabase
      .from('contacts')
      .select('id, client_id, clients!inner(org_id)')
      .eq('id', winnerId)
      .single();

    const { data: loser, error: loserError } = await supabase
      .from('contacts')
      .select('id, client_id, clients!inner(org_id)')
      .eq('id', loserId)
      .single();

    if (winnerError || loserError || !winner || !loser) {
      return NextResponse.json(
        { error: 'One or both contacts not found' },
        { status: 404 }
      );
    }

    // Check org access - safely access nested client data
    const winnerOrgId = winner.clients && typeof winner.clients === 'object' && 'org_id' in winner.clients
      ? (winner.clients as { org_id: string }).org_id
      : null;
    const loserOrgId = loser.clients && typeof loser.clients === 'object' && 'org_id' in loser.clients
      ? (loser.clients as { org_id: string }).org_id
      : null;

    if (winnerOrgId !== user.id || loserOrgId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to contacts' },
        { status: 403 }
      );
    }

    // Perform merge
    const result = await mergeContacts(supabase, winnerId, loserId);

    return NextResponse.json({
      success: true,
      message: 'Contacts merged successfully',
      result
    });
  } catch (error: any) {
    console.error('Contact merge error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge contacts' },
      { status: 500 }
    );
  }
}
