---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Account Manager Agent - Quick Start Guide

## ✅ What's Been Implemented

Phase 1 of the Account Manager Agent is now complete! Here's what you have:

### Core Functionality
- ✅ AI-powered action planning (uses Claude Sonnet 3.5)
- ✅ Kanban workflow for action management
- ✅ Email draft generation and review
- ✅ Client ranking and prioritization
- ✅ Goal pressure calculation
- ✅ Review mode (all actions require approval)
- ✅ 2-hour automated work cycles
- ✅ Email suppression (bounces, complaints)
- ✅ Rate limiting and cooldown periods

### UI Components
- ✅ `/agent` page with Kanban board
- ✅ Agent control panel (right drawer)
- ✅ Email draft review sheet
- ✅ Dashboard stats and metrics
- ✅ Sidebar navigation link

### Database
- ✅ 7 new tables with RLS policies
- ✅ Triggers for timestamp updates
- ✅ Analytics views
- ✅ Migration script ready

### API Routes
- ✅ `/api/agent/run` - Trigger work cycles
- ✅ `/api/agent/execute-card` - Execute actions
- ✅ `/api/email/send` - Send emails (Resend integration)
- ✅ `/api/email/webhook` - Handle email events

## 🚀 Next Steps to Go Live

### 1. Run Database Migration (Required)

```bash
# Apply the migration
npm run db:push

# Or manually via Supabase CLI
supabase db push
```

This creates all the necessary tables and policies.

### 2. Set Up Resend for Email (Required)

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your domain `myroihome.com`:
   - Add DNS records they provide
   - Wait for verification (usually 5-10 minutes)
3. Create an API key
4. Add to `.env.local`:
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   ```
5. Configure webhook:
   - In Resend dashboard → Webhooks
   - Add endpoint: `https://yourapp.com/api/email/webhook`
   - Subscribe to: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`

### 3. Initialize Agent Settings (Required)

Get your user UUID:
```sql
SELECT id FROM profiles WHERE email = 'your-email@example.com';
```

Then run:
```bash
# Edit scripts/setup-agent.sql and replace USER_UUID_HERE
# Then run it via Supabase SQL Editor or:
psql -h your-db-host -U postgres -d postgres -f scripts/setup-agent.sql
```

### 4. Test the Agent (Recommended)

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:9002/agent`
3. Click "Agent Control Panel"
4. Click "Start Agent Cycle"

The agent will:
- Analyze your goals and clients
- Generate 3-7 action proposals
- Create cards on the Kanban board

5. Review a card:
   - Click on an email card
   - Review the draft
   - Click "Approve & Send" (will simulate send in dev)

### 5. Deploy to Production

```bash
# Commit your changes
git add .
git commit -m "Add Account Manager Agent Phase 1"
git push origin main

# Vercel will auto-deploy
# The cron job is configured in vercel.json
```

After deployment:
- Verify the cron job is active in Vercel dashboard
- Test the production webhook endpoint
- Monitor the first automated run (happens every 2 hours)

## 📊 Monitoring Your Agent

### View Agent Status
Navigate to `/agent` to see:
- Latest run status
- Cards created in last 30 days
- Approval and completion rates
- Email send statistics

### Database Queries

Check recent runs:
```sql
SELECT * FROM agent_runs 
ORDER BY started_at DESC 
LIMIT 10;
```

View pending cards:
```sql
SELECT 
  k.title,
  k.state,
  c.company_name,
  k.created_at
FROM kanban_cards k
LEFT JOIN clients c ON k.client_id = c.id
WHERE k.state IN ('suggested', 'in_review', 'approved')
ORDER BY k.created_at DESC;
```

Check agent performance:
```sql
SELECT * FROM agent_performance;
```

### Agent Telemetry
Open the Agent Control Panel to see:
- Current status (Idle/Working/Error)
- Goal pressure metrics
- Cards created today
- Emails sent
- Upcoming actions

## 🎯 How to Use

### Daily Workflow

