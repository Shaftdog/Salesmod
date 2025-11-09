/**
 * Password Reset API Route
 *
 * Sends password reset email to user
 * Requirements: FR-1.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resetPasswordSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Parse and validate request
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/callback`,
    });

    if (error) {
      console.error('[Password Reset] Failed', {
        email,
        error: error.message,
      });

      // Don't reveal whether email exists (security best practice)
      // Always return success to prevent email enumeration
    } else {
      console.log('[Password Reset] Email sent', {
        email,
        timestamp: new Date().toISOString(),
      });
    }

    // Always return success (security: don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });

  } catch (error) {
    console.error('[Password Reset] Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Even on error, return success message (security)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  }
}
