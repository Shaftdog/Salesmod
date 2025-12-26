import { NextRequest, NextResponse } from 'next/server';
import {
  verifySlackRequest,
  getSlackIntegration,
  getSlackUserMapping,
  callAgentChat,
  sendSlackMessage,
  formatForSlack,
  extractMentionedMessage,
  isFromBot,
  SlackEvent,
} from '@/lib/slack/slack-adapter';

export const maxDuration = 60;

/**
 * POST /api/integrations/slack/events
 * Handles incoming Slack events (mentions, DMs, etc.)
 */
export async function POST(request: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    console.error('[Slack Events] Missing SLACK_SIGNING_SECRET');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  // Get raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('x-slack-signature') || '';
  const timestamp = request.headers.get('x-slack-request-timestamp') || '';

  // Verify request is from Slack
  if (!verifySlackRequest(signingSecret, signature, timestamp, body)) {
    console.error('[Slack Events] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Parse event
  let event: SlackEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Handle URL verification challenge (Slack app setup)
  if (event.type === 'url_verification' && event.challenge) {
    return NextResponse.json({ challenge: event.challenge });
  }

  // Handle event callbacks
  if (event.type === 'event_callback' && event.event) {
    const slackEvent = event.event;

    // Ignore bot messages to prevent loops
    if (isFromBot(slackEvent)) {
      return NextResponse.json({ ok: true });
    }

    // Handle app_mention and direct messages
    if (slackEvent.type === 'app_mention' || slackEvent.type === 'message') {
      // Process asynchronously - respond to Slack immediately
      processMessageAsync(event).catch(err => {
        console.error('[Slack Events] Async processing error:', err);
      });

      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ ok: true });
}

/**
 * Process Slack message asynchronously
 */
async function processMessageAsync(event: SlackEvent): Promise<void> {
  const slackEvent = event.event!;
  const teamId = event.team_id!;

  console.log('[Slack Events] Processing message:', {
    teamId,
    channel: slackEvent.channel,
    user: slackEvent.user,
    text: slackEvent.text?.substring(0, 50),
  });

  // Get Slack integration for this workspace
  const integration = await getSlackIntegration(teamId);
  if (!integration) {
    console.error('[Slack Events] No integration found for team:', teamId);
    return;
  }

  // Get user mapping (for tenant context)
  const { tenantId } = await getSlackUserMapping(
    integration.id,
    slackEvent.user
  );

  if (!tenantId) {
    console.error('[Slack Events] No tenant found for integration');
    return;
  }

  // Extract the actual message (remove @mention if present)
  let messageText = slackEvent.text;
  if (integration.bot_user_id) {
    messageText = extractMentionedMessage(messageText, integration.bot_user_id);
  }

  if (!messageText || messageText.trim().length === 0) {
    // Empty message after removing mention - send help
    await sendSlackMessage(
      integration.bot_token,
      slackEvent.channel,
      "👋 Hi! I'm your Salesmod AI assistant. Ask me anything about your clients, deals, or tasks!\n\nTry: _\"What's the status of the Jones deal?\"_ or _\"Show me pending tasks\"_",
      slackEvent.thread_ts || slackEvent.ts
    );
    return;
  }

  try {
    // Call the agent
    const response = await callAgentChat(tenantId, null, messageText);

    // Format for Slack
    const slackResponse = formatForSlack(response);

    // Send response (in thread if this was a threaded message)
    await sendSlackMessage(
      integration.bot_token,
      slackEvent.channel,
      slackResponse,
      slackEvent.thread_ts || slackEvent.ts
    );
  } catch (error: any) {
    console.error('[Slack Events] Error processing message:', error);

    // Send error message
    await sendSlackMessage(
      integration.bot_token,
      slackEvent.channel,
      `❌ Sorry, I encountered an error: ${error.message}\n\nPlease try again or contact support.`,
      slackEvent.thread_ts || slackEvent.ts
    );
  }
}
