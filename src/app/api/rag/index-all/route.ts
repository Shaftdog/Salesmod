import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { indexClients, indexActivities, indexChatConversations } from '@/lib/agent/rag';

export const maxDuration = 300; // 5 minutes

/**
 * POST /api/rag/index-all
 * One-time indexing of all data
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

    console.log(`[RAG] Starting full index for user ${user.id}`);

    const results: any = {
      clients: 0,
      activities: 0,
      chats: 0,
      errors: [],
      startedAt: new Date().toISOString(),
    };

    // Index clients
    try {
      console.log('[RAG] Indexing clients...');
      results.clients = await indexClients(user.id);
      console.log(`[RAG] ✓ Indexed ${results.clients} clients`);
    } catch (error: any) {
      console.error('[RAG] Client indexing failed:', error);
      results.errors.push(`Clients: ${error.message}`);
    }

    // Index activities
    try {
      console.log('[RAG] Indexing activities...');
      results.activities = await indexActivities(user.id);
      console.log(`[RAG] ✓ Indexed ${results.activities} activities`);
    } catch (error: any) {
      console.error('[RAG] Activity indexing failed:', error);
      results.errors.push(`Activities: ${error.message}`);
    }

    // Index chat conversations
    try {
      console.log('[RAG] Indexing chat conversations...');
      results.chats = await indexChatConversations(user.id);
      console.log(`[RAG] ✓ Indexed ${results.chats} conversations`);
    } catch (error: any) {
      console.error('[RAG] Chat indexing failed:', error);
      results.errors.push(`Chats: ${error.message}`);
    }

    results.completedAt = new Date().toISOString();
    results.totalIndexed = results.clients + results.activities + results.chats;

    console.log(`[RAG] Indexing complete. Total: ${results.totalIndexed} items`);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('[RAG] Indexing failed:', error);
    return NextResponse.json(
      { error: error.message || 'Indexing failed' },
      { status: 500 }
    );
  }
}

