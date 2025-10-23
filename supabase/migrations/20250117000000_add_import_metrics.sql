-- Add metrics column to migration_jobs table for tracking import statistics
alter table migration_jobs
  add column if not exists metrics jsonb default '{}'::jsonb;
