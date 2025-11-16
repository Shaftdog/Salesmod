# Email Bounce Handling System - Comprehensive Test Plan

## System Overview

This test plan covers the email bounce handling system with the following components:

1. **Database Schema** - Contact tags, email suppressions, notifications, helper functions
2. **Webhook Handler** - `/api/email/webhook` - Processes bounce events from Resend
3. **Job Planner** - Filters out bounced contacts from email campaigns
4. **Email Executor** - Blocks sends to bounced addresses
5. **Notifications API** - Dashboard alerts for bounces

## Test Environment Setup

### Prerequisites
- PostgreSQL database with migration applied: `20251112000001_add_bounce_tracking.sql`
- Next.js application running on `http://localhost:3000`
- Supabase configured with valid credentials
- Test user authenticated with valid org_id
- Test client and contacts created in database

### Test Data Requirements

#### Test Contacts
```sql
-- Contact 1: For hard bounce testing
INSERT INTO contacts (id, email, first_name, last_name, client_id, org_id)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'hardbounce@example.com',
  'Hard',
  'Bounce',
  '<test_client_id>',
  '<test_org_id>'
);

-- Contact 2: For soft bounce testing (3 attempts)
INSERT INTO contacts (id, email, first_name, last_name, client_id, org_id)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'softbounce@example.com',
  'Soft',
  'Bounce',
  '<test_client_id>',
  '<test_org_id>'
);

-- Contact 3: Valid contact (control group)
INSERT INTO contacts (id, email, first_name, last_name, client_id, org_id)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'valid@example.com',
  'Valid',
  'Contact',
  '<test_client_id>',
  '<test_org_id>'
);

-- Contact 4: For multiple bounce testing
INSERT INTO contacts (id, email, first_name, last_name, client_id, org_id)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'multiplebounce@example.com',
  'Multiple',
  'Bounce',
  '<test_client_id>',
  '<test_org_id>'
);

-- Contact 5: Non-existent email for webhook testing
-- (not in database - used to test webhook handling of unknown contacts)
```

---

## Test Suite 1: Webhook Processing

### Test 1.1: Hard Bounce Event Processing
**Priority**: HIGH
**Test Type**: API Integration Test
**File**: `tests/api/email-webhook-hard-bounce.spec.ts`

**Prerequisites**:
- Contact with ID `11111111-1111-1111-1111-111111111111` exists
- Email: `hardbounce@example.com`
- No existing suppressions for this contact
- No existing tags

**Test Steps**:
1. Send POST request to `/api/email/webhook`
2. Use payload:
```json
{
  "type": "email.bounced",
  "data": {
    "to": "hardbounce@example.com",
    "email_id": "test_email_001",
    "bounce": {
      "type": "Permanent",
      "subType": "General",
      "message": "550 5.1.1 User unknown"
    }
  }
}
```

**Expected Results**:
- HTTP 200 response with `{ "received": true }`
- Database checks:
  - `email_suppressions` table has new record:
    - `contact_id`: `11111111-1111-1111-1111-111111111111`
    - `reason`: `'bounce'`
    - `bounce_type`: `'Permanent'`
    - `bounce_count`: `1`
    - `last_bounce_at`: recent timestamp
  - `contacts.tags` for this contact includes `'email_bounced_hard'`
  - `email_notifications` table has new record:
    - `type`: `'bounce_hard'`
    - `contact_id`: `11111111-1111-1111-1111-111111111111`
    - `title`: contains "Hard Bounce"
    - `is_read`: `false`

**Cleanup**:
```sql
DELETE FROM email_notifications WHERE contact_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM email_suppressions WHERE contact_id = '11111111-1111-1111-1111-111111111111';
UPDATE contacts SET tags = '[]'::jsonb WHERE id = '11111111-1111-1111-1111-111111111111';
```

---

### Test 1.2: Soft Bounce - First Attempt
**Priority**: HIGH
**Test Type**: API Integration Test
**File**: `tests/api/email-webhook-soft-bounce-1.spec.ts`

**Prerequisites**:
- Contact with ID `22222222-2222-2222-2222-222222222222` exists
- Email: `softbounce@example.com`
- No existing suppressions
- No tags

**Test Steps**:
1. Send POST request to `/api/email/webhook`
2. Use payload:
```json
{
  "type": "email.bounced",
  "data": {
    "to": "softbounce@example.com",
    "email_id": "test_email_002",
    "bounce": {
      "type": "Transient",
      "subType": "MailboxFull",
      "message": "Mailbox is full"
    }
  }
}
```

**Expected Results**:
- HTTP 200 response
- Database checks:
  - `email_suppressions` has record with:
    - `reason`: `'soft_bounce_tracking'` (not 'bounce' yet)
    - `bounce_type`: `'Transient'`
    - `bounce_count`: `1`
  - `contacts.tags` does NOT include bounce tags (not suppressed yet)
  - `email_notifications` table has NO new record (not suppressed yet)

**Cleanup**: See Test 1.4 cleanup

---

