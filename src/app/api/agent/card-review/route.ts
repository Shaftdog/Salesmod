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

## REJECTION HISTORY
${rejectionPatterns.length > 0 ? `
**Total Previous Rejections**: ${rejectionPatterns.length}

💡 **Proactive Insight**: The user has provided feedback on ${rejectionPatterns.length} previous cards. Use this history to offer data-driven suggestions.
` : 'No previous rejections - this is the first feedback!'}

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
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    // Create streaming response with proper tool handling
    let conversationMessages = [...anthropicMessages];
    let toolCallsDetected = false;

    // Convert Anthropic stream to web stream
    const encoder = new TextEncoder();
    const webStream = new ReadableStream({
      async start(controller) {
        try {
          let currentToolUseId: string | null = null;
          let currentToolName: string | null = null;

          while (true) {
            const stream = await anthropicClient.messages.stream({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 1500,
              temperature: 0.2,
              system: systemPrompt,
              messages: conversationMessages,
              tools,
            });

            let assistantMessage = '';
            let toolUses: any[] = [];

            for await (const chunk of stream) {
              if (chunk.type === 'content_block_start') {
                if (chunk.content_block.type === 'tool_use') {
                  currentToolUseId = chunk.content_block.id;
                  currentToolName = chunk.content_block.name;
                  toolCallsDetected = true;
                }
              } else if (chunk.type === 'content_block_delta') {
                if (chunk.delta.type === 'text_delta') {
                  assistantMessage += chunk.delta.text;
                  controller.enqueue(encoder.encode(chunk.delta.text));
                } else if (chunk.delta.type === 'input_json_delta' && currentToolUseId) {
                  // Accumulate tool input
                  if (!toolUses.find(t => t.id === currentToolUseId)) {
                    toolUses.push({
                      id: currentToolUseId,
                      name: currentToolName,
                      input_json: chunk.delta.partial_json || ''
                    });
                  } else {
                    const tool = toolUses.find(t => t.id === currentToolUseId);
                    if (tool) {
                      tool.input_json += chunk.delta.partial_json || '';
                    }
                  }
                }
              } else if (chunk.type === 'message_stop') {
                // Handle tool calls if any
                if (toolUses.length > 0) {
                  const toolResults = [];

                  for (const toolUse of toolUses) {
                    if (toolUse.name === 'storeRejectionFeedback') {
                      try {
                        const input = JSON.parse(toolUse.input_json) as { reason: string; rule?: string };

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

                        toolResults.push({
                          type: 'tool_result' as const,
                          tool_use_id: toolUse.id,
                          content: 'Feedback stored successfully'
                        });

                        // Send confirmation to user
                        const confirmMsg = '\n\n✓ Feedback stored successfully';
                        controller.enqueue(encoder.encode(confirmMsg));

                      } catch (error) {
                        console.error('[CardReview] Error storing feedback:', error);
                        toolResults.push({
                          type: 'tool_result' as const,
                          tool_use_id: toolUse.id,
                          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                          is_error: true
                        });
                      }
                    }
                  }

                  // If we had tool calls, continue conversation with results
                  if (toolResults.length > 0) {
                    conversationMessages.push({
                      role: 'assistant',
                      content: [
                        ...toolUses.map(t => ({
                          type: 'tool_use' as const,
                          id: t.id,
                          name: t.name,
                          input: JSON.parse(t.input_json)
                        }))
                      ]
                    });

                    conversationMessages.push({
                      role: 'user',
                      content: toolResults
                    });

                    // Continue the loop for follow-up
                    continue;
                  }
                }

                // No more tool calls, we're done
                break;
              }
            }

            // If no tool calls were made, we're done
            if (toolUses.length === 0) {
              break;
            }
          }

          controller.close();
        } catch (error) {
          console.error('[CardReview] Stream error:', error);
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
