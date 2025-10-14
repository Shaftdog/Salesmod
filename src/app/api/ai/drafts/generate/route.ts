import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateDraft, type DraftType, type ClientContext } from '@/lib/ai/agent-service'

/**
 * POST /api/ai/drafts/generate
 * 
 * Generates an AI draft for a client based on context.
 * Body: { clientId, draftType, contextHints?, tone? }
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
    const { clientId, draftType, contextHints, tone } = body

    if (!clientId || !draftType) {
      return NextResponse.json(
        { error: 'clientId and draftType are required' },
        { status: 400 }
      )
    }

    // Fetch client context from the context API
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

    // Generate draft using AI service
    const startTime = Date.now()
    const draft = await generateDraft({
      draftType: draftType as DraftType,
      context,
      contextHints,
      tone,
    })
    const generationTime = Date.now() - startTime

    // Save draft to database
    const { data: savedDraft, error: saveError } = await supabase
      .from('ai_drafts')
      .insert({
        client_id: clientId,
        draft_type: draftType,
        subject: draft.subject,
        content: draft.content,
        context_snapshot: context,
        status: 'pending',
        tokens_used: draft.tokensUsed,
        created_by: user.id,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving draft:', saveError)
      return NextResponse.json(
        { error: 'Failed to save draft' },
        { status: 500 }
      )
    }

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      operation_type: 'draft_generation',
      model_used: 'gpt-4o-mini',
      tokens_used: draft.tokensUsed,
      estimated_cost: (draft.tokensUsed / 1000000) * 0.15, // $0.15 per 1M tokens for gpt-4o-mini
      client_id: clientId,
      draft_id: savedDraft.id,
      success: true,
    })

    // Return draft with metadata
    return NextResponse.json({
      draft: {
        id: savedDraft.id,
        clientId: savedDraft.client_id,
        draftType: savedDraft.draft_type,
        subject: savedDraft.subject,
        content: savedDraft.content,
        status: savedDraft.status,
        tokensUsed: savedDraft.tokens_used,
        createdAt: savedDraft.created_at,
      },
      reasoning: draft.reasoning,
      generationTime,
    })

  } catch (error) {
    console.error('Error generating draft:', error)
    
    // Log failed attempt
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase.from('ai_usage_logs').insert({
          user_id: user.id,
          operation_type: 'draft_generation',
          model_used: 'gpt-4o-mini',
          tokens_used: 0,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch (logError) {
      console.error('Error logging failed attempt:', logError)
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate draft',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

