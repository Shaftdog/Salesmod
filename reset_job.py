#!/usr/bin/env python3
"""Reset the job by removing batch 0 tasks so agent can create fresh ones"""
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

# Get the running job
cursor.execute("""
    SELECT id, name
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print(f"Job: {job['name']} ({job['id']})")

# Check existing tasks
cursor.execute("""
    SELECT id, batch, step, kind, status
    FROM job_tasks
    WHERE job_id = %s
    ORDER BY batch, step
""", (job['id'],))

tasks = cursor.fetchall()
print(f"\nCurrent tasks:")
for task in tasks:
    print(f"  Batch {task['batch']}, Step {task['step']}: {task['kind']} ({task['status']})")

# Delete batch 0 tasks
cursor.execute("""
    DELETE FROM job_tasks
    WHERE job_id = %s
      AND batch = 0
""", (job['id'],))

deleted_count = cursor.rowcount
conn.commit()

print(f"\n✅ Deleted {deleted_count} batch 0 tasks")
print(f"\n✨ Job is now ready!")
print(f"\nNext steps:")
print(f"  1. The agent will run automatically (or you can trigger it)")
print(f"  2. It will see the job with batch 0 complete (no tasks)")
print(f"  3. It will generate batch 1 with fresh tasks")
print(f"  4. It will expand those tasks into email cards")
print(f"  5. You'll see 10 email cards in the kanban board!")

cursor.close()
conn.close()



