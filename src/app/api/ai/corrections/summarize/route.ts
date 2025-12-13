import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

// Input validation schema
const requestSchema = z.object({
  userDescription: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  taskTitle: z.string().max(200).optional().nullable(),
  taskDescription: z.string().max(1000).optional().nullable(),
  orderContext: z.object({
    order_number: z.string().max(50).optional().nullable(),
    property_address: z.string().max(200).optional().nullable(),
    client_name: z.string().max(100).optional().nullable(),
  }).optional().nullable(),
})

/**
 * POST /api/ai/corrections/summarize
 *
 * Takes user description of a correction issue and generates:
 * - A clear, concise summary
 * - Suggested severity level
 * - Suggested category
 */
export async function POST(request: Request) {
  try {
    // Check API key before proceeding
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = requestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { userDescription, taskTitle, taskDescription, orderContext } = validationResult.data

    // Sanitize inputs for prompt injection protection
    const sanitize = (str: string | null | undefined) =>
      str ? str.replace(/[<>{}[\]]/g, '').slice(0, 500) : 'N/A'

    const prompt = `You are an appraisal quality assurance specialist. Analyze this correction request and provide a structured summary.

TASK INFORMATION:
- Task: ${sanitize(taskTitle)}
- Description: ${sanitize(taskDescription)}

ORDER CONTEXT:
- Order Number: ${sanitize(orderContext?.order_number)}
- Property Address: ${sanitize(orderContext?.property_address)}
- Client: ${sanitize(orderContext?.client_name)}

USER'S DESCRIPTION OF THE ISSUE:
${sanitize(userDescription)}

Based on this information, provide:
1. A clear, professional summary of the issue (2-3 sentences max)
2. A severity assessment: 'minor' (typos, formatting), 'major' (data errors, compliance gaps), or 'critical' (fundamental errors affecting valuation)
3. A category: 'data' (incorrect data), 'format' (formatting issues), 'compliance' (USPAP/regulatory), 'calculation' (math/formula errors), or 'other'

Respond with JSON only:
{
  "summary": "Clear summary of the correction needed",
  "suggested_severity": "minor|major|critical",
  "suggested_category": "data|format|compliance|calculation|other",
  "reasoning": "Brief explanation of severity/category choices"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert appraisal quality assurance specialist. Provide concise, professional summaries.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }

    const parsed = JSON.parse(response)

    // Log usage (fire and forget)
    supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      operation_type: 'correction_summary',
      model_used: 'gpt-4o-mini',
      tokens_used: completion.usage?.total_tokens || 0,
      estimated_cost: ((completion.usage?.total_tokens || 0) / 1000000) * 0.15,
      success: true,
    }).then(({ error }) => {
      if (error) console.error('Failed to log AI usage:', error)
    })

    return NextResponse.json({
      summary: parsed.summary,
      suggested_severity: parsed.suggested_severity,
      suggested_category: parsed.suggested_category,
      reasoning: parsed.reasoning,
    })

  } catch (error) {
    console.error('Error generating correction summary:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate summary',
      },
      { status: 500 }
    )
  }
}
