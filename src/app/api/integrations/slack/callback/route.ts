import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/slack/callback
 * Handles OAuth callback from Slack after user authorizes
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user cancellation
  if (error) {
    console.error('[Slack OAuth] User cancelled or error:', error);
    return NextResponse.redirect(
      new URL('/settings/integrations?slack=cancelled', request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings/integrations?slack=error&message=missing_params', request.url)
    );
  }

  // Decode state
  let stateData: { tenantId: string; userId: string };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
  } catch {
    return NextResponse.redirect(
      new URL('/settings/integrations?slack=error&message=invalid_state', request.url)
    );
  }

  // Verify user is still authenticated and matches state
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || user.id !== stateData.userId) {
    return NextResponse.redirect(
      new URL('/login?redirect=/settings/integrations', request.url)
    );
  }

  // Exchange code for access token
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`;

  if (!clientId || !clientSecret) {
    console.error('[Slack OAuth] Missing client credentials');
    return NextResponse.redirect(
      new URL('/settings/integrations?slack=error&message=not_configured', request.url)
    );
  }

  try {
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('[Slack OAuth] Token exchange failed:', tokenData.error);
      return NextResponse.redirect(
        new URL(`/settings/integrations?slack=error&message=${tokenData.error}`, request.url)
      );
    }

    // Extract token data
    const {
      access_token,
      team,
      bot_user_id,
      scope,
      authed_user,
    } = tokenData;

    // Store integration in database
    const { error: insertError } = await supabase
      .from('slack_integrations')
      .upsert({
        tenant_id: stateData.tenantId,
        slack_team_id: team.id,
        slack_team_name: team.name,
        bot_token: access_token,
        bot_user_id: bot_user_id,
        scope: scope,
        authed_user_id: authed_user?.id,
        enabled: true,
        installed_by: user.id,
      }, {
        onConflict: 'slack_team_id',
      });

    if (insertError) {
      console.error('[Slack OAuth] Database error:', insertError);
      return NextResponse.redirect(
        new URL('/settings/integrations?slack=error&message=db_error', request.url)
      );
    }

    console.log('[Slack OAuth] Successfully connected workspace:', team.name);

    return NextResponse.redirect(
      new URL('/settings/integrations?slack=success', request.url)
    );
  } catch (err: any) {
    console.error('[Slack OAuth] Exception:', err);
    return NextResponse.redirect(
      new URL('/settings/integrations?slack=error&message=exception', request.url)
    );
  }
}
