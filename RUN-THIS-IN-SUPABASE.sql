-- ================================================================
-- 🚀 COMPLETE AGENT SETUP - ALL-IN-ONE SCRIPT
-- ================================================================
-- 1. Log in to Supabase: https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy this ENTIRE file and paste it
-- 5. Click "Run"
-- 6. Check the output for your User ID and verification
-- 7. Go to http://localhost:9002/agent and click "Start Agent Cycle"!
-- ================================================================

-- =====================================================
-- PART 1: CREATE ALL TABLES (The Migration)
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: agent_runs
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  mode TEXT NOT NULL DEFAULT 'review' CHECK (mode IN ('auto', 'review')),
  goal_pressure DECIMAL(5, 2),
  planned_actions INTEGER DEFAULT 0,
  approved INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_org_id ON agent_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON agent_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status) WHERE status = 'running';

-- TABLE: kanban_cards
CREATE TABLE IF NOT EXISTS kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('send_email', 'schedule_call', 'research', 'create_task', 'follow_up', 'create_deal')),
  title TEXT NOT NULL,
  description TEXT,
  rationale TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  state TEXT NOT NULL DEFAULT 'suggested' CHECK (state IN ('suggested', 'in_review', 'approved', 'executing', 'done', 'blocked', 'rejected')),
  action_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_cards_org_state ON kanban_cards(org_id, state);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_client ON kanban_cards(client_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_created_at ON kanban_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_state ON kanban_cards(state) WHERE state IN ('suggested', 'in_review', 'approved');

-- TABLE: agent_memories
CREATE TABLE IF NOT EXISTS agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('chat', 'email', 'session', 'client_context')),
  key TEXT NOT NULL,
  content JSONB NOT NULL,
  importance DECIMAL(3, 2) DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, scope, key)
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_org_scope ON agent_memories(org_id, scope);
CREATE INDEX IF NOT EXISTS idx_agent_memories_expires ON agent_memories(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_memories_key ON agent_memories(org_id, key);

-- TABLE: agent_reflections
CREATE TABLE IF NOT EXISTS agent_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  metrics JSONB DEFAULT '{}'::JSONB,
  hypotheses TEXT,
  next_adjustments JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_reflections_run ON agent_reflections(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_reflections_created_at ON agent_reflections(created_at DESC);

-- TABLE: email_suppressions
CREATE TABLE IF NOT EXISTS email_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint', 'manual')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_email_suppressions_org ON email_suppressions(org_id);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_contact ON email_suppressions(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_email ON email_suppressions(email);

-- TABLE: oauth_tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'slack', 'microsoft')),
  account_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, provider, account_email)
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_org_provider ON oauth_tokens(org_id, provider);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON oauth_tokens(expires_at);

