import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// Ensure Node.js runtime for Anthropic SDK streaming
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/agent/card-review
 * Chat interface for reviewing rejected cards
 */
export async function POST(request: Request) {
  try {
    const { messages, cardId, contactId, clientId, context } = await request.json();
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build system prompt with card context
    const cardContext = context?.card;
    const contactContext = context?.contact;
    const clientContext = context?.client;

    // Fetch recent rejection patterns for proactive suggestions
    const { data: recentRejections } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('org_id', user.id)
      .or('key.ilike.%rejection_%,key.ilike.%deletion_%')
      .gte('importance', 0.7)
      .order('created_at', { ascending: false })
      .limit(20);

    const rejectionPatterns = recentRejections?.map((r: any) => ({
      reason: r.content?.reason,
      rule: r.content?.rule,
      cardType: r.content?.card_type,
      timestamp: r.content?.timestamp,
    })) || [];

    // Detect common patterns
    const patternSummary = detectRejectionPatterns(rejectionPatterns);

    const systemPrompt = `You are an AI Account Manager helping the user review a rejected action card.

## CRITICAL: ALWAYS CALL TOOLS IMMEDIATELY - NO EXPLANATIONS FIRST

**CORRECT EXAMPLES:**
User: "Store this feedback"
You: [IMMEDIATELY CALL storeRejectionFeedback tool, then say] "✓ Stored this feedback successfully."

User: "Delete this card"
You: [IMMEDIATELY CALL deleteCard tool, then say] "✓ Deleted the card."

**INCORRECT EXAMPLES (NEVER DO THIS):**
User: "Store this feedback"
You: "Let me store this feedback for you..." [WRONG - call the tool first!]

User: "Delete this card"
You: "I'll delete this card and store the feedback..." [WRONG - call the tool, don't talk about it!]

## RULES:
1. When user requests an action, IMMEDIATELY call the appropriate tool - do not respond with text first
2. After the tool returns success, acknowledge what you DID (past tense)
3. NEVER say "let me", "I'll", "I will" - JUST CALL THE TOOL
4. Do not explain what you're about to do - DO IT FIRST, confirm AFTER

## CARD DETAILS
- **Type**: ${cardContext?.type || 'Unknown'}
- **Title**: ${cardContext?.title || 'Unknown'}
- **Priority**: ${cardContext?.priority || 'medium'}
- **State**: ${cardContext?.state || 'rejected'}
- **Rationale**: ${cardContext?.rationale || 'No rationale provided'}

${contactContext ? `## CONTACT
- **Name**: ${contactContext.name}
- **Email**: ${contactContext.email}` : ''}

${clientContext ? `## CLIENT
- **Company**: ${clientContext.name}
- **Email**: ${clientContext.email}` : ''}

${cardContext?.action_payload?.subject ? `## EMAIL DETAILS
- **Subject**: ${cardContext.action_payload.subject}
- **To**: ${cardContext.action_payload.to}` : ''}

## REJECTION PATTERN ANALYSIS
${patternSummary.totalRejections > 0 ? `
**Total Rejections Analyzed**: ${patternSummary.totalRejections}
**Recent Trend**: ${patternSummary.recentTrends}

**Most Common Rejection Reasons**:
${patternSummary.commonReasons.map((r, i) => `${i + 1}. ${r.reason} (${r.count} times)`).join('\n')}

**Card Types with Issues**:
${patternSummary.cardTypeIssues.map((c) => `- ${c.cardType}: ${c.count} rejections`).join('\n')}

💡 **Proactive Insight**: Use this data to offer specific, data-driven suggestions to the user.
` : 'No rejection patterns detected yet - this is the first feedback!'}

## YOUR CAPABILITIES

You have the following tools available:

1. **storeRejectionFeedback** - Save user's feedback about why this card was rejected
   - Creates a permanent memory for the agent to learn from
   - Can include rules to avoid similar cards in the future

2. **reviseCard** - Create an improved version of this card based on user feedback
   - Accepts changes to subject, body, or other fields
   - Creates a new suggested card with improvements
   - Marks the original card as superseded

3. **deleteCard** - Delete this card entirely if it's not needed

4. **detectPatternAndSuggest** - Analyze rejection patterns and suggest improvements
   - Detects common issues across multiple rejections
   - Provides actionable recommendations

5. **analyzeRejectionTrends** - Generate a trend report of recent rejections
   - Shows temporal patterns and category breakdowns
   - Helps identify systematic issues

6. **researchContact** - Research a contact to gather additional context
   - Fetches interaction history and past communications
   - Useful before revising cards to ensure personalization
   - Stores research findings for future reference

## PHASE 4: INTELLIGENT AUTOMATION TOOLS

7. **suggestSmartRule** - 🎯 MOST IMPORTANT - Use FIRST when user provides feedback
   - Automatically analyzes rejection reason
   - Suggests specific, actionable rules without user having to write them
   - Detects patterns: placeholder names, email domains, timing, quality issues
   - Checks for similar existing rules to avoid duplicates
   - Returns ready-to-use rule with regex patterns

8. **detectSimilarFeedback** - Check if similar feedback already exists
   - Prevents duplicate/redundant feedback storage
   - Uses keyword matching for similarity detection
   - Suggests merging similar rules
   - Shows up to 5 most similar feedback items

9. **findSimilarCards** - Find other pending cards with the same issue
   - Scans all suggested cards for similar problems
   - Supports: placeholder names, email domains, timing, targeting, content quality
   - Returns up to 20 similar cards for batch review
   - Enables efficient batch operations

10. **batchApplyFeedback** - Apply feedback to multiple cards at once
    - Process up to 20 cards in one operation
    - Can reject or delete multiple cards
    - Stores feedback once for entire batch
    - High importance rating (0.95) for batch feedback

## CONVERSATION FLOW (Enhanced with Phase 4)

1. **Proactive Analysis**: If patterns exist, START by mentioning relevant patterns you've noticed

2. **Smart Rule Suggestion**: When user provides feedback, IMMEDIATELY use suggestSmartRule
   - "Let me suggest a rule for that..."
   - Present the suggested rule clearly
   - Offer to check for similar feedback
   - Give user option to approve, modify, or reject

3. **Batch Opportunity Detection**: After suggesting rule, use findSimilarCards
   - "I found 5 other cards with similar issues. Would you like to apply this feedback to all of them?"
   - Show card details clearly
   - Offer batch operations

4. **Execute Efficiently**:
   - Use batchApplyFeedback for multiple cards
   - Use storeRejectionFeedback for single cards
   - Always confirm what was done

5. **Learn and Improve**: Show impact of feedback
   - "This rule will prevent X cards in future runs"
   - "We've now learned to avoid Y"

## CONVERSATION STYLE

Be conversational, empathetic, and data-driven. When you identify patterns or opportunities, proactively mention them: "I've noticed this is the 3rd time we've had issues with X - I can automatically apply this rule to 5 other cards right now. Would you like me to?"

You can ask clarifying questions BEFORE taking action, but once the user confirms or requests an action, CALL THE TOOL IMMEDIATELY.`;

    // Use native Anthropic SDK - bypassing broken Vercel AI SDK
    const anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    // Define tools in native Anthropic format
    const tools: Anthropic.Tool[] = [
      {
        name: 'storeRejectionFeedback',
        description: 'Store user feedback about why a card was rejected. Use this when the user provides feedback about rejecting a card or suggests a rule.',
        input_schema: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Why the user rejected the card'
            },
            rule: {
              type: 'string',
              description: 'Optional rule to avoid similar cards in the future'
            }
          },
          required: ['reason']
        }
      }
    ];

    // Convert messages to Anthropic format
    const anthropicMessages: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    // Create streaming response
    const stream = await anthropicClient.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      temperature: 0.2,
      system: systemPrompt,
      messages: anthropicMessages,
      tools,
    });

    // Handle tool calls
    stream.on('message', async (message) => {
      if (message.stop_reason === 'tool_use') {
        for (const content of message.content) {
          if (content.type === 'tool_use' && content.name === 'storeRejectionFeedback') {
            const input = content.input as { reason: string; rule?: string };
            try {
              await supabase.from('agent_memories').insert({
                org_id: user.id,
                scope: 'card_feedback',
                key: `rejection_${cardContext?.type}_${Date.now()}`,
                content: {
                  type: 'rejection_feedback',
                  card_id: cardId,
                  reason: input.reason,
                  rule: input.rule,
                  timestamp: new Date().toISOString(),
                },
                importance: 0.9,
                last_used_at: new Date().toISOString(),
              });
              console.log('[CardReview] Feedback stored successfully');
            } catch (error) {
              console.error('[CardReview] Error storing feedback:', error);
            }
          }
        }
      }
    });

    // Convert Anthropic stream to web stream
    const encoder = new TextEncoder();
    const webStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(webStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('[CardReview API] Error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
