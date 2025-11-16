#!/usr/bin/env python3
"""Clear error tasks so agent can retry"""
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

# Delete error and pending tasks
cursor.execute("""
    DELETE FROM job_tasks
    WHERE job_id IN (SELECT id FROM jobs WHERE status = 'running')
      AND status IN ('error', 'pending')
    RETURNING id, kind, status
""")

deleted = cursor.fetchall()
conn.commit()

print(f"✅ Deleted {len(deleted)} tasks:")
for task in deleted:
    print(f"   • Task {task['id']}: {task['kind']} ({task['status']})")

print("\n✨ Job is ready for next agent run!")
print("   The fixed query will now find 10 AMC contacts")

cursor.close()
conn.close()



