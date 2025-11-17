import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/field-services/bookings/auto-assign
 * Automatically assign best resource based on territory, skills, and availability
 *
 * Request body:
 * - propertyZip: string (required)
 * - scheduledStart: string (ISO datetime, required)
 * - scheduledEnd: string (ISO datetime, required)
 * - requiredSkills?: string[] (skill type IDs)
 * - orderType?: string
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyZip,
      scheduledStart,
      scheduledEnd,
      requiredSkills = [],
      orderType,
    } = body;

    // Validate required fields
    if (!propertyZip || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyZip, scheduledStart, scheduledEnd' },
        { status: 400 }
      );
    }

    const zip5 = propertyZip.substring(0, 5);

    // Step 1: Find territories that cover this ZIP code
    const { data: territories } = await supabase
      .from('service_territories')
      .select('id')
      .contains('zip_codes', [zip5])
      .eq('is_active', true);

    if (!territories || territories.length === 0) {
      return NextResponse.json({
        resourceId: null,
        reason: 'no_territory_coverage',
        message: 'No service territory covers this ZIP code',
      });
    }

    const territoryIds = territories.map(t => t.id);

    // Step 2: Find resources that serve these territories
    let resourceQuery = supabase
      .from('bookable_resources')
      .select(`
        id,
        max_daily_appointments,
        service_territory_ids,
        resource_skills!inner(skill_type_id),
        profiles(name)
      `)
      .eq('is_bookable', true)
      .eq('resource_type', 'appraiser');

    // Filter by resources that have at least one territory in the list
    const { data: allResources } = await resourceQuery;

    const candidateResources = (allResources || []).filter((resource: any) => {
      const resourceTerritories = resource.service_territory_ids || [];
      return territoryIds.some(tid => resourceTerritories.includes(tid));
    });

    if (candidateResources.length === 0) {
      return NextResponse.json({
        resourceId: null,
        reason: 'no_available_resources',
        message: 'No resources serve this territory',
      });
    }

    // Step 3: Filter by required skills if specified
    let skillFilteredResources = candidateResources;
    if (requiredSkills.length > 0) {
      skillFilteredResources = candidateResources.filter((resource: any) => {
        const resourceSkillIds = resource.resource_skills.map((rs: any) => rs.skill_type_id);
        return requiredSkills.every((reqSkill: any) => resourceSkillIds.includes(reqSkill));
      });

      if (skillFilteredResources.length === 0) {
        return NextResponse.json({
          resourceId: null,
          reason: 'no_resources_with_skills',
          message: 'No resources have the required skills',
        });
      }
    }

    // Step 4: Check availability for each resource
    const availableResources = [];

    for (const resource of skillFilteredResources) {
      // Check for conflicts
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('resource_id', resource.id)
        .not('status', 'in', '("cancelled","rescheduled")')
        .lt('scheduled_start', scheduledEnd)
        .gt('scheduled_end', scheduledStart);

      if (conflicts && conflicts.length > 0) {
        continue; // Skip this resource, they have a conflict
      }

      // Check daily capacity
      const dayStart = new Date(scheduledStart);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('resource_id', resource.id)
        .gte('scheduled_start', dayStart.toISOString())
        .lt('scheduled_start', dayEnd.toISOString())
        .not('status', 'in', '("cancelled","rescheduled")');

      if (count && count >= resource.max_daily_appointments) {
        continue; // Skip, at capacity
      }

      availableResources.push(resource);
    }

    if (availableResources.length === 0) {
      return NextResponse.json({
        resourceId: null,
        reason: 'no_available_slots',
        message: 'All matching resources are booked or at capacity',
      });
    }

    // Step 5: Score and rank resources (simple scoring for now)
    const scoredResources = await Promise.all(
      availableResources.map(async (resource) => {
        let score = 100;

        // Get workload for the week
        const weekStart = new Date(scheduledStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { count: weeklyBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('resource_id', resource.id)
          .gte('scheduled_start', weekStart.toISOString())
          .lt('scheduled_start', weekEnd.toISOString())
          .not('status', 'in', '("cancelled","rescheduled")');

        // Lower score for busier resources (distribute workload)
        score -= (weeklyBookings || 0) * 5;

        // Check if primary territory (bonus points)
        const { data: resourceDetails } = await supabase
          .from('bookable_resources')
          .select('primary_territory_id')
          .eq('id', resource.id)
          .single();

        if (resourceDetails && territoryIds.includes(resourceDetails.primary_territory_id)) {
          score += 20; // Bonus for primary territory
        }

        return {
          ...resource,
          score,
        };
      })
    );

    // Sort by score (highest first)
    scoredResources.sort((a, b) => b.score - a.score);

    const bestResource = scoredResources[0];

    return NextResponse.json({
      resourceId: bestResource.id,
      resourceName: (bestResource as any).profiles?.name,
      score: bestResource.score,
      reason: 'success',
      message: `Assigned to ${(bestResource as any).profiles?.name} (score: ${bestResource.score})`,
      alternativeResources: scoredResources.slice(1, 4).map((r: any) => ({
        id: r.id,
        name: r.profiles?.name,
        score: r.score,
      })),
    });

  } catch (error: any) {
    console.error('Auto-assign error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-assign resource' },
      { status: 500 }
    );
  }
}
