/**
 * Admin API - User Area Overrides
 *
 * GET /api/admin/users/[id]/areas - Get user's effective areas
 * PUT /api/admin/users/[id]/areas - Set user area overrides (Super Admin only)
 * DELETE /api/admin/users/[id]/areas - Remove user overrides (revert to role defaults)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId, isSuperAdmin, isAdmin, getUserAreas, getUserRole } from '@/lib/admin/permissions'
import type { OverrideMode, AreaCode } from '@/lib/admin/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetUserId } = await params
    const supabase = await createClient()

    // Check authentication
    const userId = await getCurrentUserId(supabase)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can view other users' areas
    const userIsAdmin = await isAdmin(userId, supabase)
    if (!userIsAdmin && userId !== targetUserId) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get user's role
    const userRole = await getUserRole(targetUserId, supabase)

    // Get user's effective areas
    const areas = await getUserAreas(targetUserId, supabase)

    // Get user's override configuration if any
    const { data: overrideData } = await supabase
      .from('user_area_overrides')
      .select('override_mode, created_at, updated_at')
      .eq('user_id', targetUserId)
      .single()

    // Get user's explicit area access entries
    const { data: accessData } = await supabase
      .from('user_area_access')
      .select(`
        access_type,
        include_all_submodules,
        areas (
          id,
          code,
          name
        )
      `)
      .eq('user_id', targetUserId)

    const accessEntries = (accessData || []).map((entry: any) => ({
      areaCode: entry.areas?.code,
      areaName: entry.areas?.name,
      accessType: entry.access_type,
      includeAllSubmodules: entry.include_all_submodules,
    }))

    return NextResponse.json({
      userId: targetUserId,
      role: userRole,
      overrideMode: overrideData?.override_mode || null,
      effectiveAreas: areas,
      accessEntries,
    })
  } catch (error) {
    console.error('Error in user areas API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetUserId } = await params
    const supabase = await createClient()

    // Check authentication
    const userId = await getCurrentUserId(supabase)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only Super Admin can modify user area overrides
    const userIsSuperAdmin = await isSuperAdmin(userId, supabase)
    if (!userIsSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { overrideMode, grants, revokes } = body as {
      overrideMode: OverrideMode
      grants?: AreaCode[]
      revokes?: AreaCode[]
    }

    if (!overrideMode || !['tweak', 'custom'].includes(overrideMode)) {
      return NextResponse.json(
        { error: 'Invalid override mode. Must be "tweak" or "custom"' },
        { status: 400 }
      )
    }

    // Get area IDs for grants and revokes
    const allCodes = [...(grants || []), ...(revokes || [])]
    let areaMap = new Map<string, string>()

    if (allCodes.length > 0) {
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('id, code')
        .in('code', allCodes)

      if (areasError) {
        console.error('Error fetching areas:', areasError)
        return NextResponse.json(
          { error: 'Failed to fetch areas' },
          { status: 500 }
        )
      }

      areaMap = new Map((areasData || []).map(a => [a.code, a.id]))
    }

    // Start transaction-like operations

    // 1. Upsert override mode
    const { error: overrideError } = await supabase
      .from('user_area_overrides')
      .upsert({
        user_id: targetUserId,
        override_mode: overrideMode,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (overrideError) {
      console.error('Error setting override mode:', overrideError)
      return NextResponse.json(
        { error: 'Failed to set override mode' },
        { status: 500 }
      )
    }

    // 2. Delete existing area access entries for this user
    const { error: deleteError } = await supabase
      .from('user_area_access')
      .delete()
      .eq('user_id', targetUserId)

    if (deleteError) {
      console.error('Error deleting existing access:', deleteError)
      return NextResponse.json(
        { error: 'Failed to update area access' },
        { status: 500 }
      )
    }

    // 3. Insert new access entries
    const accessEntries: any[] = []

    for (const code of grants || []) {
      const areaId = areaMap.get(code)
      if (areaId) {
        accessEntries.push({
          user_id: targetUserId,
          area_id: areaId,
          access_type: 'grant',
          include_all_submodules: true,
        })
      }
    }

    for (const code of revokes || []) {
      const areaId = areaMap.get(code)
      if (areaId) {
        accessEntries.push({
          user_id: targetUserId,
          area_id: areaId,
          access_type: 'revoke',
          include_all_submodules: true,
        })
      }
    }

    if (accessEntries.length > 0) {
      const { error: insertError } = await supabase
        .from('user_area_access')
        .insert(accessEntries)

      if (insertError) {
        console.error('Error inserting access entries:', insertError)
        return NextResponse.json(
          { error: 'Failed to update area access' },
          { status: 500 }
        )
      }
    }

    // Get updated effective areas
    const effectiveAreas = await getUserAreas(targetUserId, supabase)

    return NextResponse.json({
      success: true,
      message: 'User area access updated',
      effectiveAreas,
    })
  } catch (error) {
    console.error('Error in user areas API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetUserId } = await params
    const supabase = await createClient()

    // Check authentication
    const userId = await getCurrentUserId(supabase)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only Super Admin can remove user area overrides
    const userIsSuperAdmin = await isSuperAdmin(userId, supabase)
    if (!userIsSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      )
    }

    // Delete override configuration
    const { error: overrideDeleteError } = await supabase
      .from('user_area_overrides')
      .delete()
      .eq('user_id', targetUserId)

    if (overrideDeleteError) {
      console.error('Error deleting user area overrides:', overrideDeleteError)
      return NextResponse.json(
        { error: 'Failed to remove area overrides' },
        { status: 500 }
      )
    }

    // Delete all access entries
    const { error: accessDeleteError } = await supabase
      .from('user_area_access')
      .delete()
      .eq('user_id', targetUserId)

    if (accessDeleteError) {
      console.error('Error deleting user area access:', accessDeleteError)
      return NextResponse.json(
        { error: 'Failed to remove area access entries' },
        { status: 500 }
      )
    }

    // Delete all submodule access entries
    const { error: submoduleDeleteError } = await supabase
      .from('user_submodule_access')
      .delete()
      .eq('user_id', targetUserId)

    if (submoduleDeleteError) {
      console.error('Error deleting user submodule access:', submoduleDeleteError)
      return NextResponse.json(
        { error: 'Failed to remove submodule access entries' },
        { status: 500 }
      )
    }

    // Get effective areas (now just role defaults)
    const effectiveAreas = await getUserAreas(targetUserId, supabase)

    return NextResponse.json({
      success: true,
      message: 'User area overrides removed, reverted to role defaults',
      effectiveAreas,
    })
  } catch (error) {
    console.error('Error in user areas API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
