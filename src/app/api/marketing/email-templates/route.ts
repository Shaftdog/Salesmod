import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createEmailTemplate,
  listEmailTemplates,
  CreateEmailTemplateInput,
} from '@/lib/marketing/email-template-service';
import { createEmailTemplateSchema } from '@/lib/validation/marketing';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const orgId = profile.id;

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const templates = await listEmailTemplates(orgId, {
      category,
      isActive,
      limit,
      offset,
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error in GET /api/marketing/email-templates:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const orgId = profile.id;

    const body = await request.json();

    // SECURITY: Validate input with Zod schema
    const validated = createEmailTemplateSchema.parse(body);

    const template = await createEmailTemplate(orgId, user.id, validated as CreateEmailTemplateInput);

    if (!template) {
      return NextResponse.json(
        { error: 'Failed to create email template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/marketing/email-templates:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
