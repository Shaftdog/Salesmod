import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformResourceSkill } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/resources/[id]/skills
 * Get all skills for a specific resource
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: skills, error } = await supabase
      .from('resource_skills')
      .select(`
        *,
        skill_types (*),
        verifier:profiles!resource_skills_verified_by_fkey (
          id,
          name,
          email
        )
      `)
      .eq('resource_id', id)
      .order('proficiency_level', { ascending: false });

    if (error) {
      console.error('Resource skills query error:', error);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    const transformedSkills = (skills || []).map(transformResourceSkill);

    return NextResponse.json({ skills: transformedSkills });

  } catch (error: any) {
    console.error('Resource skills get error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/field-services/resources/[id]/skills
 * Add a skill to a resource
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: resourceId } = await params;

    // Check if user is admin or the resource owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && user.id !== resourceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      skillTypeId,
      proficiencyLevel = 'intermediate',
      certificationNumber,
      certifiedDate,
      expiryDate,
      issuingAuthority,
      isVerified = false,
      notes
    } = body;

    // Validate required fields
    if (!skillTypeId) {
      return NextResponse.json({ error: 'Missing required field: skillTypeId' }, { status: 400 });
    }

    // Check if skill already exists for this resource
    const { data: existing } = await supabase
      .from('resource_skills')
      .select('id')
      .eq('resource_id', resourceId)
      .eq('skill_type_id', skillTypeId)
      .single();

    if (existing) {
      return NextResponse.json({
        error: 'This skill is already assigned to this resource'
      }, { status: 409 });
    }

    const { data: skill, error: insertError } = await supabase
      .from('resource_skills')
      .insert({
        resource_id: resourceId,
        skill_type_id: skillTypeId,
        proficiency_level: proficiencyLevel,
        certification_number: certificationNumber,
        certified_date: certifiedDate,
        expiry_date: expiryDate,
        issuing_authority: issuingAuthority,
        is_verified: isVerified,
        verified_by: isVerified ? user.id : null,
        verified_at: isVerified ? new Date().toISOString() : null,
        notes
      })
      .select(`
        *,
        skill_types (*),
        verifier:profiles!resource_skills_verified_by_fkey (
          id,
          name,
          email
        )
      `)
      .single();

    if (insertError) {
      console.error('Resource skill insert error:', insertError);
      return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 });
    }

    const transformedSkill = transformResourceSkill(skill);

    return NextResponse.json({
      skill: transformedSkill,
      message: 'Skill added successfully'
    });

  } catch (error: any) {
    console.error('Resource skill create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add skill' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/field-services/resources/[id]/skills
 * Remove a skill from a resource
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: resourceId } = await params;

    // Check if user is admin or the resource owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && user.id !== resourceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skillId');

    if (!skillId) {
      return NextResponse.json({ error: 'Missing required param: skillId' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('resource_skills')
      .delete()
      .eq('id', skillId)
      .eq('resource_id', resourceId);

    if (deleteError) {
      console.error('Resource skill delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to remove skill' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Skill removed successfully' });

  } catch (error: any) {
    console.error('Resource skill delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove skill' },
      { status: 500 }
    );
  }
}
