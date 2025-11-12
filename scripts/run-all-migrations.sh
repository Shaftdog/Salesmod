#!/bin/bash
#
# Run all database migrations in order
# Usage: ./scripts/run-all-migrations.sh
#

set -e  # Exit on error

echo "🚀 Running all database migrations"
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
  echo ""
  echo "Install with:"
  echo "  macOS:   brew install postgresql"
  echo "  Ubuntu:  sudo apt-get install postgresql-client"
  echo "  Windows: https://www.postgresql.org/download/windows/"
  exit 1
fi

# Create migration_history table if it doesn't exist
psql "$DATABASE_URL" -c "
  CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ DEFAULT NOW()
  );
" > /dev/null

# Get list of already applied migrations
APPLIED_MIGRATIONS=$(psql "$DATABASE_URL" -t -c "SELECT migration_name FROM migration_history;" 2>/dev/null | tr -d ' ')

# Find all migration files
MIGRATION_DIR="supabase/migrations"
if [ ! -d "$MIGRATION_DIR" ]; then
  echo "❌ Error: Migration directory not found: $MIGRATION_DIR"
  exit 1
fi

# Count migrations
TOTAL_COUNT=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l | tr -d ' ')
if [ "$TOTAL_COUNT" -eq 0 ]; then
  echo "✅ No migrations found in $MIGRATION_DIR"
  exit 0
fi

echo "📂 Found $TOTAL_COUNT migration files"
echo ""

# Run each migration in order
APPLIED_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0

for MIGRATION_FILE in "$MIGRATION_DIR"/*.sql; do
  MIGRATION_NAME=$(basename "$MIGRATION_FILE")

  # Check if already applied
  if echo "$APPLIED_MIGRATIONS" | grep -q "$MIGRATION_NAME"; then
    echo "⏭️  Skipping (already applied): $MIGRATION_NAME"
    ((SKIPPED_COUNT++))
    continue
  fi

  echo "⚙️  Running: $MIGRATION_NAME"

  # Run the migration
  if psql "$DATABASE_URL" -f "$MIGRATION_FILE" -v ON_ERROR_STOP=1 > /dev/null 2>&1; then
    # Log to migration history
    psql "$DATABASE_URL" -c "INSERT INTO migration_history (migration_name) VALUES ('$MIGRATION_NAME');" > /dev/null

    echo "   ✅ Success"
    ((APPLIED_COUNT++))
  else
    echo "   ❌ Failed"
    ((FAILED_COUNT++))

    # Show error details
    echo ""
    echo "Error details:"
    psql "$DATABASE_URL" -f "$MIGRATION_FILE" -v ON_ERROR_STOP=1 || true
    echo ""
    echo "❌ Migration failed: $MIGRATION_NAME"
    echo "Stopping migration process."
    exit 1
  fi
done

echo ""
echo "=" | tr ' ' '='  | head -c 60
echo ""
echo "📊 Migration Summary:"
echo "   Total files:     $TOTAL_COUNT"
echo "   Applied:         $APPLIED_COUNT"
echo "   Skipped:         $SKIPPED_COUNT"
echo "   Failed:          $FAILED_COUNT"
echo ""

if [ "$FAILED_COUNT" -eq 0 ]; then
  echo "✅ All migrations completed successfully!"
else
  echo "❌ Some migrations failed"
  exit 1
fi
