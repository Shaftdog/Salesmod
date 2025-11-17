# Key Files Reference for Re-engagement Campaigns

## Core Files by Feature

### 1. Marketing Campaigns
- **Types/Models**: `/home/user/Salesmod/src/lib/types/marketing.ts` (646 lines)
- **Service**: `/home/user/Salesmod/src/lib/marketing/campaign-service.ts` (295 lines)
- **API Routes**:
  - `/home/user/Salesmod/src/app/api/marketing/campaigns/route.ts` (100 lines)
  - `/home/user/Salesmod/src/app/api/marketing/campaigns/[id]/route.ts`
  - `/home/user/Salesmod/src/app/api/marketing/campaigns/[id]/analytics/route.ts`

### 2. Jobs System (Workflow Orchestration)
- **Types/Models**: `/home/user/Salesmod/src/types/jobs.ts` (399 lines)
  - Job statuses, task kinds, parameters
  - Cadence configuration
  - Request/response schemas
  
- **API Routes**:
  - `/home/user/Salesmod/src/app/api/agent/jobs/route.ts` (274 lines) - Create/list jobs
  - `/home/user/Salesmod/src/app/api/agent/jobs/[id]/route.ts`
  - `/home/user/Salesmod/src/app/api/agent/jobs/[id]/tasks/route.ts`
  - `/home/user/Salesmod/src/app/api/agent/jobs/[id]/cancel/route.ts`
  
- **Services**:
  - `/home/user/Salesmod/src/lib/agent/job-planner.ts` - Task planning

### 3. Email Classification & Response
- **Email Classifier**: `/home/user/Salesmod/src/lib/agent/email-classifier.ts` (692 lines)
  - AI classification with Claude Sonnet 4.5
  - User-defined rules with caching
  - Prompt injection protection
  
- **Email Response Generator**: `/home/user/Salesmod/src/lib/agent/email-response-generator.ts` (320 lines)
  - Response generation based on category
  - Business context building
  - Auto-send logic for low-risk categories
  
- **Email-to-Card Converter**: `/home/user/Salesmod/src/lib/agent/email-to-card.ts`
  - Converts classified emails to kanban cards

### 4. Gmail Integration
- **OAuth Routes**:
  - `/home/user/Salesmod/src/app/api/integrations/gmail/connect/route.ts` (74 lines)
  - `/home/user/Salesmod/src/app/api/integrations/gmail/callback/route.ts`
  - `/home/user/Salesmod/src/app/api/integrations/gmail/status/route.ts`
  - `/home/user/Salesmod/src/app/api/integrations/gmail/disconnect/route.ts`
  
- **Gmail Service**: `/home/user/Salesmod/src/lib/gmail/gmail-service.ts`

### 5. Card System (Kanban/Task Execution)
- **Executor**: `/home/user/Salesmod/src/lib/agent/executor.ts`
  - Card execution logic
  - State machine management
  - Supports 6+ card types
  
- **API**: `/home/user/Salesmod/src/app/api/agent/execute-card/route.ts` (96 lines)

### 6. Sentiment & Reputation
- **Types**: `/home/user/Salesmod/src/types/reputation.ts` (187 lines)
  - Review platforms, ratings
  - Sentiment analysis fields
  - Response templates
  - BUT: Not integrated with email responses yet

