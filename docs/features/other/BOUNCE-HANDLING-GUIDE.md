---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Email Bounce Handling System

## Overview

This system automatically detects and handles bounced emails from Resend, preventing the application from repeatedly sending to bad email addresses. It includes intelligent bounce classification, contact tagging, and dashboard notifications.

## Features

### 1. **Bounce Type Detection**
- **Hard Bounces (Permanent)**: Immediately suppress the contact
  - Invalid email addresses
  - Domain doesn't exist
  - Email on suppression list
- **Soft Bounces (Transient)**: Track attempts, suppress after 3 failures
  - Mailbox full
  - Temporary server issues
  - Email size too large

### 2. **Contact Tagging**
- `email_bounced_hard`: Email permanently bounced
- `email_bounced_soft`: Email bounced 3+ times (soft bounces)
- Automatically excluded from future email campaigns

### 3. **Dashboard Notifications**
- Real-time alerts when bounces occur
- Contact details and bounce reason
- Actionable recommendations

### 4. **Automatic Filtering**
- Job planner skips bounced contacts
- Email executor prevents sends to bounced addresses
- Suppression list checked before every send

## Setup Instructions

### Step 1: Apply Database Migration

Run the migration in your Supabase SQL editor:

```bash
# The migration file is located at:
supabase/migrations/20251112000001_add_bounce_tracking.sql
```

This creates:
- `tags` field on contacts table
- Bounce tracking fields on email_suppressions
- `email_notifications` table
- Helper functions for tag management

### Step 2: Configure Resend Webhook

