import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zqhenxhgcjxslpfezybm.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaGVueGhnY2p4c2xwZmV6eWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzE2ODMsImV4cCI6MjA3NTk0NzY4M30.Lfpl219L15r_vtoeXvuaGlRrhq4s-_7L67IYW3eTrSE';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

/**
 * Get or create a test user and return authentication session
 */
export async function getTestUserSession(): Promise<AuthSession | null> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Try to sign in with test credentials
  const testEmail = 'test@appraisetrack.com';
  const testPassword = 'TestPassword123!';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.error('Failed to authenticate test user:', error.message);
      return null;
    }

    if (!data.session) {
      console.error('No session returned from authentication');
      return null;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      userId: data.user.id,
      email: data.user.email || testEmail,
    };
  } catch (error) {
    console.error('Error during authentication:', error);
    return null;
  }
}

/**
 * Set authentication cookies in the browser to simulate logged-in user
 */
export async function setAuthSession(page: Page, session: AuthSession): Promise<void> {
  // Navigate to the app first to set the domain
  await page.goto('http://localhost:9002');

  // Set Supabase auth cookies/localStorage
  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      const authData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user',
          email: 'test@appraisetrack.com',
        },
      };

      // Supabase stores session in localStorage with a specific key format
      const storageKey = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
      localStorage.setItem(
        storageKey,
        JSON.stringify(authData)
      );

      // Also try the standard format
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify(authData)
      );
    },
    { accessToken: session.accessToken, refreshToken: session.refreshToken }
  );

  console.log('✓ Authentication session set in browser');
}

/**
 * Complete authentication flow: get session and set it in browser
 */
export async function authenticateTestUser(page: Page): Promise<boolean> {
  const session = await getTestUserSession();

  if (!session) {
    console.error('❌ Failed to get test user session');
    return false;
  }

  console.log('✓ Test user authenticated successfully');
  await setAuthSession(page, session);

  return true;
}
