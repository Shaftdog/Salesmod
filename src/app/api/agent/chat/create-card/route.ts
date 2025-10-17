import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/agent/chat/create-card
 * Create a card from chat conversation
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
    const { type, clientId, title, rationale, priority, emailDraft, taskDetails } = body;

    if (!type || !clientId || !title || !rationale) {
      return NextResponse.json(
        { error: 'Missing required fields: type, clientId, title, rationale' },
        { status: 400 }
      );
    }

    // Build action payload
    let actionPayload: any = {};
    if (emailDraft) {
      actionPayload = emailDraft;
    } else if (taskDetails) {
      actionPayload = taskDetails;
    }

    const { data, error } = await supabase
      .from('kanban_cards')
      .insert({
        org_id: user.id,
        client_id: clientId,
        type,
        title,
        rationale,
        priority: priority || 'medium',
        state: 'suggested',
        action_payload: actionPayload,
        created_by: user.id, // User created via chat
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      card: {
        id: data.id,
        title: data.title,
        type: data.type,
        state: data.state,
      },
    });
  } catch (error: any) {
    console.error('Card creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create card' },
      { status: 500 }
    );
  }
}

