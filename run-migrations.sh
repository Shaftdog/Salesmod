#!/bin/bash
# Run Client Portal Database Migrations
# This script links your Supabase project and applies all migrations

set -e  # Exit on error

echo "🚀 Client Portal Migration Script"
echo "=================================="
echo ""

# Project configuration
PROJECT_REF="zqhenxhgcjxslpfezybm"
DB_PASSWORD="NsjCsuLJfBswVhdI"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the Salesmod project root"
    exit 1
fi

# Check if migrations exist
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Error: supabase/migrations directory not found"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install --legacy-peer-deps 2>/dev/null || true

echo ""
echo "🔗 Step 2: Linking Supabase project (ref: $PROJECT_REF)..."
npx supabase link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD"

echo ""
echo "📊 Step 3: Pushing migrations to database..."
npm run db:push

echo ""
echo "✅ Step 4: Verifying migrations..."
npx supabase db diff --schema public || echo "⚠️  Diff check skipped (optional)"

echo ""
echo "🎉 Migrations Complete!"
echo ""
echo "Next steps:"
echo "  1. Create .env.local (copy from .env.example)"
echo "  2. Add your Supabase credentials to .env.local"
echo "  3. Run: npm run dev"
echo "  4. Visit: http://localhost:9002/login"
echo ""
