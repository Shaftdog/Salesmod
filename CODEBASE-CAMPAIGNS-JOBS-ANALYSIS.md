# Salesmod Codebase Analysis: Campaigns & Jobs System

## 1. MARKETING CAMPAIGNS SECTION - EXISTS

### Data Models
- **Table**: `marketing_campaigns`
- **Key Fields**:
  - `id`, `org_id`, `name`, `description`, `goal`, `status`
  - `start_date`, `end_date`
  - Target audience: `target_role_codes`, `target_role_categories`, `exclude_role_codes`
  - Segmentation: `include_tags`, `exclude_tags`, `min_lead_score`
  - Channels: email, linkedin, substack, tiktok, instagram, facebook, pinterest, youtube, blog, newsletter, webinar, podcast
  - `metrics` (JSONB)
  - `created_by`, `created_at`, `updated_at`

### Campaign Types
- **Goals**: reactivation, nurture, acquisition, education, retention, brand_awareness
- **Statuses**: draft, active, paused, completed, archived
- **Related Tables**:
  - `marketing_content` (blog, social_post, email, case_study, etc.)
  - `content_schedule` (for scheduling posts across channels)
  - `email_campaigns` (email-specific campaigns)
  - `email_sends` (individual email tracking)
  - `newsletter`, `newsletter_issues`
  - `email_templates`

### API Routes
- `POST /api/marketing/campaigns` - Create campaign
- `GET /api/marketing/campaigns` - List campaigns
- `GET/PUT /api/marketing/campaigns/[id]` - Get/update campaign
- `GET /api/marketing/campaigns/[id]/analytics` - Campaign analytics
- Email templates: `/api/marketing/email-templates`
- Newsletters: `/api/marketing/newsletters`
- Audience targeting: `/api/marketing/audiences/calculate-size`

### Services
- `campaign-service.ts` - CRUD operations, analytics calculation
- `email-template-service.ts` - Email template management
- `newsletter-service.ts` - Newsletter management
- `audience-builder.ts` - Audience segmentation
- `analytics-service.ts` - Campaign performance tracking
- `lead-scoring.ts` - Lead scoring logic

---

## 2. JOBS SYSTEM - EXISTS & SOPHISTICATED

### Data Model
The Jobs system is a **multi-step workflow runner** for coordinating agent outreach campaigns.

#### Tables
- **`jobs`**: Campaign orchestration
  - `id`, `org_id`, `owner_id`
  - `name`, `description`, `status`
  - `params` (JSONB) - Complex configuration
  - `created_at`, `started_at`, `finished_at`, `last_run_at`
  - Denormalized metrics: `total_tasks`, `completed_tasks`, `failed_tasks`, `cards_created`, `cards_approved`, `cards_executed`, `emails_sent`, `errors_count`

- **`job_tasks`**: Individual workflow steps
  - `id`, `job_id`, `step`, `batch`, `kind`, `status`
  - `input`, `output` (JSONB)
  - `created_at`, `started_at`, `finished_at`, `error_message`, `retry_count`

### Task Kinds
- `draft_email` - Generate email cards for contacts
- `send_email` - Execute approved email cards
- `create_task` - Create CRM tasks
- `schedule_call` - Schedule follow-up calls
- `check_portal` - Verify portal access
- `update_profile` - Update contact info
- `research` - Research contacts
- `follow_up` - Follow-up actions
- `create_deal` - Create sales opportunities

### Job Parameters
Supports:
- **Target Selection**: clients, contacts, custom filters by role, state, tags, email, recency
- **Email Templates**: Multiple templates with variables
- **Cadence**: day0, day4, day10, day21, custom days
- **Behavior**: review_mode, edit_mode, bulk_mode, batch_size, auto_approve
- **Portal Checking**: Portal URLs and credentials
- **Task Creation**: Template-based task creation

### Job Statuses
- `pending`, `running`, `paused`, `succeeded`, `failed`, `cancelled`

### API Routes
- `POST /api/agent/jobs` - Create job
- `GET /api/agent/jobs` - List jobs
- `GET /api/agent/jobs/[id]` - Get job details
- `GET /api/agent/jobs/[id]/tasks` - List job tasks
- `POST /api/agent/jobs/[id]/cancel` - Cancel job

### Services
- `job-planner.ts` - Planning and task generation
- Jobs API validates with Zod schemas: `CreateJobRequestSchema`, `UpdateJobRequestSchema`

---

## 3. EMAIL SENDING - EXISTS

### Email Infrastructure
- **Table**: `email_campaigns` with metrics tracking
- **API**: `POST /api/email/send` - Send individual emails
- **Metrics**: sent, delivered, opened, clicked, bounced, unsubscribed
- **Contact Preferences**: opt-out tracking, email type preferences

### Email Templates
- Store templates with variables: `{{first_name}}`, `{{company_name}}`, etc.
- Categories: newsletter, campaign, follow_up, announcement, transactional
- Template service: `email-template-service.ts`

