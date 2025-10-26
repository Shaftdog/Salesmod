import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        authenticated: false,
        authError: authError?.message,
      });
    }

    // Test basic contacts query
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone')
      .limit(10);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        count: 0,
        authenticated: true,
        userId: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      count: contacts?.length || 0,
      contacts: contacts || [],
      authenticated: true,
      userId: user.id,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
