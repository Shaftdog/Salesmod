import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: authError.message 
      }, { status: 401 })
    }

    // Try to fetch clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5)
    
    if (clientsError) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: clientsError.message,
        code: clientsError.code,
        hint: clientsError.hint
      }, { status: 500 })
    }

    // Try to fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    return NextResponse.json({
      success: true,
      user: user ? { id: user.id, email: user.email } : null,
      clientsCount: clients?.length || 0,
      profilesCount: profiles?.length || 0,
      clients: clients || [],
      profiles: profiles || []
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error.message 
    }, { status: 500 })
  }
}

