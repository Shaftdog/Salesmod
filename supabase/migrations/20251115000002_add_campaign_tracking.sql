-- Add Job/Campaign tracking to Gmail messages
-- Links email replies back to original job/task context

ALTER TABLE gmail_messages
  ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  ADD COLUMN task_id BIGINT REFERENCES job_tasks(id) ON DELETE SET NULL,
  ADD COLUMN is_reply_to_campaign BOOLEAN DEFAULT false,
  ADD COLUMN original_message_id TEXT; -- Gmail ID of the original outbound email

-- Index for looking up replies to campaigns
CREATE INDEX idx_gmail_messages_job ON gmail_messages(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_gmail_messages_task ON gmail_messages(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_gmail_messages_original ON gmail_messages(original_message_id) WHERE original_message_id IS NOT NULL;

COMMENT ON COLUMN gmail_messages.job_id IS 'Link to job/campaign that initiated this conversation';
COMMENT ON COLUMN gmail_messages.task_id IS 'Link to specific job task (e.g., send_email task)';
COMMENT ON COLUMN gmail_messages.is_reply_to_campaign IS 'True if this is a reply to an agent-sent campaign email';
COMMENT ON COLUMN gmail_messages.original_message_id IS 'Gmail message ID of the original outbound email this is replying to';
