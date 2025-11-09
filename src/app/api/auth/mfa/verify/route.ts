/**
 * MFA Verify API Route
 *
 * Verifies TOTP code and completes MFA enrollment
 * Requirements: FR-1.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mfaVerifySchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = mfaVerifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { code, factorId } = validation.data;

    // Create MFA challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      console.error('[MFA Verify] Challenge creation failed', {
        userId: user.id,
        factorId,
        error: challengeError.message,
      });

      throw new Error(`MFA challenge failed: ${challengeError.message}`);
    }

    // Verify the code
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      console.log('[MFA Verify] Verification failed', {
        userId: user.id,
        factorId,
        error: verifyError.message,
      });

      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    console.log('[MFA Verify] MFA enabled successfully', {
      userId: user.id,
      factorId,
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication enabled successfully!',
    });

  } catch (error) {
    console.error('[MFA Verify] Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'MFA verification failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
