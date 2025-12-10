/**
 * User Registration API Route
 *
 * Creates new user and adds them to the existing main tenant.
 * IMPORTANT: This system uses a SINGLE TENANT model - all users belong to the same organization.
 * Do NOT create new tenants for each user!
 *
 * Requirements: FR-1.1
 * Reference: docs/client-portal/04-TASKS/phase-1/1.1-multi-tenant-auth.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeAsAdmin, deleteOrphanedUser } from '@/lib/supabase/admin';
import { registerSchema } from '@/lib/validations/auth';
import { z } from 'zod';

// The single main tenant ID - all users belong to this organization
const MAIN_TENANT_ID = 'da0563f7-7d29-4c02-b835-422f31c82b7b';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;
    // Note: tenantName and tenantType are ignored - we use the single main tenant

    // 2. Create user with Supabase Auth
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (authError) {
      // Handle specific Supabase errors - prevent email enumeration
      if (authError.message.includes('already registered')) {
        // Return generic success message to prevent email enumeration
        console.log('[Registration] Email already registered', { email });
        return NextResponse.json(
          {
            success: true,
            message: 'If this email is not already registered, you will receive a confirmation email.',
          },
          { status: 200 }
        );
      }

      throw new Error(`User creation failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed: No user returned');
    }

    const userId = authData.user.id;

    console.log('[Registration] User created', {
      userId,
      email,
      timestamp: new Date().toISOString(),
    });

    // 3. Add user to the EXISTING main tenant (NO NEW TENANT CREATION!)
    try {
      // Verify main tenant exists
      const tenantCheck = await executeAsAdmin(
        'verify_main_tenant',
        userId,
        async (adminClient) => {
          const { data, error } = await adminClient
            .from('tenants')
            .select('id, name')
            .eq('id', MAIN_TENANT_ID)
            .single();

          if (error || !data) {
            throw new Error('Main tenant not found - contact administrator');
          }

          return data;
        }
      );

      console.log('[Registration] Using existing tenant', {
        tenantId: tenantCheck.id,
        tenantName: tenantCheck.name,
        userId,
      });

      // 4. Update profile with main tenant info (requires service-role)
      await executeAsAdmin(
        'link_user_to_tenant',
        userId,
        async (adminClient) => {
          const { error } = await adminClient
            .from('profiles')
            .update({
              tenant_id: MAIN_TENANT_ID,
              tenant_type: 'internal',
            })
            .eq('id', userId);

          if (error) {
            throw new Error(`Profile update failed: ${error.message}`);
          }
        }
      );

      console.log('[Registration] Profile linked to main tenant', {
        userId,
        tenantId: MAIN_TENANT_ID,
      });

      // 5. Success response
      return NextResponse.json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        userId,
        tenantId: MAIN_TENANT_ID,
        email,
      });

    } catch (tenantError) {
      // Delete the orphaned auth user to allow re-registration
      try {
        await deleteOrphanedUser(
          userId,
          `Tenant linking failed: ${tenantError instanceof Error ? tenantError.message : 'Unknown error'}`
        );
      } catch (deleteError) {
        console.error('[Registration] Failed to delete orphaned user', {
          userId,
          email,
          deleteError: deleteError instanceof Error ? deleteError.message : 'Unknown error',
        });
      }

      console.error('[Registration] Tenant linking failed, user deleted', {
        userId,
        email,
        error: tenantError instanceof Error ? tenantError.message : 'Unknown error',
      });

      return NextResponse.json(
        {
          error: 'Registration failed. Please try again.',
          code: 'TENANT_LINKING_FAILED',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('[Registration] Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Registration failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
