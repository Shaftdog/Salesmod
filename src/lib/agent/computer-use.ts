import Anthropic from '@anthropic-ai/sdk';

/**
 * Computer Use Agent for visual tasks
 * Use sparingly - this is slower and more expensive than APIs
 */

export interface ComputerUseTask {
  instruction: string;
  maxSteps?: number;
  timeout?: number;
}

export interface ComputerUseResult {
  success: boolean;
  finalOutput: string;
  steps: number;
  screenshots?: string[]; // Base64 encoded
  error?: string;
}

/**
 * Execute a computer use task
 * 
 * Example tasks:
 * - "Go to competitor.com and find their pricing page, extract all prices"
 * - "Search LinkedIn for [Person] at [Company] and summarize their role"
 * - "Browse to [URL] and extract all contact information"
 */
export async function executeComputerUseTask(
  task: ComputerUseTask
): Promise<ComputerUseResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const maxSteps = task.maxSteps || 20;
  const steps: any[] = [];
  const screenshots: string[] = [];

  try {
    console.log('[Computer Use] Starting task:', task.instruction);

    // Initialize the conversation
    let messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: task.instruction,
      },
    ];

    // Multi-step execution loop
    for (let step = 0; step < maxSteps; step++) {
      console.log(`[Computer Use] Step ${step + 1}/${maxSteps}`);

      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        tools: [
          {
            type: 'computer_20241022',
            name: 'computer',
            display_width_px: 1024,
            display_height_px: 768,
            display_number: 1,
          } as any,
          {
            type: 'text_editor_20241022',
            name: 'str_replace_editor',
          } as any,
          {
            type: 'bash_20241022',
            name: 'bash',
          } as any,
        ] as any,
        messages,
      });

      steps.push(response);

      // Check if task is complete
      if (response.stop_reason === 'end_turn') {
        const finalText = response.content
          .filter((c) => c.type === 'text')
          .map((c: any) => c.text)
          .join('\n');

        return {
          success: true,
          finalOutput: finalText,
          steps: step + 1,
          screenshots,
        };
      }

      // Process tool calls
      const toolResults: any[] = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          console.log(`[Computer Use] Tool called: ${block.name}`, block.input);

          try {
            // Execute the tool based on its name
            let result: any;

            if (block.name === 'computer') {
              result = await executeComputerTool(block.input);
            } else if (block.name === 'str_replace_editor') {
              result = await executeTextEditorTool(block.input);
            } else if (block.name === 'bash') {
              result = await executeBashTool(block.input);
            } else {
              result = { error: `Unknown tool: ${block.name}` };
            }

            // Handle base64 screenshot data
            if (result.base64_image) {
              screenshots.push(result.base64_image);
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: typeof result === 'string' ? result : JSON.stringify(result),
            });
          } catch (error: any) {
            console.error(`[Computer Use] Tool execution error:`, error);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Error: ${error.message}`,
              is_error: true,
            });
          }
        }
      }

      // Add assistant response and tool results to conversation
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      if (toolResults.length > 0) {
        messages.push({
          role: 'user',
          content: toolResults,
        });
      }
    }

    return {
      success: false,
      finalOutput: 'Task exceeded maximum steps',
      steps: maxSteps,
      error: 'Max steps reached',
    };
  } catch (error: any) {
    console.error('[Computer Use] Error:', error);
    return {
      success: false,
      finalOutput: '',
      steps: steps.length,
      error: error.message,
    };
  }
}

/**
 * Specialized: Competitive pricing research
 */
export async function researchCompetitorPricing(
  competitorUrl: string
): Promise<{
  success: boolean;
  pricing: any[];
  analysis: string;
}> {
  const result = await executeComputerUseTask({
    instruction: `
Go to ${competitorUrl} and find their pricing information.

Tasks:
1. Navigate to the website
2. Find the pricing or plans page
3. Extract all pricing tiers, features, and costs
4. Screenshot the pricing page
5. Summarize the competitive positioning

Return a JSON object with:
- pricing: array of {tier, price, features[]}
- analysis: competitive analysis vs our pricing
    `.trim(),
    maxSteps: 15,
  });

  if (!result.success) {
    return {
      success: false,
      pricing: [],
      analysis: result.error || 'Failed to research pricing',
    };
  }

  // Parse the result
  try {
    const data = JSON.parse(result.finalOutput);
    return {
      success: true,
      pricing: data.pricing || [],
      analysis: data.analysis || result.finalOutput,
    };
  } catch {
    return {
      success: true,
      pricing: [],
      analysis: result.finalOutput,
    };
  }
}

/**
 * Specialized: Company research via visual browsing
 */
export async function deepCompanyResearch(
  companyName: string,
  companyWebsite?: string
): Promise<string> {
  const instruction = companyWebsite
    ? `Research ${companyName} by visiting ${companyWebsite}. Find:
       - Company size and structure
       - Key products/services
       - Recent news or announcements
       - Leadership team
       - Contact information
       Summarize findings in a business intelligence report.`
    : `Search for ${companyName} on Google, visit their website, and create a comprehensive report.`;

  const result = await executeComputerUseTask({
    instruction,
    maxSteps: 25,
  });

  return result.finalOutput;
}

/**
 * Execute computer tool (screen interaction)
 */
async function executeComputerTool(input: any): Promise<any> {
  const { action } = input;

  // Check if computer use infrastructure is available
  if (!process.env.COMPUTER_USE_ENABLED) {
    throw new Error(
      'Computer Use requires a dedicated infrastructure with display server. ' +
      'Set COMPUTER_USE_ENABLED=true and ensure X11/VNC is running.'
    );
  }

  // In a production setup, this would interface with the actual computer use infrastructure
  // This typically runs in a Docker container with X11/VNC

  // For now, return a helpful message about what would happen
  switch (action) {
    case 'screenshot':
      return {
        type: 'screenshot',
        base64_image: null, // Would contain actual screenshot
        message: 'Screenshot would be captured from display',
      };

    case 'mouse_move':
    case 'left_click':
    case 'right_click':
    case 'double_click':
      return {
        type: action,
        message: `Would execute ${action} at coordinates (${input.coordinate?.[0]}, ${input.coordinate?.[1]})`,
      };

    case 'type':
      return {
        type: 'type',
        message: `Would type: "${input.text}"`,
      };

    case 'key':
      return {
        type: 'key',
        message: `Would press key: ${input.text}`,
      };

    default:
      return {
        type: 'unknown',
        message: `Unknown computer action: ${action}`,
      };
  }
}

/**
 * Execute text editor tool
 */
async function executeTextEditorTool(input: any): Promise<string> {
  const { command, path, file_text, old_str, new_str, insert_line, view_range } = input;

  if (!process.env.COMPUTER_USE_ENABLED) {
    throw new Error('Text editor requires Computer Use infrastructure');
  }

  // In production, this would actually edit files in the container
  switch (command) {
    case 'view':
      return `Would view file: ${path}${view_range ? ` (lines ${view_range[0]}-${view_range[1]})` : ''}`;

    case 'create':
      return `Would create file: ${path} with ${file_text?.length || 0} characters`;

    case 'str_replace':
      return `Would replace "${old_str}" with "${new_str}" in ${path}`;

    case 'insert':
      return `Would insert text at line ${insert_line} in ${path}`;

    default:
      return `Unknown editor command: ${command}`;
  }
}

/**
 * Execute bash tool
 */
async function executeBashTool(input: any): Promise<string> {
  const { command, restart } = input;

  if (!process.env.COMPUTER_USE_ENABLED) {
    throw new Error('Bash execution requires Computer Use infrastructure');
  }

  if (restart) {
    return 'Would restart bash session';
  }

  // In production, this would execute actual bash commands in the container
  // SECURITY NOTE: This should run in an isolated container, not the main server
  return `Would execute bash command: ${command}`;
}

/**
 * Check if Computer Use is properly configured
 */
export function isComputerUseAvailable(): boolean {
  return Boolean(
    process.env.COMPUTER_USE_ENABLED === 'true' &&
    process.env.ANTHROPIC_API_KEY
  );
}

/**
 * Get Computer Use configuration status
 */
export function getComputerUseStatus(): {
  available: boolean;
  reason?: string;
  requirements: string[];
} {
  const requirements = [
    'ANTHROPIC_API_KEY environment variable',
    'COMPUTER_USE_ENABLED=true environment variable',
    'Docker container with X11/VNC display server',
    'Browser (Chrome/Firefox) in container',
    'Screen resolution configured (recommended: 1024x768)',
  ];

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      available: false,
      reason: 'Missing ANTHROPIC_API_KEY',
      requirements,
    };
  }

  if (process.env.COMPUTER_USE_ENABLED !== 'true') {
    return {
      available: false,
      reason: 'COMPUTER_USE_ENABLED is not set to true',
      requirements,
    };
  }

  return {
    available: true,
    requirements,
  };
}

