import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformBookableResource } from '@/lib/supabase/transforms';

/**
 * GET /api/field-services/resources
 * List all bookable resources (appraisers, equipment, etc.)
 *
 * Query params:
 * - resourceType: 'appraiser' | 'equipment' | 'vehicle' | 'facility'
 * - isBookable: boolean
 * - employmentType: 'staff' | 'contractor' | 'vendor'
 * - territoryId: UUID (filter by service territory)
 * - skillId: UUID (filter by required skill)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType');
    const isBookable = searchParams.get('isBookable');
    const employmentType = searchParams.get('employmentType');
    const territoryId = searchParams.get('territoryId');
    const skillId = searchParams.get('skillId');

    // Build query with joins
    let query = supabase
      .from('bookable_resources')
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
      `);

    // Apply filters
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (isBookable !== null) {
      query = query.eq('is_bookable', isBookable === 'true');
    }

    if (employmentType) {
      query = query.eq('employment_type', employmentType);
    }

    if (territoryId) {
      query = query.contains('service_territory_ids', [territoryId]);
    }

    // If filtering by skill, join through resource_skills
    if (skillId) {
      const { data: resourcesWithSkill } = await supabase
        .from('resource_skills')
        .select('resource_id')
        .eq('skill_type_id', skillId);

      if (resourcesWithSkill && resourcesWithSkill.length > 0) {
        const resourceIds = resourcesWithSkill.map(r => r.resource_id);
        query = query.in('id', resourceIds);
      } else {
        // No resources have this skill
        return NextResponse.json({ resources: [] });
      }
    }

    const { data: resources, error } = await query.order('is_bookable', { ascending: false });

    if (error) {
      console.error('Resources query error:', error);
      return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }

    // Transform to camelCase
    const transformedResources = (resources || []).map(transformBookableResource);

    return NextResponse.json({ resources: transformedResources });

  } catch (error: any) {
    console.error('Resources list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/field-services/resources
 * Create or update a bookable resource
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
      id, // Profile ID of the resource
      resourceType = 'appraiser',
      employmentType,
      isBookable = true,
      bookingBufferMinutes = 30,
      maxDailyAppointments = 4,
      maxWeeklyHours = 40,
      primaryTerritoryId,
      serviceTerritoryIds = [],
      hourlyRate,
      overtimeRate,
      perInspectionRate,
      splitPercentage,
      assignedEquipmentIds = [],
      licenseNumber,
      licenseState,
      licenseExpiry,
      errorsAndOmissionsCarrier,
      errorsAndOmissionsExpiry,
      errorsAndOmissionsAmount,
      emergencyContactName,
      emergencyContactPhone,
      preferredContactMethod = 'email',
      defaultWorkingHours,
      timezone = 'America/New_York',
      metadata = {}
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id (profile ID)' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Upsert resource
    const { data: resource, error: upsertError } = await supabase
      .from('bookable_resources')
      .upsert({
        id,
        resource_type: resourceType,
        employment_type: employmentType,
        is_bookable: isBookable,
        booking_buffer_minutes: bookingBufferMinutes,
        max_daily_appointments: maxDailyAppointments,
        max_weekly_hours: maxWeeklyHours,
        primary_territory_id: primaryTerritoryId,
        service_territory_ids: serviceTerritoryIds,
        hourly_rate: hourlyRate,
        overtime_rate: overtimeRate,
        per_inspection_rate: perInspectionRate,
        split_percentage: splitPercentage,
        assigned_equipment_ids: assignedEquipmentIds,
        license_number: licenseNumber,
        license_state: licenseState,
        license_expiry: licenseExpiry,
        errors_and_omissions_carrier: errorsAndOmissionsCarrier,
        errors_and_omissions_expiry: errorsAndOmissionsExpiry,
        errors_and_omissions_amount: errorsAndOmissionsAmount,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        preferred_contact_method: preferredContactMethod,
        default_working_hours: defaultWorkingHours || {
          monday: { enabled: true, start: '08:00', end: '17:00' },
          tuesday: { enabled: true, start: '08:00', end: '17:00' },
          wednesday: { enabled: true, start: '08:00', end: '17:00' },
          thursday: { enabled: true, start: '08:00', end: '17:00' },
          friday: { enabled: true, start: '08:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '13:00' },
          sunday: { enabled: false, start: '09:00', end: '13:00' }
        },
        timezone,
        metadata
      })
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

    if (upsertError) {
      console.error('Resource upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to upsert resource' }, { status: 500 });
    }

    const transformedResource = transformBookableResource(resource);

    return NextResponse.json({
      resource: transformedResource,
      message: 'Resource saved successfully'
    });

  } catch (error: any) {
    console.error('Resource upsert error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save resource' },
      { status: 500 }
    );
  }
}
