#!/usr/bin/env python3
"""Delete cards created with wrong template and reset job"""
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

print(f"Job: {job['name']}")

# Delete cards from this job
cursor.execute("""
    DELETE FROM kanban_cards
    WHERE job_id = %s
    RETURNING id, title
""", (job['id'],))
deleted_cards = cursor.fetchall()

print(f"\n✅ Deleted {len(deleted_cards)} cards (wrong template):")
for card in deleted_cards[:3]:
    print(f"   • {card['title'][:60]}")
if len(deleted_cards) > 3:
    print(f"   • ...and {len(deleted_cards) - 3} more")

# Delete batch 1 tasks so agent creates fresh ones
cursor.execute("""
    DELETE FROM job_tasks
    WHERE job_id = %s
      AND batch = 1
    RETURNING id, kind, status
""", (job['id'],))
deleted_tasks = cursor.fetchall()

print(f"\n✅ Deleted {len(deleted_tasks)} batch 1 tasks:")
for task in deleted_tasks:
    print(f"   • Task {task['id']}: {task['kind']} ({task['status']})")

conn.commit()

print(f"\n🔄 Job reset! Ready for agent to retry with correct template.")
print(f"\nTemplate will be sorted: Day 0, Day 4, Day 10, Day 21")
print(f"Batch 1 will now use 'Day 0 - Initial Contact' ✅")

cursor.close()
conn.close()



