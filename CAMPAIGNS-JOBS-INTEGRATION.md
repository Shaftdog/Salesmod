# How Campaigns Sync with Jobs

**Date:** November 17, 2025
**Author:** Claude Code

---

## Overview

Campaigns and Jobs are **tightly integrated** in your application. When you launch a campaign, it automatically creates a Job and Job Tasks that execute the email outreach with rate limiting and tracking.

---

## The Integration Flow

### 1. Campaign Creation (Draft)

```
User creates campaign → Status: "draft"
- Define audience (who gets emails)
- Write email content (subject + body)
- Set sending rules (rate limits, schedule)
```

At this stage:
- ✅ Campaign exists in database
- ❌ No Job created yet
- ❌ No emails sent

### 2. Campaign Launch

**File:** `src/lib/campaigns/launch.ts`

When you click "Launch Campaign", the system:

```typescript
// 1. Resolve audience (filters suppressions)
const recipients = await resolveTargetSegment(campaign.target_segment, orgId);

// 2. Create Job linked to campaign
const job = await supabase.from('jobs').insert({
  campaign_id: campaignId,        // 👈 Links job to campaign
  name: campaign.name,
  role: 'outreach',
  metadata: {
    rate_limit: {
      per_hour: campaign.send_rate_per_hour,
      batch_size: campaign.send_batch_size
    }
  }
});

// 3. Create Job Tasks (one per recipient)
const tasks = recipients.map(recipient => ({
  job_id: job.id,
  campaign_id: campaignId,        // 👈 Links task to campaign
  email_address: recipient.email,
  status: 'pending',
  metadata: {
    email_subject: personalizedSubject,  // Merge tokens replaced
    email_body: personalizedBody,        // Merge tokens replaced
  }
}));

// 4. Update campaign status
campaign.status = 'active' or 'scheduled'
campaign.primary_job_id = job.id
```

**Result:**
- ✅ 1 Job created
- ✅ N Job Tasks created (one per recipient)
- ✅ Campaign status → `active` or `scheduled`
- ✅ Campaign → Job relationship established

---

## Database Schema

### Tables Involved

```sql
campaigns
├── id (PK)
├── name
├── status (draft → active → completed)
├── primary_job_id (FK → jobs.id)  👈 Links to main job
├── target_segment (audience filters)
├── email_subject
├── email_body
├── send_rate_per_hour
└── send_batch_size

jobs
├── id (PK)
├── campaign_id (FK → campaigns.id)  👈 Links to campaign
├── name
├── role ('outreach')
├── status (pending → completed)
└── metadata (rate limits, schedule)

job_tasks
├── id (PK)
├── job_id (FK → jobs.id)
├── campaign_id (FK → campaigns.id)  👈 Direct campaign link
├── email_address
├── contact_id (FK → contacts.id)
├── status (pending → completed/failed)
└── metadata (personalized email content)

campaign_contact_status
├── campaign_id (FK → campaigns.id)
├── email_address
├── last_event (sent, opened, clicked, replied, failed)
├── sent_at
└── opened_at
```

### Relationship Diagram

```
Campaign (1)
    ↓
    ├─→ Job (1)
    │     ↓
    │     └─→ Job Tasks (N)
    │           ↓
    │           └─→ Email Sends
    │
    └─→ Campaign Contact Status (N)
          └─→ Tracking events
```

---

## Job Execution

### Automated Execution

**File:** `src/lib/campaigns/job-executor.ts`

The job executor runs **automatically** via:
- Cron job (every 5-15 minutes)
- API endpoint: `/api/campaigns/execute`
- Manual trigger via admin panel

**What it does:**