1. **Morning Review** (9am)
   - Check Agent panel for overnight activity
   - Review new suggested cards
   - Approve high-priority emails

2. **Midday Check** (1pm)
   - Review cards from latest run
   - Execute approved actions
   - Monitor completion stats

3. **Evening Wrap** (5pm)
   - Check for blocked cards
   - Review metrics
   - Adjust goals if needed

### Card Actions

**Email Cards:**
- Click to review draft
- Edit if needed (future feature)
- Approve & Send immediately
- Or just Approve for later execution

**Task Cards:**
- Approve to create task
- Auto-assigns to you
- Appears in /tasks page

**Deal Cards:**
- Approve to create opportunity
- Appears in /deals pipeline

### Adjusting Agent Behavior

**Increase Aggressiveness:**
```sql
UPDATE agent_settings 
SET cooldown_days = 3 -- from 5
WHERE org_id = 'your-uuid';
```

**Decrease Sends:**
```sql
UPDATE agent_settings 
SET daily_send_limit = 25 -- from 50
WHERE org_id = 'your-uuid';
```

**Pause Agent:**
```sql
UPDATE agent_settings 
SET enabled = false
WHERE org_id = 'your-uuid';
```

## 🔧 Troubleshooting

### "Agent won't start"
- Check: `SELECT * FROM agent_settings WHERE org_id = 'your-uuid';`
- Ensure `enabled = true`
- Check for stuck runs: `SELECT * FROM agent_runs WHERE status = 'running';`

### "No cards being created"
- Verify you have active goals: `SELECT * FROM goals WHERE is_active = true;`
- Check you have active clients: `SELECT * FROM clients WHERE is_active = true;`
- Review run errors: `SELECT errors FROM agent_runs ORDER BY started_at DESC LIMIT 1;`

### "Emails not sending"
- Verify Resend API key: `echo $RESEND_API_KEY`
- Check suppressions: `SELECT * FROM email_suppressions;`
- Verify contact has email: `SELECT * FROM contacts WHERE id = 'contact-uuid';`

### "Cards stuck in 'executing'"
Run cleanup:
```sql
UPDATE kanban_cards 
SET state = 'blocked'
WHERE state = 'executing' 
  AND created_at < NOW() - INTERVAL '1 hour';
```

## 📝 What's NOT Implemented Yet

These are planned for Phase 2:

- ❌ Auto mode (agent executes without approval)
- ❌ Gmail integration for inbound replies
- ❌ Google Drive RAG (knowledge base)
- ❌ Slack notifications and commands
- ❌ Web research tool
- ❌ Chat interface with agent
- ❌ Multi-org support
- ❌ A/B testing framework

## 🎓 Best Practices

1. **Start Conservative**
   - Keep in Review mode for first 2 weeks
   - Monitor approval rates
   - Build trust in agent suggestions

2. **Set Realistic Goals**
   - Agent performs best with clear, measurable goals
   - Keep gap to target reasonable
   - Update goals regularly

3. **Maintain Data Quality**
   - Ensure client contacts have emails
   - Keep activity log up to date
   - Log all client interactions

4. **Review Regularly**
   - Check agent reflections for insights
   - Monitor blocked cards for patterns
   - Adjust settings based on performance

5. **Provide Feedback**
   - Approve good suggestions quickly
   - Reject poor ones with notes (future feature)
   - This trains the agent over time

## 📞 Support

Need help?
- Check `AGENT-IMPLEMENTATION-README.md` for detailed docs
- Review database logs: `agent_runs.errors`
- Check agent reflections for insights
- Review API logs for errors

## 🚀 Ready to Scale?

Once comfortable with Phase 1:
1. Increase daily send limits gradually
2. Reduce cooldown periods
3. Consider Phase 2 features (Auto mode, Gmail, Slack)
4. Explore A/B testing different approaches
5. Train on your specific patterns

---

**Current Status:** Phase 1 Complete ✅  
**Next Phase:** Gmail + Slack Integration  
**Timeline:** Ready for internal testing now!