### Test 1.3: Soft Bounce - Second Attempt
**Priority**: HIGH
**Test Type**: API Integration Test
**File**: `tests/api/email-webhook-soft-bounce-2.spec.ts`

**Prerequisites**:
- Test 1.2 completed (1st soft bounce recorded)
- `bounce_count` = 1 in `email_suppressions`

**Test Steps**:
1. Send POST request to `/api/email/webhook`
2. Use same payload as Test 1.2 (2nd bounce for same contact)

**Expected Results**:
- HTTP 200 response
- Database checks:
  - `email_suppressions` updated:
    - `bounce_count`: `2`
    - `last_bounce_at`: updated timestamp
    - `reason`: still `'soft_bounce_tracking'`
  - `contacts.tags` still does NOT include bounce tags
  - No notification created yet

**Cleanup**: See Test 1.4 cleanup

---

### Test 1.4: Soft Bounce - Third Attempt (Suppression Trigger)
**Priority**: HIGH
**Test Type**: API Integration Test
**File**: `tests/api/email-webhook-soft-bounce-3.spec.ts`

**Prerequisites**:
- Test 1.3 completed (2nd soft bounce recorded)
- `bounce_count` = 2 in `email_suppressions`

**Test Steps**:
1. Send POST request to `/api/email/webhook`
2. Use same payload as Test 1.2 (3rd bounce for same contact)

**Expected Results**:
- HTTP 200 response
- Database checks:
  - `email_suppressions` updated:
    - `bounce_count`: `3`
    - `reason`: changed to `'bounce'` (now suppressed)
  - `contacts.tags` NOW includes `'email_bounced_soft'`
  - `email_notifications` has new record:
    - `type`: `'bounce_soft'`
    - `title`: contains "Soft Bounce (3x)"
    - `metadata.bounce_count`: `3`

**Cleanup**:
```sql
DELETE FROM email_notifications WHERE contact_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM email_suppressions WHERE contact_id = '22222222-2222-2222-2222-222222222222';
UPDATE contacts SET tags = '[]'::jsonb WHERE id = '22222222-2222-2222-2222-222222222222';
```

---

### Test 1.5: Bounce for Non-Existent Contact
**Priority**: MEDIUM
**Test Type**: API Integration Test
**File**: `tests/api/email-webhook-unknown-contact.spec.ts`

**Prerequisites**:
- Email `nonexistent@example.com` does NOT exist in contacts table

**Test Steps**:
1. Send POST request to `/api/email/webhook`
2. Use payload:
```json
{
  "type": "email.bounced",
  "data": {
    "to": "nonexistent@example.com",
    "email_id": "test_email_003",
    "bounce": {
      "type": "Permanent",
      "message": "No such user"
    }
  }
}
```

**Expected Results**:
- HTTP 200 response (webhook accepts it)
- Console log shows "Contact not found for bounced email"
- No database changes (graceful failure)
- No error thrown

**Cleanup**: None needed

---

### Test 1.6: Invalid Webhook Payload
**Priority**: MEDIUM
**Test Type**: API Integration Test
**File**: `tests/api/email-webhook-invalid-payload.spec.ts`

**Prerequisites**: None

**Test Steps**:
1. Send POST request to `/api/email/webhook`
2. Use invalid payload:
```json
{
  "type": "email.bounced",
  "data": {
    "to": null,
    "bounce": {}
  }
}
```

**Expected Results**:
- HTTP 200 response (webhook should not crash)
- Console error logged
- No database changes

**Cleanup**: None needed

---

### Test 1.7: Multiple Bounces to Same Contact
**Priority**: MEDIUM
**Test Type**: API Integration Test
**File**: `tests/api/email-webhook-multiple-hard-bounces.spec.ts`

**Prerequisites**:
- Contact `44444444-4444-4444-4444-444444444444` exists
- Has existing hard bounce suppression with `bounce_count = 1`

**Test Steps**:
1. Send POST request for 2nd hard bounce
2. Use payload with `to: "multiplebounce@example.com"`

**Expected Results**:
- `email_suppressions` updated (not inserted again):
  - `bounce_count`: incremented to `2`
  - `last_bounce_at`: updated
- Tag remains `'email_bounced_hard'` (no duplicates)
- New notification created for each bounce

**Cleanup**:
```sql
DELETE FROM email_notifications WHERE contact_id = '44444444-4444-4444-4444-444444444444';
DELETE FROM email_suppressions WHERE contact_id = '44444444-4444-4444-4444-444444444444';
UPDATE contacts SET tags = '[]'::jsonb WHERE id = '44444444-4444-4444-4444-444444444444';
```

---

## Test Suite 2: Contact Tagging System

### Test 2.1: Add Tag Helper Function
**Priority**: HIGH
**Test Type**: Database Function Test
**File**: `tests/db/add-contact-tag.spec.ts`

**Prerequisites**:
- Contact exists with empty tags: `tags = '[]'::jsonb`

**Test Steps**:
1. Execute SQL:
```sql
SELECT add_contact_tag('11111111-1111-1111-1111-111111111111', 'test_tag');
```
2. Query contact tags:
```sql
SELECT tags FROM contacts WHERE id = '11111111-1111-1111-1111-111111111111';
```