```typescript
// 1. Find all active campaign jobs
const jobs = await supabase
  .from('jobs')
  .select('*, campaigns!inner(*)')
  .not('campaign_id', 'is', null)
  .in('campaigns.status', ['active', 'scheduled']);

// 2. For each job:
for (const job of jobs) {
  // Skip if scheduled for future
  if (campaign.start_at > now) continue;

  // 3. Check rate limit (emails sent in last hour)
  const sentInLastHour = await countRecentSends(campaign.id);
  const remainingInWindow = sendRatePerHour - sentInLastHour;

  if (remainingInWindow <= 0) {
    console.log('Rate limit reached, skipping');
    continue;
  }

  // 4. Get pending tasks (respecting rate limit)
  const tasks = await getPendingTasks(job.id, remainingInWindow);

  // 5. Send emails
  for (const task of tasks) {
    await sendCampaignEmail({
      recipientEmail: task.email_address,
      subject: task.metadata.email_subject,
      htmlBody: task.metadata.email_body,
    });

    // 6. Update task status
    task.status = 'completed';

    // 7. Track in campaign_contact_status
    await updateContactStatus(campaign.id, task.email_address, 'sent');
  }

  // 8. Check if job is complete
  if (allTasksComplete) {
    job.status = 'completed';
    campaign.status = 'completed';
  }
}
```

### Rate Limiting

The system respects `send_rate_per_hour` to avoid spam filters:

```typescript
// Example: send_rate_per_hour = 75
// Every execution cycle:
//   1. Count emails sent in last 60 minutes
//   2. If < 75, send more (up to batch_size)
//   3. If >= 75, wait until next cycle
```

This ensures emails are sent gradually, not all at once.

---

## Response Processing & Task Generation

**File:** `src/lib/campaigns/task-generator.ts`

When recipients **reply** to campaign emails:

### 1. Response Classification

```typescript
// Email reply received → classified by AI
const disposition = classifyResponse(emailBody);
// Possible values:
// - INTERESTED
// - NEEDS_MORE_INFO
// - NOT_INTERESTED
// - OUT_OF_OFFICE
// - ESCALATE_UNCLEAR
// - etc.
```

### 2. Automatic Task Creation

Based on disposition, **Cards (tasks)** are created in your Kanban system:

```typescript
// Example: User replied "interested"
await supabase.from('cards').insert({
  campaign_id: campaignId,
  campaign_response_id: responseId,
  contact_id: contactId,
  title: `Schedule call with ${contactName} - expressed interest`,
  description: `Contact responded: ${aiSummary}`,
  type: 'task',
  queue: 'sales',           // 👈 Appears in Sales queue
  priority: 'high',         // 👈 High priority
  status: 'todo',
});
```

### Task Routing by Disposition

| Disposition | Queue | Priority | Auto-Action |
|------------|-------|----------|-------------|
| INTERESTED | `sales` | high | Create "Schedule call" task |
| NEEDS_MORE_INFO | `account_manager` | medium | Create follow-up task with AI draft reply |
| NO_ACTIVE_PROFILE | `sales_admin` | high | Create onboarding task |
| ESCALATE_UNCLEAR | `sales_manager` | medium | Create manual review task |
| NOT_INTERESTED | - | - | No task (logged only) |
| OUT_OF_OFFICE | - | - | No task (auto-retry later) |

---

## Complete Lifecycle Example

### Step-by-Step Flow

