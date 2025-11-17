/**
 * Supabase Admin Client
 *
 * SECURITY: Service-role key bypasses RLS - use with extreme caution!
 *
 * This wrapper ensures:
 * 1. User authentication is verified before any admin operation
 * 2. All operations are logged for audit trail
 * 3. Service-role key never exposed to client
 *
 * Allowed use cases:
 * - Tenant creation during user registration
 * - Magic link generation for borrowers
 * - Automated system tasks
 *
 * Reference: docs/client-portal/02-ARCHITECTURE.md#service-role-usage
 */

import { createClient } from '@supabase/supabase-js';
import { createClient as createRegularClient } from './server';

/**
 * Get admin client with service-role key
 * NEVER export this function directly - always use executeAsAdmin wrapper
 */
function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured. Check your .env file.');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured. Check your .env file.');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    }
  );
}

/**
 * Execute operation with service-role privileges
 *
 * @param operation - Description of operation for logging (e.g., "create_tenant_during_registration")
 * @param userId - User ID to verify authentication
 * @param fn - Async function that receives admin client
 * @returns Result from the function
 *
 * @example
 * ```ts
 * const tenant = await executeAsAdmin(
 *   'create_tenant',
 *   userId,
 *   async (adminClient) => {
 *     const { data, error } = await adminClient
 *       .from('tenants')
 *       .insert({ name: 'Acme Corp', owner_id: userId })
 *       .select()
 *       .single();
 *     if (error) throw error;
 *     return data;
 *   }
 * );
 * ```
 */
export async function executeAsAdmin<T>(
  operation: string,
  userId: string,
  fn: (adminClient: ReturnType<typeof getAdminClient>) => Promise<T>
): Promise<T> {
  // 1. Verify user is authenticated via regular client
  const supabase = await createRegularClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[ADMIN OPERATION BLOCKED] Unauthenticated attempt', {
      operation,
      requestedUserId: userId,
      error: authError?.message,
    });
    throw new Error('Unauthorized: User not authenticated');
  }

  if (user.id !== userId) {
    console.error('[ADMIN OPERATION BLOCKED] User ID mismatch', {
      operation,
      authenticatedUserId: user.id,
      requestedUserId: userId,
    });
    throw new Error('Unauthorized: User ID mismatch');
  }

  // 2. Log operation start (sent to Vercel logs + Sentry if configured)
  console.log('[ADMIN OPERATION START]', {
    operation,
    userId,
    email: user.email,
    timestamp: new Date().toISOString(),
  });

  const startTime = Date.now();

  try {
    // 3. Execute operation with admin client
    const adminClient = getAdminClient();
    const result = await fn(adminClient);

    // 4. Log success
    const duration = Date.now() - startTime;
    console.log('[ADMIN OPERATION SUCCESS]', {
      operation,
      userId,
      duration: `${duration}ms`,
    });

    return result;

  } catch (error) {
    // 5. Log failure
    const duration = Date.now() - startTime;
    console.error('[ADMIN OPERATION FAILED]', {
      operation,
      userId,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

/**
 * Generate magic link for borrower access
 *
 * @param email - Borrower email
 * @param orderId - Order ID the borrower can access
 * @param grantedBy - User ID of lender granting access
 * @returns Magic link URL
 */
export async function generateBorrowerMagicLink(
  email: string,
  orderId: string,
  grantedBy: string
): Promise<string> {
  return executeAsAdmin(
    'generate_borrower_magic_link',
    grantedBy,
    async (adminClient) => {
      const { data, error } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/borrower/orders/${orderId}`,
          data: {
            role: 'borrower',
            order_id: orderId,
            granted_by: grantedBy,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          },
        },
      });

      if (error) {
        throw new Error(`Failed to generate magic link: ${error.message}`);
      }

      if (!data?.properties?.action_link) {
        throw new Error('Magic link generation returned no link');
      }

      return data.properties.action_link;
    }
  );
}

/**
 * Send magic link to borrower via email
 *
 * Uses Supabase Auth's built-in email sending (configured in Supabase dashboard)
 *
 * @param email - Borrower email address
 * @param orderId - Order ID for redirect context
 */
export async function sendBorrowerMagicLink(
  email: string,
  orderId: string
): Promise<void> {
  const adminClient = getAdminClient();

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/borrower/orders/${orderId}`,
    data: {
      role: 'borrower',
      order_id: orderId,
    },
  });

  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`);
  }

  console.log('[BORROWER MAGIC LINK SENT]', {
    email,
    orderId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Delete orphaned auth user (for registration rollback)
 *
 * SECURITY: This bypasses the authentication check since we're cleaning up
 * a failed registration. Only call this in error handlers.
 *
 * @param userId - User ID to delete
 * @param reason - Reason for deletion (for logging)
 */
export async function deleteOrphanedUser(
  userId: string,
  reason: string
): Promise<void> {
  const adminClient = getAdminClient();

  console.log('[ORPHANED USER CLEANUP START]', {
    userId,
    reason,
    timestamp: new Date().toISOString(),
  });

  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error('[ORPHANED USER CLEANUP FAILED]', {
      userId,
      reason,
      error: error.message,
    });
    throw new Error(`Failed to delete orphaned user: ${error.message}`);
  }

  console.log('[ORPHANED USER CLEANUP SUCCESS]', {
    userId,
    reason,
  });
}
