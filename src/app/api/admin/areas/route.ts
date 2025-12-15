/**
 * Admin API - Areas Management
 *
 * GET /api/admin/areas - List all areas with sub-modules
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId, isAdmin } from '@/lib/admin/permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const userId = await getCurrentUserId(supabase)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all areas with sub-modules
    const { data: areasData, error: areasError } = await supabase
      .from('areas')
      .select(`
        id,
        code,
        name,
        description,
        icon,
        display_order,
        is_active,
        sub_modules (
          id,
          code,
          name,
          route_pattern,
          display_order,
          is_active
        )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (areasError) {
      console.error('Error fetching areas:', areasError)
      return NextResponse.json(
        { error: 'Failed to fetch areas' },
        { status: 500 }
      )
    }

    // Transform to camelCase and sort sub-modules
    const areas = (areasData || []).map(area => ({
      id: area.id,
      code: area.code,
      name: area.name,
      description: area.description,
      icon: area.icon,
      displayOrder: area.display_order,
      isActive: area.is_active,
      subModules: (area.sub_modules || [])
        .filter((sm: any) => sm.is_active)
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((sm: any) => ({
          id: sm.id,
          code: sm.code,
          name: sm.name,
          routePattern: sm.route_pattern,
          displayOrder: sm.display_order,
          isActive: sm.is_active,
        })),
    }))

    return NextResponse.json({ areas })
  } catch (error) {
    console.error('Error in areas API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
