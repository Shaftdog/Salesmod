import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@/lib/supabase/server';

export interface GmailMessage {
  id: string;
  threadId: string;
  from: {
    email: string;
    name?: string;
  };
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  snippet: string;
  receivedAt: Date;
  labels: string[];
  hasAttachments: boolean;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
}

export class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;
  private orgId: string;

  constructor(orgId: string, oauth2Client: OAuth2Client) {
    this.orgId = orgId;
    this.oauth2Client = oauth2Client;
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Creates a Gmail service instance with stored OAuth tokens
   */
  static async create(orgId: string): Promise<GmailService> {
    const supabase = await createClient();

    // Get OAuth tokens from database
    const { data: token, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider', 'google')
      .single();

    if (error || !token) {
      throw new Error('Gmail not connected for this organization');
    }

    // Check if token is expired
    const expiresAt = new Date(token.expires_at);
    const isExpired = expiresAt < new Date();

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`
    );

    oauth2Client.setCredentials({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expiry_date: expiresAt.getTime(),
    });

    // Refresh token if expired
    if (isExpired && token.refresh_token) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update tokens in database
      await supabase
        .from('oauth_tokens')
        .update({
          access_token: credentials.access_token!,
          expires_at: new Date(credentials.expiry_date!).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId)
        .eq('provider', 'google');
    }

    return new GmailService(orgId, oauth2Client);
  }

  /**
   * Fetches new messages since a given date
   */
  async fetchNewMessages(since?: Date): Promise<GmailMessage[]> {
    try {
      // Build query
      let query = 'in:inbox -category:promotions -category:social';
      if (since) {
        const sinceTimestamp = Math.floor(since.getTime() / 1000);
        query += ` after:${sinceTimestamp}`;
      }

      // List message IDs
      const { data: listResponse } = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100, // Fetch up to 100 messages per poll
      });

      if (!listResponse.messages || listResponse.messages.length === 0) {
        return [];
      }

      // Fetch full message details in parallel
      const messagePromises = listResponse.messages.map((msg) =>
        this.fetchMessage(msg.id!)
      );

      const messages = await Promise.all(messagePromises);
      return messages.filter((msg): msg is GmailMessage => msg !== null);
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw error;
    }
  }

  /**
   * Fetches a single message by ID
   */
  async fetchMessage(messageId: string): Promise<GmailMessage | null> {
    try {
      const { data: message } = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      if (!message) return null;

      return this.parseMessage(message);
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Fetches all messages in a thread
   */
  async fetchThread(threadId: string): Promise<GmailMessage[]> {
    try {
      const { data: thread } = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      });

      if (!thread.messages) return [];

      return thread.messages
        .map((msg) => this.parseMessage(msg))
        .filter((msg): msg is GmailMessage => msg !== null);
    } catch (error) {
      console.error(`Error fetching thread ${threadId}:`, error);
      return [];
    }
  }

  /**
   * Sends a reply to an email thread
   */
  async sendReply(params: {
    threadId: string;
    to: string[];
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    cc?: string[];
    inReplyTo?: string;
    references?: string;
  }): Promise<string> {
    try {
      const { threadId, to, subject, bodyHtml, bodyText, cc, inReplyTo, references } = params;

      // Build email message
      const messageParts = [
        `To: ${to.join(', ')}`,
        cc && cc.length > 0 ? `Cc: ${cc.join(', ')}` : null,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        inReplyTo ? `In-Reply-To: ${inReplyTo}` : null,
        references ? `References: ${references}` : null,
        '',
        bodyHtml,
      ].filter(Boolean);

      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const { data: sentMessage } = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId,
        },
      });

      return sentMessage.id!;
    } catch (error) {
      console.error('Error sending Gmail reply:', error);
      throw error;
    }
  }

  /**
   * Adds a label to a message
   */
  async addLabel(messageId: string, labelName: string): Promise<void> {
    try {
      // Get or create label
      const { data: labels } = await this.gmail.users.labels.list({
        userId: 'me',
      });

      let labelId = labels.labels?.find((l) => l.name === labelName)?.id;

      if (!labelId) {
        // Create label
        const { data: newLabel } = await this.gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: labelName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
          },
        });
        labelId = newLabel.id!;
      }

      // Add label to message
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      });
    } catch (error) {
      console.error(`Error adding label to message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Marks a message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      console.error(`Error marking message as read ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Gets the watch history ID for incremental sync
   */
  async getHistoryId(): Promise<string | null> {
    try {
      const { data: profile } = await this.gmail.users.getProfile({
        userId: 'me',
      });
      return profile.historyId || null;
    } catch (error) {
      console.error('Error getting history ID:', error);
      return null;
    }
  }

  /**
   * Parses a Gmail API message into our format
   */
  private parseMessage(message: gmail_v1.Schema$Message): GmailMessage | null {
    try {
      const headers = message.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      // Parse email addresses
      const parseEmail = (emailString: string) => {
        const match = emailString.match(/<(.+?)>/);
        const email = match ? match[1] : emailString.trim();
        const name = match ? emailString.replace(/<.+?>/, '').trim() : undefined;
        return { email, name };
      };

      const parseEmailList = (emailString: string): string[] => {
        if (!emailString) return [];
        return emailString.split(',').map((e) => {
          const parsed = parseEmail(e);
          return parsed.email;
        });
      };

      const from = parseEmail(getHeader('from'));
      const to = parseEmailList(getHeader('to'));
      const cc = parseEmailList(getHeader('cc'));
      const bcc = parseEmailList(getHeader('bcc'));

      // Get body content
      const { bodyText, bodyHtml } = this.extractBody(message.payload!);

      // Get attachments
      const attachments = this.extractAttachments(message.payload!);

      // Parse received date
      const receivedAt = message.internalDate
        ? new Date(parseInt(message.internalDate))
        : new Date();

      return {
        id: message.id!,
        threadId: message.threadId!,
        from,
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        replyTo: getHeader('reply-to') || undefined,
        subject: getHeader('subject'),
        bodyText,
        bodyHtml,
        snippet: message.snippet || '',
        receivedAt,
        labels: message.labelIds || [],
        hasAttachments: attachments.length > 0,
        attachments,
      };
    } catch (error) {
      console.error('Error parsing message:', error);
      return null;
    }
  }

  /**
   * Extracts email body from message payload
   */
  private extractBody(payload: gmail_v1.Schema$MessagePart): {
    bodyText?: string;
    bodyHtml?: string;
  } {
    let bodyText: string | undefined;
    let bodyHtml: string | undefined;

    const decodePart = (part: gmail_v1.Schema$MessagePart) => {
      if (part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      return undefined;
    };

    const findParts = (part: gmail_v1.Schema$MessagePart) => {
      if (part.mimeType === 'text/plain' && !bodyText) {
        bodyText = decodePart(part);
      } else if (part.mimeType === 'text/html' && !bodyHtml) {
        bodyHtml = decodePart(part);
      }

      if (part.parts) {
        part.parts.forEach(findParts);
      }
    };

    findParts(payload);

    return { bodyText, bodyHtml };
  }

  /**
   * Extracts attachments from message payload
   */
  private extractAttachments(
    payload: gmail_v1.Schema$MessagePart
  ): Array<{ filename: string; mimeType: string; size: number; attachmentId: string }> {
    const attachments: Array<{
      filename: string;
      mimeType: string;
      size: number;
      attachmentId: string;
    }> = [];

    const findAttachments = (part: gmail_v1.Schema$MessagePart) => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId,
        });
      }

      if (part.parts) {
        part.parts.forEach(findAttachments);
      }
    };

    findAttachments(payload);

    return attachments;
  }
}
