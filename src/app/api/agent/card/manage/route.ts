import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/agent/card/manage
 * Unified endpoint for card management from chat
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

    const body = await request.json();
    const { action, cardId, updates, cardData } = body;

    let result: any = {};

    switch (action) {
      case 'create':
        // Create new card
        const { data: newCard, error: createError } = await supabase
          .from('kanban_cards')
          .insert({
            org_id: user.id,
            client_id: cardData.clientId,
            type: cardData.type,
            title: cardData.title,
            description: cardData.description,
            rationale: cardData.rationale,
            priority: cardData.priority || 'medium',
            state: 'suggested',
            action_payload: cardData.actionPayload || {},
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        
        result = {
          success: true,
          action: 'created',
          card: newCard,
          message: `Created ${cardData.type} card: ${cardData.title}`,
        };
        break;

      case 'update':
        // Update existing card
        const { data: updatedCard, error: updateError } = await supabase
          .from('kanban_cards')
          .update(updates)
          .eq('id', cardId)
          .eq('org_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        result = {
          success: true,
          action: 'updated',
          card: updatedCard,
          message: `Updated card: ${updatedCard.title}`,
        };
        break;

      case 'delete':
        // Delete card
        const { error: deleteError } = await supabase
          .from('kanban_cards')
          .delete()
          .eq('id', cardId)
          .eq('org_id', user.id);

        if (deleteError) throw deleteError;

        result = {
          success: true,
          action: 'deleted',
          cardId,
          message: `Deleted card ${cardId}`,
        };
        break;

      case 'approve':
        // Approve card
        const { data: approvedCard, error: approveError } = await supabase
          .from('kanban_cards')
          .update({ state: 'approved' })
          .eq('id', cardId)
          .eq('org_id', user.id)
          .select()
          .single();

        if (approveError) throw approveError;

        result = {
          success: true,
          action: 'approved',
          card: approvedCard,
          message: `Approved card: ${approvedCard.title}`,
        };
        break;

      case 'reject':
        // Reject card
        const { data: rejectedCard, error: rejectError } = await supabase
          .from('kanban_cards')
          .update({ state: 'rejected' })
          .eq('id', cardId)
          .eq('org_id', user.id)
          .select()
          .single();

        if (rejectError) throw rejectError;

        result = {
          success: true,
          action: 'rejected',
          card: rejectedCard,
          message: `Rejected card: ${rejectedCard.title}`,
        };
        break;

      case 'execute':
        // Execute card (import executor)
        const { executeCard } = await import('@/lib/agent/executor');
        const execResult = await executeCard(cardId);

        result = {
          success: execResult.success,
          action: 'executed',
          message: execResult.message,
          metadata: execResult.metadata,
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Card management failed:', error);
    return NextResponse.json(
      { error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}

