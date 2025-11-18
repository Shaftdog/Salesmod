import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Admin API endpoint to fix missing org_id on contacts
 * This applies the migration to backfill org_id from clients
 *
 * WARNING: This uses service role and should only be called by admins
 */
export async function POST(request: Request) {
  try {
    const supabase = createServiceRoleClient()

    // Run the migration query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Backfill org_id for contacts linked to clients
        UPDATE contacts
        SET org_id = clients.org_id
        FROM clients
        WHERE contacts.client_id = clients.id
          AND contacts.org_id IS NULL;
      `
    })

    if (error) {
      // If rpc doesn't exist, try direct query
      console.log('RPC not available, trying direct query...')

      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, client_id')
        .is('org_id', null)
        .not('client_id', 'is', null)

      if (contactsError) throw contactsError

      // Update each contact
      let updatedCount = 0
      for (const contact of contacts || []) {
        const { data: client } = await supabase
          .from('clients')
          .select('org_id')
          .eq('id', contact.client_id)
          .single()

        if (client?.org_id) {
          const { error: updateError } = await supabase
            .from('contacts')
            .update({ org_id: client.org_id })
            .eq('id', contact.id)

          if (!updateError) {
            updatedCount++
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Fixed org_id for ${updatedCount} contacts`,
        updatedCount,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully',
      data,
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
}