---

## 4. GMAIL INTEGRATION - EXISTS

### OAuth2 Setup
- `GET /api/integrations/gmail/connect` - Initiate OAuth flow
- `GET /api/integrations/gmail/callback` - Handle OAuth callback
- `GET /api/integrations/gmail/status` - Check connection status
- `POST /api/integrations/gmail/disconnect` - Disconnect account

### Scopes Requested
- `gmail.readonly` - Read emails
- `gmail.send` - Send emails
- `gmail.modify` - Modify labels/state
- `userinfo.email` - Get user email

### Gmail Service
- Located in `/src/lib/gmail/gmail-service.ts`
- Handles OAuth token refresh
- Message fetching and parsing
- Webhook integration available

---

## 5. EMAIL RESPONSE HANDLING - EXISTS (SOPHISTICATED)

### Email Classification System
**File**: `src/lib/agent/email-classifier.ts`

#### Email Categories
- `AMC_ORDER` - Official appraisal orders
- `OPPORTUNITY` - New business leads
- `CASE` - Complaints, disputes, rebuttals
- `STATUS` - Simple update requests
- `SCHEDULING` - Appointment logistics
- `UPDATES` - New/changed info
- `AP` - Accounts Payable
- `AR` - Accounts Receivable
- `INFORMATION` - Announcements
- `NOTIFICATIONS` - System alerts
- `REMOVE` - Unsubscribe requests
- `ESCALATE` - Low confidence emails

#### Classification Features
- Uses Claude Sonnet 4.5 for AI classification
- User-defined rules system with caching (60-second TTL)
- Rule types:
  - `sender_email` exact match
  - `sender_domain` domain matching
  - `subject_contains` substring matching
  - `subject_regex` with ReDoS protection
- Confidence scoring (0-1 scale)
- Entity extraction (order numbers, addresses, amounts, urgency)
- Prompt injection protection

### Email Response Generation
**File**: `src/lib/agent/email-response-generator.ts`

#### Capabilities
- Generates professional email responses based on:
  - Email category
  - Sender context (existing client, orders, interactions)
  - Order and property information
  - Campaign context (if reply to outreach)
  
#### Response Types
- Auto-reply for: STATUS, SCHEDULING, REMOVE (with 95% confidence)
- Human review required for: AMC_ORDER, CASE, AP, AR
- HTML + plain text generation
- Subject line regeneration

#### Business Context Building
- Finds contact by email
- Links to client account
- Fetches active orders
- Looks up property information
- Calculates order progress

---

## 6. KANBAN CARD SYSTEM - EXISTS

### Card Structure
**File**: `src/lib/agent/executor.ts`

#### Data Model
- `id`, `org_id`, `run_id`, `client_id`, `contact_id`
- `type`: send_email, schedule_call, research, create_task, follow_up, create_deal, reply_to_email, needs_human_response
- `state`: suggested, in_review, approved, executing, done, blocked, rejected
- `priority`: low, medium, high
- `title`, `description`, `rationale`
- `action_payload` (JSONB) - Task-specific data
- `approved_by`, `executed_at`

#### Card States Workflow
1. `suggested` - AI recommends action
2. `in_review` - Human reviews
3. `approved` - User approves
4. `executing` - Currently running
5. `done` - Completed successfully
6. `blocked` - Failed or blocked
7. `rejected` - User rejects

#### Email-to-Card Conversion
**File**: `src/lib/agent/email-to-card.ts`

Converts classified emails to actionable cards:
- Analyzes email category and confidence
- Creates appropriate card type
- Sets initial state (auto vs. review)
- Links to contact/client
- Stores email context in action_payload
- Supports auto-execution for high-confidence low-risk actions

---

## 7. SENTIMENT ANALYSIS & RESPONSE TRACKING

### Reputation System - EXISTS
**File**: `src/types/reputation.ts`

#### Features
- **Sentiment Tracking**: positive, neutral, negative with sentiment score (-1 to 1)
- **Review Management**: Google, Yelp, Facebook, Zillow, Trustpilot
- **Response Templates**: Pre-built responses for different scenarios
- **Escalation**: Flag reviews for account manager or legal review
- **Trend Analysis**: Daily sentiment trends, response rates

#### Not Found: Sentiment in Email Responses
- Email response generator doesn't analyze sentiment of incoming emails
- No emotion/tone detection in received emails

---

## 8. WHAT'S MISSING FOR RE-ENGAGEMENT CAMPAIGNS

### Critical Gaps

1. **Email Response Tracking**
   - ❌ No link between sent emails and received replies
   - ❌ No "conversation thread" tracking
   - ❌ Can't determine if email was replied to
   - ❌ Missing: field in `email_sends` table for `replied_at`, `reply_email_id`