### 7. Supporting Services
- **Email Templates**: `/home/user/Salesmod/src/lib/marketing/email-template-service.ts`
- **Audience Builder**: `/home/user/Salesmod/src/lib/marketing/audience-builder.ts`
- **Lead Scoring**: `/home/user/Salesmod/src/lib/marketing/lead-scoring.ts`
- **Newsletter Service**: `/home/user/Salesmod/src/lib/marketing/newsletter-service.ts`
- **Analytics Service**: `/home/user/Salesmod/src/lib/marketing/analytics-service.ts`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKETING CAMPAIGNS                           │
│  (campaign-service.ts / marketing/campaigns routes)             │
│  - Create, list, archive campaigns                              │
│  - Multi-channel support (email, LinkedIn, etc.)                │
│  - Goal-based segmentation (reactivation, nurture, etc.)        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              JOBS SYSTEM (Workflow Runner)                       │
│        (types/jobs.ts / agent/jobs routes)                      │
│  - Multi-step task orchestration                                │
│  - Cadence configuration (day0, 4, 10, 21)                      │
│  - Target selection & filtering                                 │
│  - Status: pending → running → succeeded                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   DRAFT_EMAIL   SEND_EMAIL   CREATE_TASK
   (generates    (executes    (creates
    cards)        emails)      tasks)
        │              │              │
        └──────────────┼──────────────┘
                       ↓
        ┌──────────────────────────┐
        │   KANBAN CARDS           │
        │ (executor.ts)            │
        │ States: suggested →      │
        │ in_review → approved →   │
        │ executing → done/blocked │
        └──────────────┬───────────┘
                       ↓
        ┌──────────────────────────┐
        │   EMAIL EXECUTION        │
        │ /api/email/send          │
        │                          │
        │ Metrics tracked:         │
        │ - sent, delivered        │
        │ - opened, clicked        │
        │ - bounced, unsubscribed  │
        └──────────────┬───────────┘
                       ↓
        ┌──────────────────────────┐
        │   GMAIL INTEGRATION      │
        │ OAuth2 flow              │
        │ Email sending            │
        │ Inbox polling            │
        └──────────────┬───────────┘
                       ↓
        ┌──────────────────────────┐
        │  INCOMING EMAIL          │
        │  CLASSIFICATION          │
        │ (email-classifier.ts)    │
        │ - Claude AI analysis     │
        │ - 12 categories          │
        │ - Entity extraction      │
        │ - User-defined rules     │
        └──────────────┬───────────┘
                       ↓
        ┌──────────────────────────┐
        │  RESPONSE GENERATION     │
        │ (email-response-gen.ts)  │
        │ - Generate replies       │
        │ - Auto-send for low-risk │
        │ - HTML + plain text      │
        └──────────────┬───────────┘
                       ↓
        ┌──────────────────────────┐
        │   EMAIL-TO-CARD          │
        │ (email-to-card.ts)       │
        │ - Create kanban cards    │
        │ - Auto-execute if safe   │
        │ - Link to contacts       │
        └──────────────────────────┘
```

---

## Database Tables Referenced

Key tables found in codebase (Supabase backend):

### Marketing
- `marketing_campaigns`
- `marketing_content`
- `content_schedule`
- `email_campaigns`
- `email_sends`
- `email_templates`
- `newsletter`
- `newsletter_issues`

### Agent/Jobs
- `jobs`
- `job_tasks`
- `kanban_cards`
- `agent_memories` (for classification rules)

### Contacts/Companies
- `contacts`
- `clients`
- `contact_preferences`

### Email & Integration
- `gmail_credentials`
- `email_conversations` (inferred)

### Reputation
- `reviews`
- `review_platforms`
- `review_responses`
- `sentiment_trends`

---

## Entry Points for Re-engagement

### What to Build
1. **Campaign Launch** → Auto-create Job with cadence
   - Link: `marketing_campaigns` ↔ `jobs`
   - New endpoint: `POST /api/campaigns/[id]/launch`

2. **Reply Tracking** → Sentiment Analysis → Engagement Scoring
   - Service: `conversation-linking-service.ts` (NEW)
   - Service: `engagement-scoring-service.ts` (NEW)
   - Tables: Add `replied_at`, `reply_sentiment` to `email_sends`

3. **Automated Cadence** → Background job runner
   - Service: `cadence-execution-service.ts` (NEW)
   - Runs every 4 hours, checks day-based cadence
   - Auto-creates next-step tasks

4. **Smart Targeting** → Stale Client Identification
   - Service: `reengagement-targeting-service.ts` (NEW)
   - Identifies: no orders X days, low engagement score
   - Integrates with campaign audience builder

---

## Code Quality Notes

### Well-Designed
- Email classifier with prompt injection protection
- Type-safe with Zod validation throughout
- Consistent error handling
- Rate limiting for API calls
- Caching strategies (rule cache TTL)

### Gaps to Fill
- No cross-module integration patterns for campaign→job→email→reply flow
- No background job scheduler framework
- No conversation threading logic
- No automated pause/resume based on events

