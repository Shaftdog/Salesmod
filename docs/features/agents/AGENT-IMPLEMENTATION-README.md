# Account Manager Agent - Phase 1 Implementation

## Overview

The Account Manager Agent is an AI-powered system that automatically manages client relationships, identifies opportunities, and proposes actions to help achieve organizational goals. This Phase 1 implementation focuses on **Review Mode** where all actions require human approval before execution.

## Architecture

### Core Components

1. **Agent Logic** (`src/lib/agent/`)
   - `context-builder.ts` - Gathers goals, client data, activities, and signals
   - `planner.ts` - Uses Claude AI to generate action plans
   - `executor.ts` - Executes approved actions (emails, tasks, deals)
   - `orchestrator.ts` - Coordinates the 2-hour work cycles

2. **API Routes** (`src/app/api/`)
   - `/api/agent/run` - Triggers agent work cycles
   - `/api/agent/execute-card` - Executes individual cards
   - `/api/email/send` - Sends emails via Resend
   - `/api/email/webhook` - Handles email events (opens, clicks, bounces)

3. **UI Components** (`src/components/agent/`)
   - `kanban-board.tsx` - Drag-and-drop card management
   - `email-draft-sheet.tsx` - Review and approve email drafts
   - `agent-panel.tsx` - Control panel and telemetry

4. **Database Tables** (Supabase)
   - `agent_runs` - Work cycle executions
   - `kanban_cards` - Proposed/executed actions
   - `agent_memories` - Short-term context
   - `agent_reflections` - Post-run learning
   - `email_suppressions` - Bounce/unsubscribe list
   - `oauth_tokens` - Integration credentials
   - `agent_settings` - Per-org configuration

## Getting Started

### 1. Database Setup

Run the migration to create all necessary tables:

```bash
npm run db:push
```

Or manually apply the migration file:
```bash
psql -h localhost -U postgres -d postgres -f supabase/migrations/20251015000000_account_manager_agent.sql
```

### 2. Environment Variables

Add to `.env.local`:

```bash
# Resend (for outbound emails)
RESEND_API_KEY=re_your_api_key_here

# Gmail API (for inbound emails - optional for Phase 1)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Slack (optional for Phase 1)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your_signing_secret

# Anthropic API (for AI planning)
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain `myroihome.com`
3. Add API key to environment variables
4. Configure webhook endpoint: `https://yourapp.com/api/email/webhook`

### 4. Agent Configuration

The agent uses default settings on first run. To customize:

```sql
INSERT INTO agent_settings (org_id, mode, daily_send_limit, cooldown_days, enabled)
VALUES ('user-uuid', 'review', 50, 5, true);
```

Or via the UI: Settings page → Agent Configuration (coming soon)

## Usage

### Manual Trigger

1. Navigate to `/agent` in the app
2. Click "Agent Control Panel" button
3. Click "Start Agent Cycle"

The agent will:
- Analyze active goals and calculate pressure
- Rank clients by priority (RFM + engagement)
- Generate 3-7 action proposals
- Create Kanban cards in "Suggested" column

### Review & Approve Cards

1. View cards on the Kanban board
2. Click a card to open details
3. For email cards:
   - Review subject, body, rationale
   - Click "Approve & Send" or "Reject"

### Automatic Scheduling

The agent runs every 2 hours via Vercel Cron (configured in `vercel.json`).

To disable automatic runs:
```sql
UPDATE agent_settings SET enabled = false WHERE org_id = 'user-uuid';
```

## Card Types

- **send_email** - Outbound email communication
- **create_task** - Internal follow-up task
- **schedule_call** - Propose a call/meeting
- **follow_up** - Log a follow-up activity
- **create_deal** - Create pipeline opportunity
- **research** - Internal research/investigation

## Kanban States

Cards flow through these states:
1. **suggested** - AI-proposed, awaiting review
2. **in_review** - Being evaluated
3. **approved** - Approved, ready to execute
4. **executing** - Currently being executed
5. **done** - Successfully completed
6. **blocked** - Failed or blocked
7. **rejected** - User rejected

## Safety Features

### Email Suppressions
- Automatically blocks sending to bounced/complained addresses
- Manual suppression via database

### Daily Limits
- Default: 50 emails per day per org
- Configurable in `agent_settings`

### Cooldown Period
- Default: 5 business days between contacts
- Prevents spam and over-communication

### Quiet Hours
- Configurable by timezone
- Prevents sends during off-hours

## Monitoring

### Dashboard Stats
- Total cards created
- Emails sent
- Approval rate
- Completion rate

### Agent Panel Telemetry
- Latest run status
- Goal pressure metrics
- Upcoming actions
- Performance over 30 days

### Database Views
```sql
-- Agent performance
SELECT * FROM agent_performance;

-- Card metrics
SELECT * FROM kanban_card_metrics;
```

## Troubleshooting

### Agent Won't Start

Check:
1. `agent_settings.enabled = true`
2. No existing `running` runs (one at a time)
3. Anthropic API key is valid
4. Database tables exist

### Emails Not Sending

Check:
1. Resend API key configured
2. Contact not in `email_suppressions`
3. Daily send limit not exceeded
4. Email payload is valid

### Cards Stuck in "Executing"

Manually update:
```sql
UPDATE kanban_cards 
SET state = 'blocked', 
    description = description || '\n\nManually blocked after timeout'
WHERE state = 'executing' 
  AND created_at < NOW() - INTERVAL '1 hour';
```

## API Reference

### Trigger Run
```bash
curl -X POST https://yourapp.com/api/agent/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "review"}'
```

### Execute Card
```bash
curl -X POST https://yourapp.com/api/agent/execute-card \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardId": "card-uuid"}'
```

## Roadmap (Future Phases)

### Phase 2: Auto Mode + Advanced Features
- [ ] Auto-execution with guardrails
- [ ] Google Drive RAG (knowledge base)
- [ ] Web research tool
- [ ] Gmail integration for inbound replies
- [ ] Slack DM notifications & commands

### Phase 3: Intelligence & Optimization
- [ ] A/B testing framework
- [ ] Multi-armed bandit routing
- [ ] Fine-tuned ranking model
- [ ] Voice chat interface
- [ ] Multi-org support

## Support

For issues or questions:
1. Check database logs: `agent_runs.errors`
2. Review agent reflections for insights
3. Check application logs for API errors
4. Consult the implementation plan: `account-manager-agent-phase-1.plan.md`

## Security Notes

- All RLS policies enforce `org_id` isolation
- OAuth tokens should be encrypted (use Supabase Vault in production)
- Email webhook should verify Resend signature
- Rate limiting on API endpoints recommended
- Audit log for all agent actions in `activities` table

## Performance Considerations

- Each work cycle targets <60s execution
- LLM calls cached where possible
- Database queries use indexes
- Email sends throttled (1s delay between)
- Concurrent runs prevented by status check

## License

Proprietary - Internal use only


