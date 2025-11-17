import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformSkillType } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/skills
 * List all skill types
 *
 * Query params:
 * - category: 'certification' | 'property_type' | 'specialization' | 'software' | 'equipment'
 * - isRequired: boolean
 * - isActive: boolean
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isRequired = searchParams.get('isRequired');
    const isActive = searchParams.get('isActive');

    let query = supabase.from('skill_types').select('*');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (isRequired !== null) {
      query = query.eq('is_required', isRequired === 'true');
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    } else {
      // Default to active skills only
      query = query.eq('is_active', true);
    }

    const { data: skills, error } = await query.order('category').order('name');

    if (error) {
      console.error('Skills query error:', error);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    const transformedSkills = (skills || []).map(transformSkillType);

    return NextResponse.json({ skills: transformedSkills });

  } catch (error: any) {
    console.error('Skills list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/field-services/skills
 * Create a new skill type
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      isRequired = false,
      isActive = true,
      metadata = {}
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }

    // Check if skill with this name already exists
    const { data: existing } = await supabase
      .from('skill_types')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Skill with this name already exists' }, { status: 409 });
    }

    const { data: skill, error: insertError } = await supabase
      .from('skill_types')
      .insert({
        name,
        description,
        category,
        is_required: isRequired,
        is_active: isActive,
        metadata
      })
      .select()
      .single();

    if (insertError) {
      console.error('Skill insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
    }

    const transformedSkill = transformSkillType(skill);

    return NextResponse.json({
      skill: transformedSkill,
      message: 'Skill created successfully'
    });

  } catch (error: any) {
    console.error('Skill create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create skill' },
      { status: 500 }
    );
  }
}
