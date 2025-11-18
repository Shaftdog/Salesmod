---
status: current
last_verified: 2025-01-18
updated_by: Claude Code
---

# Campaign Management System V1

## Overview

The Campaign Management System enables re-engagement campaigns with existing clients through automated email outreach, response tracking, sentiment analysis, and task generation.

## Architecture

### Database Schema

#### Core Tables

1. **campaigns** - Campaign definitions
   - Target segment configuration
   - Email content and templates
   - Rate limiting settings
   - Scheduling options

2. **campaign_responses** - Individual email responses
   - One row per reply
   - AI classification (sentiment + disposition)
   - Full response text and summary

3. **campaign_contact_status** - Current state per recipient
   - Latest event, sentiment, disposition
   - Reply count and timing
   - Open tasks count
   - **KEY**: Enables efficient queries like "who hasn't replied?"

4. **email_suppressions** - Unsubscribe list
   - Org-scoped suppression
   - Prevents re-engagement of unsubscribed contacts

5. **email_templates** - Reusable email templates
   - Subject and body templates
   - Merge token tracking

#### Extended Tables

- **jobs.campaign_id** - First-class campaign relationship
- **job_tasks.campaign_id** - Direct campaign attribution
- **cards.campaign_id** - Campaign-generated tasks
- **cards.campaign_response_id** - Links task to specific response

### Key Components

#### 1. Audience Resolution (`audience-resolver.ts`)

```typescript
resolveTargetSegment(segment, orgId) → Recipient[]
```

**Features:**
- Filter-based selection (client types, tags, last order date)
- N8n list integration (placeholder)
- Automatic suppression list filtering
- Email validation

**Edge Cases Handled:**
- Orders sorted DESC for correct "last order" detection
- Missing email addresses filtered out
- Suppressed emails excluded

#### 2. Merge Token System (`merge-tokens.ts`)

**Available Tokens:**
- `{{first_name}}`, `{{last_name}}`
- `{{company_name}}`
- `{{last_order_date}}`, `{{days_since_last_order}}`
- `{{property_count}}`, `{{total_orders}}`

**Features:**
- Token extraction and validation
- Safe replacement (handles null/undefined)
- Preview with sample data

#### 3. Campaign Launch (`launch.ts`)

```typescript
launchCampaign(campaignId, orgId) → {
  campaign_id,
  job_id,
  recipients_count
}
```

**Process:**
1. Resolve audience (with suppression filtering)
2. Create Job with `campaign_id`
3. Create personalized job_tasks (batch insert)
4. Create campaign_contact_status rows
5. Update campaign status (active/scheduled)

**Rate Limiting:**
- Configurable per campaign (default: 75/hour)
- Metadata stored in job for execution scheduler

#### 4. Response Processing (`process-response.ts`)

**Triggered by:** Gmail webhook/polling

**Flow:**
1. Lookup job_task → campaign_id
2. Fetch Gmail message (TODO: implement)
3. AI classification → sentiment + disposition + unsubscribe detection
4. Create campaign_response record
5. Update campaign_contact_status
6. Handle unsubscribe → add to email_suppressions
7. Generate tasks based on disposition
8. Increment counters (reply_count, open_tasks_count)

#### 5. AI Classification (`classifier.ts`)

**V1 Policy: NO AUTO-SEND**

```typescript
classifyResponse() → {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
  disposition: 'HAS_ACTIVE_PROFILE' | 'NO_ACTIVE_PROFILE' | ...,
  is_unsubscribe: boolean,
  summary: string
}
```

**Dispositions:**
- `HAS_ACTIVE_PROFILE` - Confirmation
- `NO_ACTIVE_PROFILE` - Needs onboarding
- `INTERESTED` - Sales opportunity
- `NEEDS_MORE_INFO` - Follow-up required
- `NOT_INTERESTED` - Decline
- `OUT_OF_OFFICE` - Auto-reply
- `ESCALATE_UNCLEAR` - Manual review needed

**TODO:** Implement LLM integration (OpenAI/Anthropic)

#### 6. Task Generation (`task-generator.ts`)

**Rules:**

| Disposition | Task Queue | Priority | Draft Reply? |
|-------------|------------|----------|--------------|
| NO_ACTIVE_PROFILE | sales_admin | high | No |
| NEEDS_MORE_INFO | account_manager | medium | Yes (AI-generated) |
| INTERESTED | sales | high | No |
| ESCALATE_UNCLEAR | sales_manager | medium | No |

**Draft Generation:**
- AI creates draft reply
- Included in Card description
- Human reviews and sends (NO AUTO-SEND in V1)

#### 7. Metrics Calculation (`metrics.ts`)

**Real-time calculation from `campaign_contact_status`:**

```typescript
getCampaignMetrics(campaignId, orgId) → {
  sent, replied, pending, bounced, unsubscribed,
  response_rate,
  sentiment: { positive, neutral, negative },
  dispositions: { ... },
  tasks: { total, completed, pending },
  needs_follow_up: [...]
}
```

