/**
 * MFA Setup API Route
 *
 * Enrolls user in TOTP-based two-factor authentication
 * Requirements: FR-1.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Enroll in MFA (TOTP)
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    });

    if (error) {
      console.error('[MFA Setup] Enrollment failed', {
        userId: user.id,
        error: error.message,
      });

      throw new Error(`MFA enrollment failed: ${error.message}`);
    }

    console.log('[MFA Setup] Enrollment initiated', {
      userId: user.id,
      factorId: data.id,
    });

    return NextResponse.json({
      success: true,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
      uri: data.totp.uri,
    });

  } catch (error) {
    console.error('[MFA Setup] Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'MFA setup failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
