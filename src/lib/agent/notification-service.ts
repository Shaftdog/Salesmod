/**
 * Notification Service - Push notifications to Slack/Teams
 *
 * One-way push notifications for agent events.
 * No back-and-forth conversation - just alerts.
 */

export type NotificationType =
  | 'run_started'
  | 'run_completed'
  | 'run_failed'
  | 'cards_created'
  | 'cards_executed'
  | 'email_sent'
  | 'error';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export type ChannelType = 'slack' | 'teams';

export interface NotificationEvent {
  type: NotificationType;
  severity: NotificationSeverity;
  tenantId: string;
  data: {
    runId?: string;
    cardId?: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface NotificationChannel {
  id: string;
  tenant_id: string;
  channel_type: ChannelType;
  webhook_url: string;
  channel_name: string;
  events: NotificationType[];
  enabled: boolean;
  created_at: string;
}

// Emoji mapping for notification types
const TYPE_EMOJI: Record<NotificationType, string> = {
  run_started: '🚀',
  run_completed: '✅',
  run_failed: '❌',
  cards_created: '📋',
  cards_executed: '⚡',
  email_sent: '📧',
  error: '🚨',
};

const SEVERITY_COLOR: Record<NotificationSeverity, string> = {
  info: '#2196F3',     // Blue
  warning: '#FF9800',  // Orange
  error: '#F44336',    // Red
  success: '#4CAF50',  // Green
};

/**
 * Send notification to Slack via webhook
 */
async function sendSlackNotification(
  webhookUrl: string,
  event: NotificationEvent
): Promise<{ success: boolean; error?: string }> {
  const emoji = TYPE_EMOJI[event.type] || '📌';
  const color = SEVERITY_COLOR[event.severity];

  // Build Slack Block Kit message
  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${formatTitle(event.type)}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: event.data.message,
      },
    },
  ];

  // Add details if present
  if (event.data.details && Object.keys(event.data.details).length > 0) {
    const fields: any[] = [];
    for (const [key, value] of Object.entries(event.data.details)) {
      if (value !== undefined && value !== null) {
        fields.push({
          type: 'mrkdwn',
          text: `*${formatKey(key)}:*\n${value}`,
        });
      }
    }
    if (fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: fields.slice(0, 10), // Slack limit
      });
    }
  }

  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `<!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
      },
    ],
  });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks,
        attachments: [
          {
            color,
            fallback: event.data.message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Slack webhook failed: ${response.status} - ${text}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Slack webhook error: ${error.message}` };
  }
}

/**
 * Send notification to Microsoft Teams via webhook
 */
