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

    // Use admin client to send invite
    const adminClient = getAdminClient()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Send magic link for existing users (acts as a login link)
    const { error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
      options: {
        redirectTo: `${appUrl}/dashboard`,
      },
    })

    if (error) {
      console.error('[Admin Send Invite] Generate link error:', error.message)

      // If user doesn't exist in auth, we may need to invite them
      // Try inviting instead
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
    }

    // Actually send the magic link email using signInWithOtp
    // generateLink only creates the link but doesn't send email
    const { error: sendError } = await adminClient.auth.signInWithOtp({
      email: profile.email,
      options: {
        emailRedirectTo: `${appUrl}/dashboard`,
        shouldCreateUser: false, // User already exists
      },
    })

    if (sendError) {
      console.error('[Admin Send Invite] OTP send error:', sendError.message)
      // Don't fail - the invite might have worked
    }

    console.log('[Admin Send Invite] Success', {
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
