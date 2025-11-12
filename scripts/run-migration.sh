#!/bin/bash
#
# Run a single database migration file
# Usage: ./scripts/run-migration.sh path/to/migration.sql
#

set -e  # Exit on error

# Check if migration file is provided
if [ -z "$1" ]; then
  echo "❌ Error: Migration file path required"
  echo "Usage: ./scripts/run-migration.sh supabase/migrations/YYYYMMDD_migration_name.sql"
  exit 1
fi

MIGRATION_FILE="$1"

# Check if file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

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

echo "🔧 Running migration: $MIGRATION_FILE"
echo "📦 Database: $(echo $DATABASE_URL | sed 's/:.*.@/@/g')"
echo ""

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

# Run the migration
echo "⚙️  Executing migration..."
if psql "$DATABASE_URL" -f "$MIGRATION_FILE" -v ON_ERROR_STOP=1; then
  echo ""
  echo "✅ Migration completed successfully!"

  # Log to migration history (optional)
  MIGRATION_NAME=$(basename "$MIGRATION_FILE")
  psql "$DATABASE_URL" -c "
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      migration_name TEXT NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO migration_history (migration_name) VALUES ('$MIGRATION_NAME');
  " > /dev/null 2>&1 || true

  echo "📝 Logged to migration_history table"
else
  echo ""
  echo "❌ Migration failed!"
  exit 1
fi
