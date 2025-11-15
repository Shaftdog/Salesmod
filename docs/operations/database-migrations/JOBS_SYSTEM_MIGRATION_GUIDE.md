---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Jobs System Migration Guide

## Overview
Three migration files need to be applied to your Supabase database to add the Jobs (Campaign Runner) system.

## Migration Files (in order)
1. `20251103000000_create_jobs_system.sql` - Creates jobs and job_tasks tables
2. `20251103000001_add_job_links.sql` - Links jobs to kanban_cards and agent_runs
3. `20251103000002_create_job_metrics_view.sql` - Creates materialized view for metrics

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Open SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

### Step 2: Apply Migrations
Run each migration file in order. Copy and paste the contents of each file:

1. **First migration**: Copy contents of `supabase/migrations/20251103000000_create_jobs_system.sql`
   - Click "Run" or press `Cmd/Ctrl + Enter`
   - Wait for success message

2. **Second migration**: Copy contents of `supabase/migrations/20251103000001_add_job_links.sql`
   - Click "Run"
   - Wait for success message

3. **Third migration**: Copy contents of `supabase/migrations/20251103000002_create_job_metrics_view.sql`
   - Click "Run"
   - Wait for success message

### Step 3: Verify
Run this query to verify the tables were created:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('jobs', 'job_tasks', 'job_metrics');
```

You should see:
- jobs
- job_tasks
- job_metrics (materialized view)

## Method 2: Using psql (If installed)

```bash
# Install psql if needed (macOS)
brew install libpq

# Run migrations
psql "postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/20251103000000_create_jobs_system.sql

psql "postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/20251103000001_add_job_links.sql

psql "postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/20251103000002_create_job_metrics_view.sql
```

## Method 3: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref zqhenxhgcjxslpfezybm

# Push migrations
supabase db push
```

## What Gets Created

### Tables
- **jobs**: Container for campaigns/projects
  - Tracks job status, configuration, and metrics
  - RLS policy: Users can only see their organization's jobs

- **job_tasks**: Granular execution steps within jobs
  - One task can create multiple kanban cards (1:many)
  - Tracks progress and results
  - Unique constraint on (job_id, batch, step)

### Materialized View
- **job_metrics**: Fast-access aggregated metrics
  - Pre-calculated task completion rates
  - Card state breakdown by type
  - Approval rates and email counts

### Functions
- `transition_job_status()` - Safe status transitions with validation
- `cancel_job()` - Cancel job and skip all pending tasks
- `update_job_metrics_on_task_change()` - Auto-update metrics
- `update_job_metrics_on_card_change()` - Sync metrics with cards
- `refresh_job_metrics()` - Manually refresh materialized view
- `get_job_cards()` - Get all cards for a job
- `get_job_progress()` - Get job progress summary

### Links Added
- `kanban_cards.job_id` - Links cards to jobs (nullable)
- `kanban_cards.task_id` - Links cards to specific tasks (nullable)
- `agent_runs.job_id` - Tracks which runs processed which jobs

## After Migration

### 1. Refresh Materialized View
After creating your first jobs, refresh the metrics view:
```sql
SELECT refresh_job_metrics();
```

### 2. Test Job Creation
Via API:
```bash
curl -X POST http://localhost:9002/api/agent/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Job",
    "description": "First test job",
    "params": {
      "target_group": "AMC",
      "cadence": {"day0": true},
      "templates": {
        "intro": {"subject": "Hello {{first_name}}", "body": "Test email"}
      },
      "review_mode": true,
      "batch_size": 5
    }
  }'
```

### 3. View Jobs in UI
Navigate to: http://localhost:9002/agent/jobs

## Troubleshooting

### Error: "relation already exists"
The tables were already created. Safe to ignore or use `DROP TABLE IF EXISTS` first.

### Error: "permission denied"
Ensure you're using the correct database credentials and have CREATE permissions.

### Error: "auth.uid() does not exist"
The RLS policies use Supabase Auth. Ensure you're connected to a Supabase database.

### Materialized view not refreshing
Run manually:
```sql
SELECT refresh_job_metrics();
```

Or set up a cron job (requires pg_cron extension):
```sql
SELECT cron.schedule(
  'refresh-job-metrics',
  '*/5 * * * *',  -- Every 5 minutes
  $$SELECT refresh_job_metrics();$$
);
```

## Security Notes

1. **RLS Policies**: All tables have Row Level Security enabled
2. **SECURITY DEFINER**: Functions have authorization checks via `auth.uid()`
3. **XSS Prevention**: Template variables are HTML-escaped
4. **Transaction Safety**: Job creation uses rollback on failure

## Performance Optimizations

1. **Materialized View**: Pre-calculated metrics for fast queries
2. **Indexes**: Optimized for common queries (org_id, status, job_id)
3. **FILTER Clauses**: Single LEFT JOIN instead of multiple subqueries
4. **Batch Processing**: Incremental task generation instead of all upfront

## Next Steps

1. ✅ Apply migrations
2. ✅ Test job creation via UI
3. ✅ Create first campaign
4. ✅ Monitor jobs in Control Panel
5. ✅ Check metrics in job_metrics view
