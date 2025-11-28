/**
 * Password Reset Callback Route
 *
 * Handles the Supabase PKCE auth callback for password reset.
 * Exchanges the auth code for a session and redirects to the update password page.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  // Get the origin for redirects
  const origin = requestUrl.origin

  if (code) {
    // PKCE flow - exchange the code for a session
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Password Reset Callback] Code exchange failed:', error.message)
      return NextResponse.redirect(`${origin}/login?error=reset_failed&message=${encodeURIComponent(error.message)}`)
    }

    // Success - redirect to update password page
    return NextResponse.redirect(`${origin}/update-password`)
  }

  if (token_hash && type === 'recovery') {
    // Token hash flow - verify the OTP
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    })

    if (error) {
      console.error('[Password Reset Callback] Token verification failed:', error.message)
      return NextResponse.redirect(`${origin}/login?error=reset_failed&message=${encodeURIComponent(error.message)}`)
    }

    // Success - redirect to update password page
    return NextResponse.redirect(`${origin}/update-password`)
  }

  // No valid parameters
  console.error('[Password Reset Callback] Missing code or token_hash')
  return NextResponse.redirect(`${origin}/login?error=invalid_link`)
}
