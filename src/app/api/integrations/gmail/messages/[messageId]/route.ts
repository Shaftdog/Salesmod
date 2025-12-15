import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Gets a single Gmail message by gmail_message_id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile with tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'No tenant assigned' }, { status: 403 });
    }

    // Get the gmail message
    const { data: message, error: messageError } = await supabase
      .from('gmail_messages')
      .select(`
        from_email,
        from_name,
        subject,
        snippet,
        body_text,
        body_html,
        received_at,
        category,
        confidence
      `)
      .eq('tenant_id', profile.tenant_id)
      .eq('gmail_message_id', messageId)
      .single();

    if (messageError) {
      if (messageError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }
      console.error('Error fetching message:', messageError);
      return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Gmail message error:', error);
    return NextResponse.json({ error: 'Failed to get message' }, { status: 500 });
  }
}
