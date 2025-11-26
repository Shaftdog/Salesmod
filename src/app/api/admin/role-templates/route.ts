/**
 * Admin API - Role Templates Management
 *
 * GET /api/admin/role-templates - List all role templates
 * PUT /api/admin/role-templates - Update role template (Super Admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId, isSuperAdmin, isAdmin } from '@/lib/admin/permissions'
import { USER_ROLES, AREA_CODES, type UserRole, type AreaCode } from '@/lib/admin/types'

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

    // Only admins can view role templates
    const userIsAdmin = await isAdmin(userId, supabase)
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get all role templates with area info
    const { data: templatesData, error: templatesError } = await supabase
      .from('role_area_templates')
      .select(`
        id,
        role_name,
        include_all_submodules,
        areas (
          id,
          code,
          name,
          icon,
          display_order
        )
      `)
      .order('role_name', { ascending: true })

    if (templatesError) {
      console.error('Error fetching role templates:', templatesError)
      return NextResponse.json(
        { error: 'Failed to fetch role templates' },
        { status: 500 }
      )
    }

    // Group by role
    const roleTemplates: Record<string, any[]> = {}

    for (const template of templatesData || []) {
      const roleName = template.role_name
      if (!roleTemplates[roleName]) {
        roleTemplates[roleName] = []
      }
      roleTemplates[roleName].push({
        id: template.id,
        areaId: template.areas?.id,
        areaCode: template.areas?.code,
        areaName: template.areas?.name,
        areaIcon: template.areas?.icon,
        displayOrder: template.areas?.display_order,
        includeAllSubmodules: template.include_all_submodules,
      })
    }

    // Sort areas within each role by display order
    for (const role in roleTemplates) {
      roleTemplates[role].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    }

    // Build response with all roles (even those with no areas)
    const result = USER_ROLES.map(role => ({
      role,
      areas: roleTemplates[role] || [],
    }))

    return NextResponse.json({ roleTemplates: result })
  } catch (error) {
    console.error('Error in role-templates API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    // Only Super Admin can modify role templates
    const userIsSuperAdmin = await isSuperAdmin(userId, supabase)
    if (!userIsSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { roleName, areaCodes } = body

    if (!roleName || !USER_ROLES.includes(roleName as UserRole)) {
      return NextResponse.json(
        { error: 'Invalid role name' },
        { status: 400 }
      )
    }

    if (!Array.isArray(areaCodes)) {
      return NextResponse.json(
        { error: 'areaCodes must be an array' },
        { status: 400 }
      )
    }

    // Validate that all area codes are valid
    const invalidCodes = areaCodes.filter(code => !AREA_CODES.includes(code as AreaCode))
    if (invalidCodes.length > 0) {
      return NextResponse.json(
        { error: `Invalid area codes: ${invalidCodes.join(', ')}. Valid codes are: ${AREA_CODES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get area IDs for the provided codes
    const { data: areasData, error: areasError } = await supabase
      .from('areas')
      .select('id, code')
      .in('code', areaCodes)

    if (areasError) {
      console.error('Error fetching areas:', areasError)
      return NextResponse.json(
        { error: 'Failed to fetch areas' },
        { status: 500 }
      )
    }

    const areaMap = new Map((areasData || []).map(a => [a.code, a.id]))

    // Delete existing templates for this role
    const { error: deleteError } = await supabase
      .from('role_area_templates')
      .delete()
      .eq('role_name', roleName)

    if (deleteError) {
      console.error('Error deleting role templates:', deleteError)
      return NextResponse.json(
        { error: 'Failed to update role templates' },
        { status: 500 }
      )
    }

    // Insert new templates
    if (areaCodes.length > 0) {
      const newTemplates = areaCodes
        .filter(code => areaMap.has(code))
        .map(code => ({
          role_name: roleName,
          area_id: areaMap.get(code),
          include_all_submodules: true,
        }))

      if (newTemplates.length > 0) {
        const { error: insertError } = await supabase
          .from('role_area_templates')
          .insert(newTemplates)

        if (insertError) {
          console.error('Error inserting role templates:', insertError)
          return NextResponse.json(
            { error: 'Failed to update role templates' },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated areas for role: ${roleName}`,
    })
  } catch (error) {
    console.error('Error in role-templates API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
