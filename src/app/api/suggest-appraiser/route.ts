import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const inputSchema = z.object({
  propertyAddress: z.string(),
  propertyCity: z.string(),
  propertyState: z.string(),
  propertyZip: z.string(),
  orderPriority: z.enum(['rush', 'high', 'normal', 'low']),
  orderType: z.enum(['purchase', 'refinance', 'home_equity', 'estate', 'divorce', 'tax_appeal', 'other']),
  appraisers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    availability: z.boolean(),
    geographicCoverage: z.string(),
    workload: z.number(),
    rating: z.number(),
  })),
})

const outputSchema = z.object({
  appraiserId: z.string(),
  reason: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input = inputSchema.parse(body)

    // Use appraisers from the request (they're passed from the client)
    const appraisers = input.appraisers.filter(a => a.availability)

    if (appraisers.length === 0) {
      return NextResponse.json(
        { error: 'No available appraisers found' },
        { status: 400 }
      )
    }

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: outputSchema,
      prompt: `You are an expert in appraisal order assignment. 
      
Order Details:
- Property: ${input.propertyAddress}, ${input.propertyCity}, ${input.propertyState} ${input.propertyZip}
- Priority: ${input.orderPriority}
- Type: ${input.orderType}

Available Appraisers:
${appraisers.map(a => `
  - ${a.name} (ID: ${a.id})
    Geographic Coverage: ${a.geographicCoverage}
    Current Workload: ${a.workload} active orders
    Rating: ${a.rating}/5
`).join('\n')}

Select the best appraiser based on:
1. Geographic coverage (must include the property location: ${input.propertyCity}, ${input.propertyState})
2. Lowest current workload among qualified appraisers
3. Highest rating
4. Consider priority level (${input.orderPriority} priority orders need experienced appraisers)

Return the exact appraiser ID from the list above and a detailed reason for selection (2-3 sentences).`,
    })

    // Verify the suggested appraiser exists in the input list
    const suggestedAppraiser = appraisers.find(a => a.id === object.appraiserId)
    if (!suggestedAppraiser) {
      // Fallback: select the appraiser with lowest workload
      const fallback = appraisers.sort((a, b) => a.workload - b.workload)[0]
      return NextResponse.json({
        appraiserId: fallback.id,
        reason: `Selected ${fallback.name} based on lowest workload (${fallback.workload} orders) and availability.`,
      })
    }

    return NextResponse.json(object)
  } catch (error) {
    console.error('AI suggestion error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate suggestion. Please try again.' },
      { status: 500 }
    )
  }
}