**Expected Results**:
- Function returns: `["test_tag"]`
- Contact tags field contains: `["test_tag"]`
- `updated_at` timestamp is current

**Cleanup**:
```sql
UPDATE contacts SET tags = '[]'::jsonb WHERE id = '11111111-1111-1111-1111-111111111111';
```

---

### Test 2.2: Add Duplicate Tag (Idempotent)
**Priority**: MEDIUM
**Test Type**: Database Function Test
**File**: `tests/db/add-tag-idempotent.spec.ts`

**Prerequisites**:
- Contact has tag: `tags = '["existing_tag"]'::jsonb`

**Test Steps**:
1. Execute SQL twice:
```sql
SELECT add_contact_tag('11111111-1111-1111-1111-111111111111', 'existing_tag');
```

**Expected Results**:
- Tag array remains: `["existing_tag"]` (no duplicates)
- Function is idempotent

**Cleanup**: Reset tags to `[]`

---

### Test 2.3: Remove Tag Helper Function
**Priority**: HIGH
**Test Type**: Database Function Test
**File**: `tests/db/remove-contact-tag.spec.ts`

**Prerequisites**:
- Contact has tags: `tags = '["tag1", "tag2", "tag3"]'::jsonb`

**Test Steps**:
1. Execute SQL:
```sql
SELECT remove_contact_tag('11111111-1111-1111-1111-111111111111', 'tag2');
```

**Expected Results**:
- Function returns: `["tag1", "tag3"]`
- Contact tags: `["tag1", "tag3"]`
- Middle tag removed correctly

**Cleanup**: Reset tags

---

### Test 2.4: Check Tag Helper Function
**Priority**: MEDIUM
**Test Type**: Database Function Test
**File**: `tests/db/contact-has-tag.spec.ts`

**Prerequisites**:
- Contact has tags: `tags = '["email_bounced_hard", "vip"]'::jsonb`

**Test Steps**:
1. Check existing tag:
```sql
SELECT contact_has_tag('11111111-1111-1111-1111-111111111111', 'email_bounced_hard');
```
2. Check non-existent tag:
```sql
SELECT contact_has_tag('11111111-1111-1111-1111-111111111111', 'nonexistent');
```

**Expected Results**:
- First query returns: `true`
- Second query returns: `false`

**Cleanup**: Reset tags

---

### Test 2.5: Tags Stored in Database Correctly
**Priority**: HIGH
**Test Type**: Integration Test
**File**: `tests/integration/tag-persistence.spec.ts`

**Prerequisites**:
- Clean contact with no tags

**Test Steps**:
1. Trigger hard bounce via webhook (Test 1.1)
2. Query contact directly from database
3. Parse JSONB tags field

**Expected Results**:
- Tags field is valid JSONB array
- Contains exactly `["email_bounced_hard"]`
- GIN index allows efficient queries

**Cleanup**: Standard

---

## Test Suite 3: Job Planner Filtering

### Test 3.1: Hard Bounced Contacts Excluded from Job
**Priority**: HIGH
**Test Type**: Integration Test
**File**: `tests/integration/planner-excludes-hard-bounce.spec.ts`

**Prerequisites**:
- 3 contacts in database:
  - Contact A: No tags, no suppression
  - Contact B: Has `email_bounced_hard` tag
  - Contact C: No tags, no suppression
- All match job filter (e.g., `client_type: 'AMC'`)

**Test Steps**:
1. Create test job with `target_filter: { client_type: 'AMC' }`
2. Call `planNextBatch(job, 0)`
3. Call `expandTaskToCards()` on draft_email task
4. Inspect returned cards

**Expected Results**:
- Only 2 cards created (Contacts A and C)
- Contact B excluded (has hard bounce tag)
- Console logs show: "Filtered out contact ... - has bounce tag"

**Data Setup**:
```sql
-- Set up Contact B with hard bounce
UPDATE contacts SET tags = '["email_bounced_hard"]'::jsonb
WHERE id = '<contact_b_id>';
```

**Cleanup**:
```sql
UPDATE contacts SET tags = '[]'::jsonb WHERE id = '<contact_b_id>';
DELETE FROM kanban_cards WHERE job_id = '<test_job_id>';
```

---

### Test 3.2: Soft Bounced Contacts Excluded from Job
**Priority**: HIGH
**Test Type**: Integration Test
**File**: `tests/integration/planner-excludes-soft-bounce.spec.ts`

**Prerequisites**:
- Contact with `email_bounced_soft` tag

**Test Steps**:
1. Create job targeting this contact's segment
2. Run planner

**Expected Results**:
- Contact excluded from cards
- Logs show soft bounce filtering

**Cleanup**: Standard

---

### Test 3.3: Suppression List Check
**Priority**: HIGH
**Test Type**: Integration Test
**File**: `tests/integration/planner-checks-suppressions.spec.ts`

**Prerequisites**:
- Contact with no tags but exists in `email_suppressions` table

