import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

// Input validation schema
const requestSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  requestType: z.enum(['correction', 'revision']),
  orderContext: z.object({
    order_number: z.string().max(50).optional().nullable(),
    property_address: z.string().max(200).optional().nullable(),
  }).optional().nullable(),
})

/**
 * POST /api/ai/corrections/parse-tasks
 *
 * Takes a correction/revision description and generates specific tasks
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

    const { description, requestType, orderContext } = validationResult.data

    // Sanitize inputs for prompt injection protection
    const sanitize = (str: string | null | undefined) =>
      str ? str.replace(/[<>{}[\]]/g, '').slice(0, 500) : 'N/A'

    const prompt = `You are an appraisal workflow assistant. Analyze this ${requestType} request and break it down into specific, actionable tasks.

ORDER CONTEXT:
- Order Number: ${sanitize(orderContext?.order_number)}
- Property Address: ${sanitize(orderContext?.property_address)}

${requestType.toUpperCase()} DESCRIPTION:
${sanitize(description)}

Based on this description, create a list of specific tasks that need to be completed. Each task should be:
- Clear and actionable
- Focused on a single issue
- Written as an imperative (e.g., "Add location map to report")

Respond with JSON only:
{
  "tasks": [
    {
      "title": "Short task title (max 100 chars)",
      "description": "Detailed description of what needs to be done"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert appraisal workflow assistant. Break down correction and revision requests into specific, actionable tasks. Always respond with valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }

    const parsed = JSON.parse(response)

    // Validate tasks array
    if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
      // Fallback to single task if AI doesn't return proper format
      return NextResponse.json({
        tasks: [{
          title: `${requestType === 'revision' ? 'Revision' : 'Correction'} Required`,
          description: description
        }]
      })
    }

    // Log usage (fire and forget)
    supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      operation_type: 'parse_correction_tasks',
      model_used: 'gpt-4o-mini',
      tokens_used: completion.usage?.total_tokens || 0,
      estimated_cost: ((completion.usage?.total_tokens || 0) / 1000000) * 0.15,
      success: true,
    }).then(({ error }) => {
      if (error) console.error('Failed to log AI usage:', error)
    })

    return NextResponse.json({
      tasks: parsed.tasks.map((task: any) => ({
        title: String(task.title || '').slice(0, 100),
        description: String(task.description || '').slice(0, 1000),
      }))
    })

  } catch (error) {
    console.error('Error parsing correction tasks:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to parse tasks',
      },
      { status: 500 }
    )
  }
}
