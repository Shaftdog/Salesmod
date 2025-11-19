import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin/api-middleware'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logSuccess, logFailure } from '@/lib/admin/audit'

/**
 * Admin API endpoint to fix missing org_id on contacts
 *
 * This applies a data migration to backfill org_id values for contacts
 * by copying the org_id from their associated client records.
 *
 * **Authentication:** Requires admin role
 * **Operation:** Updates contacts.org_id WHERE org_id IS NULL
 * **Audit:** Logs all operations to audit_logs table
 *
 * @returns JSON response with success status and count of updated contacts
 */
export const POST = withAdminAuth(async (request: NextRequest, { userId }) => {
  const operationName = 'contacts.backfill_org_id'

  try {
    // Use service role client for privileged database operation
    const supabase = createServiceRoleClient()

    // Execute the migration using direct SQL update with JOIN
    // This is efficient and atomic - updates all contacts in one query
    const { data, error } = await supabase
      .rpc('execute_sql', {
        query: `
          UPDATE contacts
          SET org_id = clients.org_id
          FROM clients
          WHERE contacts.client_id = clients.id
            AND contacts.org_id IS NULL
          RETURNING contacts.id;
        `
      })

    if (error) {
      // Log failure for audit trail
      await logFailure(
        operationName,
        `Migration failed: ${error.message}`,
        'contacts',
        undefined,
        {
          error: error.message,
          error_code: error.code,
          admin_user: userId
        }
      )
      throw new Error(`Migration failed: ${error.message}`)
    }

    // Count how many contacts were updated
    const updatedCount = Array.isArray(data) ? data.length : 0

    // Log successful operation to audit trail
    await logSuccess(
      operationName,
      'contacts',
      undefined,
      undefined,
      {
        contacts_updated: updatedCount,
        admin_user: userId,
        timestamp: new Date().toISOString(),
      }
    )

    return NextResponse.json({
      success: true,
      message: `Successfully backfilled org_id for ${updatedCount} contacts`,
      updatedCount,
      details: {
        admin_user: userId,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    // Log error but don't expose internal details to client
    await logFailure(
      operationName,
      error.message || 'Unknown error',
      'contacts',
      undefined,
      {
        error: error.stack,
        admin_user: userId
      }
    )

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to apply migration',
      },
      { status: 500 }
    )
  }
})