```
1. CREATE CAMPAIGN
   User: Creates "Q1 Broker Outreach"
   Database: campaign record (status: draft)

2. DEFINE AUDIENCE
   User: Target segment = {client_types: ['Broker'], last_order_max_days: 90}
   System: Resolves to 150 contacts

3. WRITE EMAIL
   User: Subject = "Hey {{first_name}}, following up on your last order"
   User: Body = "Hi {{first_name}}, ..."

4. LAUNCH CAMPAIGN
   System: Creates Job with 150 tasks
   Database:
     - campaigns.status = 'active'
     - jobs.campaign_id = campaign_id
     - job_tasks (150 records, status: 'pending')
     - campaign_contact_status (150 records)

5. AUTOMATED EXECUTION (Cron runs every 10 min)

   Cycle 1 (10:00 AM):
     - Check rate limit: 0/75 sent in last hour
     - Send 25 emails (batch_size)
     - Update 25 job_tasks: status = 'completed'
     - Update 25 contact_status: last_event = 'sent'

   Cycle 2 (10:10 AM):
     - Check rate limit: 25/75 sent in last hour
     - Send 25 more emails
     - Update status

   Cycle 3 (10:20 AM):
     - Check rate limit: 50/75
     - Send 25 more

   Cycle 4 (10:30 AM):
     - Check rate limit: 75/75 (LIMIT REACHED)
     - Skip sending, wait for next hour

   Cycle 5 (11:00 AM):
     - Check rate limit: 50/75 (first batch now > 1 hour old)
     - Send 25 more

   ... continues until all 150 sent

6. RECIPIENT RESPONSES

   Broker A replies: "Not interested"
     - System: disposition = NOT_INTERESTED
     - System: No task created (just logged)

   Broker B replies: "Yes, interested!"
     - System: disposition = INTERESTED
     - System: Creates Card in Sales queue:
       Title: "Schedule call with John Smith - expressed interest"
       Priority: high

   Broker C replies: "Tell me more about pricing"
     - System: disposition = NEEDS_MORE_INFO
     - System: Creates Card in Account Manager queue:
       Title: "Follow up with Jane Doe - more info requested"
       Description: Includes AI-generated draft reply
       Priority: medium

7. SALES TEAM ACTION

   Sales rep sees tasks in Kanban:
     - "Schedule call with John Smith" (high priority)
     - "Follow up with Jane Doe" (medium priority)

   Rep clicks task → sees original response → takes action

8. CAMPAIGN COMPLETION

   When all 150 emails sent:
     - All job_tasks: status = 'completed' or 'failed'
     - Job: status = 'completed'
     - Campaign: status = 'completed'

   Campaign metrics show:
     - 150 sent
     - 5 interested (tasks created)
     - 20 needs more info (tasks created)
     - 125 no response / not interested
```

---

## API Endpoints

### Campaign Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/campaigns` | POST | Create campaign (draft) |
| `/api/campaigns/[id]/launch` | POST | Launch campaign → creates Job |
| `/api/campaigns/[id]` | GET | Get campaign details + metrics |
| `/api/campaigns/[id]/responses` | GET | Get recipient responses |

### Job Execution

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/campaigns/execute` | POST | Trigger job executor (cron) |
| `/api/campaigns/[id]/execute` | POST | Execute specific campaign job |

### Response Processing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/campaigns/process-response` | POST | Process email reply → create task |

---

## Key Integration Points

### 1. Campaign → Job (One-to-One)

- Every active campaign has exactly **1 Job**
- Job is created at launch time
- Campaign stores `primary_job_id` for quick access

### 2. Job → Job Tasks (One-to-Many)

- Each recipient gets **1 Job Task**
- Tasks hold personalized email content
- Tasks execute with rate limiting

### 3. Campaign → Contact Status (One-to-Many)

- Tracks **every recipient's journey**:
  - sent → opened → clicked → replied
- Used for metrics and suppression lists

### 4. Responses → Cards/Tasks (One-to-One)

- AI classifies email replies
- Important replies **auto-create** cards in Kanban
- Sales team sees tasks in their queues

---

## Viewing the Integration

### In the UI

**Campaign Detail Page** (`/sales/campaigns/[id]`):

- **Overview Tab**: Campaign info + launch button
- **Metrics Tab**: Shows job execution stats
  - Total emails sent
  - Open rate
  - Reply rate
  - Response dispositions
- **Responses Tab**: All replies from recipients
  - Each response links to generated task (if applicable)

**Jobs Page** (`/jobs`):

- Shows all jobs including campaign jobs
- Filter by `campaign_id` to see campaign-related jobs
- Click job → see all tasks

**Kanban Board** (`/sales/cards`):

