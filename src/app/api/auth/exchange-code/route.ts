/**
 * Server-side PKCE Code Exchange
 *
 * This endpoint exchanges a PKCE authorization code for a session.
 * It's used as a fallback when client-side exchange fails (e.g., when
 * an admin triggers a password reset for another user and the user's
 * browser doesn't have the code verifier).
 *
 * Using the service role key allows us to exchange the code without
 * the code verifier that would normally be required.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    // Use service role client to exchange the code
    // This bypasses the need for the code verifier
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Exchange Code] SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[Exchange Code] NEXT_PUBLIC_SUPABASE_URL not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Exchange the code for a session using admin API
    // Note: For recovery flows, we need to use a different approach
    // We'll verify the code and return session tokens
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Exchange Code] Exchange error:', error.message)

      // If the code is invalid or expired, return a clear message
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'The password reset link has expired or is invalid. Please request a new one.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 400 }
      )
    }

    // Return the session tokens so the client can set them
    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      }
    })

  } catch (error) {
    console.error('[Exchange Code] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to exchange authorization code' },
      { status: 500 }
    )
  }
}
