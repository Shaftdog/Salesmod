/**
 * Production Cards API Routes
 * GET /api/production/cards - List production cards
 * POST /api/production/cards - Create a new production card
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  CreateProductionCardSchema,
  ProductionCard,
  ProductionCardWithOrder,
  ProductionStage,
  PRODUCTION_STAGES,
} from '@/types/production';

// Query parameter validation schema
const QueryParamsSchema = z.object({
  stage: z.enum(PRODUCTION_STAGES as unknown as [string, ...string[]]).optional(),
  appraiser_id: z.string().uuid().optional(),
  active_only: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

// ============================================================================
// GET /api/production/cards - List Production Cards
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const paramsResult = QueryParamsSchema.safeParse({
      stage: searchParams.get('stage') || undefined,
      appraiser_id: searchParams.get('appraiser_id') || undefined,
      active_only: searchParams.get('active_only') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const { stage, appraiser_id, active_only, limit, offset } = paramsResult.data;
    const activeOnly = active_only !== 'false';

    // Build query
    let query = supabase
      .from('production_cards')
      .select(
        `
        *,
        order:orders(id, order_number, status, property_address),
        template:production_templates(id, name),
        assigned_appraiser:profiles!production_cards_assigned_appraiser_id_fkey(id, name, email)
      `,
        { count: 'exact' }
      )
      .eq('org_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (stage) {
      query = query.eq('current_stage', stage);
    }
    if (appraiser_id) {
      query = query.eq('assigned_appraiser_id', appraiser_id);
    }
    if (activeOnly) {
      query = query.is('completed_at', null);
    }

    const { data: cards, error: queryError, count } = await query;

    if (queryError) {
      console.error('Failed to fetch production cards:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }

    // Calculate stage counts
    const { data: stageCounts, error: stageError } = await supabase
      .from('production_cards')
      .select('current_stage')
      .eq('org_id', user.id)
      .is('completed_at', null);

    const byStage: Record<ProductionStage, number> = {} as Record<ProductionStage, number>;
    PRODUCTION_STAGES.forEach(s => {
      byStage[s] = 0;
    });

    if (!stageError && stageCounts) {
      stageCounts.forEach(card => {
        if (byStage[card.current_stage as ProductionStage] !== undefined) {
          byStage[card.current_stage as ProductionStage]++;
        }
      });
    }

    return NextResponse.json({
      cards: cards as ProductionCardWithOrder[],
      total: count || 0,
      by_stage: byStage,
    });
  } catch (error) {
    console.error('Error in GET /api/production/cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/production/cards - Create Production Card
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateProductionCardSchema.parse(body);

    // Verify order exists and doesn't already have a production card
    const { data: existingCard, error: checkError } = await supabase
      .from('production_cards')
      .select('id')
      .eq('order_id', validatedData.order_id)
      .single();

    if (existingCard) {
      return NextResponse.json(
        { error: 'Order already has a production card', card_id: existingCard.id },
        { status: 400 }
      );
    }

    // Verify template exists
    const { data: template, error: templateError } = await supabase
      .from('production_templates')
      .select('id')
      .eq('id', validatedData.template_id)
      .eq('org_id', user.id)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    // Create production card
    const { data: card, error: createError } = await supabase
      .from('production_cards')
      .insert({
        org_id: user.id,
        tenant_id: profile.tenant_id,
        order_id: validatedData.order_id,
        template_id: validatedData.template_id,
        due_date: validatedData.due_date || null,
        priority: validatedData.priority || 'normal',
        assigned_appraiser_id: validatedData.assigned_appraiser_id || null,
        current_stage: 'INTAKE',
        processed_stages: [],
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create production card:', createError);
      return NextResponse.json(
        { error: 'Failed to create card' },
        { status: 500 }
      );
    }

    // Generate INTAKE stage tasks from template
    let tasksCreated = 0;
    try {
      const { data: result, error: genError } = await supabase.rpc('generate_stage_tasks', {
        p_card_id: card.id,
        p_stage: 'INTAKE',
      });

      if (genError) {
        console.error('Error generating tasks:', genError);
      } else {
        tasksCreated = result || 0;
      }
    } catch (rpcError) {
      console.error('RPC error generating tasks:', rpcError);
    }

    // Fetch the card with relations
    const { data: cardWithRelations, error: fetchError } = await supabase
      .from('production_cards')
      .select(
        `
        *,
        order:orders(id, order_number, status, property_address),
        template:production_templates(id, name),
        assigned_appraiser:profiles!production_cards_assigned_appraiser_id_fkey(id, name, email)
      `
      )
      .eq('id', card.id)
      .single();

    return NextResponse.json(
      {
        card: cardWithRelations as ProductionCardWithOrder,
        tasks_created: tasksCreated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/production/cards:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
