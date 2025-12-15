/**
 * Single Production Template API Routes
 * GET /api/production/templates/[id] - Get template by ID
 * PUT /api/production/templates/[id] - Update template
 * DELETE /api/production/templates/[id] - Delete template
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ProductionTemplate,
  ProductionTemplateWithTasks,
  ProductionTemplateSchema,
} from '@/types/production';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/production/templates/[id] - Get Single Template
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
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
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    // Get template (filtered by tenant_id)
    const { data: template, error: templateError } = await supabase
      .from('production_templates')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (templateError) {
      if (templateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      console.error('Failed to fetch template:', templateError);
      return NextResponse.json(
        { error: 'Failed to fetch template', details: templateError.message },
        { status: 500 }
      );
    }

    // Get tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('production_template_tasks')
      .select('*')
      .eq('template_id', id)
      .order('stage')
      .order('sort_order');

    if (tasksError) {
      console.error('Failed to fetch tasks:', tasksError);
    }

    // Get subtasks
    const taskIds = tasks?.map(t => t.id) || [];
    let subtasks: any[] = [];
    if (taskIds.length > 0) {
      const { data: subtasksData } = await supabase
        .from('production_template_subtasks')
        .select('*')
        .in('parent_task_id', taskIds)
        .order('sort_order');
      subtasks = subtasksData || [];
    }

    // Build nested structure
    const tasksWithSubtasks = (tasks || []).map(task => ({
      ...task,
      subtasks: subtasks.filter(s => s.parent_task_id === task.id),
    }));

    const response: ProductionTemplateWithTasks = {
      ...template,
      tasks: tasksWithSubtasks,
    };

    return NextResponse.json({ template: response });
  } catch (error: any) {
    console.error('Error in GET /api/production/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/production/templates/[id] - Update Template
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
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
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const validatedData = ProductionTemplateSchema.partial().parse(body);

    // Verify template exists and belongs to tenant
    const { data: existing, error: checkError } = await supabase
      .from('production_templates')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // If setting as default, first unset other defaults (scoped by tenant_id)
    if (validatedData.is_default) {
      await supabase
        .from('production_templates')
        .update({ is_default: false })
        .eq('tenant_id', profile.tenant_id)
        .eq('is_default', true)
        .neq('id', id);
    }

    // Update template
    const { data: template, error: updateError } = await supabase
      .from('production_templates')
      .update({
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.is_default !== undefined && { is_default: validatedData.is_default }),
        ...(validatedData.is_active !== undefined && { is_active: validatedData.is_active }),
        ...(validatedData.applicable_order_types !== undefined && {
          applicable_order_types: validatedData.applicable_order_types,
        }),
        ...(validatedData.applicable_property_types !== undefined && {
          applicable_property_types: validatedData.applicable_property_types,
        }),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update template:', updateError);
      return NextResponse.json(
        { error: 'Failed to update template', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: template as ProductionTemplate });
  } catch (error: any) {
    console.error('Error in PUT /api/production/templates/[id]:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/production/templates/[id] - Delete Template
// ============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
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
      return NextResponse.json({ error: 'User has no tenant_id assigned' }, { status: 403 });
    }

    // Verify template exists and belongs to tenant
    const { data: existing, error: checkError } = await supabase
      .from('production_templates')
      .select('id, is_default')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Don't allow deleting the default template if it's the only one
    if (existing.is_default) {
      const { count } = await supabase
        .from('production_templates')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id);

      if (count === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only template. Create another template first.' },
          { status: 400 }
        );
      }
    }

    // Check if template is in use by production cards
    const { count: cardsUsingTemplate } = await supabase
      .from('production_cards')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', id);

    if (cardsUsingTemplate && cardsUsingTemplate > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete template. It is used by ${cardsUsingTemplate} production card(s).`,
          in_use_count: cardsUsingTemplate,
        },
        { status: 400 }
      );
    }

    // Delete template (cascade will delete tasks and subtasks)
    const { error: deleteError } = await supabase
      .from('production_templates')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete template:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete template', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    console.error('Error in DELETE /api/production/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
