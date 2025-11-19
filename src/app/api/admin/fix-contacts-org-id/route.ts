import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin/api-middleware'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Admin API endpoint to fix missing org_id on contacts
 * This applies the migration to backfill org_id from clients
 *
 * Requires admin authentication
 */
export const POST = withAdminAuth(async (request: NextRequest, { userId }) => {
  try {
    // Use service role client for the migration operation
    const supabase = createServiceRoleClient()

    // Execute the migration using raw SQL
    // This is more efficient than N+1 queries and doesn't depend on RPC
    const { data, error, count } = await supabase
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
      throw new Error(`Migration failed: ${error.message}`)
    }

    // Count how many contacts were updated
    const updatedCount = Array.isArray(data) ? data.length : 0

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
    console.error('Error fixing contacts org_id:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to apply migration',
      },
      { status: 500 }
    )
  }
})