**Test Steps**:
1. Create suppression record:
```sql
INSERT INTO email_suppressions (org_id, contact_id, email, reason)
VALUES ('<org_id>', '<contact_id>', 'suppressed@example.com', 'manual');
```
2. Run job planner targeting this contact

**Expected Results**:
- Contact excluded even without bounce tag
- Logs show: "Filtered out contact ... - suppressed"

**Cleanup**:
```sql
DELETE FROM email_suppressions WHERE contact_id = '<contact_id>';
```

---

### Test 3.4: Non-Bounced Contacts Included
**Priority**: HIGH
**Test Type**: Integration Test
**File**: `tests/integration/planner-includes-valid-contacts.spec.ts`

**Prerequisites**:
- Valid contact with no tags, no suppressions

**Test Steps**:
1. Run job planner with filter matching this contact

**Expected Results**:
- Contact included in results
- Card created successfully
- No filtering logs for this contact

**Cleanup**: Standard

---

### Test 3.5: Filtering Logs Are Correct
**Priority**: MEDIUM
**Test Type**: Integration Test
**File**: `tests/integration/planner-logging.spec.ts`

**Prerequisites**:
- Mixed dataset: 2 bounced, 2 suppressed, 6 valid contacts

**Test Steps**:
1. Run planner
2. Capture console.log output

**Expected Results**:
- Logs show filtering counts:
  - "After bounce filtering: 8/10 contacts remaining"
  - "After suppression filtering: 6/8 contacts remaining"
- Individual contact filtering logged with reasons

**Cleanup**: Standard

---

## Test Suite 4: Email Executor Protection

### Test 4.1: Block Send to Hard Bounced Contact
**Priority**: HIGH
**Test Type**: Integration Test
**File**: `tests/integration/executor-blocks-hard-bounce.spec.ts`

**Prerequisites**:
- Contact has `email_bounced_hard` tag
- Approved kanban card exists for this contact

**Test Steps**:
1. Create card:
```typescript
{
  type: 'send_email',
  state: 'approved',
  contact_id: '<hard_bounced_contact_id>',
  action_payload: {
    to: 'hardbounce@example.com',
    subject: 'Test',
    body: '<p>Test</p>'
  }
}
```
2. Call `executeCard(cardId)`

**Expected Results**:
- Returns:
```typescript
{
  success: false,
  message: 'Email address bounced (hard bounce)',
  error: 'Cannot send email to Hard Bounce: email address has permanently bounced'
}
```
- Card state changed to `'blocked'`
- No email sent
- Activity NOT logged

**Cleanup**:
```sql
DELETE FROM kanban_cards WHERE id = '<card_id>';
```

---

### Test 4.2: Block Send to Soft Bounced Contact
**Priority**: HIGH
**Test Type**: Integration Test
**File**: `tests/integration/executor-blocks-soft-bounce.spec.ts`

**Prerequisites**:
- Contact has `email_bounced_soft` tag

**Test Steps**:
1. Create and execute send_email card

**Expected Results**:
- Returns:
```typescript
{
  success: false,
  message: 'Email address bounced (soft bounce)',
  error: 'Cannot send email to Soft Bounce: email address has bounced multiple times'
}
```
- Card blocked
- No email sent

**Cleanup**: Standard

---

### Test 4.3: Block Send to Suppressed Contact
**Priority**: HIGH
**Test Type**: Integration Test
**File**: `tests/integration/executor-blocks-suppressed.spec.ts`

**Prerequisites**:
- Contact in `email_suppressions` table (complaint reason)

**Test Steps**:
1. Create suppression:
```sql
INSERT INTO email_suppressions (org_id, contact_id, email, reason, details)
VALUES ('<org_id>', '<contact_id>', 'complained@example.com', 'complaint', 'User marked as spam');
```
2. Execute card

**Expected Results**:
- Returns:
```typescript
{
  success: false,
  message: 'Email suppressed',
  error: 'Contact is suppressed due to: complaint'
}
```

**Cleanup**: Delete suppression

---

### Test 4.4: Allow Send to Valid Contact
**Priority**: HIGH
**Test Type**: Integration Test
**File**: `tests/integration/executor-allows-valid-send.spec.ts`

**Prerequisites**:
- Contact with no tags, no suppressions
- RESEND_API_KEY not set (simulated mode)

**Test Steps**:
1. Create and execute card for valid contact

**Expected Results**:
- Returns:
```typescript
{
  success: true,
  message: 'Email sent successfully (simulated)',
  metadata: {
    messageId: 'sim_<timestamp>',
    to: 'valid@example.com',
    simulated: true
  }
}
```
- Card state: `'done'`
- Activity logged in database

**Cleanup**: Delete card and activity

---

### Test 4.5: Error Messages Are Descriptive
**Priority**: MEDIUM
**Test Type**: Integration Test
**File**: `tests/integration/executor-error-messages.spec.ts`

**Prerequisites**:
- Various bounced/suppressed contacts

**Test Steps**:
1. Attempt sends to each type
2. Capture error messages

**Expected Results**:
- Hard bounce error includes contact name
- Soft bounce error mentions "multiple times"
- Suppression error includes reason
- All errors actionable and clear