- Shows tasks generated from campaign responses
- Filter by `campaign_id` to see tasks from specific campaign

### In the Database

```sql
-- Find all jobs for a campaign
SELECT * FROM jobs WHERE campaign_id = 'cam_xyz';

-- Find all tasks for a campaign
SELECT * FROM job_tasks WHERE campaign_id = 'cam_xyz';

-- See campaign execution status
SELECT
  c.name AS campaign,
  c.status AS campaign_status,
  j.status AS job_status,
  COUNT(jt.id) AS total_tasks,
  COUNT(CASE WHEN jt.status = 'completed' THEN 1 END) AS completed,
  COUNT(CASE WHEN jt.status = 'pending' THEN 1 END) AS pending,
  COUNT(CASE WHEN jt.status = 'failed' THEN 1 END) AS failed
FROM campaigns c
JOIN jobs j ON j.campaign_id = c.id
JOIN job_tasks jt ON jt.job_id = j.id
WHERE c.id = 'cam_xyz'
GROUP BY c.id, c.name, c.status, j.status;

-- See tasks created from campaign responses
SELECT
  c.title AS task,
  c.queue,
  c.priority,
  c.status,
  cr.disposition,
  cr.sentiment
FROM cards c
JOIN campaign_responses cr ON cr.id = c.campaign_response_id
WHERE c.campaign_id = 'cam_xyz'
ORDER BY c.priority DESC, c.created_at DESC;
```

---

## Configuration

### Rate Limiting Settings

Set when creating campaign:

```typescript
{
  send_rate_per_hour: 75,    // Max emails per hour
  send_batch_size: 25,       // Emails per execution cycle
}
```

**Recommended values:**
- **Conservative**: 50/hour, batch 10 (warmed IP, high deliverability)
- **Standard**: 75/hour, batch 25 (default)
- **Aggressive**: 150/hour, batch 50 (established sender reputation)

### Execution Frequency

Set via cron job (recommended):

```bash
# Every 10 minutes
*/10 * * * * curl -X POST http://localhost:9002/api/campaigns/execute

# Every 5 minutes (more frequent, faster sending)
*/5 * * * * curl -X POST http://localhost:9002/api/campaigns/execute
```

---

## Summary

### The Integration in One Sentence

**Campaigns create Jobs that execute via rate-limited Job Tasks, and recipient responses auto-generate Cards (tasks) in your Kanban queues for sales follow-up.**

### Key Benefits

1. **Automation**: Launch campaign → emails send automatically
2. **Rate Limiting**: Respects send limits to avoid spam filters
3. **Tracking**: Every email tracked from send → open → reply
4. **Task Generation**: Important responses become actionable tasks
5. **Unified System**: All in one database, easy reporting

---

## Files to Explore

Want to understand the code?

| File | Purpose |
|------|---------|
| `src/lib/campaigns/launch.ts` | Campaign launch → Job creation |
| `src/lib/campaigns/job-executor.ts` | Job execution with rate limiting |
| `src/lib/campaigns/task-generator.ts` | Response → Card creation |
| `src/lib/campaigns/email-sender.ts` | Actual email sending logic |
| `src/lib/campaigns/classifier.ts` | AI response classification |
| `src/app/api/campaigns/[id]/launch/route.ts` | Launch API endpoint |
| `src/app/api/campaigns/execute/route.ts` | Execution API endpoint |

---

## Next Steps

To see this in action:

1. **Create a test campaign** at `/sales/campaigns/new`
2. **Set a small audience** (e.g., 5 test contacts)
3. **Launch it** → watch Job get created
4. **Trigger execution** → `/api/campaigns/execute`
5. **Check job_tasks** → see emails "sent" (simulated in dev)
6. **View metrics** → campaign detail page shows progress
7. **Simulate a reply** → see task created in Kanban

This integration makes your campaigns fully automated while keeping sales teams in the loop with actionable tasks!
