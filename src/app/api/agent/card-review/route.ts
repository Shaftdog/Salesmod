import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { anthropicTools } from '@/lib/agent/anthropic-tool-registry';
import { executeAnthropicTool } from '@/lib/agent/anthropic-tool-executor';

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

    const systemPrompt = `You are an AI Account Manager helping the user review a rejected action card. You have comprehensive access to all business data and specialized card review tools.

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

## YOUR COMPREHENSIVE CAPABILITIES

### Card Review Specialized Tools:
1. **storeRejectionFeedback** - Save user's feedback about rejected cards
2. **reviseCard** - Create improved version of cards with user changes
3. **detectPatternAndSuggest** - Analyze rejection patterns across cards
4. **analyzeRejectionTrends** - Generate trend reports of rejections
5. **researchContact** - Gather contact context and interaction history
6. **suggestSmartRule** 🎯 - Auto-suggest rules from rejection reasons
7. **detectSimilarFeedback** - Find duplicate/similar feedback
8. **findSimilarCards** - Find other cards with same issues
9. **batchApplyFeedback** - Apply feedback to multiple cards at once

### Full Database Access:
- **searchClients**, **createClient**, **deleteClient**
- **searchContacts**, **createContact**, **deleteContact**
- **createProperty**, **deleteProperty**
- **createOrder**, **deleteOrder**
- **getAllCards**, **getPendingCards**, **createCard**, **updateCard**, **deleteCard**
- **deleteOpportunity**, **createActivity**, **deleteTask**
- **getClientActivity**

### Code & Development:
- **readFile**, **writeFile**, **editFile** - Full file system access
- **listFiles**, **searchCode** - Code exploration
- **runCommand** - Execute shell commands, tests, builds

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

    // Use native Anthropic SDK with comprehensive tool registry
    const anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

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
              tools: anthropicTools,
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
                    try {
                      const input = JSON.parse(toolUse.input_json);

                      // Execute tool using comprehensive executor
                      const result = await executeAnthropicTool(toolUse.name, input, user.id);

                      console.log(`[CardReview] Tool executed: ${toolUse.name}`, result);

                      toolResults.push({
                        type: 'tool_result' as const,
                        tool_use_id: toolUse.id,
                        content: JSON.stringify(result)
                      });

                      // Send confirmation to user for successful operations
                      if (result.success) {
                        const confirmMsg = `\n\n✓ ${result.message || 'Operation completed successfully'}`;
                        controller.enqueue(encoder.encode(confirmMsg));
                      }

                    } catch (error) {
                      console.error(`[CardReview] Error executing tool ${toolUse.name}:`, error);
                      toolResults.push({
                        type: 'tool_result' as const,
                        tool_use_id: toolUse.id,
                        content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
                        is_error: true
                      });
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