**Performance:**
- Single query on campaign_contact_status
- Supplementary query for tasks
- No complex aggregations

## API Endpoints

### Campaign CRUD

```
GET    /api/campaigns              - List campaigns (paginated)
POST   /api/campaigns              - Create campaign
GET    /api/campaigns/:id          - Get campaign details
PATCH  /api/campaigns/:id          - Update campaign
DELETE /api/campaigns/:id          - Delete campaign (not active)
```

### Campaign Operations

```
POST   /api/campaigns/preview-audience  - Preview recipient count/sample
POST   /api/campaigns/test-send         - Send test email to self
POST   /api/campaigns/:id/launch        - Launch campaign → create job
GET    /api/campaigns/:id/metrics       - Get campaign metrics
```

### Response Processing

```
POST   /api/campaigns/process-response  - Process Gmail reply
  Body: { gmailMessageId, jobTaskId }
```

## Permissions

**Who can manage campaigns:**
- `admin` role
- `sales_manager` role

**Implemented via:**
```typescript
canManageCampaigns(context) // in api-utils.ts
```

## Safety Features

### 1. Suppression List

**Automatic exclusion:**
- Audience resolver checks `email_suppressions`
- Never sends to previously unsubscribed contacts

**Reasons:**
- `unsubscribed` - Explicit request
- `bounced` - Hard bounce
- `spam_complaint` - Marked as spam
- `manual` - Manually added by admin

### 2. Test Send

**Before launch:**
- Send test email to logged-in user
- Uses sample merge data
- Subject prefixed with `[TEST]`

### 3. Launch Confirmation

**For large sends (>200 recipients):**
- Confirmation modal with warnings
- Shows estimated send time
- Cannot be undone reminder

### 4. No Auto-Send Replies

**V1 explicit policy:**
- AI only classifies and drafts
- All outbound responses require human approval
- Drafts stored in Card description
- Human reviews, edits, and sends

## Campaign Creation Flow

### Step 1: Target Audience

**Filter Builder:**
- Client types (AMC, Direct Lender, etc.)
- Tags
- Last order date range (days ago)
- States
- Active profile status

**OR**

**N8n List Selection:**
- Pick from existing lists
- (TODO: Implement N8n integration)

**Preview:**
- Shows recipient count
- Sample of 5 contacts

### Step 2: Email Content

**Options:**
1. Write custom email
2. Load from template
3. Edit template

**Merge Tokens:**
- Helper UI shows available tokens
- Click to insert
- Auto-validation on save

**Preview:**
- Shows rendered email with sample data

### Step 3: Settings

**Rate Limiting:**
- Default: 75 emails/hour
- Configurable per campaign
- Prevents spam filter triggers

**Scheduling:**
- Send immediately (default)
- Schedule for specific date/time
- Campaign status = 'scheduled' until start_at

### Step 4: Review & Launch

**Final check:**
- Audience count
- Email preview
- Send schedule
- Estimated completion time

**Actions:**
- Send test email to self
- Launch campaign

## Response Processing

### Gmail Integration

**TODO:** Implement Gmail API integration

**Current placeholder:**
- `process-response` endpoint exists
- Expects `gmailMessageId` + `jobTaskId`
- Mock response body for now

**Production requirements:**
1. Gmail webhook or polling
2. Extract message body and metadata
3. Thread matching via `In-Reply-To` / `References` headers
4. Call `/api/campaigns/process-response`

### Attribution Flow

```
Inbound Email
  ↓ (Gmail threading headers)
job_task_id
  ↓ (first-class column)
campaign_id
  ↓
Process response → Classify → Generate tasks
```

## Dashboard Metrics

### Overview Cards

- **Sent** - Total emails delivered
- **Replies** - Total responses received
- **Response Rate** - % of sent that replied
- **Bounced** - Failed deliveries
- **Unsubscribed** - Opted out

### Sentiment Breakdown

- 😊 Positive
- 😐 Neutral
- ☹️ Negative

### Disposition Breakdown

- Has active profile
- No active profile ← needs task
- Interested
- Needs more info
- Not interested
- Out of office

### Tasks

- Total created
- Completed
- Pending
- Completion rate

### Needs Follow-Up

**Shows contacts with:**
- `open_tasks_count > 0`
- Disposition in [NO_ACTIVE_PROFILE, NEEDS_MORE_INFO, ESCALATE_UNCLEAR]

## Database Functions

### Increment Functions

**Why:** Supabase JS doesn't support `.raw()` increment syntax

```sql
increment_reply_count(campaign_id, email_address)
increment_open_tasks_count(campaign_id, email_address, increment)
decrement_open_tasks_count(campaign_id, email_address)
```

**Usage:**
```typescript
await supabase.rpc('increment_reply_count', {
  p_campaign_id: campaignId,
  p_email_address: email
});
```

## Implementation Status

