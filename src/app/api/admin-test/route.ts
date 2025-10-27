import { withAdminAuth } from '@/lib/admin/api-middleware'
import { NextResponse } from 'next/server'

/**
 * Admin-only test endpoint
 *
 * This endpoint tests the admin authentication middleware.
 * Only users with the 'admin' role can access this.
 *
 * Test it by visiting: /api/admin-test
 *
 * Expected results:
 * - As admin: Returns JSON with success message and user list
 * - As non-admin: Returns {"error": "Unauthorized: Admin access required"} with 403 status
 * - Not logged in: Returns {"error": "Unauthorized: Not authenticated"} with 401 status
 */
export const GET = withAdminAuth(async (request, { userId, supabase }) => {
  // This code only executes if the user is an admin
  // The withAdminAuth middleware has already verified the user's admin status

  try {
    // Fetch some user data to demonstrate admin access
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin authentication successful!',
      yourUserId: userId,
      timestamp: new Date().toISOString(),
      data: {
        totalUsers: users?.length || 0,
        users: users?.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role || 'user',
          createdAt: u.created_at
        }))
      }
    })
  } catch (error) {
    console.error('Error in admin test endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
