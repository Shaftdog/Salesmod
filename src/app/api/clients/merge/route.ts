import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mergeClients, findDuplicateClients } from '@/lib/clients-merge';
import { z } from 'zod';

// Validation schemas
const mergeClientsSchema = z.object({
  winnerId: z.string().uuid('Invalid winner ID format'),
  loserId: z.string().uuid('Invalid loser ID format')
}).refine(data => data.winnerId !== data.loserId, {
  message: 'Cannot merge client with itself'
});

const limitSchema = z.number().int().min(1).max(100);

/**
 * GET /api/clients/merge
 * Find potential duplicate clients in the organization
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

    const duplicates = await findDuplicateClients(supabase, user.id, limit);

    return NextResponse.json({
      duplicates,
      count: duplicates.length
    });
  } catch (error: any) {
    console.error('Find duplicate clients error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find duplicate clients' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/merge
 * Merge two clients into one
 *
 * Body:
 * - winnerId: string (UUID) - Client to keep
 * - loserId: string (UUID) - Client to delete
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
    const validationResult = mergeClientsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { winnerId, loserId } = validationResult.data;

    // Verify both clients exist and belong to user's org
    const { data: winner, error: winnerError } = await supabase
      .from('clients')
      .select('id, org_id')
      .eq('id', winnerId)
      .single();

    const { data: loser, error: loserError } = await supabase
      .from('clients')
      .select('id, org_id')
      .eq('id', loserId)
      .single();

    if (winnerError || loserError || !winner || !loser) {
      return NextResponse.json(
        { error: 'One or both clients not found' },
        { status: 404 }
      );
    }

    // Check org access
    if (winner.org_id !== user.id || loser.org_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to clients' },
        { status: 403 }
      );
    }

    // Perform merge
    const result = await mergeClients(supabase, winnerId, loserId);

    return NextResponse.json({
      success: true,
      message: 'Clients merged successfully',
      result
    });
  } catch (error: any) {
    console.error('Client merge error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge clients' },
      { status: 500 }
    );
  }
}
