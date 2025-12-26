import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/slack/connect
 * Initiates Slack OAuth flow - redirects user to Slack authorization
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Slack integration not configured' },
      { status: 500 }
    );
  }

  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Get user's tenant_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) {
    return NextResponse.json(
      { error: 'User has no tenant assigned' },
      { status: 403 }
    );
  }

  // Bot scopes needed for chat functionality
  const scopes = [
    'app_mentions:read',  // Receive @mentions
    'chat:write',         // Send messages
    'im:history',         // Read DM history
    'im:read',            // Access DM channels
    'im:write',           // Send DMs
    'users:read',         // Get user info
  ].join(',');

  // Store state for CSRF protection (tenant_id + user_id)
  const state = Buffer.from(
    JSON.stringify({ tenantId: profile.tenant_id, userId: user.id })
  ).toString('base64');

  // Build Slack OAuth URL
  const authUrl = new URL('https://slack.com/oauth/v2/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
