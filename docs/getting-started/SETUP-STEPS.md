---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Complete Agent Setup - Step by Step

## ✅ What's Working
The UI is fully functional! I just tested it and confirmed:
- Agent page loads correctly
- Agent Control Panel opens
- Kanban board displays
- All components render properly

## ⚠️ What's Needed
The database tables need to be created. Follow these steps:

---

## Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm

2. Click "SQL Editor" in the left sidebar

3. Click "New Query"

4. Copy the ENTIRE contents of this file and paste into the SQL editor:
   ```
   supabase/migrations/20251015000000_account_manager_agent.sql
   ```

5. Click "Run" to execute the migration

### Option B: Via Terminal (if you have Supabase CLI logged in)

```bash
cd /Users/sherrardhaugabrooks/Documents/Salesmod
npx supabase db push
```

---

## Step 2: Get Your User ID

In Supabase SQL Editor, run:

```sql
SELECT id, email FROM auth.users LIMIT 5;
```

Copy your user ID (the UUID).

---

## Step 3: Initialize Agent Settings

In Supabase SQL Editor, run this (REPLACE `YOUR-USER-UUID-HERE` with your actual user ID):

```sql
INSERT INTO agent_settings (
  org_id,
  mode,
  quiet_hours_start,
  quiet_hours_end,
  timezone,
  daily_send_limit,
  cooldown_days,
  escalation_threshold,
  enabled
)
VALUES (
  'YOUR-USER-UUID-HERE',  -- CHANGE THIS!
  'review',
  '22:00:00',
  '08:00:00',
  'America/New_York',
  50,
  5,
  0.75,
  true
)
ON CONFLICT (org_id) DO UPDATE SET
  enabled = true,
  updated_at = NOW();
```

---

## Step 4: Create a Test Goal (Optional but Recommended)

This helps the agent have something to work towards:

```sql
INSERT INTO goals (
  metric_type,
  target_value,
  period_type,
  period_start,
  period_end,
  is_active,
  created_by,
  description
)
VALUES (
  'revenue',
  100000,
  'monthly',
  DATE_TRUNC('month', CURRENT_DATE),
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
  true,
  'YOUR-USER-UUID-HERE',  -- CHANGE THIS!
  'Monthly revenue target for agent testing'
);
```

---

## Step 5: Verify Setup

Run this query to confirm everything is ready:

```sql
SELECT 
  'agent_settings' as table_name, 
  COUNT(*) as count,
  'Should be 1' as expected
FROM agent_settings
UNION ALL
SELECT 'agent_runs', COUNT(*), 'Should be 0 (none run yet)' FROM agent_runs
UNION ALL
SELECT 'kanban_cards', COUNT(*), 'Should be 0' FROM kanban_cards
UNION ALL
SELECT 'goals (active)', COUNT(*), 'Should be at least 1' FROM goals WHERE is_active = true;
```

Expected results:
- agent_settings: 1
- agent_runs: 0
- kanban_cards: 0
- goals (active): 1 or more

---

## Step 6: Test the Agent!

Now go back to your app at http://localhost:9002/agent and:

1. Click "Agent Control Panel"
2. Click "Start Agent Cycle"
3. Watch it create cards!

---

## 🎯 Current Status

**Browser Testing Results:**
- ✅ App runs on http://localhost:9002
- ✅ Agent page accessible at /agent
- ✅ Agent Control Panel opens correctly
- ✅ Kanban board displays with all 6 columns
- ✅ UI is fully responsive and error-free
- ✅ Stats cards showing (currently 0s, expected)
- ⏳ Database tables need to be created (Steps 1-4 above)

**After you complete Steps 1-4:**
- Click "Start Agent Cycle" in the app
- Agent will analyze your data and create action cards
- You can review and approve cards
- Test email sending (simulated in dev mode)

---

## 📝 Notes

- **Email sending is simulated** in development (no Resend needed yet)
- The agent will work with whatever clients and activities you have in your database
- If you have no clients, the agent will still run but won't create many actions
- All actions require approval (Review mode) - no emails sent automatically

---

## 🆘 Troubleshooting

**If "Start Agent Cycle" doesn't work:**
1. Check browser console for errors
2. Verify agent_settings exists: `SELECT * FROM agent_settings;`
3. Check ANTHROPIC_API_KEY is set in .env.local
4. Look for errors in terminal where dev server is running

**If no cards are created:**
1. Make sure you have at least one active goal
2. Ensure you have some clients in the database
3. Check the agent_runs table for errors: `SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 1;`

