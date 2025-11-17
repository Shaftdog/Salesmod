#!/bin/bash
# Apply migrations directly via PostgreSQL (alternative method)
# Use this if the Supabase CLI method doesn't work

set -e

echo "🗄️  Direct SQL Migration Script"
echo "==============================="
echo ""

# Database configuration
DB_HOST="db.zqhenxhgcjxslpfezybm.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="NsjCsuLJfBswVhdI"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found. Please install PostgreSQL client:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql-client"
    echo "   Windows: Download from postgresql.org"
    exit 1
fi

echo "Testing database connection..."
if ! psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    echo "   Host: $DB_HOST"
    echo "   User: $DB_USER"
    exit 1
fi
echo "✅ Database connection successful"
echo ""

# Apply each migration
MIGRATIONS=(
    "20251109120000_create_tenants_table.sql"
    "20251109121000_create_borrower_access.sql"
    "20251109122000_create_order_status_history.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    migration_file="supabase/migrations/$migration"

    if [ ! -f "$migration_file" ]; then
        echo "❌ Error: Migration file not found: $migration_file"
        exit 1
    fi

    echo "📝 Applying: $migration"

    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed"
        echo ""
        echo "Migration failed. Please check the error above."
        exit 1
    fi
    echo ""
done

echo "🎉 All migrations applied successfully!"
echo ""
echo "Verifying tables..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'borrower_order_access', 'order_status_history')
    ORDER BY tablename;
"

echo ""
echo "Next steps:"
echo "  1. Create .env.local (copy from .env.example)"
echo "  2. Add your Supabase credentials to .env.local"
echo "  3. Run: npm run dev"
echo "  4. Visit: http://localhost:9002/login"
echo ""
