import { withAdminAuth } from '@/lib/admin/api-middleware'
import { AUDIT_ACTIONS, logSuccess } from '@/lib/admin/audit'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/users/[id]
 * Get a single user by ID
 */
export const GET = withAdminAuth(async (request: NextRequest, { supabase, params }) => {
  try {
    const { id: rawId } = await params
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Get user's recent activity
    const { data: recentActivity } = await supabase
      .from('audit_logs')
      .select('id, action, resource_type, created_at, status')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      user,
      recentActivity: recentActivity || [],
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/admin/users/[id]
 * Update a user's details
 */
export const PUT = withAdminAuth(async (request: NextRequest, { userId, supabase, params }) => {
  try {
    const { id: rawId } = await params
    const id = Array.isArray(rawId) ? rawId[0] : rawId
    const body = await request.json()
    const { name, email, role } = body

    // Validate input
    if (!name && !email && !role) {
      return NextResponse.json(
        { error: 'At least one field (name, email, or role) is required' },
        { status: 400 }
      )
    }

    // Prevent users from removing the last admin
    if (role && role !== 'admin') {
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single()

      if (currentUser?.role === 'admin') {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin')

        if (count === 1) {
          return NextResponse.json(
            { error: 'Cannot remove the last admin user' },
            { status: 400 }
          )
        }
      }
    }

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (name) updates.name = name
    if (email) updates.email = email
    if (role) updates.role = role

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log the action
    await logSuccess(
      AUDIT_ACTIONS.USER_UPDATE,
      'user',
      id,
      updates,
      { updated_by: userId }
    )

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (soft delete by deactivating)
 */
export const DELETE = withAdminAuth(async (request: NextRequest, { userId, supabase, params }) => {
  try {
    const { id: rawId } = await params
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    // Prevent deletion of self
    if (id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user is an admin
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single()

    if (targetUser?.role === 'admin') {
      // Prevent deletion of last admin
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')

      if (count === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        )
      }
    }

    // Soft delete: mark as inactive or update role
    // For now, we'll just delete the profile record
    // In production, you might want to implement soft deletes
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    // Log the action
    await logSuccess(
      AUDIT_ACTIONS.USER_DELETE,
      'user',
      id,
      {},
      { deleted_by: userId }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
})
