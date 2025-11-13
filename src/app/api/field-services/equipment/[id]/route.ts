import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformEquipment } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/equipment/[id]
 * Get equipment details with assignment history
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

    const { data: equipment, error } = await supabase
      .from('equipment_catalog')
      .select(`
        *,
        current_assignment:equipment_assignments!equipment_assignments_equipment_id_fkey(
          id,
          assigned_date,
          returned_date,
          condition_at_checkout,
          condition_at_return,
          notes,
          resource:bookable_resources!equipment_assignments_resource_id_fkey(
            id,
            profiles(id, name, email, avatar_url, phone)
          ),
          assigned_by_profile:profiles!equipment_assignments_assigned_by_fkey(
            id, name, email
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      }
      console.error('Equipment query error:', error);
      return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
    }

    return NextResponse.json({ equipment: transformEquipment(equipment) });

  } catch (error: any) {
    console.error('Equipment get error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/field-services/equipment/[id]
 * Update equipment details
 */
export async function PATCH(
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
    const body = await request.json();

    // Convert camelCase to snake_case
    const updateData: any = {};

    if (body.equipmentType !== undefined) updateData.equipment_type = body.equipmentType;
    if (body.make !== undefined) updateData.make = body.make;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.serialNumber !== undefined) updateData.serial_number = body.serialNumber;
    if (body.purchaseDate !== undefined) updateData.purchase_date = body.purchaseDate;
    if (body.purchaseCost !== undefined) updateData.purchase_cost = body.purchaseCost;
    if (body.currentValue !== undefined) updateData.current_value = body.currentValue;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.maintenanceSchedule !== undefined) updateData.maintenance_schedule = body.maintenanceSchedule;
    if (body.lastMaintenanceDate !== undefined) updateData.last_maintenance_date = body.lastMaintenanceDate;
    if (body.nextMaintenanceDate !== undefined) updateData.next_maintenance_date = body.nextMaintenanceDate;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.specifications !== undefined) updateData.specifications = body.specifications;
    if (body.warrantyExpiry !== undefined) updateData.warranty_expiry = body.warrantyExpiry;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: equipment, error } = await supabase
      .from('equipment_catalog')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        current_assignment:equipment_assignments!equipment_assignments_equipment_id_fkey(
          id,
          assigned_date,
          resource:bookable_resources!equipment_assignments_resource_id_fkey(
            id,
            profiles(id, name, email, avatar_url)
          )
        )
      `)
      .single();

    if (error) {
      console.error('Equipment update error:', error);
      return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
    }

    return NextResponse.json({
      equipment: transformEquipment(equipment),
      message: 'Equipment updated successfully'
    });

  } catch (error: any) {
    console.error('Equipment update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update equipment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/field-services/equipment/[id]
 * Mark equipment as retired (soft delete)
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Check if equipment has active assignments
    const { data: activeAssignment } = await supabase
      .from('equipment_assignments')
      .select('id')
      .eq('equipment_id', id)
      .is('returned_date', null)
      .single();

    if (activeAssignment) {
      return NextResponse.json(
        { error: 'Cannot retire equipment with active assignment. Please check in first.' },
        { status: 400 }
      );
    }

    // Soft delete by marking as retired
    const { error } = await supabase
      .from('equipment_catalog')
      .update({ status: 'retired' })
      .eq('id', id);

    if (error) {
      console.error('Equipment retire error:', error);
      return NextResponse.json({ error: 'Failed to retire equipment' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Equipment retired successfully' });

  } catch (error: any) {
    console.error('Equipment delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retire equipment' },
      { status: 500 }
    );
  }
}
