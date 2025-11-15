import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

/**
 * Gmail OAuth2 callback handler
 * Exchanges authorization code for tokens and stores them
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Gmail OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=invalid_callback`
      );
    }

    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { orgId, userId } = stateData;

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=unauthorized`
      );
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's Gmail email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      throw new Error('Failed to get user email from Google');
    }

    // Calculate token expiration
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // Store tokens in database
    const { error: insertError } = await supabase.from('oauth_tokens').upsert(
      {
        org_id: orgId,
        provider: 'google',
        account_email: userInfo.email,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || null,
        expires_at: expiresAt.toISOString(),
        scopes: tokens.scope?.split(' ') || [],
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'org_id,provider,account_email',
      }
    );

    if (insertError) {
      console.error('Failed to store OAuth tokens:', insertError);
      throw insertError;
    }

    // Initialize Gmail sync state
    const { error: syncError } = await supabase.from('gmail_sync_state').upsert(
      {
        org_id: orgId,
        is_enabled: true,
        auto_process: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'org_id',
      }
    );

    if (syncError) {
      console.error('Failed to initialize sync state:', syncError);
    }

    // Redirect to settings with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?success=gmail_connected&email=${encodeURIComponent(userInfo.email)}`
    );
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=connection_failed`
    );
  }
}
