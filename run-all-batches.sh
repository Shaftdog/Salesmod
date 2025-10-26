#!/bin/bash

# ==============================================
# AUTO-RUN ALL 5 HISTORICAL ORDER BATCHES
# ==============================================

# Connection string (using Session Pooler for IPv4 compatibility)
DB_URL="postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

echo "🚀 Starting import of all 5 batches..."
echo ""

# Run each batch
for i in {1..5}; do
  echo "📦 Running batch $i of 5..."
  psql "$DB_URL" -f "import-historical-batch-$i.sql" > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ Batch $i complete!"
  else
    echo "❌ Batch $i failed!"
    echo "   Trying with verbose output..."
    psql "$DB_URL" -f "import-historical-batch-$i.sql"
    exit 1
  fi
  
  echo ""
done

echo "🎉 All 1,319 orders imported successfully!"
echo ""
echo "Verifying..."
psql "$DB_URL" -c "SELECT COUNT(*) as total_orders FROM orders WHERE source = 'asana';"

