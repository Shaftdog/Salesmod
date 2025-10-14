-- =====================================================
-- FIX RLS POLICIES FOR AI AGENT TABLES
-- More permissive policies to prevent 406 errors
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own drafts" ON ai_drafts;
DROP POLICY IF EXISTS "Users can create drafts" ON ai_drafts;
DROP POLICY IF EXISTS "Users can update their pending drafts" ON ai_drafts;
DROP POLICY IF EXISTS "Users can delete their own drafts" ON ai_drafts;

DROP POLICY IF EXISTS "Users can view all suggestions" ON agent_suggestions;
DROP POLICY IF EXISTS "Users can update suggestions" ON agent_suggestions;

DROP POLICY IF EXISTS "Users can view their own feedback" ON ai_feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON ai_feedback;

DROP POLICY IF EXISTS "Users can view their own usage" ON ai_usage_logs;
DROP POLICY IF EXISTS "System can create usage logs" ON ai_usage_logs;

-- =====================================================
-- CREATE MORE PERMISSIVE POLICIES
-- =====================================================

-- ai_drafts - Allow all authenticated users to manage drafts
CREATE POLICY "Authenticated users can view all drafts"
  ON ai_drafts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create drafts"
  ON ai_drafts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update drafts"
  ON ai_drafts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete drafts"
  ON ai_drafts FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- agent_suggestions - Allow all authenticated users
CREATE POLICY "Authenticated users can view suggestions"
  ON agent_suggestions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create suggestions"
  ON agent_suggestions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update suggestions"
  ON agent_suggestions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete suggestions"
  ON agent_suggestions FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ai_feedback - Allow all authenticated users
CREATE POLICY "Authenticated users can view feedback"
  ON ai_feedback FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ai_usage_logs - Allow all authenticated users to view, system can create
CREATE POLICY "Authenticated users can view usage logs"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create usage logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


