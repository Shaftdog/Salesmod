---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Database Migration System

## Overview

This project uses a custom database migration system for managing PostgreSQL schema changes via Supabase. The system includes both Node.js and Bash scripts for maximum flexibility.

## Quick Start

### Check Migration Status
```bash
node scripts/run-migration.js --check
```

### Run All Pending Migrations
```bash
node scripts/run-migration.js
```

### Run Specific Migration
```bash
node scripts/run-migration.js supabase/migrations/20251112000001_add_bounce_tracking.sql
```

## Prerequisites

### Node.js Scripts (Recommended)
- ✅ Node.js 16+ (already installed)
- ✅ `pg` package (already installed)
- ✅ `dotenv` package (already installed)
- ✅ `.env.local` with DATABASE_URL

### Bash Scripts (Alternative)
- PostgreSQL client (`psql`) installed
  - **macOS**: `brew install postgresql`
  - **Ubuntu**: `sudo apt-get install postgresql-client`
  - **Windows**: [Download installer](https://www.postgresql.org/download/windows/)

## Database Connection

Your database credentials are configured in `.env.local`:

```bash
# Session Pooler (recommended for most operations)
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# Direct Connection (for operations requiring direct access)
DIRECT_DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

**Connection Types:**
- **Session Pooler**: Better for serverless, transaction pooling, multiple connections
- **Direct**: Required for some admin operations, better for long-running transactions

## Migration Scripts

### Node.js Scripts (Cross-platform)

#### `scripts/run-migration.js`
The main migration runner with multiple modes:

**Check status:**
```bash
node scripts/run-migration.js --check
# or
node scripts/run-migration.js -c
```

Output:
```
🔍 Checking database migration status
============================================================

📡 Testing database connection...
✅ Connected successfully

📦 Database Info:
   PostgreSQL 15.1

📋 Migration History:
   Applied migrations: 5

   Recent migrations:
   ✅ 20251112000001_add_bounce_tracking.sql (applied: 2025-11-12 10:30:00)
   ✅ 20251103000000_create_jobs_system.sql (applied: 2025-11-03 15:45:23)
   ...

📂 Pending Migrations:
   ✅ No pending migrations

============================================================
```

**Run all pending:**
```bash
node scripts/run-migration.js
```

Output:
```
🚀 Running all database migrations
============================================================

📂 Found 6 migration files

⏭️  Skipping (already applied): 20250101000000_base_schema.sql
⏭️  Skipping (already applied): 20251015000000_account_manager_agent.sql
⚙️  Running: 20251112000001_add_bounce_tracking.sql
   ✅ Success

============================================================

📊 Migration Summary:
   Total files:     6
   Applied:         1
   Skipped:         5
   Failed:          0

✅ All migrations completed successfully!
```

**Run specific file:**
```bash
node scripts/run-migration.js supabase/migrations/20251112000001_add_bounce_tracking.sql
```

### Bash Scripts (Unix/Linux/macOS)

#### `scripts/check-migrations.sh`
Check database and migration status:
```bash
./scripts/check-migrations.sh
```

#### `scripts/run-all-migrations.sh`
Run all pending migrations:
```bash
./scripts/run-all-migrations.sh
```

#### `scripts/run-migration.sh`
Run a specific migration file:
```bash
./scripts/run-migration.sh supabase/migrations/20251112000001_add_bounce_tracking.sql
```

## Migration History Tracking

All scripts automatically create and use a `migration_history` table:

```sql
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
```

This table:
- Tracks which migrations have been applied
- Prevents duplicate migration runs
- Records when each migration was applied
- Uses the filename as the unique identifier

## Creating New Migrations

### Naming Convention

Migrations should follow this pattern:
```
YYYYMMDD_description.sql
```

Examples:
- `20251112000001_add_bounce_tracking.sql`
- `20251113000000_add_user_preferences.sql`
- `20251113000001_update_indexes.sql`

**Rules:**
- Date format: `YYYYMMDD`
- Sequential number if multiple on same day: `000000`, `000001`, etc.
- Descriptive name with underscores
- Always use `.sql` extension

### Migration Template

```sql
-- =====================================================
-- MIGRATION: Description of what this does
-- Date: YYYY-MM-DD
-- =====================================================

-- Step 1: Create/alter tables
CREATE TABLE IF NOT EXISTS public.example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_example_name
  ON public.example_table(name);

-- Step 3: Add constraints
ALTER TABLE public.example_table
  ADD CONSTRAINT example_name_length CHECK (LENGTH(name) >= 3);

-- Step 4: Enable RLS
ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies
CREATE POLICY "Users can view example"
  ON public.example_table FOR SELECT
  TO authenticated
  USING (true);

-- Step 6: Add comments
COMMENT ON TABLE public.example_table IS 'Example table for demonstration';
COMMENT ON COLUMN public.example_table.name IS 'User-provided name (min 3 chars)';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
```

### Best Practices

1. **Use IF NOT EXISTS/IF EXISTS**
   - Makes migrations idempotent (safe to run multiple times)
   - Prevents errors if schema already exists

2. **Include Rollback Comments**
   ```sql
   -- To rollback this migration:
   -- DROP TABLE IF EXISTS public.example_table;
   -- DROP INDEX IF EXISTS idx_example_name;
   ```

3. **Test Before Applying**
   - Run in a development environment first
   - Verify data integrity
   - Check for constraint violations

4. **Use Transactions for Complex Migrations**
   ```sql
   BEGIN;

   -- Multiple operations here

   COMMIT;
   -- ROLLBACK; -- Use this if something goes wrong
   ```

5. **Document Everything**
   - Add comments explaining WHY, not just WHAT
   - Include examples if creating functions
   - Note any dependencies on other migrations

## Workflow Examples

### Example 1: Applying the Bounce Tracking Migration

```bash
# 1. Check current status
node scripts/run-migration.js --check

# 2. Review the migration file
cat supabase/migrations/20251112000001_add_bounce_tracking.sql

# 3. Apply the migration
node scripts/run-migration.js supabase/migrations/20251112000001_add_bounce_tracking.sql

# 4. Verify it was applied
node scripts/run-migration.js --check
```

### Example 2: Creating and Applying a New Migration

```bash
# 1. Create the migration file
cat > supabase/migrations/20251113000000_add_user_settings.sql << 'EOF'
-- Add user settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON public.user_settings(user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
EOF

# 2. Check status (should show as pending)
node scripts/run-migration.js --check

# 3. Apply the migration
node scripts/run-migration.js supabase/migrations/20251113000000_add_user_settings.sql

# 4. Verify success
node scripts/run-migration.js --check
```

### Example 3: Running All Pending Migrations

```bash
# 1. Check what's pending
node scripts/run-migration.js --check

# 2. Run all pending at once
node scripts/run-migration.js

# 3. Verify all applied
node scripts/run-migration.js --check
```

## Troubleshooting

### Error: "relation already exists"

**Problem**: Table/index already exists from a previous run

**Solution**: Migration likely already applied. Check status:
```bash
node scripts/run-migration.js --check
```

If not in history but schema exists, add it manually:
```sql
INSERT INTO migration_history (migration_name)
VALUES ('20251112000001_add_bounce_tracking.sql');
```

### Error: "could not connect to database"

**Problem**: Database credentials incorrect or database not accessible

**Solutions:**
1. Verify `.env.local` has correct `DATABASE_URL`
2. Check if database is running (Supabase project active)
3. Test connection manually:
   ```bash
   psql "$DATABASE_URL" -c "SELECT version();"
   ```

### Error: "column does not exist"

**Problem**: Migration depends on schema from another migration

**Solutions:**
1. Ensure migrations run in correct order (alphabetically by filename)
2. Check if dependent migration was applied:
   ```bash
   node scripts/run-migration.js --check
   ```
3. Apply dependent migrations first

### Error: "foreign key constraint violation"

**Problem**: Trying to add foreign key to non-existent table

**Solutions:**
1. Run migrations in correct order
2. Use `IF NOT EXISTS` for table creation
3. Check referenced table exists:
   ```sql
   SELECT * FROM information_schema.tables
   WHERE table_name = 'referenced_table';
   ```

### Migration Runs But Has Errors

**Problem**: Some SQL statements failed but migration marked as complete

**Prevention:**
- Use transactions (`BEGIN` / `COMMIT`)
- Test in development first
- Review migration carefully

**Recovery:**
1. Check what actually got applied:
   ```bash
   psql "$DATABASE_URL" -c "\d+ table_name"
   ```

2. Create a fix-up migration:
   ```bash
   # Create new migration with fixes
   cat > supabase/migrations/20251113000001_fix_previous.sql
   ```

## Integration with Claude Code Agents

### database-architect Agent

The `database-architect` sub-agent has migration capabilities built-in:

```bash
# The agent can run these commands:
node scripts/run-migration.js --check
node scripts/run-migration.js
node scripts/run-migration.js path/to/migration.sql
```

**Workflow:**
1. User requests database changes
2. Agent creates migration file
3. Agent runs `--check` to see status
4. Agent applies the migration
5. Agent verifies success

**Example:**
```
User: "Add a user preferences table"
Agent: Creates migration file
Agent: Runs node scripts/run-migration.js --check
Agent: Applies migration
Agent: Confirms success
```

## Security Notes

### Credentials

- ✅ Database credentials stored in `.env.local` (gitignored)
- ✅ Never commit `.env.local` to version control
- ✅ Use `.env.local.example` for templates
- ⚠️ Service role key has admin access - keep secure

### Migration Safety

- Always review migrations before applying
- Test in development environment first
- Use transactions for complex changes
- Keep backups before major migrations
- Limit migration access to authorized users

## Advanced Usage

### Running Migrations in CI/CD

```yaml
# .github/workflows/deploy.yml
- name: Run database migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: node scripts/run-migration.js
```

### Checking Migration Status Programmatically

```javascript
const { Client } = require('pg');

async function checkPendingMigrations() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(`
    SELECT migration_name, applied_at
    FROM migration_history
    ORDER BY applied_at DESC
    LIMIT 10
  `);

  console.log('Recent migrations:', result.rows);
  await client.end();
}
```

### Custom Migration Tracking

You can query the `migration_history` table directly:

```sql
-- Show all applied migrations
SELECT * FROM migration_history ORDER BY applied_at DESC;

-- Check if specific migration applied
SELECT EXISTS(
  SELECT 1 FROM migration_history
  WHERE migration_name = '20251112000001_add_bounce_tracking.sql'
);

-- Count total migrations
SELECT COUNT(*) FROM migration_history;

-- Find migrations applied today
SELECT * FROM migration_history
WHERE applied_at >= CURRENT_DATE;
```

## Getting Help

### Check Scripts Are Executable
```bash
ls -la scripts/
# Should show -rwxr-xr-x for .sh files
```

### Make Scripts Executable
```bash
chmod +x scripts/*.sh
```

### Verbose Mode (Debugging)
```bash
# For bash scripts
bash -x scripts/run-migration.sh file.sql

# For Node.js, add console.logs or use NODE_DEBUG
NODE_DEBUG=* node scripts/run-migration.js --check
```

### Test Database Connection
```bash
# Using psql
psql "$DATABASE_URL" -c "SELECT version();"

# Using Node.js
node -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query('SELECT version()')).then(r=>console.log(r.rows)).then(()=>c.end())"
```

## Summary

✅ **Node.js scripts work cross-platform** (recommended)
✅ **Bash scripts for users with psql installed**
✅ **Automatic migration tracking** via `migration_history` table
✅ **Safe to run multiple times** (idempotent with IF NOT EXISTS)
✅ **Integrated with database-architect agent**
✅ **Database credentials configured and secure**

---

**Quick Reference:**
- Check: `node scripts/run-migration.js --check`
- Apply all: `node scripts/run-migration.js`
- Apply one: `node scripts/run-migration.js path/to/file.sql`
- Database: Configured in `.env.local`
