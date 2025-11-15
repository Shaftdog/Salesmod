# Gmail Agent Card Processor

This feature enables the autonomous agent to receive emails from Gmail and automatically process them into actionable cards.

## Overview

The Gmail integration replaces Lindy.ai for email classification and routing. All emails sent to `Admin@roiappraise.com` are automatically:
1. Fetched from Gmail every 2 minutes
2. Classified using Claude Sonnet 4.5 (11 categories)
3. Converted into kanban cards
4. Auto-responded (if confidence ≥ 95%) or escalated to humans
5. Organized in Gmail with labels, read status, and archiving

## Inbox Management

The agent automatically manages your Gmail inbox to keep it clean:

**Auto-Responded Emails:**
- ✅ Marked as read
- 🏷️ Labeled: `Salesmod/[CATEGORY]` and `Salesmod/Auto-Responded`
- 📦 Archived (removed from inbox)
- Clean inbox, all processed emails still accessible via labels

**Escalated Emails (Need Human Review):**
- 📨 Kept in inbox (unread)
- 🏷️ Labeled: `Salesmod/[CATEGORY]` (e.g., `Salesmod/CASE`, `Salesmod/ESCALATE`)
- ⚠️ Requires your attention
- Visible in both Gmail and Salesmod kanban

## Campaign Context Tracking

**Critical Feature:** The agent maintains full conversation continuity with Job/Campaign emails.

When a client replies to a campaign email (from Jobs system):
- ✅ **Automatically detects** the reply is part of a campaign conversation
- ✅ **Links to original job** (job_id, task_id tracked in database)
- ✅ **Retrieves campaign context** (job name, description, original email content)
- ✅ **Includes conversation history** in AI response generation
- ✅ **Maintains continuity** - responses reference the original email

**Example:**
```
Campaign Email (Job: "Follow up on pending appraisals"):
"Hi John, checking in on your appraisal for 123 Main St.
Do you have any questions about the process?"

Client Replies:
"Yes, when will it be ready?"

Agent Response (with context):
"Thanks for getting back to me about the appraisal for 123 Main St!
Based on our current progress, we expect to have it completed by [date].
I'll keep you updated on the timeline."
```

**Without campaign context**, the agent would respond generically without knowing what appraisal or what the original email asked. **With campaign context**, responses are natural conversation continuations.

## Architecture

```
Gmail Inbox → Poller → Classifier → Card Generator → Executor → Response
     ↓            ↓           ↓            ↓              ↓
  Database    AI Model   Triage Logic   Kanban      Gmail API
```

### Components

1. **Gmail OAuth Flow** (`/api/integrations/gmail/*`)
   - `/connect` - Initiates OAuth2 flow
   - `/callback` - Handles OAuth callback
   - `/disconnect` - Removes integration
   - `/status` - Gets connection status

2. **Gmail Service** (`src/lib/gmail/gmail-service.ts`)
   - Fetches messages from Gmail API
   - Sends replies via Gmail API
   - Manages thread history
   - Handles attachments
   - Inbox management (labels, read status, archiving)

