import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformBookableResource } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/resources/[id]
 * Get a single bookable resource by ID with skills and availability
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

    const { data: resource, error } = await supabase
      .from('bookable_resources')
      .select(`
        *,
        profiles (
          id,
          name,
          email,
          avatar_url,
          role,
          availability,
          geographic_coverage,
          workload,
          rating
        ),
        primary_territory:service_territories!bookable_resources_primary_territory_id_fkey (
          *
        ),
        resource_skills (
          *,
          skill_types (
            *
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      console.error('Resource query error:', error);
      return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
    }

    const transformedResource = transformBookableResource(resource);

    return NextResponse.json({ resource: transformedResource });

  } catch (error: any) {
    console.error('Resource get error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/field-services/resources/[id]
 * Update specific fields of a bookable resource
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

    // Check if user is admin or updating their own resource
    const { id } = await params;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Convert camelCase to snake_case for database
    const updateData: any = {};

    if (body.resourceType !== undefined) updateData.resource_type = body.resourceType;
    if (body.employmentType !== undefined) updateData.employment_type = body.employmentType;
    if (body.isBookable !== undefined) updateData.is_bookable = body.isBookable;
    if (body.bookingBufferMinutes !== undefined) updateData.booking_buffer_minutes = body.bookingBufferMinutes;
    if (body.maxDailyAppointments !== undefined) updateData.max_daily_appointments = body.maxDailyAppointments;
    if (body.maxWeeklyHours !== undefined) updateData.max_weekly_hours = body.maxWeeklyHours;
    if (body.primaryTerritoryId !== undefined) updateData.primary_territory_id = body.primaryTerritoryId;
    if (body.serviceTerritoryIds !== undefined) updateData.service_territory_ids = body.serviceTerritoryIds;
    if (body.hourlyRate !== undefined) updateData.hourly_rate = body.hourlyRate;
    if (body.overtimeRate !== undefined) updateData.overtime_rate = body.overtimeRate;
    if (body.perInspectionRate !== undefined) updateData.per_inspection_rate = body.perInspectionRate;
    if (body.splitPercentage !== undefined) updateData.split_percentage = body.splitPercentage;
    if (body.assignedEquipmentIds !== undefined) updateData.assigned_equipment_ids = body.assignedEquipmentIds;
    if (body.licenseNumber !== undefined) updateData.license_number = body.licenseNumber;
    if (body.licenseState !== undefined) updateData.license_state = body.licenseState;
    if (body.licenseExpiry !== undefined) updateData.license_expiry = body.licenseExpiry;
    if (body.errorsAndOmissionsCarrier !== undefined) updateData.errors_and_omissions_carrier = body.errorsAndOmissionsCarrier;
    if (body.errorsAndOmissionsExpiry !== undefined) updateData.errors_and_omissions_expiry = body.errorsAndOmissionsExpiry;
    if (body.errorsAndOmissionsAmount !== undefined) updateData.errors_and_omissions_amount = body.errorsAndOmissionsAmount;
    if (body.emergencyContactName !== undefined) updateData.emergency_contact_name = body.emergencyContactName;
    if (body.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = body.emergencyContactPhone;
    if (body.preferredContactMethod !== undefined) updateData.preferred_contact_method = body.preferredContactMethod;
    if (body.defaultWorkingHours !== undefined) updateData.default_working_hours = body.defaultWorkingHours;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: resource, error: updateError } = await supabase
      .from('bookable_resources')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        profiles (
          id,
          name,
          email,
          avatar_url,
          role
        ),
        primary_territory:service_territories!bookable_resources_primary_territory_id_fkey (
          id,
          name,
          territory_type,
          color_hex
        )
      `)
      .single();

    if (updateError) {
      console.error('Resource update error:', updateError);
      return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
    }

    const transformedResource = transformBookableResource(resource);

    return NextResponse.json({
      resource: transformedResource,
      message: 'Resource updated successfully'
    });

  } catch (error: any) {
    console.error('Resource update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update resource' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/field-services/resources/[id]
 * Delete a bookable resource (soft delete by setting is_bookable to false)
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete by setting is_bookable to false
    const { error: deleteError } = await supabase
      .from('bookable_resources')
      .update({ is_bookable: false })
      .eq('id', id);

    if (deleteError) {
      console.error('Resource delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Resource deleted successfully' });

  } catch (error: any) {
    console.error('Resource delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
