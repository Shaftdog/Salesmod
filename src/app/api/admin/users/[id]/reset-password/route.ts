/**
 * Admin API: Reset Password for User
 *
 * Sends a password reset email to the specified user.
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

    // Use admin client to send password reset
    const adminClient = getAdminClient()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Generate password reset link
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
      options: {
        redirectTo: `${appUrl}/auth/reset-password/callback`,
      },
    })

    if (error) {
      console.error('[Admin Reset Password] Error:', error.message)
      return NextResponse.json(
        { error: `Failed to generate reset link: ${error.message}` },
        { status: 500 }
      )
    }

    // The generateLink returns the action_link that we need to send via email
    // For now, we'll use the built-in email method
    const { error: resetError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
      options: {
        redirectTo: `${appUrl}/auth/reset-password/callback`,
      },
    })

    // Use resetPasswordForEmail which actually sends the email
    const { error: sendError } = await adminClient.auth.resetPasswordForEmail(
      profile.email,
      {
        redirectTo: `${appUrl}/auth/reset-password/callback`,
      }
    )

    if (sendError) {
      console.error('[Admin Reset Password] Send error:', sendError.message)
      return NextResponse.json(
        { error: `Failed to send reset email: ${sendError.message}` },
        { status: 500 }
      )
    }

    console.log('[Admin Reset Password] Success', {
      userId,
      email: profile.email,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${profile.email}`,
    })

  } catch (error) {
    console.error('[Admin Reset Password] Error:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}
