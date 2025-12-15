import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { anthropicTools } from '@/lib/agent/anthropic-tool-registry';
import { executeAnthropicTool } from '@/lib/agent/anthropic-tool-executor';

// Ensure Node.js runtime for Anthropic SDK streaming
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/agent/task-review
 * Chat interface for reviewing and getting help with tasks
 */
export async function POST(request: Request) {
  try {
    const { messages, taskId, contactId, clientId, context } = await request.json();
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant_id for multi-tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return Response.json(
        { error: 'User has no tenant_id assigned' },
        { status: 403 }
      );
    }

    // Build system prompt with task context
    const taskContext = context?.task;
    const contactContext = context?.contact;
    const clientContext = context?.client;
    const assigneeContext = context?.assignee;

    // Fetch related activities for this task's client
    let recentActivities: any[] = [];
    if (clientId) {
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);
      recentActivities = activities || [];
    }

    const systemPrompt = `You are an AI Account Manager helping the user with a task. You have comprehensive access to all business data and tools to help complete tasks efficiently.

## TASK DETAILS
- **Title**: ${taskContext?.title || 'Unknown'}
- **Description**: ${taskContext?.description || 'No description provided'}
- **Priority**: ${taskContext?.priority || 'normal'}
- **Status**: ${taskContext?.status || 'pending'}
${taskContext?.dueDate ? `- **Due Date**: ${new Date(taskContext.dueDate).toLocaleDateString()}` : ''}

${assigneeContext ? `## ASSIGNED TO
- **Name**: ${assigneeContext.name}` : ''}

${contactContext ? `## CONTACT
- **Name**: ${contactContext.name}
- **Email**: ${contactContext.email || 'N/A'}` : ''}

${clientContext ? `## CLIENT
- **Company**: ${clientContext.name}
- **Email**: ${clientContext.email || 'N/A'}` : ''}

${recentActivities.length > 0 ? `## RECENT CLIENT ACTIVITIES
${recentActivities.slice(0, 5).map((a: any) => `- ${a.activity_type}: ${a.subject} (${new Date(a.created_at).toLocaleDateString()})`).join('\n')}
` : ''}

## YOUR CAPABILITIES

### Task Management:
- Help analyze the task and suggest approaches
- Provide context about related clients and contacts
- Search for relevant information in the system
- Suggest next steps and best practices

### Full Database Access:
- **searchClients**, **createClient** - Client management
- **searchContacts**, **createContact** - Contact management
- **createActivity** - Log activities
- **getClientActivity** - Get client history
- **getAllCards**, **getPendingCards** - View agent cards
- **createCard** - Create new action cards

### Research & Context:
- **researchContact** - Gather contact context and interaction history
- Search internal data for relevant information

## HOW TO HELP

1. **Task Analysis**: Help break down complex tasks into actionable steps
2. **Context Gathering**: Provide relevant client/contact history and context
3. **Best Practices**: Suggest industry best practices for completing the task
4. **Action Planning**: Help prioritize and plan task completion
5. **Documentation**: Help draft communications or documentation related to the task

Be helpful, concise, and focused on actionable advice. When the user asks for help, provide specific, practical suggestions tailored to their task context.`;

    // Use native Anthropic SDK
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
              temperature: 0.3,
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

                      console.log(`[TaskReview] Tool executed: ${toolUse.name}`, result);

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
                      console.error(`[TaskReview] Error executing tool ${toolUse.name}:`, error);
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
          console.error('[TaskReview] Stream error:', error);
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
    console.error('[TaskReview API] Error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
