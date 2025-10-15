import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeCard } from '@/lib/agent/executor';

export const maxDuration = 30;

/**
 * POST /api/agent/execute-card
 * Execute a single approved kanban card
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get card ID from request
    const body = await request.json();
    const { cardId } = body;

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Verify card belongs to user's org
    const { data: card, error: cardError } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('id', cardId)
      .eq('org_id', user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Execute the card
    console.log(`Executing card ${cardId} for user ${user.id}`);
    const result = await executeCard(cardId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 400 }
      );
    }

    // Update run stats if this was an email
    if (card.type === 'send_email' && card.run_id) {
      // Try to increment via RPC, fallback to manual update
      try {
        await supabase.rpc('increment_run_sent', { run_id: card.run_id });
      } catch (rpcError) {
        // Fallback: manual increment
        const { data: run } = await supabase
          .from('agent_runs')
          .select('sent')
          .eq('id', card.run_id)
          .single();

        if (run) {
          await supabase
            .from('agent_runs')
            .update({ sent: (run.sent || 0) + 1 })
            .eq('id', card.run_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Card execution failed:', error);
    return NextResponse.json(
      { error: error.message || 'Card execution failed' },
      { status: 500 }
    );
  }
}


