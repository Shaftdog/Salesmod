import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

/**
 * Initiates Gmail OAuth2 flow
 * Redirects user to Google consent screen
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Google OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`
    );

    // Gmail API scopes
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly', // Read emails
      'https://www.googleapis.com/auth/gmail.send', // Send emails
      'https://www.googleapis.com/auth/gmail.modify', // Modify labels/state
      'https://www.googleapis.com/auth/userinfo.email', // Get user email
    ];

    // Generate auth URL with state
    const state = Buffer.from(
      JSON.stringify({
        orgId: profile.id,
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: scopes,
      state,
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Gmail OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Gmail connection' },
      { status: 500 }
    );
  }
}