1. Go to your [Resend Dashboard](https://resend.com/webhooks)
2. Click "Add Webhook"
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/email/webhook
   ```
4. Select events:
   - ✅ `email.bounced`
   - ✅ `email.delivered` (optional)
   - ✅ `email.opened` (optional)
   - ✅ `email.clicked` (optional)
5. Save the webhook

### Step 3: Test the System

Run the test script to verify everything is working:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-url \
SUPABASE_SERVICE_ROLE_KEY=your-key \
node test-bounce-handling.js
```

Expected output:
```
✅ Hard bounce tag added successfully
✅ Suppression record created
✅ Notification created
✅ Soft bounce tag added after 3 bounces
```

## How It Works

### Webhook Flow

```
┌─────────────┐
│   Resend    │
│  (bounce)   │
└──────┬──────┘
       │
       ↓
┌─────────────────────┐
│  Webhook Handler    │
│  /api/email/webhook │
└──────┬──────────────┘
       │
       ├─→ Lookup contact by email
       ├─→ Determine bounce type
       ├─→ Hard bounce? → Immediate suppression + tag
       ├─→ Soft bounce? → Track count (suppress after 3)
       ├─→ Add contact tag
       ├─→ Create notification
       └─→ Update suppression record
```

### Job Planner Flow

```
┌──────────────┐
│ Job Planner  │
└──────┬───────┘
       │
       ├─→ Query contacts
       ├─→ Filter by bounce tags
       ├─→ Check suppression list
       └─→ Return only valid contacts
```

### Email Executor Flow

```
┌──────────────┐
│   Executor   │
└──────┬───────┘
       │
       ├─→ Check contact tags
       ├─→ Check suppression list
       ├─→ Valid? → Send email
       └─→ Bounced? → Block & mark card as blocked
```

## Database Schema

### contacts.tags (JSONB)
```json
["email_bounced_hard"]
// or
["email_bounced_soft"]
```

### email_suppressions (enhanced)
| Field | Type | Description |
|-------|------|-------------|
| bounce_type | TEXT | Permanent, Transient, Unknown |
| bounce_subtype | TEXT | Suppressed, General, etc. |
| bounce_message | TEXT | Detailed bounce reason |
| bounce_count | INTEGER | Number of bounces |
| last_bounce_at | TIMESTAMP | Last bounce timestamp |

### email_notifications (new)
| Field | Type | Description |
|-------|------|-------------|
| type | TEXT | bounce_hard, bounce_soft, etc. |
| email | TEXT | Bounced email address |
| title | TEXT | Notification title |
| message | TEXT | Detailed message |
| metadata | JSONB | Additional context |
| is_read | BOOLEAN | Read status |

## API Endpoints

### Get Notifications
```http
GET /api/notifications?unread=true&limit=50
```

Response:
```json
{
  "notifications": [
    {
      "id": "...",
      "type": "bounce_hard",
      "title": "Hard Bounce: John Doe",
      "message": "Email permanently bounced: Invalid address",
      "contact": {
        "id": "...",
        "first_name": "John",
        "last_name": "Doe",
        "email": "invalid@example.com"
      },
      "is_read": false,
      "created_at": "2025-11-12T10:30:00Z"
    }
  ],
  "unread_count": 3
}
```

### Mark Notification as Read
```http
PATCH /api/notifications
Content-Type: application/json

{
  "id": "notification-id",
  "is_read": true
}
```

### Mark All as Read
```http
POST /api/notifications/mark-all-read
```

### Delete Notification
```http
DELETE /api/notifications?id=notification-id
```

## Helper Functions (Supabase)

### Add Tag to Contact
```sql
SELECT add_contact_tag(
  'contact-id-here',
  'email_bounced_hard'
);
```

### Remove Tag from Contact
```sql
SELECT remove_contact_tag(
  'contact-id-here',
  'email_bounced_hard'
);
```

### Check if Contact Has Tag
```sql
SELECT contact_has_tag(
  'contact-id-here',
  'email_bounced_hard'
);
```

## Monitoring & Maintenance

### Check Bounce Statistics

```sql
-- Contacts with bounce tags
SELECT
  COUNT(*) FILTER (WHERE tags ? 'email_bounced_hard') as hard_bounces,
  COUNT(*) FILTER (WHERE tags ? 'email_bounced_soft') as soft_bounces,
  COUNT(*) as total_contacts
FROM contacts;
```

### View Recent Bounces
```sql
SELECT
  c.first_name,
  c.last_name,
  c.email,
  es.bounce_type,
  es.bounce_count,
  es.last_bounce_at
FROM contacts c
JOIN email_suppressions es ON es.contact_id = c.id
WHERE es.last_bounce_at > NOW() - INTERVAL '7 days'
ORDER BY es.last_bounce_at DESC;
```

### Unread Notifications
```sql
SELECT
  type,
  COUNT(*) as count
FROM email_notifications
WHERE is_read = false
GROUP BY type;
```

## Recovery & Cleanup

### Remove Bounce Tag (Email Fixed)

If a contact updates their email address and you want to retry:

```sql
-- Remove bounce tag
SELECT remove_contact_tag('contact-id', 'email_bounced_hard');

-- Remove suppression
DELETE FROM email_suppressions
WHERE contact_id = 'contact-id';

-- Create notification
INSERT INTO email_notifications (
  org_id, contact_id, type, email, title, message
) VALUES (
  'org-id', 'contact-id', 'suppression', 'email@example.com',
  'Email Address Reactivated',
  'Contact bounce status cleared and email address reactivated'
);
```

### Bulk Cleanup Old Bounces

Remove soft bounces older than 90 days (they may be fixed):

```sql
-- Remove old soft bounce tags
WITH old_soft_bounces AS (
  SELECT contact_id
  FROM email_suppressions
  WHERE bounce_type = 'Transient'
    AND last_bounce_at < NOW() - INTERVAL '90 days'
)
UPDATE contacts
SET tags = tags - 'email_bounced_soft'
WHERE id IN (SELECT contact_id FROM old_soft_bounces);

-- Remove old suppression records
DELETE FROM email_suppressions
WHERE bounce_type = 'Transient'
  AND last_bounce_at < NOW() - INTERVAL '90 days';
```

## Troubleshooting

### Bounces Not Being Recorded

1. **Check webhook is configured in Resend**
   - Verify URL is correct
   - Ensure events are selected
   - Check webhook logs in Resend dashboard

2. **Check webhook endpoint**
   ```bash
   # Test webhook locally
   curl -X POST http://localhost:3000/api/email/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "type": "email.bounced",
       "data": {
         "to": ["test@example.com"],
         "bounce": {
           "type": "Permanent",
           "subType": "Invalid",
           "message": "Address does not exist"
         }
       }
     }'
   ```

3. **Check logs**
   ```bash
   # Look for webhook processing logs
   grep "Webhook" logs/application.log
   grep "Bounce" logs/application.log
   ```

### Tags Not Applied

Check if contact exists and has email:

```sql
SELECT id, email, tags
FROM contacts
WHERE email = 'bounced@example.com';
```

### Job Still Sending to Bounced Contacts

Verify filtering is working:

```javascript
// In job-planner.ts, should see logs like:
[getTargetContacts] Filtered out contact John Doe - has bounce tag
[getTargetContacts] After bounce filtering: 8/10 contacts remaining
```

## Best Practices

1. **Monitor bounce rates**: Alert if > 5% of emails bounce
2. **Regular cleanup**: Archive old soft bounces quarterly
3. **Email validation**: Validate email format before adding contacts
4. **User communication**: Notify users when contacts bounce
5. **Retry strategy**: Only retry soft bounces after 30+ days

## Security Notes

- Webhook endpoint should verify Resend signature in production
- Use service role client for webhook operations
- Implement rate limiting on webhook endpoint
- Sanitize bounce messages before displaying to users

## Support

For issues or questions:
1. Check webhook logs in Resend dashboard
2. Review application logs for webhook processing
3. Verify database migration was applied correctly
4. Test with the provided test script

---

**System Status**: ✅ Ready for Production

**Last Updated**: 2025-11-12
