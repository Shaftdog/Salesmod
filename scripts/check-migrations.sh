#!/bin/bash
#
# Check database migration status
# Usage: ./scripts/check-migrations.sh
#

set -e  # Exit on error

echo "🔍 Checking database migration status"
echo "=" | tr ' ' '='  | head -c 60
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)
else
  echo "❌ Error: .env.local not found"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set in .env.local"
  exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "❌ Error: psql (PostgreSQL client) is not installed"
  exit 1
fi

# Test database connection
echo "📡 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
  echo "✅ Connected successfully"
else
  echo "❌ Failed to connect to database"
  exit 1
fi

echo ""
echo "📦 Database Info:"
psql "$DATABASE_URL" -c "SELECT version();" -t | head -1

# Check if migration_history table exists
echo ""
echo "📋 Migration History:"
if psql "$DATABASE_URL" -c "\d migration_history" > /dev/null 2>&1; then
  APPLIED_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM migration_history;" | tr -d ' ')
  echo "   Applied migrations: $APPLIED_COUNT"
  echo ""

  # Show recent migrations
  echo "   Recent migrations:"
  psql "$DATABASE_URL" -c "
    SELECT
      migration_name,
      TO_CHAR(applied_at, 'YYYY-MM-DD HH24:MI:SS') as applied_at
    FROM migration_history
    ORDER BY applied_at DESC
    LIMIT 10;
  " --tuples-only --no-align --field-separator ' | ' | while IFS='|' read -r name date; do
    echo "   ✅ $name (applied: $date)"
  done
else
  echo "   ⚠️  No migration_history table found (no migrations applied yet)"
fi

# Check for pending migrations
echo ""
echo "📂 Pending Migrations:"
MIGRATION_DIR="supabase/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
  echo "   ⚠️  Migration directory not found: $MIGRATION_DIR"
  exit 0
fi

# Get list of applied migrations
APPLIED_MIGRATIONS=$(psql "$DATABASE_URL" -t -c "SELECT migration_name FROM migration_history;" 2>/dev/null | tr -d ' ' || echo "")

PENDING_COUNT=0
for MIGRATION_FILE in "$MIGRATION_DIR"/*.sql; do
  if [ ! -f "$MIGRATION_FILE" ]; then
    continue
  fi

  MIGRATION_NAME=$(basename "$MIGRATION_FILE")

  # Check if not applied
  if ! echo "$APPLIED_MIGRATIONS" | grep -q "$MIGRATION_NAME"; then
    if [ $PENDING_COUNT -eq 0 ]; then
      echo ""
    fi
    echo "   ⏳ $MIGRATION_NAME"
    ((PENDING_COUNT++))
  fi
done

if [ $PENDING_COUNT -eq 0 ]; then
  echo "   ✅ No pending migrations"
else
  echo ""
  echo "   Total pending: $PENDING_COUNT"
  echo ""
  echo "💡 Run './scripts/run-all-migrations.sh' to apply pending migrations"
fi

echo ""
echo "=" | tr ' ' '='  | head -c 60
echo ""
