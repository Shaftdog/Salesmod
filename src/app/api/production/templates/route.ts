/**
 * Production Templates API Routes
 * GET /api/production/templates - List templates
 * POST /api/production/templates - Create a new template
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  CreateTemplateRequestSchema,
  ProductionTemplate,
  ProductionTemplateWithTasks,
} from '@/types/production';

// ============================================================================
// GET /api/production/templates - List Templates
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

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';
    const includeTasksParam = searchParams.get('include_tasks') === 'true';

    // Build query - filter by tenant_id for multi-tenant isolation
    let query = supabase
      .from('production_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    // Filter by tenant_id if available, otherwise fall back to org_id
    if (profile?.tenant_id) {
      query = query.eq('tenant_id', profile.tenant_id);
    } else {
      query = query.eq('org_id', user.id);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: templates, error: queryError } = await query;

    if (queryError) {
      console.error('Failed to fetch templates:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch templates', details: queryError.message },
        { status: 500 }
      );
    }

    // If include_tasks is true, fetch tasks for each template
    if (includeTasksParam && templates && templates.length > 0) {
      const templateIds = templates.map(t => t.id);

      const { data: tasks, error: tasksError } = await supabase
        .from('production_template_tasks')
        .select('*')
        .in('template_id', templateIds)
        .order('stage')
        .order('sort_order');

      if (tasksError) {
        console.error('Failed to fetch template tasks:', tasksError);
      }

      // Fetch subtasks
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

      // Combine into nested structure
      const templatesWithTasks = templates.map(template => ({
        ...template,
        tasks: (tasks || [])
          .filter(t => t.template_id === template.id)
          .map(task => ({
            ...task,
            subtasks: subtasks.filter(s => s.parent_task_id === task.id),
          })),
      }));

      return NextResponse.json({
        templates: templatesWithTasks as ProductionTemplateWithTasks[],
        total: templates.length,
      });
    }

    return NextResponse.json({
      templates: templates as ProductionTemplate[],
      total: templates?.length || 0,
    });
  } catch (error: any) {
    console.error('Error in GET /api/production/templates:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/production/templates - Create Template
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
    const validatedData = CreateTemplateRequestSchema.parse(body);

    // If setting as default, first unset other defaults
    if (validatedData.is_default) {
      await supabase
        .from('production_templates')
        .update({ is_default: false })
        .eq('org_id', user.id)
        .eq('is_default', true);
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('production_templates')
      .insert({
        org_id: user.id,
        name: validatedData.name,
        description: validatedData.description || null,
        is_default: validatedData.is_default || false,
        is_active: validatedData.is_active ?? true,
        applicable_order_types: validatedData.applicable_order_types || [],
        applicable_property_types: validatedData.applicable_property_types || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (templateError) {
      console.error('Failed to create template:', templateError);
      return NextResponse.json(
        { error: 'Failed to create template', details: templateError.message },
        { status: 500 }
      );
    }

    // Create tasks if provided
    const createdTasks: any[] = [];
    if (validatedData.tasks && validatedData.tasks.length > 0) {
      for (const taskInput of validatedData.tasks) {
        const { data: task, error: taskError } = await supabase
          .from('production_template_tasks')
          .insert({
            template_id: template.id,
            stage: taskInput.stage,
            title: taskInput.title,
            description: taskInput.description || null,
            default_role: taskInput.default_role,
            estimated_minutes: taskInput.estimated_minutes || 30,
            is_required: taskInput.is_required ?? true,
            sort_order: taskInput.sort_order || 0,
          })
          .select()
          .single();

        if (taskError) {
          console.error('Failed to create task:', taskError);
          // Continue with other tasks
          continue;
        }

        const taskWithSubtasks: any = { ...task, subtasks: [] };

        // Create subtasks if provided
        if (taskInput.subtasks && taskInput.subtasks.length > 0) {
          const subtasksToInsert = taskInput.subtasks.map((subtask, index) => ({
            parent_task_id: task.id,
            title: subtask.title,
            description: subtask.description || null,
            default_role: subtask.default_role,
            estimated_minutes: subtask.estimated_minutes || 15,
            is_required: subtask.is_required ?? true,
            sort_order: subtask.sort_order ?? index,
          }));

          const { data: subtasks, error: subtaskError } = await supabase
            .from('production_template_subtasks')
            .insert(subtasksToInsert)
            .select();

          if (subtaskError) {
            console.error('Failed to create subtasks:', subtaskError);
          } else {
            taskWithSubtasks.subtasks = subtasks || [];
          }
        }

        createdTasks.push(taskWithSubtasks);
      }
    }

    const response: ProductionTemplateWithTasks = {
      ...template,
      tasks: createdTasks,
    };

    return NextResponse.json({ template: response }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/production/templates:', error);

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