async function sendTeamsNotification(
  webhookUrl: string,
  event: NotificationEvent
): Promise<{ success: boolean; error?: string }> {
  const emoji = TYPE_EMOJI[event.type] || '📌';
  const color = SEVERITY_COLOR[event.severity].replace('#', '');

  // Build facts for details
  const facts: any[] = [];
  if (event.data.details) {
    for (const [key, value] of Object.entries(event.data.details)) {
      if (value !== undefined && value !== null) {
        facts.push({
          name: formatKey(key),
          value: String(value),
        });
      }
    }
  }

  // Build Microsoft Teams Adaptive Card (legacy MessageCard format for webhook compatibility)
  const card = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    themeColor: color,
    summary: `${emoji} ${formatTitle(event.type)}`,
    sections: [
      {
        activityTitle: `${emoji} ${formatTitle(event.type)}`,
        activitySubtitle: new Date().toLocaleString(),
        text: event.data.message,
        facts: facts.slice(0, 10), // Teams limit
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Teams webhook failed: ${response.status} - ${text}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Teams webhook error: ${error.message}` };
  }
}

/**
 * Format notification type to human-readable title
 */
function formatTitle(type: NotificationType): string {
  const titles: Record<NotificationType, string> = {
    run_started: 'Agent Run Started',
    run_completed: 'Agent Run Completed',
    run_failed: 'Agent Run Failed',
    cards_created: 'Cards Created',
    cards_executed: 'Cards Executed',
    email_sent: 'Email Sent',
    error: 'Error',
  };
  return titles[type] || type;
}

/**
 * Format key to human-readable label
 */
function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Send notification to a specific channel
 */
export async function sendToChannel(
  channel: NotificationChannel,
  event: NotificationEvent
): Promise<{ success: boolean; error?: string }> {
  // Check if this channel is subscribed to this event type
  if (!channel.events.includes(event.type)) {
    return { success: true }; // Skip silently
  }

  if (!channel.enabled) {
    return { success: true }; // Skip silently
  }

  switch (channel.channel_type) {
    case 'slack':
      return sendSlackNotification(channel.webhook_url, event);
    case 'teams':
      return sendTeamsNotification(channel.webhook_url, event);
    default:
      return { success: false, error: `Unknown channel type: ${channel.channel_type}` };
  }
}

/**
 * Send notification to all configured channels for a tenant
 */
export async function sendNotification(
  event: NotificationEvent,
  channels: NotificationChannel[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.all(
    channels.map(channel => sendToChannel(channel, event))
  );

  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const result of results) {
    if (result.success) {
      sent++;
    } else if (result.error) {
      failed++;
      errors.push(result.error);
    }
  }

  return { sent, failed, errors };
}

/**
 * Test a webhook by sending a test notification
 */
export async function testWebhook(
  channelType: ChannelType,
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  const testEvent: NotificationEvent = {
    type: 'run_completed',
    severity: 'success',
    tenantId: 'test',
    data: {
      message: 'This is a test notification from Salesmod Agent',
      details: {
        test: 'Connection successful!',
        timestamp: new Date().toISOString(),
      },
    },
  };

  switch (channelType) {
    case 'slack':
      return sendSlackNotification(webhookUrl, testEvent);
    case 'teams':
      return sendTeamsNotification(webhookUrl, testEvent);
    default:
      return { success: false, error: `Unknown channel type: ${channelType}` };
  }
}

/**
 * Helper to create run started notification
 */
export function createRunStartedEvent(
  tenantId: string,
  runId: string,
  mode: 'auto' | 'review'
): NotificationEvent {
  return {
    type: 'run_started',
    severity: 'info',
    tenantId,
    data: {
      runId,
      message: `Agent work block started in *${mode}* mode`,
      details: {
        run_id: runId.substring(0, 8),
        mode,
      },
    },
  };
}

/**
 * Helper to create run completed notification
 */
export function createRunCompletedEvent(
  tenantId: string,
  runId: string,
  stats: {
    cardsCreated: number;
    cardsExecuted: number;
    emailsSent: number;
    errors: number;
    durationMs: number;
  }
): NotificationEvent {
  const hasErrors = stats.errors > 0;
  return {
    type: 'run_completed',
    severity: hasErrors ? 'warning' : 'success',
    tenantId,
    data: {
      runId,
      message: hasErrors
        ? `Agent run completed with ${stats.errors} error(s)`
        : 'Agent run completed successfully',
      details: {
        cards_created: stats.cardsCreated,
        cards_executed: stats.cardsExecuted,
        emails_sent: stats.emailsSent,
        errors: stats.errors,
        duration: `${(stats.durationMs / 1000).toFixed(1)}s`,
      },
    },
  };
}

/**
 * Helper to create run failed notification
 */
export function createRunFailedEvent(
  tenantId: string,
  runId: string,
  error: string
): NotificationEvent {
  return {
    type: 'run_failed',
    severity: 'error',
    tenantId,
    data: {
      runId,
      message: `Agent run failed: ${error}`,
      details: {
        run_id: runId.substring(0, 8),
        error: error.substring(0, 200),
      },
    },
  };
}

/**
 * Helper to create email sent notification
 */
export function createEmailSentEvent(
  tenantId: string,
  recipient: string,
  subject: string,
  simulated: boolean
): NotificationEvent {
  return {
    type: 'email_sent',
    severity: 'success',
    tenantId,
    data: {
      message: simulated
        ? `Email simulated to ${recipient}`
        : `Email sent to ${recipient}`,
      details: {
        to: recipient,
        subject: subject.substring(0, 50),
        mode: simulated ? 'Simulated' : 'Production',
      },
    },
  };
}
