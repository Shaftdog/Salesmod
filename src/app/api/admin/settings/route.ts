import { withAdminAuth } from '@/lib/admin/api-middleware'
import { AUDIT_ACTIONS, logSuccess } from '@/lib/admin/audit'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/settings
 * Get all settings or settings by category
 */
export const GET = withAdminAuth(async (request: NextRequest, { supabase }) => {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Check if settings table exists by trying to query it
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .order('category')
      .order('key')

    if (error) {
      // If settings table doesn't exist, return empty settings
      if (error.code === 'PGRST205') {
        return NextResponse.json({
          settings: [],
          grouped: {},
          message: 'Settings table not yet created - using default configuration'
        })
      }
      throw error
    }

    // Group settings by category
    const grouped = settings?.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    }, {} as Record<string, typeof settings>)

    return NextResponse.json({
      settings: settings || [],
      grouped: grouped || {},
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
})

/**
 * PATCH /api/admin/settings
 * Update multiple settings at once
 */
export const PATCH = withAdminAuth(async (request: NextRequest, { userId, supabase }) => {
  try {
    const body = await request.json()
    const { updates } = body

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array of {key, value} objects' },
        { status: 400 }
      )
    }

    // Check if settings table exists first
    const { error: tableError } = await supabase
      .from('settings')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === 'PGRST205') {
      return NextResponse.json(
        { error: 'Settings table not yet created - cannot update settings' },
        { status: 503 }
      )
    }

    // Update each setting
    const results = []
    for (const update of updates) {
      const { key, value } = update

      if (!key) {
        continue
      }

      const { data, error } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
        .single()

      if (error) {
        console.error(`Error updating setting ${key}:`, error)
        continue
      }

      results.push(data)
    }

    // Log the action
    await logSuccess(
      AUDIT_ACTIONS.SETTINGS_UPDATE,
      'settings',
      'bulk',
      { updated_keys: updates.map((u: any) => u.key) },
      { updated_by: userId, count: results.length }
    )

    return NextResponse.json({
      updated: results,
      count: results.length,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/admin/settings
 * Create a new setting
 */
export const POST = withAdminAuth(async (request: NextRequest, { userId, supabase }) => {
  try {
    const body = await request.json()
    const { key, value, category, description, is_public = false } = body

    if (!key || value === undefined || !category) {
      return NextResponse.json(
        { error: 'Key, value, and category are required' },
        { status: 400 }
      )
    }

    // Check if settings table exists first
    const { error: tableError } = await supabase
      .from('settings')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === 'PGRST205') {
      return NextResponse.json(
        { error: 'Settings table not yet created - cannot create settings' },
        { status: 503 }
      )
    }

    const { data: setting, error } = await supabase
      .from('settings')
      .insert([{ key, value, category, description, is_public }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Setting with this key already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    // Log the action
    await logSuccess(
      AUDIT_ACTIONS.SETTINGS_CREATE,
      'settings',
      setting.id,
      { key, category },
      { created_by: userId }
    )

    return NextResponse.json({ setting }, { status: 201 })
  } catch (error) {
    console.error('Error creating setting:', error)
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    )
  }
})
