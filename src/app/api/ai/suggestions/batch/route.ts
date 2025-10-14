import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateSuggestions, type ClientContext } from '@/lib/ai/agent-service'

/**
 * POST /api/ai/suggestions/batch
 * 
 * Generate suggestions for multiple clients or all clients
 * Body: { clientIds?: string[] } - If empty, generates for all clients
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { clientIds } = body

    // Fetch clients to analyze
    let query = supabase.from('clients').select('id, name, company')
    
    if (clientIds && clientIds.length > 0) {
      query = query.in('id', clientIds)
    }

    const { data: clients, error: clientsError } = await query.limit(10) // Safety limit

    if (clientsError) {
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      )
    }

    const results = []

    for (const client of clients || []) {
      try {
        // Fetch context for this client
        const contextResponse = await fetch(
          `${request.url.split('/api')[0]}/api/ai/context?clientId=${client.id}`,
          {
            headers: {
              cookie: request.headers.get('cookie') || '',
            }
          }
        )

        if (!contextResponse.ok) {
          results.push({
            clientId: client.id,
            clientName: client.name || client.company,
            success: false,
            error: 'Failed to fetch context'
          })
          continue
        }

        const context: ClientContext = await contextResponse.json()

        // Generate suggestions
        const suggestions = await generateSuggestions(context)

        // Save suggestions to database
        let savedCount = 0
        for (const suggestion of suggestions) {
          const { error: saveError } = await supabase
            .from('agent_suggestions')
            .insert({
              client_id: client.id,
              suggestion_type: suggestion.type,
              priority: suggestion.priority,
              title: suggestion.title,
              description: suggestion.description,
              reasoning: suggestion.reasoning,
              action_data: suggestion.actionData,
              status: 'pending',
              created_by: user.id,
            })

          if (!saveError) {
            savedCount++
          }
        }

        results.push({
          clientId: client.id,
          clientName: client.name || client.company,
          success: true,
          suggestionsGenerated: savedCount
        })

        // Log usage
        await supabase.from('ai_usage_logs').insert({
          user_id: user.id,
          operation_type: 'suggestion_generation',
          model_used: 'gpt-4o-mini',
          tokens_used: 500, // Estimated
          estimated_cost: 0.000075, // Estimated
          client_id: client.id,
          success: true,
        })

      } catch (error) {
        results.push({
          clientId: client.id,
          clientName: client.name || client.company,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    })

  } catch (error) {
    console.error('Error generating batch suggestions:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate batch suggestions'
      },
      { status: 500 }
    )
  }
}

