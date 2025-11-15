import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Disconnects Gmail integration
 * Removes OAuth tokens and disables sync
 */
export async function POST(request: NextRequest) {
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

    // Get org_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Delete OAuth tokens
    const { error: deleteError } = await supabase
      .from('oauth_tokens')
      .delete()
      .eq('org_id', profile.id)
      .eq('provider', 'google');

    if (deleteError) {
      console.error('Failed to delete OAuth tokens:', deleteError);
      throw deleteError;
    }

    // Disable Gmail sync
    const { error: syncError } = await supabase
      .from('gmail_sync_state')
      .update({
        is_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', profile.id);

    if (syncError) {
      console.error('Failed to disable sync:', syncError);
    }

    return NextResponse.json({
      success: true,
      message: 'Gmail disconnected successfully',
    });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Gmail' },
      { status: 500 }
    );
  }
}
