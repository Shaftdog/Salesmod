/**
 * Gmail API Client for Campaign Response Processing
 *
 * SETUP REQUIRED:
 * 1. Create Google Cloud Project at https://console.cloud.google.com
 * 2. Enable Gmail API
 * 3. Create OAuth 2.0 credentials OR Service Account
 * 4. Add credentials to .env.local:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 *    - GOOGLE_REFRESH_TOKEN (for OAuth)
 *    OR
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *    - GOOGLE_PRIVATE_KEY (for Service Account)
 *
 * For detailed setup: https://developers.google.com/gmail/api/quickstart/nodejs
 */

import { google } from 'googleapis';

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  receivedAt: string;
  headers: Record<string, string>;
}

/**
 * Get Gmail client (requires OAuth setup)
 */
function getGmailClient() {
  // Check for required environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
    console.warn('[Gmail Client] Google OAuth credentials not configured');
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Fetch a Gmail message by ID
 */
export async function getGmailMessage(messageId: string): Promise<GmailMessage | null> {
  const gmail = getGmailClient();

  if (!gmail) {
    console.warn('[Gmail Client] Returning null - Gmail API not configured');
    return null;
  }

  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    if (!message || !message.payload) {
      throw new Error('Invalid message format');
    }

    // Extract headers
    const headers: Record<string, string> = {};
    message.payload.headers?.forEach((header) => {
      if (header.name && header.value) {
        headers[header.name.toLowerCase()] = header.value;
      }
    });

    // Extract body
    let body = '';
    if (message.payload.parts) {
      // Multipart message
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
          // Fallback to HTML if no plain text
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    } else if (message.payload.body?.data) {
      // Simple message
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    }

    return {
      id: message.id || messageId,
      threadId: message.threadId || '',
      subject: headers['subject'] || '',
      from: headers['from'] || '',
      to: headers['to'] || '',
      body,
      receivedAt: new Date(parseInt(message.internalDate || '0')).toISOString(),
      headers,
    };
  } catch (error) {
    console.error('[Gmail Client] Error fetching message:', error);
    throw error;
  }
}

/**
 * Watch for new messages (Gmail Push Notifications)
 * Requires setting up Cloud Pub/Sub topic
 * See: https://developers.google.com/gmail/api/guides/push
 */
export async function setupGmailWatch(topicName: string): Promise<void> {
  const gmail = getGmailClient();

  if (!gmail) {
    throw new Error('Gmail API not configured');
  }

  try {
    await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
      },
    });
    console.log('[Gmail Client] Watch setup successfully');
  } catch (error) {
    console.error('[Gmail Client] Error setting up watch:', error);
    throw error;
  }
}

/**
 * Stop watching for messages
 */
export async function stopGmailWatch(): Promise<void> {
  const gmail = getGmailClient();

  if (!gmail) {
    throw new Error('Gmail API not configured');
  }

  try {
    await gmail.users.stop({
      userId: 'me',
    });
    console.log('[Gmail Client] Watch stopped successfully');
  } catch (error) {
    console.error('[Gmail Client] Error stopping watch:', error);
    throw error;
  }
}
