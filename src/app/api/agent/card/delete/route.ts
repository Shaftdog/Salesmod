import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/agent/card/delete
 * Delete a specific card by ID
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
    }

    console.log(`[Delete] Attempting to delete card: ${cardId}`);

    // Get card info before deleting
    const { data: card } = await supabase
      .from('kanban_cards')
      .select('id, title, type, state, client:clients(company_name)')
      .eq('id', cardId)
      .eq('org_id', user.id)
      .single();

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Delete the card
    const { error: deleteError } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', cardId)
      .eq('org_id', user.id);

    if (deleteError) {
      console.error('[Delete] Database error:', deleteError);
      throw deleteError;
    }

    console.log(`[Delete] ✓ Successfully deleted: ${card.title}`);

    return NextResponse.json({
      success: true,
      deleted: {
        id: card.id,
        title: card.title,
        type: card.type,
        client: card.client?.company_name,
      },
    });
  } catch (error: any) {
    console.error('[Delete] Failed:', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}

