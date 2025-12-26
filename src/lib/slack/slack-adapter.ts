/**
 * Slack Adapter - Bridges Slack messages to the Agent chat endpoint
 *
 * Handles:
 * - Slack request verification
 * - Message extraction from events
 * - Calling the agent chat endpoint
 * - Formatting responses for Slack
 */

import crypto from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Types
export interface SlackEvent {
  type: string;
  event?: {
    type: string;
    user: string;
    text: string;
    channel: string;
    ts: string;
    thread_ts?: string;
    bot_id?: string;
  };
  challenge?: string;
  team_id?: string;
  event_id?: string;
}

export interface SlackIntegration {
  id: string;
  tenant_id: string;
  slack_team_id: string;
  slack_team_name: string | null;
  bot_token: string;
  bot_user_id: string | null;
  enabled: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Verify Slack request signature
 */
export function verifySlackRequest(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // Compute expected signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(sigBasestring);
  const expectedSignature = `v0=${hmac.digest('hex')}`;

  // Compare signatures (timing-safe)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Get Slack integration by team ID
 */
export async function getSlackIntegration(
  teamId: string
): Promise<SlackIntegration | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('slack_integrations')
    .select('*')
    .eq('slack_team_id', teamId)
    .eq('enabled', true)
    .single();

  if (error || !data) {
    console.error('[Slack] Integration not found for team:', teamId);
    return null;
  }

  return data as SlackIntegration;
}

/**
 * Get or create user mapping for Slack user
 */
export async function getSlackUserMapping(
  integrationId: string,
  slackUserId: string
): Promise<{ tenantId: string; profileId: string | null }> {
  const supabase = createServiceRoleClient();

  // Check if mapping exists
  const { data: mapping } = await supabase
    .from('slack_user_mappings')
    .select('profile_id, tenant_id')
    .eq('slack_integration_id', integrationId)
    .eq('slack_user_id', slackUserId)
    .single();

  if (mapping) {
    return {
      tenantId: mapping.tenant_id,
      profileId: mapping.profile_id,
    };
  }

  // Get tenant from integration
  const { data: integration } = await supabase
    .from('slack_integrations')
    .select('tenant_id')
    .eq('id', integrationId)
    .single();

  return {
    tenantId: integration?.tenant_id || '',
    profileId: null,
  };
}

/**
 * Call the agent chat endpoint and get response
 */
export async function callAgentChat(
  tenantId: string,
  profileId: string | null,
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const supabase = createServiceRoleClient();

  // Get a profile for this tenant to use for the chat
  // If we have a mapped profile, use it; otherwise use the first admin profile
  let userId: string;

  if (profileId) {
    userId = profileId;
  } else {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      throw new Error('No profiles found for tenant');
    }
    userId = profiles[0].id;
  }

  // Build messages array
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: message },
  ];

  // Call the chat endpoint internally (non-streaming)
  // We'll use the direct Anthropic approach for simplicity
  const { generateText } = await import('ai');
  const { anthropic } = await import('@ai-sdk/anthropic');
  const { agentTools } = await import('@/lib/agent/tools');
  const { searchRAG, buildRAGContext } = await import('@/lib/agent/rag');

  // Get RAG context
  let ragContext = '';
  const ragResults = await searchRAG(userId, message, 3, 0.7);
  if (ragResults.length > 0) {
    ragContext = '\n' + buildRAGContext(ragResults);
  }

  // Build system prompt (simplified for Slack)
  const systemPrompt = `You are an AI Account Manager assistant for a property appraisal management company. You're chatting via Slack.

Current context:
- Tenant ID: ${tenantId}
- Source: Slack

${ragContext}

Keep responses concise and Slack-friendly. Use simple formatting.
You have access to all the same tools as the web app (search clients, create cards, etc).

IMPORTANT: This is a Slack conversation. Be brief but helpful.`;

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      tools: agentTools,
      maxSteps: 5, // Allow tool use
      temperature: 0.7,
    });

    return result.text || 'I processed your request but have no text response.';
  } catch (error: any) {
    console.error('[Slack] Chat error:', error);
    throw new Error(`Chat failed: ${error.message}`);
  }
}

/**
 * Send message to Slack channel
 */
export async function sendSlackMessage(
  botToken: string,
  channel: string,
  text: string,
  threadTs?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text,
        thread_ts: threadTs, // Reply in thread if provided
        mrkdwn: true,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[Slack] Send message error:', data.error);
      return { ok: false, error: data.error };
    }

    return { ok: true };
  } catch (error: any) {
    console.error('[Slack] Send message exception:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Send typing indicator to Slack
 */
export async function sendTypingIndicator(
  botToken: string,
  channel: string
): Promise<void> {
  // Slack doesn't have a real typing indicator API for bots
  // We can use reactions or just be fast
  // For now, this is a no-op placeholder
}

/**
 * Format agent response for Slack
 * Converts markdown to Slack mrkdwn format
 */
export function formatForSlack(text: string): string {
  return text
    // Bold: **text** or __text__ → *text*
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    .replace(/__(.*?)__/g, '*$1*')
    // Italic: *text* or _text_ → _text_ (already compatible)
    // Code blocks: ```lang\ncode``` → ```code```
    .replace(/```\w*\n/g, '```\n')
    // Inline code: `code` (already compatible)
    // Links: [text](url) → <url|text>
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>')
    // Headers: # Header → *Header*
    .replace(/^#{1,6}\s+(.+)$/gm, '*$1*')
    // Bullet points (already compatible)
    // Numbered lists (already compatible)
    .trim();
}

/**
 * Extract bot mention from message text
 * Returns the message without the @mention
 */
export function extractMentionedMessage(
  text: string,
  botUserId: string
): string {
  // Remove <@BOTID> mention
  const mentionPattern = new RegExp(`<@${botUserId}>\\s*`, 'g');
  return text.replace(mentionPattern, '').trim();
}

/**
 * Check if message is from a bot (to avoid loops)
 */
export function isFromBot(event: SlackEvent['event']): boolean {
  return !!event?.bot_id;
}