2. **Engagement Scoring for Replies**
   - ❌ No sentiment analysis of incoming replies to campaign emails
   - ❌ No scoring system: "positive", "negative", "neutral" responses
   - ❌ No tracking of response tone/sentiment for learning
   - ❌ Missing: `response_sentiment` field in email/contact tracking

3. **Cadence Automation**
   - ⚠️ Jobs system has cadence config (day0, day4, day10, day21) BUT:
   - ❌ No scheduled task runner for automatic cadence advancement
   - ❌ No background job to execute "day 4 follow-up" tasks
   - ❌ Requires manual intervention to create next-step tasks

4. **Campaign-to-Job Linking**
   - ⚠️ Jobs system exists, campaigns exist, but:
   - ❌ No relationship between `marketing_campaigns` and `jobs`
   - ❌ Can't launch a job from a campaign
   - ❌ Missing: `campaign_id` field in `jobs` table

5. **Contact Engagement History**
   - ❌ No consolidated view of contact interaction history
   - ❌ Can't track: emails sent → replies received → sentiment → engagement score
   - ❌ Missing: engagement_score on contacts for re-engagement targeting

6. **Opt-Out/Fatigue Management**
   - ⚠️ Contact preferences exist but:
   - ❌ No automatic pause if contact opts out
   - ❌ No email fatigue detection (too many emails in short period)
   - ❌ No bounce/unsubscribe handling to pause jobs

7. **Re-engagement Targeting Logic**
   - ❌ No "stale client" identification
   - ❌ No automatic selection of disengaged contacts
   - ❌ Missing: `last_positive_interaction_at`, `engagement_trend`

8. **Multi-channel Coordination**
   - ✅ Supports multiple channels in campaigns BUT:
   - ❌ No cross-channel engagement tracking
   - ❌ No sequential channel strategy (email → linkedin → phone)
   - ❌ No coordination between campaign channels

---

## 9. CURRENT ARCHITECTURE STRENGTHS

1. **Sophisticated Email Classification**
   - AI-powered with Claude Sonnet
   - User-defined rules with caching
   - Multi-factor entity extraction
   - Safe regex evaluation

2. **Flexible Job System**
   - Multi-step workflow orchestration
   - Batch processing support
   - Task-based architecture
   - Comprehensive cadence configuration

3. **Campaign Framework**
   - Multi-channel support
   - Advanced audience segmentation
   - Role-based targeting
   - Analytics infrastructure

4. **Contact Management**
   - Preference tracking
   - Company-contact associations
   - Email validation

5. **Card-Based Execution**
   - Human-in-the-loop workflow
   - Flexible action types
   - Clear state machine

---

## 10. RECOMMENDATIONS FOR RE-ENGAGEMENT CAMPAIGNS

### Database Schema Changes
1. Add `campaign_id` to `jobs` table
2. Add `replied_at`, `reply_email_id`, `reply_sentiment` to `email_sends`
3. Add `last_positive_interaction_at`, `engagement_score`, `engagement_trend` to contacts
4. Create `email_conversations` table to link sent → reply threads
5. Create `contact_engagement_history` table for trend tracking

### New Services Required
1. **Re-engagement Targeting Service**
   - Identify stale clients (no orders in X days)
   - Calculate engagement decay
   - Segment by persona/role

2. **Conversation Linking Service**
   - Match incoming emails to original campaigns
   - Group email threads
   - Track reply sentiment

3. **Cadence Execution Service**
   - Scheduled task runner (every 4 hours?)
   - Check cadence rules
   - Auto-create next-step tasks
   - Handle pause conditions

4. **Engagement Scoring Service**
   - Analyze reply sentiment
   - Update contact engagement score
   - Track engagement trends
   - Flag high-value re-engaged contacts

### New API Routes
1. `POST /api/campaigns/[id]/launch` - Launch campaign as job
2. `GET /api/campaigns/[id]/engagement` - View engagement metrics
3. `POST /api/jobs/[id]/pause-on-optout` - Auto-pause on unsubscribe
4. `GET /api/contacts/[id]/engagement-history` - Conversation timeline
5. `POST /api/agent/cadence/execute` - Trigger cadence advancement (internal)

### Key Feature: Email Reply Handling
Current flow: Email arrives → Classified → Card created ✅
Missing: Sentiment analysis → Engagement update → Cadence adjustment

---

## CONCLUSION

**You have a STRONG foundation** for re-engagement campaigns:
- ✅ Email classification with AI
- ✅ Job-based workflow orchestration
- ✅ Campaign infrastructure
- ✅ Gmail integration
- ✅ Card-based execution

**What you need to build**:
- Link campaigns to jobs explicitly
- Add conversation/reply tracking
- Implement sentiment scoring for replies
- Build automated cadence runner
- Create engagement trend tracking
- Add stale client targeting

The good news: **Most of the hard parts exist**. You just need to wire them together and add the missing coordination layers.

