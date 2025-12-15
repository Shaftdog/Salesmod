#!/usr/bin/env python3
"""Reset cards and tasks for final test with all fixes"""
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
    SELECT id
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

# Delete all cards and tasks
cursor.execute("DELETE FROM kanban_cards WHERE job_id = %s", (job['id'],))
cards_deleted = cursor.rowcount

cursor.execute("DELETE FROM job_tasks WHERE job_id = %s AND batch = 1", (job['id'],))
tasks_deleted = cursor.rowcount

conn.commit()

print(f"✅ Deleted {cards_deleted} cards")
print(f"✅ Deleted {tasks_deleted} tasks")
print(f"\n🎯 Final test ready!")
print(f"\nFixes applied:")
print(f"  1. ✅ Variable syntax: {{{{first_name}}}}")
print(f"  2. ✅ No subject in body")
print(f"  3. ✅ HTML formatting with <p> tags")
print(f"  4. ✅ Bullet list formatting with <ul><li>")

cursor.close()
conn.close()



