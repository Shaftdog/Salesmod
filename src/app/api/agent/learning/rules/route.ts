import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

/**
 * GET /api/agent/learning/rules
 * Fetch all learning rules with optional filtering and sorting
 */
export async function GET(request: NextRequest) {
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

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'User has no tenant_id assigned' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const cardType = searchParams.get('cardType');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Fetch all feedback entries that contain rules
    let query = supabase
      .from('agent_memories')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('scope', 'card_feedback')
      .not('content->>rule', 'is', null);

    // Filter by card type if specified
    if (cardType) {
      query = query.eq('content->>card_type', cardType);
    }

    // Apply sorting
    if (sortBy === 'importance') {
      query = query.order('importance', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    query = query.limit(limit);

    const { data: rules, error: rulesError } = await query;

    if (rulesError) {
      console.error('[Rules API] Error fetching rules:', rulesError);
      return NextResponse.json({ error: rulesError.message }, { status: 500 });
    }

    // Transform to a cleaner format
    const transformedRules = (rules || []).map((rule: any) => ({
      id: rule.id,
      key: rule.key,
      rule: rule.content?.rule || '',
      reason: rule.content?.reason || '',
      cardType: rule.content?.card_type || 'unknown',
      importance: rule.importance,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
      isBatch: rule.content?.type === 'batch_rejection_feedback',
      metadata: {
        cardIds: rule.content?.card_ids || [],
        action: rule.content?.action || null,
        patternType: rule.content?.pattern_type || null,
        regex: rule.content?.regex || null,
      },
    }));

    return NextResponse.json({
      success: true,
      rules: transformedRules,
      count: transformedRules.length,
    });
  } catch (error: any) {
    console.error('[Rules API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agent/learning/rules
 * Update an existing rule (edit rule text, change importance, etc.)
 */
export async function PATCH(request: NextRequest) {
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

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'User has no tenant_id assigned' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, rule, reason, importance, cardType } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    // Fetch the existing rule
    const { data: existingRule, error: fetchError } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (fetchError || !existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Update the content
    const updatedContent = {
      ...existingRule.content,
      ...(rule && { rule }),
      ...(reason && { reason }),
      ...(cardType && { card_type: cardType }),
    };

    const updateData: any = {
      content: updatedContent,
      updated_at: new Date().toISOString(),
    };

    if (importance !== undefined) {
      updateData.importance = importance;
    }

    const { data: updatedRule, error: updateError } = await supabase
      .from('agent_memories')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single();

    if (updateError) {
      console.error('[Rules API] Error updating rule:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rule: {
        id: updatedRule.id,
        rule: updatedRule.content?.rule,
        reason: updatedRule.content?.reason,
        cardType: updatedRule.content?.card_type,
        importance: updatedRule.importance,
        updatedAt: updatedRule.updated_at,
      },
      message: 'Rule updated successfully',
    });
  } catch (error: any) {
    console.error('[Rules API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agent/learning/rules?id=xxx
 * Delete a learning rule
 */
export async function DELETE(request: NextRequest) {
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

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'User has no tenant_id assigned' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('agent_memories')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id);

    if (deleteError) {
      console.error('[Rules API] Error deleting rule:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error: any) {
    console.error('[Rules API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/learning/rules/test
 * Test a rule to see how many pending cards it would affect
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
    const { rule, cardType, patternType, regex } = body;

    if (!rule) {
      return NextResponse.json({ error: 'Rule is required' }, { status: 400 });
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'User has no tenant_id assigned' },
        { status: 403 }
      );
    }

    // Fetch all pending cards
    const { data: pendingCards, error: cardsError } = await supabase
      .from('kanban_cards')
      .select('*, contacts!inner(*), clients!inner(*)')
      .eq('tenant_id', profile.tenant_id)
      .eq('state', 'suggested')
      .limit(100);

    if (cardsError) {
      console.error('[Rules API] Error fetching cards:', cardsError);
      return NextResponse.json({ error: cardsError.message }, { status: 500 });
    }

    // Filter cards based on the pattern type
    let affectedCards = pendingCards || [];

    if (patternType && regex) {
      const pattern = new RegExp(regex, 'i');

      affectedCards = affectedCards.filter((card: any) => {
        const contact = card.contacts;
        const client = card.clients;

        switch (patternType) {
          case 'contact_name':
            const firstName = contact?.first_name || '';
            const lastName = contact?.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            return pattern.test(firstName) || pattern.test(lastName) || pattern.test(fullName);

          case 'email_domain':
            const email = contact?.email || '';
            return pattern.test(email);

          case 'company_name':
            const companyName = client?.name || '';
            return pattern.test(companyName);

          default:
            return false;
        }
      });
    }

    // Group by card type
    const cardTypeDistribution = affectedCards.reduce((acc: any, card: any) => {
      const type = card.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      affectedCardsCount: affectedCards.length,
      totalPendingCards: (pendingCards || []).length,
      cardTypeDistribution,
      sampleCards: affectedCards.slice(0, 5).map((card: any) => ({
        id: card.id,
        title: card.title,
        type: card.type,
        contactName: `${card.contacts?.first_name || ''} ${card.contacts?.last_name || ''}`.trim(),
        contactEmail: card.contacts?.email,
        companyName: card.clients?.name,
      })),
      message: `This rule would affect ${affectedCards.length} of ${(pendingCards || []).length} pending cards`,
    });
  } catch (error: any) {
    console.error('[Rules API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
