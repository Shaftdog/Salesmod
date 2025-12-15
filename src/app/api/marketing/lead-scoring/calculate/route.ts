import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateLeadScore, recalculateAllScores } from '@/lib/marketing/lead-scoring';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, orgId, recalculateAll } = body;

    if (recalculateAll && orgId) {
      // Recalculate all scores for the org
      const count = await recalculateAllScores(orgId);
      return NextResponse.json({
        success: true,
        message: `Recalculated scores for ${count} contacts`,
        count
      });
    }

    if (contactId) {
      // Calculate score for single contact
      const score = await calculateLeadScore(contactId);

      if (!score) {
        return NextResponse.json(
          { error: 'Failed to calculate lead score' },
          { status: 500 }
        );
      }

      return NextResponse.json({ score });
    }

    return NextResponse.json(
      { error: 'Must provide contactId or set recalculateAll=true with orgId' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/marketing/lead-scoring/calculate:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
