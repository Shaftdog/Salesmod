import { withAdminAuth } from '@/lib/admin/api-middleware'
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

    // Create admin client with service role key
    const { createClient } = await import('@supabase/supabase-js')
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create auth user using Admin API
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create auth user' },
        { status: 500 }
      )
    }

    // The trigger will automatically create the profile
    // Now update the profile with the role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', authUser.user.id)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating profile role:', profileError)
      // User was created, but role update failed - still return success
    }

    const newUser = profile || { id: authUser.user.id, email, name, role }

    // Log the action
    await logSuccess(
      AUDIT_ACTIONS.USER_CREATE,
      'user',
      authUser.user.id,
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
