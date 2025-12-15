#!/usr/bin/env python3
"""Delete cards and reset job to recreate with fixed templates"""
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'aws-1-us-east-1.pooler.supabase.com',
    'port': 5432,
    'user': 'postgres.zqhenxhgcjxslpfezybm',
    'password': 'NsjCsuLJfBswVhdI',
    'database': 'postgres'
}

conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
cursor = conn.cursor()

# Get job
cursor.execute("""
    SELECT id, name
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

# Delete cards
cursor.execute("""
    DELETE FROM kanban_cards
    WHERE job_id = %s
    RETURNING id
""", (job['id'],))
deleted_cards = cursor.rowcount

# Delete batch 1 tasks
cursor.execute("""
    DELETE FROM job_tasks
    WHERE job_id = %s
      AND batch = 1
    RETURNING id
""", (job['id'],))
deleted_tasks = cursor.rowcount

conn.commit()

print(f"✅ Deleted {deleted_cards} cards with bad formatting")
print(f"✅ Deleted {deleted_tasks} batch 1 tasks")
print(f"\n🔄 Ready to recreate cards with:")
print(f"   • Fixed variable syntax: {{{{first_name}}}}")
print(f"   • No subject line in body")
print(f"   • Proper HTML formatting")

cursor.close()
conn.close()