3. **Email Classifier** (`src/lib/agent/email-classifier.ts`)
   - Uses Claude Sonnet 4.5
   - 11 category classification (from Lindy rules)
   - Confidence scoring (0-1)
   - Entity extraction (order #, address, amount, urgency)

4. **Card Generator** (`src/lib/agent/email-to-card.ts`)
   - Creates cards from classified emails
   - Implements triage logic
   - Auto-approve or escalate based on confidence
   - Links emails to contacts/clients

5. **Response Generator** (`src/lib/agent/email-response-generator.ts`)
   - Generates AI-powered responses
   - Context-aware (client history, orders, properties)
   - **Campaign-aware** (includes original email for continuity)
   - Category-specific templates
   - Professional ROI Homes voice

6. **Gmail Poller** (`src/lib/agent/gmail-poller.ts`)
   - Orchestrates entire workflow
   - Polls Gmail every 2 minutes
   - **Detects campaign replies** via thread tracking
   - **Links to Jobs** for conversation context
   - Batch processes emails
   - Updates sync state

7. **Executor Updates** (`src/lib/agent/executor.ts`)
   - New card types: `reply_to_email`, `needs_human_response`
   - Sends replies via Gmail API
   - Logs all activities

## Email Classification

### 11 Categories (from Lindy)

| Category | Auto-Handle | Description |
|----------|-------------|-------------|
| **STATUS** | ✅ Yes | Simple status update requests |
| **SCHEDULING** | ✅ Yes | Property inspection logistics |
| **REMOVE** | ✅ Yes | Unsubscribe requests |
| **NOTIFICATIONS** | ✅ Yes | Automated system alerts (no response) |
| **UPDATES** | 📝 Review | New/changed info for existing orders |
| **OPPORTUNITY** | 📝 Review | New business leads seeking quotes |
| **AMC_ORDER** | 👤 Human | Official appraisal orders from AMCs |
| **CASE** | 👤 Human | Complaints, disputes, rebuttals |
| **AP** | 👤 Human | Invoices/bills to pay |
| **AR** | 👤 Human | Payments owed to ROI |
| **INFORMATION** | 📄 Log | General announcements, news |
| **ESCALATE** | 👤 Human | Unclear emails (confidence < 95%) |

### Confidence Threshold

- **≥ 0.95**: Auto-handle (if category allows)
- **< 0.95**: Escalate to human with auto-reply

## Database Schema

### New Tables

#### `gmail_messages`
Stores all fetched Gmail messages with classification results.

```sql
- id UUID
- org_id UUID
- gmail_message_id TEXT (Gmail's unique ID)
- gmail_thread_id TEXT
- contact_id UUID (linked contact)
- client_id UUID (linked client)
- card_id UUID (created card)
- from_email TEXT
- to_email TEXT[]
- subject TEXT
- body_text TEXT
- body_html TEXT
- category email_category (enum)
- confidence DECIMAL(3,2)
- intent JSONB (extracted entities)
- received_at TIMESTAMPTZ
- processed_at TIMESTAMPTZ
```

#### `gmail_sync_state`
Tracks sync configuration and statistics per organization.

```sql
- org_id UUID
- last_sync_at TIMESTAMPTZ
- last_history_id TEXT
- total_messages_synced INTEGER
- is_enabled BOOLEAN
- auto_process BOOLEAN
- auto_respond_threshold DECIMAL(3,2) (default 0.95)
- auto_handle_categories email_category[]
```

### Updated Tables

#### `kanban_cards`
Added Gmail linking fields:

```sql
- gmail_message_id TEXT
- gmail_thread_id TEXT
- email_category email_category
```

New card types:
- `reply_to_email` - Agent responds to email
- `needs_human_response` - Escalated to human

## Setup Instructions

### 1. Google Cloud Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API**
4. Configure OAuth consent screen
   - User type: External
   - Scopes: `gmail.readonly`, `gmail.send`, `gmail.modify`, `userinfo.email`
5. Create OAuth 2.0 credentials
   - Application type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/integrations/gmail/callback`

### 2. Environment Variables

Add to `.env.local`:

```bash
# Google OAuth (Gmail Integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Anthropic API (for email classification & responses)
ANTHROPIC_API_KEY=your_anthropic_api_key

# App URL (for OAuth callback)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Database Migrations

Run the migrations:

```bash
# Apply Gmail integration migrations
supabase migration up
```

Migrations created:
- `20251115000000_create_gmail_integration.sql`
- `20251115000001_add_email_card_types.sql`

### 4. Install Dependencies

```bash
npm install googleapis
```

### 5. Connect Gmail Account

1. Navigate to `/settings/integrations`
2. Click "Connect Gmail"
3. Authorize with Google account
4. Confirm connection successful

## Usage

### Automatic Polling

The system automatically polls Gmail every 2 minutes when enabled.

No manual intervention required for:
- ✅ Status update requests → Auto-responds with order status
- ✅ Scheduling requests → Auto-confirms appointments
- ✅ Unsubscribe requests → Auto-processes
- ✅ OOO replies → Updates contact metadata

### Manual Sync

Trigger sync manually from settings page:
```
POST /api/agent/gmail/poll
```

Or via UI: Settings → Integrations → "Sync Now" button

### Viewing Email Cards

All email-generated cards appear in the kanban board with:
- Email icon indicator
- Link to original Gmail message
- Full email thread context
- Classification category and confidence

### Responding to Escalated Emails

For emails that need human response:

1. Card appears in kanban as `needs_human_response`
2. Card shows full email context
3. Human responds directly from card (future: reply-from-card UI)
4. Response sent via Gmail API
5. Activity logged

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/gmail/connect` | GET | Initiate OAuth flow |
| `/api/integrations/gmail/callback` | GET | OAuth callback handler |
| `/api/integrations/gmail/disconnect` | POST | Disconnect Gmail |
| `/api/integrations/gmail/status` | GET | Get connection status |
| `/api/agent/gmail/poll` | POST | Manual sync trigger |
| `/api/agent/gmail/poll` | GET | Get sync state |

## Monitoring

### Settings Page

View at `/settings/integrations`:
- Connection status
- Last sync time
- 24-hour statistics
- Manual sync button

### Statistics Tracked

- Emails processed
- Cards created
- Auto-responded emails
- Escalated emails

### Logs

All email processing logged to:
- Activities table (user-visible)
- Server console (debugging)

## Security

- OAuth tokens encrypted at rest
- Minimal Gmail API scopes requested
- Per-organization token isolation
- Automatic token refresh
- Audit trail for all email access

## Troubleshooting

### Gmail not syncing

1. Check OAuth token not expired: `/api/integrations/gmail/status`
2. Verify `gmail_sync_state.is_enabled = true`
3. Check server logs for errors
4. Manually trigger sync: POST `/api/agent/gmail/poll`

### Emails not classified correctly

1. Review classification in `gmail_messages.category`
2. Check confidence score (`gmail_messages.confidence`)
3. If < 0.95, email escalated automatically
4. Adjust classification prompt if needed

### Responses not sending

1. Check Gmail API quota not exceeded
2. Verify OAuth token has `gmail.send` scope
3. Review executor logs for errors
4. Ensure card is in `approved` state

## Future Enhancements

- [ ] Reply-from-card UI component (in progress)
- [ ] Gmail push notifications (vs polling)
- [ ] Attachment handling
- [ ] Email templates customization
- [ ] Multi-account support
- [ ] Email thread visualization
- [ ] Advanced filters (labels, folders)
- [ ] Sentiment analysis
- [ ] Auto-categorization learning

## Testing

### Manual Testing

1. Send test email to `Admin@roiappraise.com`
2. Wait 2 minutes or trigger manual sync
3. Check kanban board for new card
4. Verify classification category
5. For auto-handle categories, check email reply sent

### Test Scenarios

- ✅ Status request: "What's the status on order #1234?"
- ✅ Scheduling: "Can we schedule an inspection for tomorrow?"
- ✅ New lead: "I need an appraisal quote for 123 Main St"
- ✅ Complaint: "This appraisal is completely wrong!"
- ✅ Unclear: "Hey, following up on that thing" (should escalate)

## Performance

- **Polling interval**: 2 minutes (configurable)
- **Batch size**: 100 messages per poll
- **Classification**: ~2-3 seconds per email
- **Response generation**: ~2-4 seconds per email
- **Total processing**: ~5 emails/second

## Cost Estimates

### API Usage (per 1000 emails/month)

- **Gmail API**: Free (within quota)
- **Anthropic Claude**:
  - Classification: ~500 tokens/email × $3/1M = $1.50
  - Response generation: ~1000 tokens/email × $3/1M = $3.00
  - **Total**: ~$4.50/1000 emails

### Savings vs Lindy

- **Lindy**: ~$100-300/month (estimate)
- **Gmail Integration**: ~$10-20/month (API costs only)
- **Savings**: 80-90% reduction

## Support

For issues or questions:
1. Check `/api/integrations/gmail/status` for diagnostics
2. Review server logs
3. Consult this documentation
4. Contact development team
