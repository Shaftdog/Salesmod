import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformEquipmentAssignment } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/equipment/[id]/assignments
 * Get assignment history for equipment
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
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let query = supabase
      .from('equipment_assignments')
      .select(`
        *,
        equipment:equipment_catalog!equipment_assignments_equipment_id_fkey(*),
        resource:bookable_resources!equipment_assignments_resource_id_fkey(
          id,
          profiles(id, name, email, avatar_url, phone)
        ),
        assigned_by_profile:profiles!equipment_assignments_assigned_by_fkey(
          id, name, email
        )
      `)
      .eq('equipment_id', id)
      .order('assigned_date', { ascending: false });

    if (activeOnly) {
      query = query.is('returned_date', null);
    }

    const { data: assignments, error } = await query;

    if (error) {
      console.error('Assignments query error:', error);
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }

    return NextResponse.json({
      assignments: assignments.map(transformEquipmentAssignment)
    });

  } catch (error: any) {
    console.error('Assignments get error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/field-services/equipment/[id]/assignments
 * Check out equipment to a resource OR check in equipment
 *
 * For check-out:
 * - resourceId: string (required)
 * - conditionAtCheckout: string
 * - notes: string
 *
 * For check-in:
 * - assignmentId: string (required)
 * - conditionAtReturn: string
 * - notes: string
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

    const { id: equipmentId } = await params;
    const body = await request.json();

    // Determine if this is a check-out or check-in
    const isCheckIn = !!body.assignmentId;

    if (isCheckIn) {
      // CHECK IN: Return equipment
      const { assignmentId, conditionAtReturn, notes } = body;

      // Verify assignment exists and is active
      const { data: existingAssignment } = await supabase
        .from('equipment_assignments')
        .select('id, equipment_id, returned_date')
        .eq('id', assignmentId)
        .eq('equipment_id', equipmentId)
        .single();

      if (!existingAssignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      if (existingAssignment.returned_date) {
        return NextResponse.json({ error: 'Equipment already checked in' }, { status: 400 });
      }

      // Update assignment with return info
      const { data: assignment, error: updateError } = await supabase
        .from('equipment_assignments')
        .update({
          returned_date: new Date().toISOString(),
          condition_at_return: conditionAtReturn,
          notes: notes || existingAssignment.notes,
        })
        .eq('id', assignmentId)
        .select(`
          *,
          equipment:equipment_catalog!equipment_assignments_equipment_id_fkey(*),
          resource:bookable_resources!equipment_assignments_resource_id_fkey(
            id,
            profiles(id, name, email, avatar_url)
          ),
          assigned_by_profile:profiles!equipment_assignments_assigned_by_fkey(
            id, name, email
          )
        `)
        .single();

      if (updateError) {
        console.error('Check-in error:', updateError);
        return NextResponse.json({ error: 'Failed to check in equipment' }, { status: 500 });
      }

      // Update equipment status to available
      await supabase
        .from('equipment_catalog')
        .update({
          status: 'available',
          condition: conditionAtReturn || 'good',
        })
        .eq('id', equipmentId);

      return NextResponse.json({
        assignment: transformEquipmentAssignment(assignment),
        message: 'Equipment checked in successfully'
      });

    } else {
      // CHECK OUT: Assign equipment to resource
      const { resourceId, conditionAtCheckout, notes } = body;

      if (!resourceId) {
        return NextResponse.json({ error: 'resourceId is required for check-out' }, { status: 400 });
      }

      // Verify equipment is available
      const { data: equipment } = await supabase
        .from('equipment_catalog')
        .select('id, status')
        .eq('id', equipmentId)
        .single();

      if (!equipment) {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      }

      if (equipment.status !== 'available') {
        return NextResponse.json({
          error: `Equipment is not available. Current status: ${equipment.status}`
        }, { status: 400 });
      }

      // Check for existing active assignment
      const { data: activeAssignment } = await supabase
        .from('equipment_assignments')
        .select('id')
        .eq('equipment_id', equipmentId)
        .is('returned_date', null)
        .single();

      if (activeAssignment) {
        return NextResponse.json({
          error: 'Equipment already has an active assignment'
        }, { status: 400 });
      }

      // Create new assignment
      const { data: assignment, error: createError } = await supabase
        .from('equipment_assignments')
        .insert({
          equipment_id: equipmentId,
          resource_id: resourceId,
          assigned_date: new Date().toISOString(),
          condition_at_checkout: conditionAtCheckout || 'good',
          notes,
          assigned_by: user.id,
        })
        .select(`
          *,
          equipment:equipment_catalog!equipment_assignments_equipment_id_fkey(*),
          resource:bookable_resources!equipment_assignments_resource_id_fkey(
            id,
            profiles(id, name, email, avatar_url, phone)
          ),
          assigned_by_profile:profiles!equipment_assignments_assigned_by_fkey(
            id, name, email
          )
        `)
        .single();

      if (createError) {
        console.error('Check-out error:', createError);
        return NextResponse.json({ error: 'Failed to check out equipment' }, { status: 500 });
      }

      // Update equipment status to in_use
      await supabase
        .from('equipment_catalog')
        .update({ status: 'in_use' })
        .eq('id', equipmentId);

      return NextResponse.json({
        assignment: transformEquipmentAssignment(assignment),
        message: 'Equipment checked out successfully'
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('Assignment operation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process assignment' },
      { status: 500 }
    );
  }
}
