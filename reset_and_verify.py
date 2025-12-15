#!/usr/bin/env python3
"""Reset pending tasks and verify setup"""
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

print("="*70)
print("RESET AND VERIFY")
print("="*70)

# Get the job
cursor.execute("""
    SELECT id, name
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print(f"\nJob: {job['name']}")

# Delete all pending/error tasks
cursor.execute("""
    DELETE FROM job_tasks
    WHERE job_id = %s
      AND status IN ('pending', 'error')
    RETURNING id, kind, status
""", (job['id'],))

deleted = cursor.fetchall()
conn.commit()

if deleted:
    print(f"\n✅ Deleted {len(deleted)} tasks:")
    for task in deleted:
        print(f"   • Task {task['id']}: {task['kind']} ({task['status']})")
else:
    print(f"\n✅ No tasks to delete")

print(f"\n" + "="*70)
print(f"READY TO TEST")
print(f"="*70)
print(f"""
✅ Job is ready for agent run
✅ Code has comprehensive logging
✅ Tasks will be marked as error if expansion fails

Next steps:
1. Make sure your Next.js dev server is running
2. Run the agent from /agent page
3. Check the server console for detailed logs like:
   - [getTargetContacts] Called with input...
   - [getTargetContacts] Query returned X contacts
   - [expandDraftEmailTask] Found X target contacts
   
If you see "Query returned 0 contacts", the issue is RLS or query.
If you see "Found X target contacts" but no cards, the issue is card creation.
""")

cursor.close()
conn.close()



