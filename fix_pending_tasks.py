#!/usr/bin/env python3
"""Delete pending tasks so agent can retry"""
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

# Get the job
cursor.execute("""
    SELECT id, name
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print(f"Job: {job['name']}")

# Delete pending tasks from batch 1
cursor.execute("""
    DELETE FROM job_tasks
    WHERE job_id = %s
      AND batch = 1
      AND status = 'pending'
    RETURNING id, kind
""", (job['id'],))

deleted = cursor.fetchall()
conn.commit()

print(f"\n✅ Deleted {len(deleted)} pending tasks:")
for task in deleted:
    print(f"   • Task {task['id']}: {task['kind']}")

print(f"\n🔄 Job is now ready for agent to retry")
print(f"   Next agent run will see batch 0 (empty) and create fresh batch 1 tasks")

cursor.close()
conn.close()



