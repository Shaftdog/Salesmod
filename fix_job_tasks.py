#!/usr/bin/env python3
"""Fix the existing job tasks to use the updated filter"""
import psycopg2
import json
from psycopg2.extras import RealDictCursor, Json

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
    SELECT id, name, params
    FROM jobs 
    WHERE status = 'running'
    LIMIT 1
""")
job = cursor.fetchone()

print(f"Job: {job['name']}")
print(f"Target filter: {job['params'].get('target_filter')}")

# Get pending tasks
cursor.execute("""
    SELECT id, kind, input, batch
    FROM job_tasks
    WHERE job_id = %s
      AND status = 'pending'
    ORDER BY batch, step
""", (job['id'],))

tasks = cursor.fetchall()
print(f"\nFound {len(tasks)} pending tasks")

# Update the draft_email task
for task in tasks:
    if task['kind'] == 'draft_email':
        print(f"\nUpdating task {task['id']} (draft_email)")
        print(f"  Current input: {task['input']}")
        
        # Update input with correct filter
        updated_input = task['input'].copy()
        updated_input['target_filter'] = job['params']['target_filter']
        updated_input['contact_ids'] = []  # Let the query find them
        
        cursor.execute("""
            UPDATE job_tasks
            SET input = %s
            WHERE id = %s
        """, (Json(updated_input), task['id']))
        
        print(f"  Updated input: {updated_input}")

conn.commit()
print("\n✅ Tasks updated!")
print("\nNow when the agent runs, it will:")
print("  1. Find the running job")
print("  2. See batch 0 has pending tasks")
print("  3. Process the draft_email task")
print("  4. Query contacts using the target_filter")
print("  5. Create email cards for the first 10 AMC contacts")

cursor.close()
conn.close()