### ✅ Completed (Backend)

- [x] Database migration with RLS
- [x] TypeScript types
- [x] Permission checks
- [x] Merge token system
- [x] Audience resolver
- [x] Campaign CRUD APIs
- [x] Launch logic
- [x] AI classifier
- [x] Task generation
- [x] Response processing
- [x] Metrics calculation

### 🚧 In Progress

- [ ] Run database migration
- [ ] Campaign creation UI
- [ ] Campaign dashboard UI

### 📋 TODO

- [ ] Gmail API integration
- [ ] N8n list integration
- [ ] Rate-limited job execution scheduler
- [ ] Email sending service integration
- [ ] LLM integration for classification
- [ ] E2E tests with playwright-tester
- [ ] Suppression list management UI

## Testing Strategy

### Unit Tests

- Audience resolver filtering
- Merge token replacement
- Metrics calculation
- Task generation rules

### Integration Tests

- Campaign launch → job creation
- Response processing → task creation
- Suppression list enforcement

### E2E Tests (Playwright)

- Create campaign flow
- Launch campaign
- Simulate response processing
- Verify dashboard metrics
- Task creation and routing

## Migration to Production

### Prerequisites

1. **Gmail API Setup**
   - OAuth credentials
   - Webhook or polling mechanism
   - Message body extraction

2. **LLM Service**
   - OpenAI or Anthropic API key
   - Prompt tuning for classification

3. **Email Sending Service**
   - SMTP or service (SendGrid, Postmark)
   - Rate limiting implementation
   - Bounce handling

### Steps

1. Run migration: `npm run db:push`
2. Verify RLS policies
3. Configure Gmail integration
4. Configure LLM service
5. Test on small campaign (<10 recipients)
6. Monitor logs for errors
7. Gather feedback
8. Iterate

## Maintenance

### Adding New Merge Tokens

1. Add to `AVAILABLE_MERGE_TOKENS` in `types.ts`
2. Update `buildMergeData()` in `merge-tokens.ts`
3. Add description in `getTokenDescription()`
4. Update UI helper components

### Adding New Dispositions

1. Add to `Disposition` type in `types.ts`
2. Add task rule in `DISPOSITION_TASK_RULES` (task-generator.ts)
3. Update AI classifier prompt
4. Add label in `DISPOSITION_LABELS`

### Troubleshooting

**Campaign stuck in 'pending':**
- Check job_tasks creation
- Verify rate limiter is running
- Check job metadata for errors

**Responses not attributed:**
- Verify `campaign_id` on job_tasks
- Check Gmail threading headers
- Review `process-response` logs

**Metrics not updating:**
- Check `campaign_contact_status` table
- Verify RPC functions are working
- Review RLS policies

## Security Considerations

### RLS Policies

All tables have org-level isolation:
```sql
USING (org_id = current_setting('app.current_org_id')::uuid)
```

### Permission Checks

All campaign endpoints require:
```typescript
await canManageCampaigns(context); // admin or sales_manager
```

### Email Validation

- Suppression list checked on every campaign
- Email format validation
- Unsubscribe detection (AI + keywords)

### Rate Limiting

- Prevents spam filter triggers
- Configurable per campaign
- Metadata stored, not enforced (TODO)

## Future Enhancements

### V2 Features

- [ ] Multi-channel support (SMS, mail)
- [ ] A/B testing for email content
- [ ] Click tracking and open rates
- [ ] Automated follow-up sequences
- [ ] Campaign templates library
- [ ] Bulk import of recipients
- [ ] Export campaign reports
- [ ] Limited auto-reply for safe dispositions (OUT_OF_OFFICE)

### Performance Optimizations

- [ ] Add `campaign_metrics` table for large campaigns
- [ ] Background job for metrics refresh
- [ ] Caching for frequently accessed data
- [ ] Pagination for response lists

### Analytics

- [ ] Conversion tracking (response → appointment → order)
- [ ] Campaign comparison dashboard
- [ ] ROI calculation
- [ ] Trend analysis over time

---

## Quick Reference

### Create Campaign

```bash
POST /api/campaigns
{
  "name": "Q4 Re-engagement",
  "target_segment": {
    "type": "filter",
    "filters": {
      "client_types": ["AMC"],
      "last_order_days_ago_min": 180
    }
  },
  "email_subject": "Checking in, {{first_name}}",
  "email_body": "Hi {{first_name}},\n\nIt's been {{days_since_last_order}} days...",
  "send_rate_per_hour": 75
}
```

### Launch Campaign

```bash
POST /api/campaigns/:id/launch
```

### Get Metrics

```bash
GET /api/campaigns/:id/metrics
```

### Process Response

```bash
POST /api/campaigns/process-response
{
  "gmailMessageId": "msg_123",
  "jobTaskId": "task_456"
}
```

---

**Last Updated:** 2025-01-18
**Author:** Claude Code
**Status:** Backend Complete, UI Pending
