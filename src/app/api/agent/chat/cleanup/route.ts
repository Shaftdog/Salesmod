import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { indexChatConversations } from '@/lib/agent/rag';

export const maxDuration = 60;

/**
 * POST /api/agent/chat/cleanup
 * Cleanup expired chats and preserve important context
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

    const results: any = {
      cleaned: 0,
      preserved: 0,
      indexed: 0,
      errors: [],
    };

    // Step 1: Preserve recent conversations to agent_memories
    try {
      console.log('[Cleanup] Preserving conversation context...');
      const { data, error } = await supabase.rpc('preserve_chat_context', {
        p_org_id: user.id,
        p_days_back: 1,
      });

      if (error) {
        console.warn('[Cleanup] Preserve context warning:', error);
      }
      results.preserved = data || 0;
    } catch (error: any) {
      console.error('[Cleanup] Failed to preserve context:', error);
      results.errors.push(`Preserve: ${error.message}`);
    }

    // Step 2: Index conversations into RAG before deletion
    try {
      console.log('[Cleanup] Indexing conversations to RAG...');
      results.indexed = await indexChatConversations(user.id);
      console.log(`[Cleanup] ✓ Indexed ${results.indexed} conversations to RAG`);
    } catch (error: any) {
      console.error('[Cleanup] Failed to index chats:', error);
      results.errors.push(`Index: ${error.message}`);
    }

    // Step 3: Delete expired messages
    try {
      console.log('[Cleanup] Cleaning up expired messages...');
      const { data, error } = await supabase.rpc('cleanup_expired_chats');

      if (error) {
        throw error;
      }

      results.cleaned = data || 0;
      console.log(`[Cleanup] ✓ Deleted ${results.cleaned} expired messages`);
    } catch (error: any) {
      console.error('[Cleanup] Failed to cleanup:', error);
      results.errors.push(`Cleanup: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      ...results,
      message: `Cleaned ${results.cleaned} messages, preserved context, indexed ${results.indexed} conversations`,
    });
  } catch (error: any) {
    console.error('[Cleanup] Chat cleanup failed:', error);
    return NextResponse.json(
      { error: error.message || 'Cleanup failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/chat/cleanup
 * Get cleanup status (how many messages will be cleaned)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count messages that will be cleaned
    const { count: expiredCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', user.id)
      .lt('expires_at', new Date().toISOString());

    // Count total messages
    const { count: totalCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', user.id);

    return NextResponse.json({
      total_messages: totalCount || 0,
      expired_messages: expiredCount || 0,
      active_messages: (totalCount || 0) - (expiredCount || 0),
    });
  } catch (error: any) {
    console.error('[Cleanup] Failed to get status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}

