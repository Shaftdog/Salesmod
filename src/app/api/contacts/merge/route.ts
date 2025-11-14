import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mergeContacts, findDuplicateContacts } from '@/lib/contacts-merge';

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
    const limit = parseInt(searchParams.get('limit') || '50');

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
    const { winnerId, loserId } = body;

    // Validate inputs
    if (!winnerId || !loserId) {
      return NextResponse.json(
        { error: 'Missing required fields: winnerId, loserId' },
        { status: 400 }
      );
    }

    if (winnerId === loserId) {
      return NextResponse.json(
        { error: 'Cannot merge contact with itself' },
        { status: 400 }
      );
    }

    // Verify both contacts exist and belong to user's org
    const { data: winner } = await supabase
      .from('contacts')
      .select('id, client_id, clients!inner(org_id)')
      .eq('id', winnerId)
      .single();

    const { data: loser } = await supabase
      .from('contacts')
      .select('id, client_id, clients!inner(org_id)')
      .eq('id', loserId)
      .single();

    if (!winner || !loser) {
      return NextResponse.json(
        { error: 'One or both contacts not found' },
        { status: 404 }
      );
    }

    // Check org access
    if ((winner as any).clients?.org_id !== user.id || (loser as any).clients?.org_id !== user.id) {
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