-- TABLE: agent_settings
CREATE TABLE IF NOT EXISTS agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  mode TEXT NOT NULL DEFAULT 'review' CHECK (mode IN ('auto', 'review')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'America/New_York',
  daily_send_limit INTEGER DEFAULT 50,
  cooldown_days INTEGER DEFAULT 5,
  escalation_threshold DECIMAL(3, 2) DEFAULT 0.75,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_settings_org ON agent_settings(org_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own runs" ON agent_runs FOR SELECT USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create runs" ON agent_runs FOR INSERT WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own runs" ON agent_runs FOR UPDATE USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own cards" ON kanban_cards FOR SELECT USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create cards" ON kanban_cards FOR INSERT WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own cards" ON kanban_cards FOR UPDATE USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own cards" ON kanban_cards FOR DELETE USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own memories" ON agent_memories FOR SELECT USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage memories" ON agent_memories FOR ALL USING (auth.uid() = org_id) WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own reflections" ON agent_reflections FOR SELECT USING (auth.uid() IN (SELECT org_id FROM agent_runs WHERE id = run_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "System can create reflections" ON agent_reflections FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own suppressions" ON email_suppressions FOR SELECT USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "System can manage suppressions" ON email_suppressions FOR ALL USING (auth.uid() = org_id) WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own tokens" ON oauth_tokens FOR SELECT USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their own tokens" ON oauth_tokens FOR ALL USING (auth.uid() = org_id) WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own settings" ON agent_settings FOR SELECT USING (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their own settings" ON agent_settings FOR ALL USING (auth.uid() = org_id) WITH CHECK (auth.uid() = org_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_kanban_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kanban_cards_updated_at ON kanban_cards;
CREATE TRIGGER kanban_cards_updated_at
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_kanban_cards_updated_at();

CREATE OR REPLACE FUNCTION update_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_tokens_updated_at();

CREATE OR REPLACE FUNCTION update_agent_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_settings_updated_at ON agent_settings;
CREATE TRIGGER agent_settings_updated_at
  BEFORE UPDATE ON agent_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_settings_updated_at();

CREATE OR REPLACE FUNCTION log_card_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state = 'approved' AND OLD.state != 'approved' THEN
    NEW.approved_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS card_approval_trigger ON kanban_cards;
CREATE TRIGGER card_approval_trigger
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW
  WHEN (NEW.state = 'approved' AND OLD.state != 'approved')
  EXECUTE FUNCTION log_card_approval();

CREATE OR REPLACE FUNCTION log_card_execution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state = 'done' AND OLD.state != 'done' THEN
    NEW.executed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS card_execution_trigger ON kanban_cards;
CREATE TRIGGER card_execution_trigger
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW
  WHEN (NEW.state = 'done' AND OLD.state != 'done')
  EXECUTE FUNCTION log_card_execution();

-- =====================================================
-- PART 2: INITIALIZE YOUR AGENT SETTINGS
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get your user ID
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '✓ TABLES CREATED SUCCESSFULLY';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 YOUR USER INFO:';
  RAISE NOTICE '   User ID: %', v_user_id;
  RAISE NOTICE '   Email: %', v_user_email;
  RAISE NOTICE '';
  
  -- Initialize agent settings
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
    v_user_id,
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
    
  RAISE NOTICE '✓ Agent settings initialized';
  RAISE NOTICE '   - Mode: Review (safe, requires approval)';
  RAISE NOTICE '   - Daily limit: 50 emails';
  RAISE NOTICE '   - Cooldown: 5 days between contacts';
  RAISE NOTICE '';
  
  -- Create test goal
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
    v_user_id,
    'Monthly revenue target for agent testing'
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE '✓ Test goal created';
  RAISE NOTICE '   - Type: Revenue';
  RAISE NOTICE '   - Target: $100,000/month';
  RAISE NOTICE '';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '🎉 SETUP COMPLETE!';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 NEXT STEPS:';
  RAISE NOTICE '   1. Go to http://localhost:9002/agent';
  RAISE NOTICE '   2. Click "Agent Control Panel"';
  RAISE NOTICE '   3. Click "Start Agent Cycle"';
  RAISE NOTICE '   4. Watch the AI create action cards!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 The agent will analyze your clients and goals,';
  RAISE NOTICE '   then propose 3-7 intelligent actions.';
  RAISE NOTICE '';
  RAISE NOTICE '=======================================================';
END $$;

-- =====================================================
-- PART 3: VERIFY SETUP
-- =====================================================

SELECT 
  '=== SETUP VERIFICATION ===' as status,
  '' as table_name,
  0 as count,
  '' as notes
UNION ALL
SELECT 
  '',
  'agent_settings' as table_name, 
  COUNT(*)::INTEGER as count,
  CASE WHEN COUNT(*) >= 1 THEN '✓ Ready' ELSE '✗ Missing' END as notes
FROM agent_settings
UNION ALL
SELECT 
  '',
  'agent_runs',
  COUNT(*)::INTEGER,
  CASE WHEN COUNT(*) = 0 THEN '✓ Ready (empty)' ELSE 'Has data' END
FROM agent_runs
UNION ALL
SELECT 
  '',
  'kanban_cards',
  COUNT(*)::INTEGER,
  CASE WHEN COUNT(*) = 0 THEN '✓ Ready (empty)' ELSE 'Has data' END
FROM kanban_cards
UNION ALL
SELECT 
  '',
  'goals (active)',
  COUNT(*)::INTEGER,
  CASE WHEN COUNT(*) >= 1 THEN '✓ Has goals' ELSE '⚠ No goals' END
FROM goals WHERE is_active = true
UNION ALL
SELECT 
  '',
  'clients (active)',
  COUNT(*)::INTEGER,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✓ Has clients'
    ELSE '⚠ No clients (agent will still work)'
  END
FROM clients WHERE is_active = true;

