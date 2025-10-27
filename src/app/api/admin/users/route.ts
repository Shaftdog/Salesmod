import { withAdminAuth } from '@/lib/admin/api-middleware'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { NextRequest, NextResponse } from 'next/server'
import { logSuccess } from '@/lib/admin/audit'
import { AUDIT_ACTIONS } from '@/lib/admin/audit'

/**
 * GET /api/admin/users
 * List all users with optional filtering and pagination
 */
export const GET = withAdminAuth(async (request: NextRequest, { supabase }) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply role filter
    if (role) {
      query = query.eq('role', role)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(from, to)

    const { data: users, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export const POST = withAdminAuth(async (request: NextRequest, { userId, supabase }) => {
  try {
    const body = await request.json()
    const { email, name, role = 'user' } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Create auth user (this would typically be done through Supabase Admin API)
    // For now, we'll just create the profile entry
    // In production, you'd want to use Supabase Admin API to create auth.users entry first

    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert([{ email, name, role }])
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log the action
    await logSuccess(
      AUDIT_ACTIONS.USER_CREATE,
      'user',
      newUser.id,
      { name, email, role },
      { created_by: userId }
    )

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
})
