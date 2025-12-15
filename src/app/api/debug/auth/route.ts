/**
 * DEBUG ENDPOINT - Check authentication status
 * DELETE THIS FILE after debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({
        authenticated: false,
        authError: authError.message,
        errorCode: authError.code,
      });
    }

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: 'No user found',
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, org_id')
      .eq('id', user.id)
      .single();

    // Extract org_id from metadata
    const metadataOrgId = user.user_metadata?.org_id || user.app_metadata?.org_id;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      profile: profileError ? { error: profileError.message } : profile,
      orgId: {
        fromMetadata: metadataOrgId,
        fromProfile: profile?.org_id,
        hasOrgId: !!metadataOrgId,
      },
      canManageCampaigns: profile && ['admin', 'sales_manager'].includes(profile.role),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
