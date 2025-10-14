#!/bin/bash

# Supabase Setup and Link Script
# This script helps you link your local project to your Supabase instance

echo "🚀 Supabase CLI Setup"
echo ""

# Check if already linked
if [ -f ".git/supabase-project-ref" ]; then
    echo "✅ Already linked to Supabase project"
    exit 0
fi

echo "To link your project, you need your Supabase project reference."
echo ""
echo "You can find it in:"
echo "  1. Your Supabase dashboard URL: https://app.supabase.com/project/YOUR-PROJECT-REF"
echo "  2. Or from your NEXT_PUBLIC_SUPABASE_URL (it's the part before .supabase.co)"
echo ""
read -p "Enter your Supabase project reference: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project reference is required"
    exit 1
fi

echo ""
echo "🔗 Linking to project: $PROJECT_REF"
echo ""

# Link to the project
npx supabase link --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully linked!"
    echo ""
    echo "📥 Now pulling your current database schema..."
    echo "   This creates a baseline migration with your existing database state."
    echo ""
    
    # Pull the current schema
    npx supabase db pull
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Schema pulled successfully!"
        echo ""
        echo "🎉 Setup complete! Your project is now configured."
        echo ""
        echo "📝 Next steps:"
        echo "   - Old migration files will be archived (run: ./archive-old-migrations.sh)"
        echo "   - New migrations: npx supabase migration new <name>"
        echo "   - Push migrations: npx supabase db push"
        echo "   - Generate types: npm run db:types"
        echo ""
    else
        echo "❌ Failed to pull schema. Check your database password."
    fi
else
    echo "❌ Failed to link project. Please check your project reference."
    exit 1
fi


