/**
 * User Registration API Route
 *
 * Creates new user + tenant in atomic operation
 * Requirements: FR-1.1
 * Reference: docs/client-portal/04-TASKS/phase-1/1.1-multi-tenant-auth.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeAsAdmin, deleteOrphanedUser } from '@/lib/supabase/admin';
import { registerSchema } from '@/lib/validations/auth';
import { z } from 'zod';

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

    const { email, password, name, tenantName, tenantType } = validation.data;

    // 2. Create user with Supabase Auth
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          // Will be updated after tenant creation
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

    // 3. Create tenant (requires service-role)
    try {
      const tenant = await executeAsAdmin(
        'create_tenant_during_registration',
        userId,
        async (adminClient) => {
          const { data, error } = await adminClient
            .from('tenants')
            .insert({
              name: tenantName,
              type: tenantType,
              owner_id: userId,
            })
            .select()
            .single();

          if (error) {
            throw new Error(`Tenant creation failed: ${error.message}`);
          }

          return data;
        }
      );

      console.log('[Registration] Tenant created', {
        tenantId: tenant.id,
        tenantName: tenant.name,
        userId,
      });

      // 4. Update profile with tenant info (requires service-role)
      await executeAsAdmin(
        'link_user_to_tenant',
        userId,
        async (adminClient) => {
          const { error } = await adminClient
            .from('profiles')
            .update({
              tenant_id: tenant.id,
              tenant_type: tenantType,
            })
            .eq('id', userId);

          if (error) {
            throw new Error(`Profile update failed: ${error.message}`);
          }
        }
      );

      console.log('[Registration] Profile updated with tenant', {
        userId,
        tenantId: tenant.id,
      });

      // 5. Success response
      return NextResponse.json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        userId,
        tenantId: tenant.id,
        email,
      });

    } catch (tenantError) {
      // Delete the orphaned auth user to allow re-registration
      try {
        await deleteOrphanedUser(
          userId,
          `Tenant creation failed: ${tenantError instanceof Error ? tenantError.message : 'Unknown error'}`
        );
      } catch (deleteError) {
        console.error('[Registration] Failed to delete orphaned user', {
          userId,
          email,
          deleteError: deleteError instanceof Error ? deleteError.message : 'Unknown error',
        });
      }

      console.error('[Registration] Tenant creation failed, user deleted', {
        userId,
        email,
        error: tenantError instanceof Error ? tenantError.message : 'Unknown error',
      });

      return NextResponse.json(
        {
          error: 'Registration failed. Please try again.',
          code: 'TENANT_CREATION_FAILED',
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
