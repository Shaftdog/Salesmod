import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { indexClients, indexActivities } from '@/lib/agent/rag';

export const maxDuration = 300; // 5 minutes for indexing

/**
 * POST /api/rag/index
 * Index data into the RAG system
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

    const body = await request.json();
    const { sources } = body; // Array of sources to index: ['clients', 'activities', 'all']

    const results: any = {
      indexed: {},
      errors: [],
    };

    // Index clients
    if (!sources || sources.includes('clients') || sources.includes('all')) {
      try {
        console.log('Indexing clients...');
        const count = await indexClients(user.id);
        results.indexed.clients = count;
        console.log(`Indexed ${count} clients`);
      } catch (error: any) {
        console.error('Client indexing failed:', error);
        results.errors.push(`Clients: ${error.message}`);
      }
    }

    // Index activities
    if (!sources || sources.includes('activities') || sources.includes('all')) {
      try {
        console.log('Indexing activities...');
        const count = await indexActivities(user.id);
        results.indexed.activities = count;
        console.log(`Indexed ${count} activities`);
      } catch (error: any) {
        console.error('Activity indexing failed:', error);
        results.errors.push(`Activities: ${error.message}`);
      }
    }

    const totalIndexed = Object.values(results.indexed).reduce((sum: number, count) => sum + (count as number), 0);

    return NextResponse.json({
      success: true,
      totalIndexed,
      ...results,
    });
  } catch (error: any) {
    console.error('RAG indexing failed:', error);
    return NextResponse.json(
      { error: error.message || 'Indexing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rag/index
 * Get indexing status
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

    // Get count of indexed items by source
    const { data, error } = await supabase
      .from('embeddings_index')
      .select('source')
      .eq('org_id', user.id);

    if (error) {
      throw error;
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      counts[row.source] = (counts[row.source] || 0) + 1;
    });

    const total = data?.length || 0;

    return NextResponse.json({
      total,
      by_source: counts,
      indexed_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to get index status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}

