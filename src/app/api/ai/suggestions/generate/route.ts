import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateSuggestions, type ClientContext } from '@/lib/ai/agent-service'

/**
 * POST /api/ai/suggestions/generate
 * 
 * Generates AI suggestions for a client based on context.
 * Body: { clientId }
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
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    // Fetch client context
    const contextResponse = await fetch(
      `${request.url.split('/api')[0]}/api/ai/context?clientId=${clientId}`,
      {
        headers: {
          cookie: request.headers.get('cookie') || '',
        }
      }
    )

    if (!contextResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch client context' },
        { status: 500 }
      )
    }

    const context: ClientContext = await contextResponse.json()

    // Generate suggestions using AI service
    const suggestions = await generateSuggestions(context)

    // Save suggestions to database
    const savedSuggestions = []
    for (const suggestion of suggestions) {
      const { data: saved, error: saveError } = await supabase
        .from('agent_suggestions')
        .insert({
          client_id: clientId,
          suggestion_type: suggestion.type,
          priority: suggestion.priority,
          title: suggestion.title,
          description: suggestion.description,
          reasoning: suggestion.reasoning,
          action_data: suggestion.actionData,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single()

      if (!saveError && saved) {
        savedSuggestions.push({
          id: saved.id,
          clientId: saved.client_id,
          type: saved.suggestion_type,
          priority: saved.priority,
          title: saved.title,
          description: saved.description,
          reasoning: saved.reasoning,
          actionData: saved.action_data,
          status: saved.status,
          createdAt: saved.created_at,
        })
      }
    }

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      operation_type: 'suggestion_generation',
      model_used: 'gpt-4o-mini',
      tokens_used: 500, // Estimated
      estimated_cost: 0.000075, // Estimated
      client_id: clientId,
      success: true,
    })

    return NextResponse.json({
      suggestions: savedSuggestions,
      total: savedSuggestions.length,
    })

  } catch (error) {
    console.error('Error generating suggestions:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate suggestions'
      },
      { status: 500 }
    )
  }
}