**Cleanup**: Standard

---

## Test Suite 5: Notifications API

### Test 5.1: GET Notifications - All Notifications
**Priority**: HIGH
**Test Type**: API Test
**File**: `tests/api/notifications-get-all.spec.ts`

**Prerequisites**:
- 3 notifications exist in database for test user
- Mix of read/unread, different types

**Test Steps**:
1. Authenticate as test user
2. Send GET request to `/api/notifications`

**Expected Results**:
- HTTP 200 response
- Body contains:
```json
{
  "notifications": [
    {
      "id": "...",
      "type": "bounce_hard",
      "title": "Hard Bounce: ...",
      "is_read": false,
      "contact": {
        "first_name": "...",
        "last_name": "..."
      }
    }
  ],
  "unread_count": 2
}
```
- Notifications ordered by `created_at DESC`
- Contact information joined

**Cleanup**: Delete test notifications

---

### Test 5.2: GET Notifications - Unread Only
**Priority**: HIGH
**Test Type**: API Test
**File**: `tests/api/notifications-get-unread.spec.ts`

**Prerequisites**:
- 2 unread notifications
- 3 read notifications

**Test Steps**:
1. Send GET to `/api/notifications?unread=true`

**Expected Results**:
- Returns only 2 unread notifications
- All have `is_read: false`

**Cleanup**: Standard

---

### Test 5.3: GET Notifications - Filter by Type
**Priority**: MEDIUM
**Test Type**: API Test
**File**: `tests/api/notifications-get-by-type.spec.ts`

**Prerequisites**:
- 2 `bounce_hard` notifications
- 1 `bounce_soft` notification

**Test Steps**:
1. Send GET to `/api/notifications?type=bounce_hard`

**Expected Results**:
- Returns only 2 notifications
- All have `type: "bounce_hard"`

**Cleanup**: Standard

---

### Test 5.4: PATCH Notification - Mark as Read
**Priority**: HIGH
**Test Type**: API Test
**File**: `tests/api/notifications-mark-read.spec.ts`

**Prerequisites**:
- Unread notification with ID `<notification_id>`

**Test Steps**:
1. Send PATCH to `/api/notifications`
2. Body:
```json
{
  "id": "<notification_id>",
  "is_read": true
}
```

**Expected Results**:
- HTTP 200 response
- Database updated: `is_read = true`
- Response contains updated notification

**Cleanup**: Delete notification

---

### Test 5.5: PATCH Notification - Mark as Unread
**Priority**: MEDIUM
**Test Type**: API Test
**File**: `tests/api/notifications-mark-unread.spec.ts`

**Prerequisites**:
- Read notification

**Test Steps**:
1. Send PATCH with `is_read: false`

**Expected Results**:
- Notification marked unread
- Unread count increases

**Cleanup**: Standard

---

### Test 5.6: POST Mark All as Read
**Priority**: HIGH
**Test Type**: API Test
**File**: `tests/api/notifications-mark-all-read.spec.ts`

**Prerequisites**:
- 5 unread notifications for test user

**Test Steps**:
1. Send POST to `/api/notifications/mark-all-read`

**Expected Results**:
- HTTP 200 response
- All 5 notifications now have `is_read: true`
- Subsequent GET returns `unread_count: 0`

**Cleanup**: Delete notifications

---

### Test 5.7: DELETE Notification
**Priority**: MEDIUM
**Test Type**: API Test
**File**: `tests/api/notifications-delete.spec.ts`

**Prerequisites**:
- Notification exists with ID `<notification_id>`

**Test Steps**:
1. Send DELETE to `/api/notifications?id=<notification_id>`

**Expected Results**:
- HTTP 200 response
- Notification deleted from database
- Subsequent GET does not include it

**Cleanup**: None needed

---

### Test 5.8: Notifications - Unauthorized Access
**Priority**: MEDIUM
**Test Type**: API Test
**File**: `tests/api/notifications-unauthorized.spec.ts`

**Prerequisites**:
- No authenticated user

**Test Steps**:
1. Send GET to `/api/notifications` without auth

**Expected Results**:
- HTTP 401 response
- Error: "Unauthorized"

**Cleanup**: None

---

## Test Suite 6: End-to-End Integration

### Test 6.1: Complete Bounce Flow - Hard Bounce
**Priority**: HIGH
**Test Type**: E2E Test
**File**: `tests/e2e/bounce-flow-hard.spec.ts`

**Prerequisites**:
- Clean contact with no tags/suppressions

**Test Steps**:
1. Create contact in database
2. Trigger hard bounce via webhook
3. Create job targeting this contact
4. Run job planner
5. Attempt to execute card

**Expected Results**:
- Step 2: Tag added, suppression created, notification sent
- Step 4: Contact excluded from cards
- Step 5: If card somehow exists, execution blocked

**Cleanup**: Full cleanup of all tables

---

### Test 6.2: Complete Bounce Flow - Soft Bounce (3 attempts)
**Priority**: HIGH
**Test Type**: E2E Test
**File**: `tests/e2e/bounce-flow-soft.spec.ts`

