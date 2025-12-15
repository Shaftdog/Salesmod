import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Gets processed Gmail messages with their card info
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile with tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'No tenant assigned' }, { status: 403 });
    }

    // Get gmail messages with card info
    const { data: messages, error: messagesError, count } = await supabase
      .from('gmail_messages')
      .select(`
        id,
        gmail_message_id,
        gmail_thread_id,
        from_email,
        from_name,
        subject,
        snippet,
        category,
        confidence,
        received_at,
        processed_at,
        card_id,
        is_read
      `, { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Get card details for messages that have cards
    const cardIds = messages
      ?.filter(m => m.card_id)
      .map(m => m.card_id) || [];

    let cardMap: Record<string, any> = {};

    if (cardIds.length > 0) {
      const { data: cards } = await supabase
        .from('kanban_cards')
        .select('id, type, state, title, priority')
        .in('id', cardIds);

      if (cards) {
        cardMap = cards.reduce((acc, card) => {
          acc[card.id] = card;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Combine messages with card info
    const enrichedMessages = messages?.map(msg => ({
      id: msg.id,
      gmailMessageId: msg.gmail_message_id,
      threadId: msg.gmail_thread_id,
      from: {
        email: msg.from_email,
        name: msg.from_name,
      },
      subject: msg.subject,
      snippet: msg.snippet,
      category: msg.category,
      confidence: msg.confidence,
      receivedAt: msg.received_at,
      processedAt: msg.processed_at,
      isRead: msg.is_read,
      card: msg.card_id ? cardMap[msg.card_id] || null : null,
    })) || [];

    return NextResponse.json({
      messages: enrichedMessages,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Gmail messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}
