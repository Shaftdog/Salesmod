import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAudienceSize, validateAudienceFilter } from '@/lib/marketing/audience-builder';
import { AudienceFilter } from '@/lib/types/marketing';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org_id from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const orgId = profile.id;

    const filter: AudienceFilter = await request.json();

    // Validate filter
    const validation = validateAudienceFilter(filter);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const size = await getAudienceSize(orgId, filter);

    return NextResponse.json({ size, filter });
  } catch (error: any) {
    console.error('Error in POST /api/marketing/audiences/calculate-size:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
