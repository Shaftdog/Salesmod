/**
 * Email Notification Types
 * Dashboard notifications for email delivery issues
 */

export interface EmailNotification {
  id: string;
  org_id: string;
  contact_id: string | null;
  type: 'bounce_hard' | 'bounce_soft' | 'suppression' | 'delivery_issue';
  email: string;
  title: string;
  message: string;
  metadata: {
    bounce_type?: string;
    bounce_subtype?: string;
    bounce_count?: number;
    email_id?: string;
    [key: string]: any;
  };
  is_read: boolean;
  created_at: string;
}

export interface EmailNotificationWithContact extends EmailNotification {
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    client_id: string;
  };
}
