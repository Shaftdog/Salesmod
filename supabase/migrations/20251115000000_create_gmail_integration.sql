-- Gmail Integration Migration
-- Creates tables and types for Gmail email processing and card generation

-- Email category enum (from Lindy classification)
CREATE TYPE email_category AS ENUM (
  'AMC_ORDER',        -- Official appraisal orders from AMCs
  'OPPORTUNITY',      -- New business leads seeking quotes
  'CASE',             -- Complex issues (complaints, disputes, rebuttals)
  'STATUS',           -- Simple update requests on orders
  'SCHEDULING',       -- Property inspection logistics
  'UPDATES',          -- New/changed info for existing orders
  'AP',               -- Accounts Payable (bills to pay)
  'AR',               -- Accounts Receivable (payments owed)
  'INFORMATION',      -- General announcements, news
  'NOTIFICATIONS',    -- Automated system alerts
  'REMOVE',           -- Unsubscribe requests
  'ESCALATE'          -- Low confidence, needs human review
);

-- Gmail messages table
CREATE TABLE gmail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Gmail identifiers
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT NOT NULL,

  -- Linked records
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  card_id UUID REFERENCES kanban_cards(id) ON DELETE SET NULL,

  -- Email metadata
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT[] NOT NULL,
  cc_email TEXT[],
  bcc_email TEXT[],
  reply_to TEXT,
  subject TEXT,

  -- Content
  body_text TEXT,
  body_html TEXT,
  snippet TEXT, -- First 200 chars for preview

  -- Classification
  category email_category,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  intent JSONB, -- AI extracted intent/entities

  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  attachment_count INTEGER DEFAULT 0,
  attachments JSONB, -- Array of {filename, mimeType, size}

  -- Gmail metadata
  labels TEXT[], -- Gmail labels
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,

  -- Timestamps
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(org_id, gmail_message_id)
);

-- Indexes for performance
CREATE INDEX idx_gmail_messages_org_received ON gmail_messages(org_id, received_at DESC);
CREATE INDEX idx_gmail_messages_thread ON gmail_messages(gmail_thread_id);
CREATE INDEX idx_gmail_messages_category ON gmail_messages(org_id, category);
CREATE INDEX idx_gmail_messages_contact ON gmail_messages(contact_id);
CREATE INDEX idx_gmail_messages_client ON gmail_messages(client_id);
CREATE INDEX idx_gmail_messages_unprocessed ON gmail_messages(org_id, processed_at) WHERE processed_at IS NULL;
CREATE INDEX idx_gmail_messages_from_email ON gmail_messages(org_id, from_email);

-- Add Gmail fields to kanban_cards
ALTER TABLE kanban_cards
  ADD COLUMN IF NOT EXISTS gmail_message_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
  ADD COLUMN IF NOT EXISTS email_category email_category;

-- Index for linking cards to Gmail messages
CREATE INDEX idx_kanban_cards_gmail_message ON kanban_cards(gmail_message_id) WHERE gmail_message_id IS NOT NULL;
CREATE INDEX idx_kanban_cards_gmail_thread ON kanban_cards(gmail_thread_id) WHERE gmail_thread_id IS NOT NULL;

-- Gmail sync state tracking
CREATE TABLE gmail_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Last sync tracking
  last_sync_at TIMESTAMPTZ,
  last_history_id TEXT, -- Gmail API history ID for incremental sync

  -- Statistics
  total_messages_synced INTEGER DEFAULT 0,
  last_message_received_at TIMESTAMPTZ,

  -- Configuration
  is_enabled BOOLEAN DEFAULT true,
  poll_interval_minutes INTEGER DEFAULT 2,
  auto_process BOOLEAN DEFAULT true,
  auto_respond_threshold DECIMAL(3,2) DEFAULT 0.95,

  -- Categories to auto-handle (rest go to review)
  auto_handle_categories email_category[] DEFAULT ARRAY['STATUS', 'SCHEDULING', 'REMOVE', 'NOTIFICATIONS']::email_category[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id)
);

-- Add foreign key to link gmail_messages back to cards
ALTER TABLE gmail_messages
  ADD CONSTRAINT fk_gmail_messages_card
  FOREIGN KEY (card_id) REFERENCES kanban_cards(id) ON DELETE SET NULL;

-- Updated_at trigger for gmail_messages
CREATE TRIGGER update_gmail_messages_updated_at
  BEFORE UPDATE ON gmail_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for gmail_sync_state
CREATE TRIGGER update_gmail_sync_state_updated_at
  BEFORE UPDATE ON gmail_sync_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE gmail_messages IS 'Stores Gmail messages fetched from connected accounts for processing into cards';
COMMENT ON TABLE gmail_sync_state IS 'Tracks Gmail sync state and configuration per organization';
COMMENT ON COLUMN gmail_messages.confidence IS 'AI classification confidence score (0.00-1.00). <0.95 triggers escalation';
COMMENT ON COLUMN gmail_messages.intent IS 'AI-extracted entities like {orderNumber, propertyAddress, urgency, amount}';
COMMENT ON COLUMN gmail_sync_state.auto_respond_threshold IS 'Minimum confidence to auto-respond (default 0.95)';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on gmail_messages
ALTER TABLE gmail_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own Gmail messages
CREATE POLICY "Users can view their own Gmail messages"
  ON gmail_messages FOR SELECT
  USING (auth.uid() = org_id);

-- Users can insert their own Gmail messages
CREATE POLICY "Users can insert their own Gmail messages"
  ON gmail_messages FOR INSERT
  WITH CHECK (auth.uid() = org_id);

-- Users can update their own Gmail messages
CREATE POLICY "Users can update their own Gmail messages"
  ON gmail_messages FOR UPDATE
  USING (auth.uid() = org_id);

-- Users can delete their own Gmail messages
CREATE POLICY "Users can delete their own Gmail messages"
  ON gmail_messages FOR DELETE
  USING (auth.uid() = org_id);

-- Enable RLS on gmail_sync_state
ALTER TABLE gmail_sync_state ENABLE ROW LEVEL SECURITY;

-- Users can view their own sync state
CREATE POLICY "Users can view their own sync state"
  ON gmail_sync_state FOR SELECT
  USING (auth.uid() = org_id);

-- Users can insert their own sync state
CREATE POLICY "Users can insert their own sync state"
  ON gmail_sync_state FOR INSERT
  WITH CHECK (auth.uid() = org_id);

-- Users can update their own sync state
CREATE POLICY "Users can update their own sync state"
  ON gmail_sync_state FOR UPDATE
  USING (auth.uid() = org_id);

-- Users can delete their own sync state
CREATE POLICY "Users can delete their own sync state"
  ON gmail_sync_state FOR DELETE
  USING (auth.uid() = org_id);
