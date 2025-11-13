import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformEquipment } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/equipment
 * List all equipment with optional filters
 *
 * Query params:
 * - equipmentType: Filter by equipment type
 * - status: Filter by status (available, in_use, maintenance, retired)
 * - condition: Filter by condition
 * - available: Only show available equipment (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const equipmentType = searchParams.get('equipmentType');
    const status = searchParams.get('status');
    const condition = searchParams.get('condition');
    const available = searchParams.get('available');

    let query = supabase
      .from('equipment_catalog')
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
      .order('created_at', { ascending: false });

    if (equipmentType) {
      query = query.eq('equipment_type', equipmentType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (condition) {
      query = query.eq('condition', condition);
    }

    if (available === 'true') {
      query = query.eq('status', 'available');
    }

    const { data: equipment, error } = await query;

    if (error) {
      console.error('Equipment list error:', error);
      return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
    }

    // Transform and filter to only include equipment with no active assignment for "available" filter
    let transformedEquipment = equipment.map(transformEquipment);

    if (available === 'true') {
      transformedEquipment = transformedEquipment.filter(e =>
        !e.currentAssignment || e.currentAssignment.length === 0
      );
    }

    return NextResponse.json({ equipment: transformedEquipment });

  } catch (error: any) {
    console.error('Equipment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/field-services/equipment
 * Create new equipment item
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may want to add proper role checking)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Convert camelCase to snake_case for database
    const equipmentData: any = {
      equipment_type: body.equipmentType,
      make: body.make,
      model: body.model,
      serial_number: body.serialNumber,
      purchase_date: body.purchaseDate,
      purchase_cost: body.purchaseCost,
      current_value: body.currentValue,
      status: body.status || 'available',
      condition: body.condition || 'good',
      maintenance_schedule: body.maintenanceSchedule,
      last_maintenance_date: body.lastMaintenanceDate,
      next_maintenance_date: body.nextMaintenanceDate,
      location: body.location,
      notes: body.notes,
      specifications: body.specifications,
      warranty_expiry: body.warrantyExpiry,
    };

    const { data: equipment, error } = await supabase
      .from('equipment_catalog')
      .insert(equipmentData)
      .select(`
        *,
        current_assignment:equipment_assignments!equipment_assignments_equipment_id_fkey(
          id,
          assigned_date,
          resource:bookable_resources!equipment_assignments_resource_id_fkey(
            id,
            profiles(id, name, email)
          )
        )
      `)
      .single();

    if (error) {
      console.error('Equipment creation error:', error);
      return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 });
    }

    return NextResponse.json({
      equipment: transformEquipment(equipment),
      message: 'Equipment created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Equipment creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create equipment' },
      { status: 500 }
    );
  }
}