**Test Steps**:
1. Create contact
2. Send 1st soft bounce → tracking only
3. Send 2nd soft bounce → still tracking
4. Send 3rd soft bounce → suppression triggered
5. Run job planner
6. Attempt execution

**Expected Results**:
- After step 2: No tag, no notification
- After step 3: No tag, no notification
- After step 4: Tag added, notification created
- Step 5: Contact excluded
- Step 6: Blocked if attempted

**Cleanup**: Full cleanup

---

### Test 6.3: Job Creates Cards, Then Bounce, Then Next Batch Excludes
**Priority**: HIGH
**Test Type**: E2E Test
**File**: `tests/e2e/job-bounce-exclusion.spec.ts`

**Prerequisites**:
- Cadence job with 2 batches (Day 0, Day 4)

**Test Steps**:
1. Run batch 1 → Cards created for 5 contacts
2. Trigger hard bounce for contact #3
3. Run batch 2 → Should create cards for 4 contacts (exclude #3)

**Expected Results**:
- Batch 1: 5 cards created
- After bounce: Contact #3 tagged
- Batch 2: Only 4 cards created
- Contact #3 not included in batch 2

**Cleanup**: Delete job, cards, suppressions

---

### Test 6.4: Multiple Contacts with Different Bounce States
**Priority**: MEDIUM
**Test Type**: E2E Test
**File**: `tests/e2e/mixed-bounce-states.spec.ts`

**Prerequisites**:
- 6 contacts:
  - 2 hard bounced
  - 1 soft bounced (3x)
  - 1 soft bounced (1x - still sendable)
  - 2 valid

**Test Steps**:
1. Set up bounce states
2. Run job planner
3. Check results

**Expected Results**:
- Cards created for: 1 soft (1x) + 2 valid = 3 contacts
- Excluded: 2 hard + 1 soft (3x) = 3 contacts

**Cleanup**: Full cleanup

---

### Test 6.5: Notification Display in Dashboard
**Priority**: MEDIUM
**Test Type**: E2E UI Test
**File**: `tests/e2e/notifications-dashboard.spec.ts`

**Prerequisites**:
- Running Next.js app with UI
- Test user logged in

**Test Steps**:
1. Trigger hard bounce via webhook
2. Navigate to notifications page
3. Verify notification displayed
4. Click "Mark as Read"
5. Verify count decreases

**Expected Results**:
- Notification appears in UI
- Shows contact name, bounce type
- Mark as read works
- Badge count updates

**Cleanup**: Standard

---

## Test Suite 7: Edge Cases and Error Handling

### Test 7.1: Webhook with Array of Recipients
**Priority**: MEDIUM
**Test Type**: API Test
**File**: `tests/edge-cases/webhook-array-recipients.spec.ts`

**Prerequisites**: None

**Test Steps**:
1. Send webhook with:
```json
{
  "type": "email.bounced",
  "data": {
    "to": ["user1@example.com", "user2@example.com"],
    "bounce": { "type": "Permanent" }
  }
}
```

**Expected Results**:
- Webhook extracts first email: `user1@example.com`
- Processes bounce for that contact
- No error thrown

**Cleanup**: Standard

---

### Test 7.2: Contact Without Client (Orphaned)
**Priority**: LOW
**Test Type**: Integration Test
**File**: `tests/edge-cases/contact-no-client.spec.ts`

**Prerequisites**:
- Contact with invalid `client_id`

**Test Steps**:
1. Trigger bounce for this contact

**Expected Results**:
- Webhook logs error: "Could not determine org_id"
- No suppression created (can't determine org)
- No crash

**Cleanup**: Standard

---

### Test 7.3: Concurrent Bounces for Same Contact
**Priority**: LOW
**Test Type**: Load Test
**File**: `tests/edge-cases/concurrent-bounces.spec.ts`

**Prerequisites**: None

**Test Steps**:
1. Send 3 simultaneous webhook requests for same contact

**Expected Results**:
- Database handles concurrency correctly
- No duplicate suppressions (UPSERT behavior)
- `bounce_count` accurately reflects attempts

**Cleanup**: Standard

---

### Test 7.4: Extremely Large Notification List
**Priority**: LOW
**Test Type**: Performance Test
**File**: `tests/edge-cases/large-notification-list.spec.ts`

**Prerequisites**:
- 500 notifications in database

**Test Steps**:
1. GET `/api/notifications?limit=50`

**Expected Results**:
- Response time < 500ms
- Returns exactly 50 notifications
- Pagination works

**Cleanup**: Delete test notifications

---

## Test Success Criteria

### Minimum Passing Requirements

#### Critical Tests (Must Pass 100%)
- All Test Suite 1 tests (Webhook Processing)
- Test Suite 3: Tests 3.1, 3.2, 3.3 (Planner Filtering)
- Test Suite 4: Tests 4.1, 4.2, 4.3, 4.4 (Executor Protection)
- Test Suite 6: Tests 6.1, 6.2, 6.3 (E2E Integration)

#### High Priority Tests (Must Pass 90%+)
- All database tagging tests (Suite 2)
- Notifications API tests (Suite 5)

#### Medium/Low Priority (75%+ passing)
- Edge cases and error handling
- Performance tests

### Coverage Requirements
- **Code Coverage**: 85%+ for all bounce-related files
- **Branch Coverage**: 80%+ for conditional logic
- **Integration Coverage**: All happy paths + critical error paths

### Performance Benchmarks
- Webhook processing: < 200ms per event
- Job planner filtering: < 1s for 1000 contacts
- Notifications API: < 300ms response time

---

## Test Implementation Priority

### Phase 1: Core Functionality (Week 1)
1. Webhook hard bounce (Test 1.1)
2. Webhook soft bounce 3x (Tests 1.2-1.4)
3. Planner excludes bounced contacts (Tests 3.1, 3.2)
4. Executor blocks sends (Tests 4.1, 4.2)

### Phase 2: Database Layer (Week 2)
5. All tagging tests (Suite 2)
6. Suppression list checks (Test 3.3)
7. Error handling (Tests 1.5, 1.6)

### Phase 3: API & Notifications (Week 3)
8. Notifications API (Suite 5: all tests)
9. E2E flows (Suite 6)

### Phase 4: Edge Cases & Polish (Week 4)
10. Edge cases (Suite 7)
11. Performance testing
12. Load testing

---

## Playwright-Tester Agent Instructions

### Environment Setup
```bash
# Start the Next.js app
cd /Users/sherrardhaugabrooks/Documents/Salesmod
npm run dev

# In another terminal, wait for app to be ready
curl http://localhost:3000/api/health || echo "Waiting for app..."
```

### Test File Structure
Create test files in `/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/email-bounce/`:

```
e2e/
  email-bounce/
    webhook/
      01-hard-bounce.spec.ts
      02-soft-bounce-1.spec.ts
      03-soft-bounce-2.spec.ts
      04-soft-bounce-3.spec.ts
      05-unknown-contact.spec.ts
      06-invalid-payload.spec.ts
      07-multiple-bounces.spec.ts
    database/
      01-add-tag.spec.ts
      02-add-tag-idempotent.spec.ts
      03-remove-tag.spec.ts
      04-has-tag.spec.ts
      05-tag-persistence.spec.ts
    planner/
      01-exclude-hard-bounce.spec.ts
      02-exclude-soft-bounce.spec.ts
      03-check-suppressions.spec.ts
      04-include-valid.spec.ts
      05-logging.spec.ts
    executor/
      01-block-hard-bounce.spec.ts
      02-block-soft-bounce.spec.ts
      03-block-suppressed.spec.ts
      04-allow-valid.spec.ts
      05-error-messages.spec.ts
    notifications/
      01-get-all.spec.ts
      02-get-unread.spec.ts
      03-get-by-type.spec.ts
      04-mark-read.spec.ts
      05-mark-unread.spec.ts
      06-mark-all-read.spec.ts
      07-delete.spec.ts
      08-unauthorized.spec.ts
    integration/
      01-bounce-flow-hard.spec.ts
      02-bounce-flow-soft.spec.ts
      03-job-bounce-exclusion.spec.ts
      04-mixed-bounce-states.spec.ts
      05-notifications-dashboard.spec.ts
    edge-cases/
      01-array-recipients.spec.ts
      02-contact-no-client.spec.ts
      03-concurrent-bounces.spec.ts
      04-large-notification-list.spec.ts
```

### Test Template

```typescript
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Email Bounce Webhook - Hard Bounce', () => {
  const testContactId = '11111111-1111-1111-1111-111111111111';
  const testEmail = 'hardbounce@example.com';

  test.beforeEach(async () => {
    // Clean up any existing test data
    await supabase.from('email_notifications').delete().eq('contact_id', testContactId);
    await supabase.from('email_suppressions').delete().eq('contact_id', testContactId);
    await supabase.from('contacts').update({ tags: [] }).eq('id', testContactId);
  });

  test.afterEach(async () => {
    // Clean up test data
    await supabase.from('email_notifications').delete().eq('contact_id', testContactId);
    await supabase.from('email_suppressions').delete().eq('contact_id', testContactId);
    await supabase.from('contacts').update({ tags: [] }).eq('id', testContactId);
  });

  test('should process hard bounce event correctly', async ({ request }) => {
    // Step 1: Send webhook
    const response = await request.post('http://localhost:3000/api/email/webhook', {
      data: {
        type: 'email.bounced',
        data: {
          to: testEmail,
          email_id: 'test_email_001',
          bounce: {
            type: 'Permanent',
            subType: 'General',
            message: '550 5.1.1 User unknown'
          }
        }
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.received).toBe(true);

    // Step 2: Verify suppression created
    const { data: suppression } = await supabase
      .from('email_suppressions')
      .select('*')
      .eq('contact_id', testContactId)
      .single();

    expect(suppression).toBeTruthy();
    expect(suppression.reason).toBe('bounce');
    expect(suppression.bounce_type).toBe('Permanent');
    expect(suppression.bounce_count).toBe(1);

    // Step 3: Verify tag added
    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', testContactId)
      .single();

    expect(contact.tags).toContain('email_bounced_hard');

    // Step 4: Verify notification created
    const { data: notification } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('contact_id', testContactId)
      .eq('type', 'bounce_hard')
      .single();

    expect(notification).toBeTruthy();
    expect(notification.is_read).toBe(false);
    expect(notification.title).toContain('Hard Bounce');
  });
});
```

### Execution Instructions

1. **Run all tests**:
```bash
npx playwright test e2e/email-bounce/ --reporter=html
```

2. **Run specific suite**:
```bash
npx playwright test e2e/email-bounce/webhook/
```

3. **Run with debugging**:
```bash
npx playwright test e2e/email-bounce/ --debug
```

4. **Generate test report**:
```bash
npx playwright show-report
```

### Test Data Setup Script

Create `/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/email-bounce/setup-test-data.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function setupTestContacts(orgId: string, clientId: string) {
  const contacts = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'hardbounce@example.com',
      first_name: 'Hard',
      last_name: 'Bounce',
      client_id: clientId,
      org_id: orgId
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'softbounce@example.com',
      first_name: 'Soft',
      last_name: 'Bounce',
      client_id: clientId,
      org_id: orgId
    },
    // ... more test contacts
  ];

  for (const contact of contacts) {
    await supabase.from('contacts').upsert(contact);
  }
}

export async function cleanupTestData() {
  const testContactIds = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    // ... all test contact IDs
  ];

  await supabase.from('email_notifications').delete().in('contact_id', testContactIds);
  await supabase.from('email_suppressions').delete().in('contact_id', testContactIds);
  await supabase.from('contacts').delete().in('id', testContactIds);
}
```

### Reporting Requirements

After test execution, provide:

1. **Test Summary**:
   - Total tests run
   - Passed/Failed/Skipped counts
   - Pass percentage per suite

2. **Failure Details**:
   - Test name
   - Expected vs Actual
   - Stack trace
   - Screenshots (if UI test)

3. **Coverage Report**:
   - Which files were tested
   - Coverage percentages
   - Untested branches

4. **Bug Report Template**:
```markdown
## Bug: [Brief Description]

**Test**: [Test file and name]
**Priority**: [High/Medium/Low]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]

**Evidence**:
- Screenshot: [link]
- Console logs: [paste]
- Database state: [query results]

**Suggested Fix**:
[If known]
```

---

## Manual Testing Checklist

For features requiring manual verification:

### Dashboard UI
- [ ] Notifications bell icon shows correct count
- [ ] Clicking notification opens details
- [ ] Mark as read visually updates
- [ ] Filtering by type works
- [ ] Delete notification removes from list

### Email Logs
- [ ] Blocked emails show reason in activity log
- [ ] Bounced emails have distinct icon/badge
- [ ] Contact profile shows bounce status

### Admin Panel
- [ ] Suppression list viewable
- [ ] Manual unsuppression works
- [ ] Bounce statistics displayed correctly

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Email Bounce Tests

on:
  push:
    branches: [main]
  pull_request:
    paths:
      - 'src/app/api/email/**'
      - 'src/lib/agent/**'
      - 'supabase/migrations/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run dev &
      - run: npx playwright test e2e/email-bounce/
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Maintenance

### Weekly Tasks
- Review failed tests
- Update test data if schema changes
- Check for flaky tests

### Monthly Tasks
- Review coverage reports
- Add tests for new edge cases
- Performance benchmarking

### After Deployment
- Run smoke tests
- Verify production metrics
- Monitor bounce rates

---

## Appendix: SQL Helper Queries

### Check Contact Bounce Status
```sql
SELECT
  id,
  email,
  first_name,
  last_name,
  tags,
  CASE
    WHEN tags ? 'email_bounced_hard' THEN 'Hard Bounce'
    WHEN tags ? 'email_bounced_soft' THEN 'Soft Bounce'
    ELSE 'Active'
  END as status
FROM contacts
WHERE id = '<contact_id>';
```

### View All Suppressions
```sql
SELECT
  es.*,
  c.email,
  c.first_name,
  c.last_name
FROM email_suppressions es
JOIN contacts c ON c.id = es.contact_id
ORDER BY es.last_bounce_at DESC;
```

### Count Bounces by Type
```sql
SELECT
  bounce_type,
  COUNT(*) as count,
  AVG(bounce_count) as avg_attempts
FROM email_suppressions
WHERE bounce_type IS NOT NULL
GROUP BY bounce_type;
```

### Recent Notifications
```sql
SELECT
  type,
  email,
  title,
  created_at,
  is_read
FROM email_notifications
ORDER BY created_at DESC
LIMIT 20;
```

---

## Contact for Questions

- **System Owner**: [Your Name]
- **Documentation**: This file
- **Issue Tracker**: GitHub Issues
- **Test Reports**: `/playwright-report/`

---

**Document Version**: 1.0
**Last Updated**: 2025-01-12
**Status**: Ready for Implementation
