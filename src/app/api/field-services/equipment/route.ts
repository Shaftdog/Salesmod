import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformEquipment } from '@/lib/supabase/transforms';
import { getApiContext, handleApiError, requireAdmin } from '@/lib/api-utils';
import { createEquipmentSchema } from '@/lib/validations/field-services';

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
    return handleApiError(error);
  }
}

/**
 * POST /api/field-services/equipment
 * Create new equipment item
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getApiContext(request);
    const { supabase, orgId } = context;

    // Check if user is admin
    await requireAdmin(context);

    // Parse and validate request body
    const body = await request.json();
    const validated = createEquipmentSchema.parse(body);

    // Convert to database format
    const equipmentData: any = {
      org_id: orgId,
      equipment_type: validated.equipmentType,
      make: validated.make,
      model: validated.model,
      serial_number: validated.serialNumber,
      purchase_date: validated.purchaseDate,
      purchase_cost: validated.purchaseCost,
      current_value: validated.currentValue,
      status: validated.status,
      condition: validated.condition,
      maintenance_schedule: validated.maintenanceSchedule,
      last_maintenance_date: validated.lastMaintenanceDate,
      next_maintenance_date: validated.nextMaintenanceDate,
      location: validated.location,
      notes: validated.notes,
      specifications: validated.specifications,
      warranty_expiry: validated.warrantyExpiry,
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
    return handleApiError(error);
  }
}
