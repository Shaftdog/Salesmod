#!/bin/bash

# Archive Old Migration Files
# Moves manually created .sql files to an archive folder for reference

echo "📦 Archiving old migration files..."
echo ""

# Create archive directory
mkdir -p supabase/archive

# Move old migration files
MOVED_COUNT=0

for file in supabase-*.sql; do
    if [ -f "$file" ]; then
        echo "  Moving $file to supabase/archive/"
        mv "$file" "supabase/archive/"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    fi
done

if [ $MOVED_COUNT -gt 0 ]; then
    echo ""
    echo "✅ Archived $MOVED_COUNT migration file(s)"
    echo "   These files are in supabase/archive/ for reference"
    echo "   They've already been applied to your database"
else
    echo "No old migration files found to archive"
fi

echo ""
echo "📁 Your migration structure:"
echo "   supabase/migrations/     - Active migrations (managed by CLI)"
echo "   supabase/archive/        - Reference copies of manually applied migrations"

