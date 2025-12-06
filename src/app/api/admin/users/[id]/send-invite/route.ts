/**
 * Admin API: Send Invite/Welcome Link to User
 *
 * Sends an invite or magic link email to the specified user.
 * Useful for onboarding new users or resending invitations.
 * Only accessible by admins and super_admins.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/permissions'

function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createServerClient()

    // Verify admin access
    await requireAdmin(supabase)

    // Get user's email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Use admin client to send magic link
    const adminClient = getAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // First check if user exists in auth system
    const { data: authUser, error: getUserError } = await adminClient.auth.admin.getUserById(userId)

    if (getUserError || !authUser?.user) {
      console.error('[Admin Send Invite] User not found in auth system:', getUserError?.message)

      // User doesn't exist in auth - try to invite them
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        profile.email,
        {
          redirectTo: `${appUrl}/dashboard`,
          data: {
            name: profile.name,
          },
        }
      )

      if (inviteError) {
        console.error('[Admin Send Invite] Invite error:', inviteError.message)
        return NextResponse.json(
          { error: `Failed to send invite: ${inviteError.message}` },
          { status: 500 }
        )
      }

      console.log('[Admin Send Invite] Invite sent to new user', {
        userId,
        email: profile.email,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: `Invite email sent to ${profile.email}`,
      })
    }

    // User exists in auth - send magic link using signInWithOtp
    // This is the primary method that actually sends the email
    const { error: otpError } = await adminClient.auth.signInWithOtp({
      email: profile.email,
      options: {
        emailRedirectTo: `${appUrl}/dashboard`,
        shouldCreateUser: false, // User already exists
      },
    })

    if (otpError) {
      console.error('[Admin Send Invite] OTP send error:', otpError.message)
      return NextResponse.json(
        { error: `Failed to send login link: ${otpError.message}` },
        { status: 500 }
      )
    }

    console.log('[Admin Send Invite] Magic link sent', {
      userId,
      email: profile.email,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Login link sent to ${profile.email}`,
    })

  } catch (error) {
    console.error('[Admin Send Invite] Error:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send invite email' },
      { status: 500 }
    )
  }
}
